from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, BanViewSet, AppealViewSet

router = DefaultRouter()
router.register("reports", ReportViewSet, basename="report")
router.register("bans", BanViewSet, basename="ban")
router.register("appeals", AppealViewSet, basename="appeal")

urlpatterns = router.urls
