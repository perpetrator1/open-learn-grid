from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health_check"),
    path("", include("accounts.urls")),
    path("", include("academic.urls")),
    path("", include("materials.urls")),
    path("api/moderation/", include("moderation.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/audit/", include("audit.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/verification/queue/", __import__("materials.verification_views", fromlist=["VerificationQueueView"]).VerificationQueueView.as_view(), name="verification-queue"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
