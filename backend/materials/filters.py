"""Django-filter classes for the materials app."""

import django_filters
from .models import Material, MaterialRequest


class MaterialFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(lookup_expr="icontains")
    department = django_filters.NumberFilter(field_name="department__id")
    course = django_filters.NumberFilter(field_name="course__id")
    semester = django_filters.NumberFilter(field_name="semester__id")
    subject = django_filters.NumberFilter(field_name="subject__id")
    material_type = django_filters.NumberFilter(field_name="material_type__id")
    verification_status = django_filters.ChoiceFilter(
        choices=Material.VerificationStatus.choices
    )
    uploaded_by = django_filters.NumberFilter(field_name="uploaded_by__id")
    verified_by = django_filters.NumberFilter(field_name="verified_by__id")
    tags = django_filters.CharFilter(field_name="tags__name", lookup_expr="iexact")
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr="lte")
    is_archived = django_filters.BooleanFilter()
    search = django_filters.CharFilter(method="full_text_search")

    class Meta:
        model = Material
        fields = [
            "title",
            "department",
            "course",
            "semester",
            "subject",
            "material_type",
            "verification_status",
            "uploaded_by",
            "verified_by",
            "tags",
            "date_from",
            "date_to",
            "is_archived",
        ]

    def full_text_search(self, queryset, name, value):
        from .search import material_search
        return material_search(queryset, value)


class MaterialRequestFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=MaterialRequest.Status.choices)
    request_type = django_filters.ChoiceFilter(choices=MaterialRequest.RequestType.choices)
    requester = django_filters.NumberFilter(field_name="requester__id")

    class Meta:
        model = MaterialRequest
        fields = ["status", "request_type", "requester"]
