"""Views for the materials app."""

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import (
    MATERIAL_PERMISSIONS,
    USER_PERMISSIONS,
    ACADEMIC_PERMISSIONS,
)
from .filters import MaterialFilter, MaterialRequestFilter
from .models import Material, MaterialRequest, MaterialType, MaterialVersion, Tag
from .serializers import (
    MaterialRequestReviewSerializer,
    MaterialRequestSerializer,
    MaterialSerializer,
    MaterialTypeSerializer,
    MaterialVerifySerializer,
    MaterialVersionSerializer,
    MaterialWriteSerializer,
    TagSerializer,
)


def _user_perms(user):
    """Return merged set of permission strings for this user via their roles."""
    if user.is_staff or user.is_superuser:
        from accounts.permissions import ALL_PERMISSIONS
        return set(ALL_PERMISSIONS)
    perms = set()
    for ur in user.user_roles.select_related("role").all():
        perms.update(ur.role.permissions or [])
    return perms


def _can(user, perm):
    return perm in _user_perms(user)


class MaterialTypeViewSet(viewsets.ModelViewSet):
    queryset = MaterialType.objects.filter(is_active=True)
    serializer_class = MaterialTypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can manage material types.")
        serializer.save()


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering = ["name"]

    @action(detail=False, methods=["get"], url_path="popular")
    def popular(self, request):
        """GET /api/tags/popular/ — top 20 tags by material count."""
        from django.db.models import Count
        qs = (
            Tag.objects.annotate(material_count=Count("materials"))
            .order_by("-material_count")[:20]
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = (
        Material.objects.select_related(
            "material_type",
            "subject",
            "semester__course__department",
            "department",
            "course",
            "uploaded_by",
            "verified_by",
        )
        .prefetch_related("tags")
        .filter(is_archived=False)
    )
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = MaterialFilter
    ordering_fields = ["created_at", "download_count", "view_count", "title"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return MaterialWriteSerializer
        if self.action == "verify":
            return MaterialVerifySerializer
        return MaterialSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """
        Smart upload: teachers/admins → directly verified, verifiers → pending,
        students → creates a MaterialRequest.
        """
        user = request.user
        perms = _user_perms(user)

        if MATERIAL_PERMISSIONS[1] not in perms:  # materials.create_material
            # Student pathway: create a MaterialRequest
            req_serializer = MaterialWriteSerializer(
                data=request.data, context={"request": request}
            )
            req_serializer.is_valid(raise_exception=True)
            MaterialRequest.objects.create(
                requester=user,
                request_type=MaterialRequest.RequestType.ADD,
                proposed_data=req_serializer.validated_data,
            )
            return Response(
                {"detail": "Your upload request has been submitted for review."},
                status=status.HTTP_202_ACCEPTED,
            )

        serializer = MaterialWriteSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        # Determine auto verification status based on role
        if user.is_staff or user.is_superuser or MATERIAL_PERMISSIONS[7] in perms:
            # admin / can approve → auto verify
            verification_status = Material.VerificationStatus.VERIFIED
        else:
            verification_status = Material.VerificationStatus.PENDING

        material = serializer.save(
            uploaded_by=user,
            verification_status=verification_status,
            verified_by=user if verification_status == Material.VerificationStatus.VERIFIED else None,
            verified_at=timezone.now() if verification_status == Material.VerificationStatus.VERIFIED else None,
        )
        return Response(MaterialSerializer(material).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        material = self.get_object()
        user = request.user
        if material.uploaded_by != user and not (user.is_staff or user.is_superuser):
            return Response(
                {"detail": "You can only edit your own materials."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        material = self.get_object()
        user = request.user
        if material.uploaded_by != user and not (user.is_staff or user.is_superuser):
            return Response(
                {"detail": "You can only delete your own materials."},
                status=status.HTTP_403_FORBIDDEN,
            )
        material.is_archived = True
        material.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="verify")
    def verify(self, request, pk=None):
        """POST /api/materials/{id}/verify/ — verifier/teacher/admin action."""
        material = self.get_object()
        user = request.user
        perms = _user_perms(user)
        can_verify = (
            user.is_staff
            or user.is_superuser
            or MATERIAL_PERMISSIONS[7] in perms  # approve_material
            or MATERIAL_PERMISSIONS[8] in perms  # reject_material
        )
        if not can_verify:
            return Response(
                {"detail": "You do not have permission to verify materials."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = MaterialVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        material.verification_status = serializer.validated_data["verification_status"]
        material.verification_note = serializer.validated_data.get("verification_note", "")
        material.verified_by = user
        material.verified_at = timezone.now()
        material.save()
        return Response(MaterialSerializer(material).data)

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        """GET /api/materials/{id}/download/ — increment download count and return file URL."""
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        material = self.get_object()
        Material.objects.filter(pk=material.pk).update(
            download_count=material.download_count + 1
        )
        if material.file:
            return Response({"url": request.build_absolute_uri(material.file.url)})
        if material.external_url:
            return Response({"url": material.external_url})
        return Response({"detail": "No file available."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["post"], url_path="view")
    def record_view(self, request, pk=None):
        """POST /api/materials/{id}/view/ — increment view count."""
        material = self.get_object()
        Material.objects.filter(pk=material.pk).update(
            view_count=material.view_count + 1
        )
        return Response({"view_count": material.view_count + 1})

    @action(detail=True, methods=["get"], url_path="versions")
    def versions(self, request, pk=None):
        """GET /api/materials/{id}/versions/ — list version history."""
        material = self.get_object()
        qs = material.versions.select_related("uploaded_by").order_by("-version_number")
        serializer = MaterialVersionSerializer(qs, many=True)
        return Response(serializer.data)


class MaterialRequestViewSet(viewsets.ModelViewSet):
    queryset = MaterialRequest.objects.select_related(
        "requester", "reviewed_by", "material"
    ).all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = MaterialRequestFilter
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.action == "review":
            return MaterialRequestReviewSerializer
        return MaterialRequestSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        perms = _user_perms(user)
        is_admin = user.is_staff or user.is_superuser or MATERIAL_PERMISSIONS[7] in perms
        if not is_admin:
            qs = qs.filter(requester=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)

    @action(detail=True, methods=["patch"], url_path="review")
    def review(self, request, pk=None):
        """PATCH /api/material-requests/{id}/review/ — approve or reject."""
        user = request.user
        perms = _user_perms(user)
        is_admin = user.is_staff or user.is_superuser or MATERIAL_PERMISSIONS[7] in perms
        if not is_admin:
            return Response(
                {"detail": "You do not have permission to review material requests."},
                status=status.HTTP_403_FORBIDDEN,
            )
        obj = self.get_object()
        if obj.status != MaterialRequest.Status.PENDING:
            return Response(
                {"detail": "This request has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = MaterialRequestReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj.status = serializer.validated_data["status"]
        obj.review_note = serializer.validated_data.get("review_note", "")
        obj.reviewed_by = user
        obj.reviewed_at = timezone.now()

        # If approved and it's an ADD request, create the material
        if obj.status == MaterialRequest.Status.APPROVED and obj.request_type == MaterialRequest.RequestType.ADD:
            mat_serializer = MaterialWriteSerializer(
                data=obj.proposed_data, context={"request": request}
            )
            if mat_serializer.is_valid():
                mat = mat_serializer.save(
                    uploaded_by=obj.requester,
                    verification_status=Material.VerificationStatus.VERIFIED,
                    verified_by=user,
                    verified_at=timezone.now(),
                )
                obj.material = mat

        obj.save()
        return Response(MaterialRequestSerializer(obj).data)
