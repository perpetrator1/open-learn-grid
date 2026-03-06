"""Data migration: seed the four default system roles."""

from django.db import migrations


def create_default_roles(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    db_alias = schema_editor.connection.alias

    roles = [
        {
            "name": "admin",
            "description": "Full system administrator with all permissions.",
            "is_system_role": True,
            "permissions": [
                "materials.view_material", "materials.create_material",
                "materials.edit_own_material", "materials.edit_any_material",
                "materials.delete_own_material", "materials.delete_any_material",
                "materials.submit_for_review", "materials.approve_material",
                "materials.reject_material", "materials.publish_material",
                "materials.unpublish_material", "materials.view_drafts",
                "materials.manage_tags", "materials.manage_categories",
                "academic.view_curriculum", "academic.manage_curriculum",
                "academic.view_department", "academic.manage_department",
                "academic.manage_courses",
                "users.view_users", "users.edit_users", "users.deactivate_users",
                "users.assign_roles", "users.review_role_requests",
                "users.manage_roles", "users.view_audit_log",
                "moderation.view_reports", "moderation.resolve_reports",
                "moderation.issue_warnings", "moderation.ban_users",
                "moderation.manage_flags",
                "federation.manage_instances", "federation.view_federated_content",
                "federation.approve_federation", "federation.block_instance",
            ],
        },
        {
            "name": "teacher",
            "description": "Can create, edit, and submit their own learning materials.",
            "is_system_role": True,
            "permissions": [
                "materials.view_material", "materials.create_material",
                "materials.edit_own_material", "materials.delete_own_material",
                "materials.submit_for_review",
                "academic.view_curriculum", "academic.view_department",
            ],
        },
        {
            "name": "verifier",
            "description": "Can review and approve/reject submitted materials.",
            "is_system_role": True,
            "permissions": [
                "materials.view_material", "materials.view_drafts",
                "materials.approve_material", "materials.reject_material",
                "materials.submit_for_review",
                "academic.view_curriculum",
            ],
        },
        {
            "name": "student",
            "description": "Can view published learning materials and curriculum.",
            "is_system_role": True,
            "permissions": [
                "materials.view_material",
                "academic.view_curriculum", "academic.view_department",
            ],
        },
    ]

    for role_data in roles:
        Role.objects.using(db_alias).get_or_create(
            name=role_data["name"],
            defaults={
                "description": role_data["description"],
                "is_system_role": role_data["is_system_role"],
                "permissions": role_data["permissions"],
            },
        )


def remove_default_roles(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    db_alias = schema_editor.connection.alias
    Role.objects.using(db_alias).filter(
        name__in=["admin", "teacher", "verifier", "student"],
        is_system_role=True,
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_default_roles, remove_default_roles),
    ]
