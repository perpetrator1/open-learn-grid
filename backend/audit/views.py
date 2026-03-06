import csv
from django.http import StreamingHttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from accounts.models import UserRole
from .models import AuditLog
from .serializers import AuditLogSerializer


def _user_perms(user):
    if not user.is_authenticated:
        return []
    if user.is_staff:
        return ["audit.view_logs"]
    perms = set()
    for ur in user.user_roles.select_related("role"):
        perms.update(ur.role.permissions if isinstance(ur.role.permissions, list) else [])
    return list(perms)


class EchoBuffer:
    """A writable object that echoes its input for streaming CSV."""
    def write(self, value):
        return value


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("actor").order_by("-created_at")
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["action", "target_type", "actor"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        user = self.request.user
        perms = _user_perms(user)
        if "audit.view_logs" not in perms and not user.is_staff:
            return AuditLog.objects.none()
        qs = super().get_queryset()
        q = self.request.query_params.get("q")
        if q:
            from django.db.models import Q
            qs = qs.filter(Q(action__icontains=q) | Q(target_repr__icontains=q))
        return qs

    @action(detail=False, methods=["get"], url_path="export-csv")
    def export_csv(self, request):
        user = request.user
        perms = _user_perms(user)
        if "audit.view_logs" not in perms and not user.is_staff:
            return Response({"detail": "Forbidden."}, status=403)

        rows = AuditLog.objects.select_related("actor").order_by("-created_at").values_list(
            "id", "actor__email", "action", "target_type", "target_id",
            "target_repr", "created_at",
        )

        def generate(rows):
            buf = EchoBuffer()
            writer = csv.writer(buf)
            yield writer.writerow(["id", "actor", "action", "target_type", "target_id", "target_repr", "created_at"])
            for row in rows:
                yield writer.writerow(row)

        response = StreamingHttpResponse(generate(rows), content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=audit_log.csv"
        return response
