"""Well-known URL for instance discovery."""
from django.urls import path
from federation.views import WellKnownView

urlpatterns = [
    path("openlearngrid/instance", WellKnownView.as_view(), name="well-known-instance"),
]
