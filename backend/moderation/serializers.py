from rest_framework import serializers
from accounts.serializers import UserPublicSerializer
from .models import Report, Ban, Appeal


class ReportSerializer(serializers.ModelSerializer):
    reporter = UserPublicSerializer(read_only=True)
    assigned_to = UserPublicSerializer(read_only=True)
    resolved_by = UserPublicSerializer(read_only=True)

    class Meta:
        model = Report
        fields = "__all__"
        read_only_fields = ["reporter", "status", "assigned_to", "action_taken",
                            "resolved_by", "resolved_at", "created_at", "updated_at"]


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["reported_item_type", "material", "reported_user",
                  "reason", "description", "evidence_urls", "context"]


class BanSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    banned_by = UserPublicSerializer(read_only=True)
    lifted_by = UserPublicSerializer(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Ban
        fields = "__all__"
        read_only_fields = ["banned_by", "is_active", "created_at", "lifted_at", "lifted_by"]


class BanCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ban
        fields = ["user", "scope", "department", "subject", "reason", "duration", "expires_at"]


class AppealSerializer(serializers.ModelSerializer):
    appellant = UserPublicSerializer(read_only=True)
    reviewed_by = UserPublicSerializer(read_only=True)

    class Meta:
        model = Appeal
        fields = "__all__"
        read_only_fields = ["appellant", "status", "reviewed_by", "review_note",
                            "created_at", "reviewed_at"]


class AppealCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appeal
        fields = ["ban", "reason", "supporting_evidence"]


class AppealReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["approved", "rejected"])
    review_note = serializers.CharField(required=False, allow_blank=True)
