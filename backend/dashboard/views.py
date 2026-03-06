from django.utils import timezone
from django.db.models.functions import TruncMonth, TruncWeek
from django.db.models import Count, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import timedelta

from accounts.models import User, UserRole
from academic.models import Department, Course, Subject
from materials.models import Material, MaterialRequest


def _user_perms(user):
    if not user.is_authenticated:
        return []
    if user.is_staff:
        return ["admin.view_dashboard"]
    perms = set()
    for ur in user.user_roles.select_related("role"):
        perms.update(ur.role.permissions if isinstance(ur.role.permissions, list) else [])
    return list(perms)


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        perms = _user_perms(user)
        is_admin = user.is_staff or "admin.view_dashboard" in perms
        is_teacher = "materials.upload" in perms

        now = timezone.now()
        week_ago = now - timedelta(days=7)

        if is_admin:
            data = {
                "total_users": User.objects.count(),
                "total_materials": Material.objects.count(),
                "pending_verification": Material.objects.filter(verification_status="pending").count(),
                "pending_requests": MaterialRequest.objects.filter(status="pending").count(),
                "total_departments": Department.objects.count(),
                "total_subjects": Subject.objects.count(),
                "new_users_this_week": User.objects.filter(date_joined__gte=week_ago).count(),
                "new_materials_this_week": Material.objects.filter(created_at__gte=week_ago).count(),
            }
        elif is_teacher:
            my_materials = Material.objects.filter(uploaded_by=user)
            data = {
                "my_materials": my_materials.count(),
                "verified_materials": my_materials.filter(verification_status="verified").count(),
                "rejected_materials": my_materials.filter(verification_status="rejected").count(),
                "pending_materials": my_materials.filter(verification_status="pending").count(),
                "total_downloads": sum(m.download_count for m in my_materials),
                "total_views": sum(m.view_count for m in my_materials),
            }
        else:
            data = {
                "available_materials": Material.objects.filter(verification_status="verified").count(),
                "my_requests": MaterialRequest.objects.filter(requester=user).count(),
                "approved_requests": MaterialRequest.objects.filter(requester=user, status="approved").count(),
            }
        return Response(data)


class DashboardActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        perms = _user_perms(user)
        is_admin = user.is_staff or "admin.view_dashboard" in perms
        now = timezone.now()
        days = int(request.query_params.get("days", 30))
        since = now - timedelta(days=days)
        activity = []
        if is_admin:
            for mat in Material.objects.filter(created_at__gte=since).order_by("-created_at")[:20]:
                activity.append({
                    "type": "material_uploaded",
                    "message": f"{mat.uploaded_by.email if mat.uploaded_by else 'Unknown'} uploaded '{mat.title}'",
                    "timestamp": mat.created_at,
                    "link": f"/materials/{mat.pk}",
                })
            for u in User.objects.filter(date_joined__gte=since).order_by("-date_joined")[:10]:
                activity.append({
                    "type": "user_joined",
                    "message": f"{u.email} joined",
                    "timestamp": u.date_joined,
                    "link": None,
                })
        else:
            for mat in Material.objects.filter(
                verification_status="verified", created_at__gte=since
            ).order_by("-created_at")[:20]:
                activity.append({
                    "type": "material_available",
                    "message": f"New material: '{mat.title}'",
                    "timestamp": mat.created_at,
                    "link": f"/materials/{mat.pk}",
                })
        activity.sort(key=lambda x: x["timestamp"], reverse=True)
        return Response(activity[:30])


class MaterialsOverTimeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        perms = _user_perms(user)
        is_admin = user.is_staff or "admin.view_dashboard" in perms
        since = timezone.now() - timedelta(days=180)
        qs = Material.objects.filter(created_at__gte=since)
        if not is_admin:
            qs = qs.filter(uploaded_by=user)
        data = (
            qs.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        return Response([{"date": row["month"].strftime("%Y-%m"), "count": row["count"]} for row in data])


class VerificationStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Count
        qs = Material.objects.values("verification_status").annotate(count=Count("id"))
        label_map = {
            "pending": "Pending",
            "verified": "Verified",
            "rejected": "Rejected",
            "draft": "Draft",
        }
        return Response([
            {"label": label_map.get(row["verification_status"], row["verification_status"]), "value": row["count"]}
            for row in qs
        ])

