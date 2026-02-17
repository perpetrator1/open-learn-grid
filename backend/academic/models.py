"""
Models for the academic app.

Handles departments, courses, subjects, and semesters.
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from accounts.models import User


class Department(models.Model):
    """
    Academic department or faculty.
    """
    
    code = models.CharField(
        max_length=50,
        unique=True,
        help_text=_('Department code (e.g., CS, MATH)')
    )
    
    name = models.CharField(
        max_length=255,
        help_text=_('Full name of the department')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Department description')
    )
    
    head = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='departments_headed',
        help_text=_('Head of the department')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether the department is active')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['code']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Semester(models.Model):
    """
    Academic semester or term.
    """
    
    class SemesterType(models.TextChoices):
        FALL = 'fall', _('Fall')
        SPRING = 'spring', _('Spring')
        SUMMER = 'summer', _('Summer')
    
    code = models.CharField(
        max_length=50,
        unique=True,
        help_text=_('Semester code (e.g., Fall2024, Spring2025)')
    )
    
    name = models.CharField(
        max_length=255,
        help_text=_('Full name of the semester')
    )
    
    semester_type = models.CharField(
        max_length=10,
        choices=SemesterType.choices,
        help_text=_('Type of semester')
    )
    
    year = models.IntegerField(
        validators=[MinValueValidator(2000), MaxValueValidator(2100)],
        help_text=_('Academic year')
    )
    
    start_date = models.DateField(help_text=_('Semester start date'))
    end_date = models.DateField(help_text=_('Semester end date'))
    
    registration_open = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When student registration opens')
    )
    registration_close = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When student registration closes')
    )
    
    is_active = models.BooleanField(
        default=False,
        help_text=_('Whether this is the current active semester')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-year', '-semester_type']
        unique_together = ('semester_type', 'year')
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['-year']),
        ]
    
    def __str__(self):
        return self.name


class Subject(models.Model):
    """
    A subject or topic within the academic curriculum.
    """
    
    code = models.CharField(
        max_length=50,
        unique=True,
        help_text=_('Subject code')
    )
    
    name = models.CharField(
        max_length=255,
        help_text=_('Subject name')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Subject description and syllabus')
    )
    
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='subjects',
        help_text=_('Department offering this subject')
    )
    
    credits = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        help_text=_('Number of academic credits')
    )
    
    level = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Subject level (e.g., 100-level, 200-level)')
    )
    
    prerequisites = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='dependent_subjects',
        help_text=_('Prerequisite subjects')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether the subject is active')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['department', 'code']
        unique_together = ('department', 'code')
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['department']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Course(models.Model):
    """
    A specific offering of a subject in a particular semester.
    """
    
    code = models.CharField(
        max_length=100,
        help_text=_('Course code (e.g., CS101-001)')
    )
    
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='courses',
        help_text=_('Subject this course is based on')
    )
    
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='courses',
        help_text=_('Semester when this course is offered')
    )
    
    section = models.CharField(
        max_length=50,
        default='001',
        help_text=_('Course section number')
    )
    
    instructor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses_taught',
        help_text=_('Instructor teaching this course')
    )
    
    co_instructors = models.ManyToManyField(
        User,
        blank=True,
        related_name='co_taught_courses',
        help_text=_('Co-instructors for this course')
    )
    
    capacity = models.IntegerField(
        validators=[MinValueValidator(1)],
        default=30,
        help_text=_('Maximum number of students')
    )
    
    schedule = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Course schedule (days, times, location)')
    )
    
    syllabus = models.TextField(
        blank=True,
        help_text=_('Course syllabus and learning objectives')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether the course is active')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['semester', 'subject', 'section']
        unique_together = ('subject', 'semester', 'section')
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['semester']),
            models.Index(fields=['instructor']),
        ]
    
    def __str__(self):
        return f"{self.code} ({self.semester})"
    
    def enrollment_count(self):
        """Get current enrollment count"""
        return self.enrollments.filter(status='active').count()
