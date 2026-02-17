"""
Models for the accounts app.

Handles user authentication, profiles, and roles.
"""

from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import EmailValidator
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """
    Custom user manager for the User model.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a regular user with the given email and password.
        """
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a superuser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True'))
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model replacing Django's default User model.
    Uses email as the unique identifier instead of username.
    """
    
    class UserRole(models.TextChoices):
        STUDENT = 'student', _('Student')
        INSTRUCTOR = 'instructor', _('Instructor')
        ADMIN = 'admin', _('Administrator')
        MODERATOR = 'moderator', _('Moderator')
    
    email = models.EmailField(
        _('email address'),
        unique=True,
        validators=[EmailValidator()],
        help_text=_('Required. Unique email address for identification.')
    )
    username = None  # Remove username field
    
    profile_picture = models.ImageField(
        upload_to='profile_pictures/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text=_('User profile picture')
    )
    
    bio = models.TextField(
        max_length=500,
        blank=True,
        help_text=_('User bio or short description')
    )
    
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT,
        help_text=_('User role within the platform')
    )
    
    is_email_verified = models.BooleanField(
        default=False,
        help_text=_('Whether the user has verified their email')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether the user account is active')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        """Return full name"""
        return f"{self.first_name} {self.last_name}".strip() or self.email
    
    def get_short_name(self):
        """Return short name"""
        return self.first_name or self.email.split('@')[0]


class UserProfile(models.Model):
    """
    Extended user profile information.
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        primary_key=True,
        help_text=_('Associated user account')
    )
    
    institution = models.CharField(
        max_length=255,
        blank=True,
        help_text=_('Associated institution or organization')
    )
    
    department = models.CharField(
        max_length=255,
        blank=True,
        help_text=_('Department or specialization')
    )
    
    location = models.CharField(
        max_length=255,
        blank=True,
        help_text=_('Geographic location of the user')
    )
    
    website = models.URLField(
        blank=True,
        help_text=_('Personal website or portfolio URL')
    )
    
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        help_text=_('Contact phone number')
    )
    
    social_links = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Social media and other links as JSON')
    )
    
    preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('User preferences as JSON')
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('User Profile')
        verbose_name_plural = _('User Profiles')
    
    def __str__(self):
        return f"Profile of {self.user}"


class Role(models.Model):
    """
    Custom role definitions with specific permissions.
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text=_('Name of the role')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Description of the role and its responsibilities')
    )
    
    permissions = models.JSONField(
        default=list,
        blank=True,
        help_text=_('List of permissions assigned to this role')
    )
    
    is_system_role = models.BooleanField(
        default=False,
        help_text=_('Whether this is a system-defined role')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_system_role', 'name']
        indexes = [
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return self.name


class UserRole(models.Model):
    """
    Association between users and custom roles.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='custom_roles',
        help_text=_('User assigned to this role')
    )
    
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='users',
        help_text=_('Role assigned to the user')
    )
    
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'role')
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.role.name}"
