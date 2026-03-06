from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification, NotificationPreference, NOTIFICATION_TYPES
from .serializers import (
    NotificationSerializer, NotificationPreferenceSerializer, MarkReadSerializer,
)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(
            recipient=self.request.user, is_dismissed=False
        ).order_by("-created_at")
        unread_only = self.request.query_params.get("unread")
        if unread_only == "true":
            qs = qs.filter(is_read=False)
        ntype = self.request.query_params.get("type")
        if ntype:
            qs = qs.filter(notification_type=ntype)
        return qs

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.mark_read()
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=["post"], url_path="mark-read-bulk")
    def mark_read_bulk(self, request):
        ser = MarkReadSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        qs = Notification.objects.filter(recipient=request.user, is_read=False)
        if ser.validated_data.get("all"):
            qs.update(is_read=True)
        elif ser.validated_data.get("ids"):
            qs.filter(id__in=ser.validated_data["ids"]).update(is_read=True)
        return Response({"detail": "Marked as read."})

    @action(detail=True, methods=["post"])
    def dismiss(self, request, pk=None):
        notif = self.get_object()
        notif.is_dismissed = True
        notif.save()
        return Response({"detail": "Dismissed."})

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = Notification.objects.filter(
            recipient=request.user, is_read=False, is_dismissed=False
        ).count()
        return Response({"count": count})


class NotificationPreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs = {p.notification_type: p for p in
                 NotificationPreference.objects.filter(user=request.user)}
        result = []
        for code, label in NOTIFICATION_TYPES:
            obj = prefs.get(code)
            if obj:
                result.append(NotificationPreferenceSerializer(obj).data)
            else:
                result.append({
                    "id": None,
                    "notification_type": code,
                    "notification_type_display": label,
                    "email_enabled": True,
                    "in_app_enabled": True,
                    "push_enabled": False,
                })
        return Response(result)

    def patch(self, request):
        updates = request.data if isinstance(request.data, list) else [request.data]
        for item in updates:
            ntype = item.get("notification_type")
            if not ntype:
                continue
            pref, _ = NotificationPreference.objects.get_or_create(
                user=request.user, notification_type=ntype
            )
            for field in ("email_enabled", "in_app_enabled", "push_enabled"):
                if field in item:
                    setattr(pref, field, item[field])
            pref.save()
        return Response({"detail": "Preferences updated."})
