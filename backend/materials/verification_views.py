from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.generics import ListAPIView
from rest_framework.filters import OrderingFilter

from accounts.models import UserRole
from .models import Material
from .serializers import MaterialSerializer


def _user_perms(user):
    if not user.is_authenticated:
        return []
    if user.is_staff:
        return ["materials.verify"]
    perms = set()
    for ur in user.user_roles.select_related("role"):
        perms.update(ur.role.permissions if isinstance(ur.role.permissions, list) else [])
    return list(perms)


class VerificationQueueView(ListAPIView):
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["subject", "material_type"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        perms = _user_perms(user)
        if "materials.verify" not in perms and not user.is_staff:
            return Material.objects.none()
        return Material.objects.filter(verification_status="pending").select_related(
            "uploaded_by", "subject", "material_type"
        ).prefetch_related("tags")
