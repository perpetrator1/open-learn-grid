import django_filters
from .models import Report, Ban


class ReportFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Report.Status.choices)
    reported_item_type = django_filters.ChoiceFilter(choices=Report.ItemType.choices)
    reason = django_filters.ChoiceFilter(choices=Report.Reason.choices)

    class Meta:
        model = Report
        fields = ["status", "reported_item_type", "reason", "assigned_to"]


class BanFilter(django_filters.FilterSet):
    scope = django_filters.ChoiceFilter(choices=Ban.Scope.choices)
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = Ban
        fields = ["scope", "is_active", "user"]
