from django.urls import path
from .views import DashboardStatsView, DashboardActivityView, MaterialsOverTimeView, VerificationStatusView

urlpatterns = [
    path("stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("activity/", DashboardActivityView.as_view(), name="dashboard-activity"),
    path("materials-over-time/", MaterialsOverTimeView.as_view(), name="dashboard-materials-over-time"),
    path("verification-status/", VerificationStatusView.as_view(), name="dashboard-verification-status"),
]
