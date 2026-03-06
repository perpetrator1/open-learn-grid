"""Serializers for the materials app."""

from rest_framework import serializers
from accounts.serializers import UserPublicSerializer
from academic.serializers import (
    DepartmentSerializer,
    CourseSerializer,
    SemesterSerializer,
    SubjectSerializer,
)
from .models import Material, MaterialRequest, MaterialType, MaterialVersion, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "created_at"]
        read_only_fields = ["created_at"]


class MaterialTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialType
        fields = ["id", "name", "icon", "is_active"]


class MaterialVersionSerializer(serializers.ModelSerializer):
    uploaded_by = UserPublicSerializer(read_only=True)

    class Meta:
        model = MaterialVersion
        fields = ["id", "version_number", "file", "change_note", "uploaded_by", "created_at"]
        read_only_fields = ["created_at"]


class MaterialSerializer(serializers.ModelSerializer):
    material_type = MaterialTypeSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)
    semester = SemesterSerializer(read_only=True, allow_null=True)
    department = DepartmentSerializer(read_only=True, allow_null=True)
    course = CourseSerializer(read_only=True, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    uploaded_by = UserPublicSerializer(read_only=True)
    verified_by = UserPublicSerializer(read_only=True, allow_null=True)

    class Meta:
        model = Material
        fields = [
            "id",
            "title",
            "description",
            "material_type",
            "subject",
            "semester",
            "department",
            "course",
            "file",
            "external_url",
            "tags",
            "uploaded_by",
            "verified_by",
            "verification_status",
            "verification_note",
            "upload_source_instance",
            "view_count",
            "download_count",
            "is_archived",
            "is_federated_shared",
            "created_at",
            "updated_at",
            "verified_at",
        ]
        read_only_fields = [
            "uploaded_by",
            "verified_by",
            "view_count",
            "download_count",
            "created_at",
            "updated_at",
            "verified_at",
        ]


class MaterialWriteSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(max_length=100), required=False, default=list
    )
    tag_names = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Material
        fields = [
            "title",
            "description",
            "material_type",
            "subject",
            "semester",
            "department",
            "course",
            "file",
            "external_url",
            "tags",
            "tag_names",
            "is_federated_shared",
        ]

    def get_tag_names(self, obj):
        return [t.name for t in obj.tags.all()]

    def validate(self, data):
        if not data.get("file") and not data.get("external_url"):
            raise serializers.ValidationError(
                "Either a file or an external URL must be provided."
            )
        return data

    def _handle_tags(self, material, tag_names):
        """Get or create tag objects and set them on the material."""
        tags = []
        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=name.lower().strip())
            tags.append(tag)
        material.tags.set(tags)

    def create(self, validated_data):
        tag_names = validated_data.pop("tags", [])
        validated_data["uploaded_by"] = self.context["request"].user
        material = super().create(validated_data)
        self._handle_tags(material, tag_names)
        if material.file:
            MaterialVersion.objects.create(
                material=material,
                version_number=1,
                file=material.file,
                uploaded_by=material.uploaded_by,
                change_note="Initial upload",
            )
        return material

    def update(self, instance, validated_data):
        tag_names = validated_data.pop("tags", None)
        old_file = instance.file
        material = super().update(instance, validated_data)
        if tag_names is not None:
            self._handle_tags(material, tag_names)
        if validated_data.get("file") and validated_data["file"] != old_file:
            last_version = material.versions.order_by("-version_number").first()
            next_version = (last_version.version_number + 1) if last_version else 2
            MaterialVersion.objects.create(
                material=material,
                version_number=next_version,
                file=material.file,
                uploaded_by=self.context["request"].user,
                change_note=validated_data.get("description", "Updated"),
            )
        return material


class MaterialVerifySerializer(serializers.Serializer):
    verification_status = serializers.ChoiceField(
        choices=[
            ("verified", "Verified"),
            ("rejected", "Rejected"),
            ("revision_requested", "Revision Requested"),
        ]
    )
    verification_note = serializers.CharField(required=False, allow_blank=True, default="")


class MaterialRequestSerializer(serializers.ModelSerializer):
    requester = UserPublicSerializer(read_only=True)
    reviewed_by = UserPublicSerializer(read_only=True, allow_null=True)
    material = MaterialSerializer(read_only=True, allow_null=True)

    class Meta:
        model = MaterialRequest
        fields = [
            "id",
            "requester",
            "request_type",
            "material",
            "proposed_data",
            "status",
            "reviewed_by",
            "review_note",
            "created_at",
            "reviewed_at",
        ]
        read_only_fields = [
            "requester",
            "status",
            "reviewed_by",
            "review_note",
            "created_at",
            "reviewed_at",
        ]

    def create(self, validated_data):
        validated_data["requester"] = self.context["request"].user
        return super().create(validated_data)


class MaterialRequestReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[("approved", "Approved"), ("rejected", "Rejected")]
    )
    review_note = serializers.CharField(required=False, allow_blank=True, default="")
