# Permission constants for the Open Learn Grid permission system.
# Permissions are stored as strings in Role.permissions (JSONField).

# ---------------------------------------------------------------------------
# Materials
# ---------------------------------------------------------------------------
MATERIAL_PERMISSIONS = [
    "materials.view_material",
    "materials.create_material",
    "materials.edit_own_material",
    "materials.edit_any_material",
    "materials.delete_own_material",
    "materials.delete_any_material",
    "materials.submit_for_review",
    "materials.approve_material",
    "materials.reject_material",
    "materials.publish_material",
    "materials.unpublish_material",
    "materials.view_drafts",
    "materials.manage_tags",
    "materials.manage_categories",
]

# ---------------------------------------------------------------------------
# Academic / Curriculum
# ---------------------------------------------------------------------------
ACADEMIC_PERMISSIONS = [
    "academic.view_curriculum",
    "academic.manage_curriculum",
    "academic.view_department",
    "academic.manage_department",
    "academic.manage_courses",
]

# ---------------------------------------------------------------------------
# User Management
# ---------------------------------------------------------------------------
USER_PERMISSIONS = [
    "users.view_users",
    "users.edit_users",
    "users.deactivate_users",
    "users.assign_roles",
    "users.review_role_requests",
    "users.manage_roles",
    "users.view_audit_log",
]

# ---------------------------------------------------------------------------
# Moderation
# ---------------------------------------------------------------------------
MODERATION_PERMISSIONS = [
    "moderation.view_reports",
    "moderation.resolve_reports",
    "moderation.issue_warnings",
    "moderation.ban_users",
    "moderation.manage_flags",
]

# ---------------------------------------------------------------------------
# Federation
# ---------------------------------------------------------------------------
FEDERATION_PERMISSIONS = [
    "federation.manage_instances",
    "federation.view_federated_content",
    "federation.approve_federation",
    "federation.block_instance",
]

# ---------------------------------------------------------------------------
# Aggregates
# ---------------------------------------------------------------------------
ALL_PERMISSIONS = (
    MATERIAL_PERMISSIONS
    + ACADEMIC_PERMISSIONS
    + USER_PERMISSIONS
    + MODERATION_PERMISSIONS
    + FEDERATION_PERMISSIONS
)

# Default permission sets per system role
TEACHER_PERMISSIONS = [
    "materials.view_material",
    "materials.create_material",
    "materials.edit_own_material",
    "materials.delete_own_material",
    "materials.submit_for_review",
    "academic.view_curriculum",
    "academic.view_department",
]

VERIFIER_PERMISSIONS = [
    "materials.view_material",
    "materials.view_drafts",
    "materials.approve_material",
    "materials.reject_material",
    "materials.submit_for_review",
    "academic.view_curriculum",
]

STUDENT_PERMISSIONS = [
    "materials.view_material",
    "academic.view_curriculum",
    "academic.view_department",
]
