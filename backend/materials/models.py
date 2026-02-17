"""
Models for the materials app.

Handles course materials including notes, question papers, and other resources.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from academic.models import Course, Subject
from accounts.models import User


class MaterialType(models.Model):
    """
    Types of course materials available.
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text=_('Name of the material type')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Description of the material type')
    )
    
    is_system_type = models.BooleanField(
        default=False,
        help_text=_('Whether this is a system-defined type')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class CourseMaterial(models.Model):
    """
    Study materials uploaded for a course.
    """
    
    class AccessLevel(models.TextChoices):
        PUBLIC = 'public', _('Public')
        ENROLLED = 'enrolled', _('Enrolled Students Only')
        RESTRICTED = 'restricted', _('Restricted')
    
    title = models.CharField(
        max_length=255,
        help_text=_('Title of the material')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Description of the material')
    )
    
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='materials',
        help_text=_('Associated course')
    )
    
    material_type = models.ForeignKey(
        MaterialType,
        on_delete=models.PROTECT,
        related_name='materials',
        help_text=_('Type of material')
    )
    
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_materials',
        help_text=_('User who uploaded the material')
    )
    
    file = models.FileField(
        upload_to='course_materials/%Y/%m/%d/',
        help_text=_('Material file')
    )
    
    access_level = models.CharField(
        max_length=20,
        choices=AccessLevel.choices,
        default=AccessLevel.ENROLLED,
        help_text=_('Who can access this material')
    )
    
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text=_('Tags for categorization')
    )
    
    is_archived = models.BooleanField(
        default=False,
        help_text=_('Whether this material is archived')
    )
    
    view_count = models.IntegerField(
        default=0,
        help_text=_('Number of times this material has been viewed')
    )
    
    download_count = models.IntegerField(
        default=0,
        help_text=_('Number of times this material has been downloaded')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['course']),
            models.Index(fields=['material_type']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.course})"


class QuestionPaper(models.Model):
    """
    Exam question papers and assignments.
    """
    
    class PaperType(models.TextChoices):
        MIDTERM = 'midterm', _('Midterm Exam')
        FINAL = 'final', _('Final Exam')
        QUIZ = 'quiz', _('Quiz')
        ASSIGNMENT = 'assignment', _('Assignment')
        PRACTICE = 'practice', _('Practice Paper')
    
    class DifficultyLevel(models.TextChoices):
        EASY = 'easy', _('Easy')
        MEDIUM = 'medium', _('Medium')
        HARD = 'hard', _('Hard')
    
    title = models.CharField(
        max_length=255,
        help_text=_('Title of the question paper')
    )
    
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='question_papers',
        null=True,
        blank=True,
        help_text=_('Associated course')
    )
    
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='question_papers',
        null=True,
        blank=True,
        help_text=_('Associated subject')
    )
    
    paper_type = models.CharField(
        max_length=20,
        choices=PaperType.choices,
        help_text=_('Type of question paper')
    )
    
    difficulty = models.CharField(
        max_length=20,
        choices=DifficultyLevel.choices,
        default=DifficultyLevel.MEDIUM,
        help_text=_('Difficulty level')
    )
    
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_question_papers',
        help_text=_('User who uploaded the paper')
    )
    
    file = models.FileField(
        upload_to='question_papers/%Y/%m/%d/',
        help_text=_('Question paper file')
    )
    
    solution_file = models.FileField(
        upload_to='question_papers/solutions/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text=_('Solution file')
    )
    
    exam_date = models.DateField(
        null=True,
        blank=True,
        help_text=_('Date when the exam was conducted')
    )
    
    total_marks = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        help_text=_('Total marks for the paper')
    )
    
    duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        help_text=_('Duration of exam in minutes')
    )
    
    is_archived = models.BooleanField(
        default=False,
        help_text=_('Whether this paper is archived')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-exam_date', '-created_at']
        indexes = [
            models.Index(fields=['course']),
            models.Index(fields=['paper_type']),
            models.Index(fields=['-exam_date']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_paper_type_display()})"


class Note(models.Model):
    """
    User-generated study notes.
    """
    
    title = models.CharField(
        max_length=255,
        help_text=_('Note title')
    )
    
    content = models.TextField(help_text=_('Note content'))
    
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='notes',
        null=True,
        blank=True,
        help_text=_('Associated course')
    )
    
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='notes',
        null=True,
        blank=True,
        help_text=_('Associated subject')
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_notes',
        help_text=_('User who created the note')
    )
    
    is_public = models.BooleanField(
        default=False,
        help_text=_('Whether the note is publicly visible')
    )
    
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text=_('Tags for categorization')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['course']),
            models.Index(fields=['created_by']),
            models.Index(fields=['-updated_at']),
        ]
    
    def __str__(self):
        return self.title
