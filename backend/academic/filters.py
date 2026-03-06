"""Django-filter classes for the academic app."""

import django_filters
from .models import AcademicRequest, Course, Department, Semester, Subject


class DepartmentFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr="icontains")
    code = django_filters.CharFilter(lookup_expr="icontains")
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = Department
        fields = ["name", "code", "is_active"]


class CourseFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr="icontains")
    department = django_filters.ModelChoiceFilter(
        queryset=Department.objects.all()
    )
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = Course
        fields = ["name", "department", "is_active"]


class SemesterFilter(django_filters.FilterSet):
    course = django_filters.ModelChoiceFilter(queryset=Course.objects.all())
    academic_year = django_filters.CharFilter(lookup_expr="icontains")
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = Semester
        fields = ["course", "academic_year", "is_active"]


class SubjectFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr="icontains")
    code = django_filters.CharFilter(lookup_expr="icontains")
    is_common = django_filters.BooleanFilter()
    is_active = django_filters.BooleanFilter()
    department = django_filters.NumberFilter(
        field_name="mappings__department__id", distinct=True
    )
    semester = django_filters.NumberFilter(
        field_name="mappings__semester__id", distinct=True
    )

    class Meta:
        model = Subject
        fields = ["name", "code", "is_common", "is_active"]


class AcademicRequestFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=AcademicRequest.Status.choices)
    request_type = django_filters.ChoiceFilter(choices=AcademicRequest.RequestType.choices)
    requester = django_filters.NumberFilter(field_name="requester__id")

    class Meta:
        model = AcademicRequest
        fields = ["status", "request_type", "requester"]
