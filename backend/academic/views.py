"""Views for the academic app."""

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import ACADEMIC_PERMISSIONS
from .filters import (
    AcademicRequestFilter,
    CourseFilter,
    DepartmentFilter,
    SemesterFilter,
    SubjectFilter,
)
from .models import AcademicRequest, Course, Department, Semester, Subject, SubjectMapping
from .serializers import (
    AcademicRequestReviewSerializer,
    AcademicRequestSerializer,
    CourseSerializer,
    CourseWriteSerializer,
    DepartmentSerializer,
    DepartmentWriteSerializer,
    SemesterSerializer,
    SemesterWriteSerializer,
    SubjectMappingCreateSerializer,
    SubjectMappingSerializer,
    SubjectSerializer,
    SubjectWriteSerializer,
)


def _is_admin(user):
    """Check if user has curriculum management permission."""
    if user.is_staff or user.is_superuser:
        return True
    perms = set()
    for ur in user.user_roles.select_related("role").all():
        perms.update(ur.role.permissions or [])
    return ACADEMIC_PERMISSIONS[1] in perms  # academic.manage_curriculum


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DepartmentFilter
    search_fields = ["name", "code"]
    ordering_fields = ["name", "code", "created_at"]
    ordering = ["name"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return DepartmentWriteSerializer
        return DepartmentSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]  # admin check in perform_*

    def perform_create(self, serializer):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to create departments.")
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to update departments.")
        serializer.save()

    def perform_destroy(self, instance):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to delete departments.")
        instance.is_active = False
        instance.save()


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related("department").all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CourseFilter
    search_fields = ["name", "code"]
    ordering_fields = ["name", "code", "created_at"]
    ordering = ["name"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return CourseWriteSerializer
        return CourseSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to create courses.")
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to update courses.")
        serializer.save()

    def perform_destroy(self, instance):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to delete courses.")
        instance.is_active = False
        instance.save()


class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.select_related("course__department").all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = SemesterFilter
    ordering_fields = ["number", "academic_year", "created_at"]
    ordering = ["number"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return SemesterWriteSerializer
        return SemesterSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to create semesters.")
        serializer.save()

    def perform_update(self, serializer):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        serializer.save()

    def perform_destroy(self, instance):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        instance.is_active = False
        instance.save()


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.prefetch_related(
        "mappings__semester__course", "mappings__department"
    ).all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = SubjectFilter
    search_fields = ["name", "code"]
    ordering_fields = ["name", "code", "credit_hours"]
    ordering = ["name"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return SubjectWriteSerializer
        return SubjectSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to create subjects.")
        serializer.save()

    def perform_update(self, serializer):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        serializer.save()

    def perform_destroy(self, instance):
        if not _is_admin(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=["get"], url_path="mappings")
    def mappings(self, request, pk=None):
        """GET /api/subjects/{id}/mappings/ — list all mappings for this subject."""
        subject = self.get_object()
        qs = subject.mappings.select_related("semester__course", "department").all()
        serializer = SubjectMappingSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="mappings/add")
    def add_mappings(self, request, pk=None):
        """POST /api/subjects/{id}/mappings/add — add semester+department mappings."""
        if not _is_admin(request.user):
            return Response(
                {"detail": "You do not have permission."},
                status=status.HTTP_403_FORBIDDEN,
            )
        subject = self.get_object()
        serializer = SubjectMappingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        from academic.models import Semester as S, Department as D
        semesters = list(S.objects.filter(pk__in=data["semester_ids"]))
        departments = list(D.objects.filter(pk__in=data["department_ids"]))
        from .serializers import _create_mappings
        _create_mappings(subject, semesters, departments)
        qs = subject.mappings.select_related("semester__course", "department").all()
        return Response(SubjectMappingSerializer(qs, many=True).data)


class SubjectMappingDestroyView(viewsets.GenericViewSet):
    """DELETE /api/subject-mappings/{id}/"""

    queryset = SubjectMapping.objects.all()
    serializer_class = SubjectMappingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, pk=None):
        if not _is_admin(request.user):
            return Response(
                {"detail": "You do not have permission."},
                status=status.HTTP_403_FORBIDDEN,
            )
        mapping = self.get_object()
        mapping.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AcademicRequestViewSet(viewsets.ModelViewSet):
    queryset = AcademicRequest.objects.select_related("requester", "reviewed_by").all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = AcademicRequestFilter
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.action == "review":
            return AcademicRequestReviewSerializer
        return AcademicRequestSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        if not _is_admin(self.request.user):
            qs = qs.filter(requester=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)

    @action(detail=True, methods=["patch"], url_path="review")
    def review(self, request, pk=None):
        """PATCH /api/academic-requests/{id}/review/ — approve or reject."""
        if not _is_admin(request.user):
            return Response(
                {"detail": "You do not have permission to review requests."},
                status=status.HTTP_403_FORBIDDEN,
            )
        obj = self.get_object()
        if obj.status != AcademicRequest.Status.PENDING:
            return Response(
                {"detail": "This request has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = AcademicRequestReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj.status = serializer.validated_data["status"]
        obj.review_note = serializer.validated_data.get("review_note", "")
        obj.reviewed_by = request.user
        obj.reviewed_at = timezone.now()
        obj.save()
        return Response(AcademicRequestSerializer(obj).data)
