from rest_framework import serializers
from .models import Notification, NotificationPreference, NOTIFICATION_TYPES


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["recipient", "created_at", "read_at"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.SerializerMethodField()

    class Meta:
        model = NotificationPreference
        fields = ["id", "notification_type", "notification_type_display",
                  "email_enabled", "in_app_enabled", "push_enabled"]

    def get_notification_type_display(self, obj):
        return dict(NOTIFICATION_TYPES).get(obj.notification_type, obj.notification_type)


class MarkReadSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    all = serializers.BooleanField(required=False, default=False)
