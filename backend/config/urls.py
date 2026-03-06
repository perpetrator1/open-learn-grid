from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from .health import HealthCheckView, ReadinessView, LivenessView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", HealthCheckView.as_view(), name="health_check"),
    path("api/readiness/", ReadinessView.as_view(), name="readiness"),
    path("api/liveness/", LivenessView.as_view(), name="liveness"),
    path("", include("accounts.urls")),
    path("", include("academic.urls")),
    path("", include("materials.urls")),
    path("api/moderation/", include("moderation.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/audit/", include("audit.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/federation/", include("federation.urls")),
    path(".well-known/", include("config.well_known_urls")),
    path("api/verification/queue/", __import__("materials.verification_views", fromlist=["VerificationQueueView"]).VerificationQueueView.as_view(), name="verification-queue"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
