"""Serializers for the academic app."""

from rest_framework import serializers
from accounts.serializers import UserPublicSerializer
from .models import (
    AcademicRequest,
    Course,
    Department,
    Semester,
    Subject,
    SubjectMapping,
)


class DepartmentSerializer(serializers.ModelSerializer):
    course_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "code",
            "description",
            "logo",
            "is_active",
            "course_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_course_count(self, obj):
        return obj.courses.filter(is_active=True).count()


class DepartmentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["name", "code", "description", "logo", "is_active"]

    def validate_code(self, v):
        return v.upper()


class CourseSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        source="department",
        queryset=Department.objects.all(),
        write_only=True,
    )
    semester_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "code",
            "department",
            "department_id",
            "duration_years",
            "description",
            "is_active",
            "semester_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_semester_count(self, obj):
        return obj.semesters.filter(is_active=True).count()


class CourseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["name", "code", "department", "duration_years", "description", "is_active"]

    def validate_code(self, v):
        return v.upper()


class SemesterSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        source="course",
        queryset=Course.objects.all(),
        write_only=True,
    )
    subject_count = serializers.SerializerMethodField()

    class Meta:
        model = Semester
        fields = [
            "id",
            "number",
            "academic_year",
            "course",
            "course_id",
            "is_active",
            "subject_count",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_subject_count(self, obj):
        return obj.subject_mappings.filter(is_active=True).count()


class SemesterWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = ["number", "academic_year", "course", "is_active"]


class SubjectMappingSerializer(serializers.ModelSerializer):
    semester = SemesterSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True, allow_null=True)

    class Meta:
        model = SubjectMapping
        fields = ["id", "semester", "department", "is_active"]


class SubjectSerializer(serializers.ModelSerializer):
    mappings = SubjectMappingSerializer(many=True, read_only=True)

    class Meta:
        model = Subject
        fields = [
            "id",
            "name",
            "code",
            "description",
            "is_common",
            "credit_hours",
            "is_active",
            "mappings",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class SubjectWriteSerializer(serializers.ModelSerializer):
    semester_ids = serializers.PrimaryKeyRelatedField(
        queryset=Semester.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )
    department_ids = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )

    class Meta:
        model = Subject
        fields = [
            "name",
            "code",
            "description",
            "is_common",
            "credit_hours",
            "is_active",
            "semester_ids",
            "department_ids",
        ]

    def validate_code(self, v):
        return v.upper()

    def create(self, validated_data):
        semesters = validated_data.pop("semester_ids", [])
        departments = validated_data.pop("department_ids", [])
        validated_data["created_by"] = self.context["request"].user
        subject = super().create(validated_data)
        _create_mappings(subject, semesters, departments)
        return subject

    def update(self, instance, validated_data):
        semesters = validated_data.pop("semester_ids", None)
        departments = validated_data.pop("department_ids", None)
        subject = super().update(instance, validated_data)
        if semesters is not None:
            instance.mappings.all().delete()
            _create_mappings(subject, semesters, departments or [])
        return subject


def _create_mappings(subject, semesters, departments):
    if not departments:
        for sem in semesters:
            SubjectMapping.objects.get_or_create(
                subject=subject, semester=sem, department=None
            )
    else:
        for sem in semesters:
            for dept in departments:
                SubjectMapping.objects.get_or_create(
                    subject=subject, semester=sem, department=dept
                )


class SubjectMappingCreateSerializer(serializers.Serializer):
    semester_ids = serializers.ListField(child=serializers.IntegerField())
    department_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )


class AcademicRequestSerializer(serializers.ModelSerializer):
    requester = UserPublicSerializer(read_only=True)
    reviewed_by = UserPublicSerializer(read_only=True, allow_null=True)

    class Meta:
        model = AcademicRequest
        fields = [
            "id",
            "requester",
            "request_type",
            "payload",
            "status",
            "reviewed_by",
            "review_note",
            "created_at",
            "reviewed_at",
        ]
        read_only_fields = [
            "requester",
            "status",
            "reviewed_by",
            "review_note",
            "created_at",
            "reviewed_at",
        ]

    def create(self, validated_data):
        validated_data["requester"] = self.context["request"].user
        return super().create(validated_data)


class AcademicRequestReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[("approved", "Approved"), ("rejected", "Rejected")]
    )
    review_note = serializers.CharField(required=False, default="", allow_blank=True)
