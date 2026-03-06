"""@audit_action decorator for DRF viewset actions."""
import functools
from .models import AuditLog


def audit_action(action_name, target_type=""):
    """Wrap a viewset method and record an AuditLog entry."""
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(self, request, *args, **kwargs):
            response = fn(self, request, *args, **kwargs)
            try:
                user = request.user if request.user.is_authenticated else None
                obj = getattr(response, "data", {})
                tid = obj.get("id") if isinstance(obj, dict) else None
                AuditLog.objects.create(
                    actor=user,
                    action=action_name,
                    target_type=target_type,
                    target_id=tid,
                    target_repr=str(obj.get("title", obj.get("name", tid or ""))),
                    metadata={
                        "ip": _get_ip(request),
                        "user_agent": request.META.get("HTTP_USER_AGENT", "")[:200],
                    },
                )
            except Exception:
                pass
            return response
        return wrapper
    return decorator


def _get_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR", "")
