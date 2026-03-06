"""Federation URL configuration."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    FederatedActivityViewSet,
    FederatedMaterialViewSet,
    FederationInboxView,
    FederationMetricsView,
    FederationShareMaterialView,
    GenerateKeysView,
    InstanceBlockViewSet,
    InstanceHealthView,
    InstanceViewSet,
    WellKnownView,
)

router = DefaultRouter()
router.register("instances", InstanceViewSet, basename="federation-instances")
router.register("activities", FederatedActivityViewSet, basename="federation-activities")
router.register("materials", FederatedMaterialViewSet, basename="federation-materials")
router.register("blocks", InstanceBlockViewSet, basename="federation-blocks")

urlpatterns = [
    path("", include(router.urls)),
    path("inbox/", FederationInboxView.as_view(), name="federation-inbox"),
    path("share-material/<int:material_id>/", FederationShareMaterialView.as_view(), name="federation-share-material"),
    path("health/", InstanceHealthView.as_view(), name="federation-health"),
    path("metrics/", FederationMetricsView.as_view(), name="federation-metrics"),
    path("generate-keys/", GenerateKeysView.as_view(), name="federation-generate-keys"),
]
