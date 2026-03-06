"""URL routing for the materials app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    MaterialRequestViewSet,
    MaterialTypeViewSet,
    MaterialViewSet,
    TagViewSet,
)

router = DefaultRouter()
router.register("material-types", MaterialTypeViewSet, basename="material-type")
router.register("tags", TagViewSet, basename="tag")
router.register("materials", MaterialViewSet, basename="material")
router.register("material-requests", MaterialRequestViewSet, basename="material-request")

urlpatterns = [
    path("api/", include(router.urls)),
]
