from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, NotificationPreferenceView

router = DefaultRouter()
router.register("", NotificationViewSet, basename="notification")

urlpatterns = router.urls + [
    path("preferences/", NotificationPreferenceView.as_view(), name="notification-preferences"),
]
