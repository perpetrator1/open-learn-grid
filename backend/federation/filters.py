"""Federation filters."""

import django_filters
from .models import Instance, FederatedActivity, FederatedMaterial


class InstanceFilter(django_filters.FilterSet):
    trust_level = django_filters.ChoiceFilter(choices=Instance.TrustLevel.choices)
    is_reachable = django_filters.BooleanFilter()
    is_active = django_filters.BooleanFilter()
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Instance
        fields = ["trust_level", "is_reachable", "is_active"]

    def filter_search(self, qs, name, value):
        from django.db.models import Q
        return qs.filter(Q(domain__icontains=value) | Q(name__icontains=value))


class FederatedActivityFilter(django_filters.FilterSet):
    activity_type = django_filters.ChoiceFilter(choices=FederatedActivity.ActivityType.choices)
    status = django_filters.ChoiceFilter(choices=FederatedActivity.Status.choices)
    from_instance = django_filters.NumberFilter(field_name="from_instance__id")
    date_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    date_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = FederatedActivity
        fields = ["activity_type", "status"]


class FederatedMaterialFilter(django_filters.FilterSet):
    source_instance = django_filters.NumberFilter(field_name="source_instance__id")
    material_type = django_filters.CharFilter(lookup_expr="iexact")
    subject_name = django_filters.CharFilter(lookup_expr="icontains")
    semester_number = django_filters.NumberFilter()
    search = django_filters.CharFilter(method="filter_search")
    tags = django_filters.CharFilter(method="filter_tags")

    class Meta:
        model = FederatedMaterial
        fields = ["source_instance", "material_type", "semester_number"]

    def filter_search(self, qs, name, value):
        from django.db.models import Q
        return qs.filter(
            Q(title__icontains=value)
            | Q(description__icontains=value)
            | Q(subject_name__icontains=value)
        )

    def filter_tags(self, qs, name, value):
        # Filter materials containing any of the comma-separated tags
        tags = [t.strip().lower() for t in value.split(",") if t.strip()]
        for tag in tags:
            qs = qs.filter(tags__contains=tag)
        return qs
