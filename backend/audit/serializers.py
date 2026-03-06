from rest_framework import serializers
from accounts.serializers import UserPublicSerializer
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor = UserPublicSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = "__all__"
