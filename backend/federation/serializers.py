"""Federation serializers."""

from rest_framework import serializers
from .models import Instance, FederatedActivity, FederatedMaterial, InstanceBlock
from .crypto import public_key_fingerprint


class InstanceSerializer(serializers.ModelSerializer):
    added_by_username = serializers.CharField(source="added_by.username", read_only=True, default="")
    public_key_fingerprint = serializers.SerializerMethodField()

    class Meta:
        model = Instance
        fields = [
            "id", "domain", "name", "description", "logo", "software_version",
            "admin_email", "trust_level", "is_home", "registration_open",
            "requires_approval", "material_count", "user_count",
            "last_synced_stats_at", "is_active", "is_reachable",
            "added_by_username", "added_at", "last_seen_at", "metadata",
            "public_key", "public_key_fingerprint",
        ]
        read_only_fields = [
            "id", "is_home", "material_count", "user_count", "last_synced_stats_at",
            "is_reachable", "added_by_username", "added_at", "last_seen_at",
        ]

    def get_public_key_fingerprint(self, obj):
        if obj.public_key:
            return public_key_fingerprint(obj.public_key)
        return ""


class InstanceCreateSerializer(serializers.Serializer):
    domain = serializers.CharField(max_length=255)

    def validate_domain(self, value):
        value = value.strip().lower().rstrip("/")
        if Instance.objects.filter(domain=value).exists():
            raise serializers.ValidationError("Instance with this domain already exists.")
        return value


class TrustLevelSerializer(serializers.Serializer):
    trust_level = serializers.ChoiceField(choices=Instance.TrustLevel.choices)
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class FederatedActivitySerializer(serializers.ModelSerializer):
    from_instance_domain = serializers.CharField(source="from_instance.domain", read_only=True)
    to_instance_domain = serializers.CharField(source="to_instance.domain", read_only=True, default="")

    class Meta:
        model = FederatedActivity
        fields = [
            "id", "from_instance", "from_instance_domain", "to_instance", "to_instance_domain",
            "activity_id", "activity_type", "payload", "signature",
            "status", "error_message", "retry_count", "created_at", "processed_at",
        ]
        read_only_fields = fields


class FederatedMaterialSerializer(serializers.ModelSerializer):
    source_instance_domain = serializers.CharField(source="source_instance.domain", read_only=True)
    source_instance_name = serializers.CharField(source="source_instance.name", read_only=True)
    source_instance_logo = serializers.ImageField(source="source_instance.logo", read_only=True)

    class Meta:
        model = FederatedMaterial
        fields = [
            "id", "original_id", "source_instance", "source_instance_domain",
            "source_instance_name", "source_instance_logo",
            "title", "description", "material_type",
            "subject_name", "semester_number", "department_name",
            "file_url", "external_url", "tags",
            "uploaded_by_username", "verified_by_username", "verification_status",
            "view_count", "download_count",
            "original_created_at", "synced_at", "last_updated_at", "is_removed",
        ]
        read_only_fields = fields


class InstanceBlockSerializer(serializers.ModelSerializer):
    instance_domain = serializers.CharField(source="instance.domain", read_only=True)
    instance_name = serializers.CharField(source="instance.name", read_only=True)
    blocked_by_username = serializers.CharField(source="blocked_by.username", read_only=True, default="")

    class Meta:
        model = InstanceBlock
        fields = [
            "id", "instance", "instance_domain", "instance_name",
            "blocked_by", "blocked_by_username", "reason", "block_type", "created_at",
        ]
        read_only_fields = ["id", "blocked_by", "created_at"]
