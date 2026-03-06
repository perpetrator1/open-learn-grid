"""Federation views."""
import json
import logging

from django.conf import settings
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import FEDERATION_PERMISSIONS
from .discovery import build_home_instance_info, fetch_instance_info
from .filters import FederatedActivityFilter, FederatedMaterialFilter, InstanceFilter
from .models import FederatedActivity, FederatedMaterial, Instance, InstanceBlock
from .protocol import sign_activity, build_activity, verify_activity_signature
from .serializers import (
    FederatedActivitySerializer,
    FederatedMaterialSerializer,
    InstanceBlockSerializer,
    InstanceCreateSerializer,
    InstanceSerializer,
    TrustLevelSerializer,
)

logger = logging.getLogger(__name__)


def _check_fed_perm(user, perm: str) -> bool:
    if user.is_staff:
        return True
    from accounts.models import UserRole
    user_perms = []
    for ur in UserRole.objects.filter(user=user, is_active=True).select_related("role"):
        user_perms.extend(ur.role.permissions or [])
    return perm in user_perms


class InstanceViewSet(viewsets.ModelViewSet):
    serializer_class = InstanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = InstanceFilter
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Instance.objects.all().order_by("-added_at")

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)

    def create(self, request, *args, **kwargs):
        if not _check_fed_perm(request.user, "federation.manage_instances"):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        create_ser = InstanceCreateSerializer(data=request.data)
        create_ser.is_valid(raise_exception=True)
        domain = create_ser.validated_data["domain"]
        try:
            info = fetch_instance_info(domain)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        instance = Instance.objects.create(
            domain=domain,
            name=info.get("name", domain),
            description=info.get("description", ""),
            software_version=info.get("software_version", ""),
            admin_email=info.get("admin_email", ""),
            public_key=info.get("public_key", ""),
            registration_open=info.get("registration_open", True),
            requires_approval=info.get("requires_approval", False),
            material_count=info.get("material_count", 0),
            user_count=info.get("user_count", 0),
            trust_level=Instance.TrustLevel.NEUTRAL,
            is_home=False,
            added_by=request.user,
            metadata=info,
        )
        return Response(InstanceSerializer(instance).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="fetch-info")
    def fetch_info(self, request):
        if not _check_fed_perm(request.user, "federation.manage_instances"):
            return Response({"detail": "Permission denied."}, status=403)
        domain = request.query_params.get("domain", "").strip()
        if not domain:
            return Response({"detail": "domain query param required."}, status=400)
        try:
            info = fetch_instance_info(domain)
            return Response(info)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["patch"], url_path="trust")
    def set_trust(self, request, pk=None):
        if not _check_fed_perm(request.user, "federation.manage_instances"):
            return Response({"detail": "Permission denied."}, status=403)
        instance = self.get_object()
        ser = TrustLevelSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        new_trust = ser.validated_data["trust_level"]
        old_trust = instance.trust_level
        if new_trust == Instance.TrustLevel.BLOCKED:
            InstanceBlock.objects.update_or_create(
                instance=instance,
                defaults={
                    "blocked_by": request.user,
                    "reason": ser.validated_data.get("reason", "Blocked by admin"),
                    "block_type": InstanceBlock.BlockType.MANUAL,
                },
            )
        elif old_trust == Instance.TrustLevel.BLOCKED:
            InstanceBlock.objects.filter(instance=instance).delete()
        instance.trust_level = new_trust
        instance.save(update_fields=["trust_level"])
        return Response(InstanceSerializer(instance).data)

    @action(detail=True, methods=["post"], url_path="sync")
    def sync(self, request, pk=None):
        if not _check_fed_perm(request.user, "federation.manage_instances"):
            return Response({"detail": "Permission denied."}, status=403)
        instance = self.get_object()
        from .tasks import sync_instance_materials
        sync_instance_materials.delay(instance.pk)
        return Response({"detail": "Sync queued."})

    @action(detail=True, methods=["get"], url_path="materials")
    def materials(self, request, pk=None):
        instance = self.get_object()
        qs = FederatedMaterial.objects.filter(source_instance=instance, is_removed=False)
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(FederatedMaterialSerializer(page, many=True).data)
        return Response(FederatedMaterialSerializer(qs, many=True).data)

    def destroy(self, request, *args, **kwargs):
        if not _check_fed_perm(request.user, "federation.manage_instances"):
            return Response({"detail": "Permission denied."}, status=403)
        instance = self.get_object()
        if instance.is_home:
            return Response({"detail": "Cannot remove home instance."}, status=400)
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class FederationInboxView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        body = request.body
        signature = request.headers.get("X-Activity-Signature", "")
        try:
            payload = json.loads(body)
        except (json.JSONDecodeError, ValueError):
            return Response({"detail": "Invalid JSON."}, status=400)
        actor = payload.get("actor", {})
        from_domain = actor.get("instance", "")
        if not from_domain:
            return Response({"detail": "Missing actor.instance."}, status=400)
        try:
            instance = Instance.objects.get(domain=from_domain, is_active=True)
        except Instance.DoesNotExist:
            return Response({"detail": "Unknown or inactive instance."}, status=403)
        if instance.trust_level == Instance.TrustLevel.BLOCKED:
            return Response({"detail": "Instance is blocked."}, status=403)
        if signature and instance.public_key:
            if not verify_activity_signature(payload, signature, instance.public_key):
                logger.warning("Invalid signature from %s", from_domain)
                return Response({"detail": "Invalid signature."}, status=403)
        activity_id = payload.get("id", "")
        if not activity_id:
            return Response({"detail": "Missing activity id."}, status=400)
        if FederatedActivity.objects.filter(activity_id=activity_id).exists():
            return Response({"detail": "Activity already received."}, status=200)
        activity = FederatedActivity.objects.create(
            from_instance=instance,
            activity_id=activity_id,
            activity_type=payload.get("type", ""),
            payload=payload,
            signature=signature,
            status=FederatedActivity.Status.RECEIVED,
        )
        from .tasks import process_federated_activity
        process_federated_activity.delay(activity.pk)
        return Response({"detail": "Accepted."}, status=202)


class FederatedActivityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FederatedActivitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = FederatedActivityFilter

    def get_queryset(self):
        return FederatedActivity.objects.select_related("from_instance", "to_instance").all()

    @action(detail=True, methods=["post"], url_path="retry")
    def retry(self, request, pk=None):
        if not _check_fed_perm(request.user, "federation.manage_instances"):
            return Response({"detail": "Permission denied."}, status=403)
        activity = self.get_object()
        if activity.status != FederatedActivity.Status.FAILED:
            return Response({"detail": "Only failed activities can be retried."}, status=400)
        activity.status = FederatedActivity.Status.RECEIVED
        activity.retry_count = 0
        activity.save(update_fields=["status", "retry_count"])
        from .tasks import process_federated_activity
        process_federated_activity.delay(activity.pk)
        return Response({"detail": "Queued for retry."})


class FederatedMaterialViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FederatedMaterialSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_class = FederatedMaterialFilter

    def get_queryset(self):
        return (
            FederatedMaterial.objects.filter(is_removed=False)
            .select_related("source_instance")
            .order_by("-synced_at")
        )

    @action(detail=True, methods=["post"], url_path="report")
    def report(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required."}, status=401)
        material = self.get_object()
        reason = request.data.get("reason", "other")
        description = request.data.get("description", "")
        from moderation.models import Report
        Report.objects.create(
            reporter=request.user,
            item_type=Report.ItemType.MATERIAL,
            item_id=str(material.pk),
            item_repr=material.title,
            reason=reason,
            description=description,
        )
        return Response({"detail": "Report submitted."}, status=201)


class InstanceBlockViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InstanceBlockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InstanceBlock.objects.select_related("instance", "blocked_by").all()

    @action(detail=True, methods=["post"], url_path="unblock")
    def unblock(self, request, pk=None):
        if not _check_fed_perm(request.user, "federation.manage_instances"):
            return Response({"detail": "Permission denied."}, status=403)
        block = self.get_object()
        instance = block.instance
        block.delete()
        instance.trust_level = Instance.TrustLevel.NEUTRAL
        instance.save(update_fields=["trust_level"])
        return Response({"detail": "Unblocked."})


class FederationShareMaterialView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, material_id):
        from materials.models import Material
        try:
            material = Material.objects.get(pk=material_id)
        except Material.DoesNotExist:
            return Response({"detail": "Material not found."}, status=404)
        if material.verification_status != "verified":
            return Response({"detail": "Only verified materials can be federated."}, status=400)
        home_domain = getattr(settings, "INSTANCE_DOMAIN", "")
        payload = build_activity(
            "material_shared",
            actor={"instance": home_domain, "user_id": request.user.pk, "username": request.user.username},
            obj={
                "id": str(material.pk),
                "title": material.title,
                "description": material.description,
                "material_type": material.material_type.name if material.material_type else "",
                "subject": {"name": material.subject.name if material.subject else "", "code": ""},
                "semester": {"number": material.semester.number if material.semester else None, "academic_year": ""},
                "department": {"name": material.department.name if material.department else "", "code": ""},
                "file_url": request.build_absolute_uri(material.file.url) if material.file else "",
                "external_url": getattr(material, "external_url", "") or "",
                "tags": [t.name for t in material.tags.all()],
                "uploaded_by": {"username": material.uploaded_by.username, "display_name": material.uploaded_by.effective_display_name},
                "verified_by": {"username": material.verified_by.username if material.verified_by else "", "display_name": ""},
                "verification_status": material.verification_status,
                "created_at": material.created_at.isoformat(),
                "view_count": material.view_count,
                "download_count": material.download_count,
            },
        )
        signature = sign_activity(payload)
        from .tasks import broadcast_activity
        broadcast_activity.delay(payload, signature)
        return Response({"detail": "Material queued for federation broadcast."})


class InstanceHealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from materials.models import Material
        from accounts.models import User
        return Response({
            "status": "ok",
            "version": "1.0.0",
            "total_materials": Material.objects.filter(verification_status="verified").count(),
            "total_users": User.objects.filter(is_active=True).count(),
            "is_accepting_activities": True,
        })


class FederationMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or _check_fed_perm(request.user, "federation.manage_instances")):
            return Response({"detail": "Permission denied."}, status=403)
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(hours=24)
        return Response({
            "activities_received_24h": FederatedActivity.objects.filter(created_at__gte=cutoff).count(),
            "activities_failed": FederatedActivity.objects.filter(status=FederatedActivity.Status.FAILED).count(),
            "blocked_instances": InstanceBlock.objects.count(),
            "trusted_instances": Instance.objects.filter(trust_level=Instance.TrustLevel.TRUSTED).count(),
            "total_federated_materials": FederatedMaterial.objects.filter(is_removed=False).count(),
        })


class WellKnownView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = build_home_instance_info()
        return Response(data)


class GenerateKeysView(APIView):
    """Generate an RSA-2048 key pair for instance setup."""
    permission_classes = [AllowAny]

    def post(self, request):
        from .crypto import generate_keypair
        private_pem, public_pem = generate_keypair()
        return Response({
            "public_key": public_pem,
            "private_key": private_pem,
        })
