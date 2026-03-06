from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from accounts.models import UserRole
from .models import Report, Ban, Appeal
from .serializers import (
    ReportSerializer, ReportCreateSerializer,
    BanSerializer, BanCreateSerializer,
    AppealSerializer, AppealCreateSerializer, AppealReviewSerializer,
)
from .filters import ReportFilter, BanFilter


def _user_perms(user):
    if not user.is_authenticated:
        return []
    if user.is_staff:
        from accounts.views import ALL_PERMISSIONS
        return list(ALL_PERMISSIONS)
    perms = set()
    for ur in user.user_roles.select_related("role"):
        perms.update(ur.role.permissions if isinstance(ur.role.permissions, list) else [])
    return list(perms)


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.select_related(
        "reporter", "material", "reported_user", "assigned_to", "resolved_by"
    ).order_by("-created_at")
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ReportFilter
    ordering_fields = ["created_at", "updated_at", "status"]

    def get_serializer_class(self):
        if self.action == "create":
            return ReportCreateSerializer
        return ReportSerializer

    def get_queryset(self):
        user = self.request.user
        perms = _user_perms(user)
        if "moderation.view_reports" in perms or user.is_staff:
            return super().get_queryset()
        # Regular users can see only their own reports
        return super().get_queryset().filter(reporter=user)

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    @action(detail=True, methods=["post"], url_path="assign")
    def assign(self, request, pk=None):
        perms = _user_perms(request.user)
        if "moderation.resolve_reports" not in perms and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=403)
        report = self.get_object()
        uid = request.data.get("assigned_to")
        from accounts.models import User
        try:
            assignee = User.objects.get(pk=uid) if uid else None
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=400)
        report.assigned_to = assignee
        report.status = "under_review"
        report.save()
        return Response(ReportSerializer(report).data)

    @action(detail=True, methods=["post"], url_path="resolve")
    def resolve(self, request, pk=None):
        perms = _user_perms(request.user)
        if "moderation.resolve_reports" not in perms and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=403)
        report = self.get_object()
        new_status = request.data.get("status", "resolved")
        if new_status not in ("resolved", "dismissed"):
            return Response({"detail": "status must be resolved or dismissed."}, status=400)
        report.action_taken = request.data.get("action_taken", "")
        report.status = new_status
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()
        return Response(ReportSerializer(report).data)


class BanViewSet(viewsets.ModelViewSet):
    queryset = Ban.objects.select_related("user", "banned_by", "lifted_by").order_by("-created_at")
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = BanFilter
    ordering_fields = ["created_at", "expires_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return BanCreateSerializer
        return BanSerializer

    def get_queryset(self):
        user = self.request.user
        perms = _user_perms(user)
        if "moderation.ban_users" in perms or user.is_staff:
            return super().get_queryset()
        return super().get_queryset().filter(user=user)

    def perform_create(self, serializer):
        perms = _user_perms(self.request.user)
        if "moderation.ban_users" not in perms and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        serializer.save(banned_by=self.request.user, is_active=True)

    @action(detail=True, methods=["post"], url_path="lift")
    def lift(self, request, pk=None):
        perms = _user_perms(request.user)
        if "moderation.ban_users" not in perms and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=403)
        ban = self.get_object()
        ban.is_active = False
        ban.lifted_at = timezone.now()
        ban.lifted_by = request.user
        ban.save()
        from notifications.utils import create_notification
        create_notification(
            recipient=ban.user,
            notification_type="ban_lifted",
            title="Restriction lifted",
            body="A restriction on your account has been lifted.",
        )
        return Response(BanSerializer(ban).data)

    @action(detail=False, methods=["get"], url_path="check-user/(?P<user_pk>[0-9]+)")
    def check_user(self, request, user_pk=None):
        """Return active bans for a given user."""
        bans = Ban.objects.filter(user_id=user_pk, is_active=True)
        return Response(BanSerializer(bans, many=True).data)


class AppealViewSet(viewsets.ModelViewSet):
    queryset = Appeal.objects.select_related("ban", "appellant", "reviewed_by").order_by("-created_at")
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return AppealCreateSerializer
        return AppealSerializer

    def get_queryset(self):
        user = self.request.user
        perms = _user_perms(user)
        if "moderation.ban_users" in perms or user.is_staff:
            return super().get_queryset()
        return super().get_queryset().filter(appellant=user)

    def perform_create(self, serializer):
        serializer.save(appellant=self.request.user)

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        perms = _user_perms(request.user)
        if "moderation.ban_users" not in perms and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=403)
        appeal = self.get_object()
        ser = AppealReviewSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        appeal.status = ser.validated_data["status"]
        appeal.review_note = ser.validated_data.get("review_note", "")
        appeal.reviewed_by = request.user
        appeal.reviewed_at = timezone.now()
        appeal.save()
        if appeal.status == "approved":
            ban = appeal.ban
            ban.is_active = False
            ban.lifted_at = timezone.now()
            ban.lifted_by = request.user
            ban.save()
        return Response(AppealSerializer(appeal).data)
