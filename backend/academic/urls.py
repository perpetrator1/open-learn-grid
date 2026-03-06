"""URL routing for the academic app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicRequestViewSet,
    CourseViewSet,
    DepartmentViewSet,
    SemesterViewSet,
    SubjectMappingDestroyView,
    SubjectViewSet,
)

router = DefaultRouter()
router.register("departments", DepartmentViewSet, basename="department")
router.register("courses", CourseViewSet, basename="course")
router.register("semesters", SemesterViewSet, basename="semester")
router.register("subjects", SubjectViewSet, basename="subject")
router.register("subject-mappings", SubjectMappingDestroyView, basename="subject-mapping")
router.register("academic-requests", AcademicRequestViewSet, basename="academic-request")

urlpatterns = [
    path("api/", include(router.urls)),
]
