from django.conf import settings
from django.db import models
from django.utils import timezone
from django.contrib.postgres.indexes import BrinIndex  # optional for time series scaling
from django.core.validators import MinValueValidator

User = settings.AUTH_USER_MODEL


# ---------- Helper choices ----------
PRIORITY_CHOICES = [
    ("low", "Low"),
    ("medium", "Medium"),
    ("high", "High"),
    ("urgent", "Urgent"),
]

TASK_STATUS = [
    ("todo", "To Do"),
    ("in_progress", "In Progress"),
    ("done", "Done"),
    ("paused", "Paused"),
    ("cancelled", "Cancelled"),
]

FOCUS_MODE_PRESET = [
    ("pomodoro", "Pomodoro"),
    ("flow", "Flow / Hero's Journey"),
    ("mini", "Mini / Hop In"),
    ("shuffle", "Task Shuffle"),
    ("custom", "Custom"),
]


# ---------- Category (pre-defined + user) ----------
class Category(models.Model):
    """
    Task categories. App ships with seed categories (Chores, School, Work, Hobby, SmallBusiness, etc.)
    Users can also create their own categories. `extra_schema` stores optional custom fields
    that apply to tasks of this category (e.g. 'client', 'project', 'difficulty').
    """
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE,
                             help_text="Null = global/predefined category")
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, blank=True, help_text="Optional color name or hex")
    extra_schema = models.JSONField(default=dict, blank=True,
                                    help_text="JSON schema or sample fields for tasks in this category")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "name")

    def __str__(self):
        return f"{self.name}" if not self.user else f"{self.name} ({self.user})"


# ---------- Task model ----------
class Task(models.Model):
    """
    Core task object. Supports voice/image attachments, custom fields (JSON), recurrence (text),
    estimated duration, and separate 'preferenced time' vs 'due date'.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, null=True, on_delete=models.SET_NULL, related_name="tasks")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    status = models.CharField(max_length=20, choices=TASK_STATUS, default="todo")
    # estimated duration in minutes
    estimated_minutes = models.PositiveIntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    # when the user prefers to do it or "preferably done at"
    preferred_datetime = models.DateTimeField(null=True, blank=True)
    # actual due date (deadline)
    due_date = models.DateTimeField(null=True, blank=True)
    # free-text recurrence (e.g., "every Mon,Wed" or iCal rule if desired)
    recurrence_rule = models.CharField(max_length=500, blank=True, help_text="Human or iCal recurrence text")
    # allow arbitrary extra fields depending on category (e.g. client, location)
    custom_fields = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Media attachments
    image = models.ImageField(upload_to="task_images/", null=True, blank=True)
    voice_note = models.FileField(upload_to="task_voice/", null=True, blank=True)

    # flags
    frozen = models.BooleanField(default=False, help_text="Frozen (paused) till further notice")
    freeze_reason = models.TextField(blank=True)
    archived = models.BooleanField(default=False)

    # soft ordering and grouping
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["-priority", "order", "-created_at"]

    def mark_done(self):
        self.status = "done"
        self.completed_at = timezone.now()
        self.save()

    def __str__(self):
        return f"{self.title} ({self.user})"


# ---------- Focus Mode (user-defined / presets) ----------
class FocusMode(models.Model):
    """
    Defines focus session types users can choose from.
    Presets: Pomodoro (25/5), Flow, Mini (5-10), Shuffle, or user-defined.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="focus_modes", null=True, blank=True)
    name = models.CharField(max_length=100)
    preset = models.CharField(max_length=30, choices=FOCUS_MODE_PRESET, default="custom")
    # configuration details custom (e.g., work_seconds, break_seconds, max_daily_runs, allow_no_timer)
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user or 'global'})"


# ---------- Focus session logs ----------
class FocusSession(models.Model):
    """
    Records each focus session. Used for analytics and adaptive engine.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="focus_sessions")
    mode = models.ForeignKey(FocusMode, null=True, blank=True, on_delete=models.SET_NULL)
    mode_name = models.CharField(max_length=120, blank=True, help_text="Cached name for quick queries")
    related_tasks = models.ManyToManyField(Task, blank=True, related_name="focus_sessions")
    # real times
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)
    # metrics
    interruptions = models.PositiveIntegerField(default=0, help_text="Times user left session / distracted")
    distractions_resisted = models.PositiveIntegerField(default=0)
    effective_minutes = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    # auto flags: is_hyperfocus (no timer) etc.
    is_hyperfocus = models.BooleanField(default=False)

    # for shuffle session: store chosen tasks snapshot
    metadata = models.JSONField(default=dict, blank=True, help_text="Extra info (task order, randomized list etc.)")

    class Meta:
        indexes = [
            models.Index(fields=["user", "started_at"]),
            BrinIndex(fields=["started_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.ended_at and not self.effective_minutes:
            self.effective_minutes = int((self.ended_at - self.started_at).total_seconds() // 60)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"FocusSession({self.user}, {self.mode_name or self.mode})"


# ---------- Adaptive focus engine data (aggregated) ----------
class FocusMetric(models.Model):
    """
    Per-user aggregated metrics used by the adaptive engine to recommend session lengths/times.
    Stores summaries per day/time-slot for easier ML/stat queries.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="focus_metrics")
    date = models.DateField()
    time_slot = models.CharField(max_length=32, blank=True, help_text="e.g., 'morning','afternoon','evening'")
    avg_effective_minutes = models.FloatField(default=0.0)
    session_count = models.PositiveIntegerField(default=0)
    avg_interruptions = models.FloatField(default=0.0)

    class Meta:
        unique_together = ("user", "date", "time_slot")


# ---------- Hobby and HobbyActivity ----------
class Hobby(models.Model):
    """
    User-defined hobbies. Each hobby can define a `schema` of fields that appear every time the user logs an activity.
    Example schema: {"duration_min": "number", "mood": "string", "materials": "string"}
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="hobbies")
    name = models.CharField(max_length=120)
    icon = models.CharField(max_length=10, blank=True)
    schema = models.JSONField(default=dict, blank=True, help_text="Field definitions used for HobbyActivity.custom_data")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user})"


class HobbyActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="hobby_activities")
    hobby = models.ForeignKey(Hobby, on_delete=models.CASCADE, related_name="activities")
    timestamp = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)
    custom_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# ---------- Reminders ----------
class Reminder(models.Model):
    """
    Reminders can attach to tasks or be standalone.
    Users can 'freeze' a reminder (pause) with reason.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reminders")
    task = models.ForeignKey(Task, null=True, blank=True, on_delete=models.CASCADE, related_name="reminders")
    title = models.CharField(max_length=255)
    note = models.TextField(blank=True)
    remind_at = models.DateTimeField(null=True, blank=True)
    repeat_rule = models.CharField(max_length=200, blank=True)
    frozen = models.BooleanField(default=False)
    freeze_reason = models.TextField(blank=True)
    snoozed_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def freeze(self, reason: str = ""):
        self.frozen = True
        self.freeze_reason = reason
        self.save()

    def unfreeze(self):
        self.frozen = False
        self.freeze_reason = ""
        self.save()


# ---------- Notes / Journal / Future Self ----------
class Note(models.Model):
    """
    Generic note; can be journal entry or a note tied to a task/hobby.
    send_to_future: optionally schedule to be delivered back to user at future_date
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField()
    task = models.ForeignKey(Task, null=True, blank=True, on_delete=models.SET_NULL, related_name="notes")
    mood_at_time = models.CharField(max_length=50, blank=True)  # snapshot
    send_to_future = models.BooleanField(default=False)
    future_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# ---------- Mood log ----------
class MoodLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="mood_logs")
    mood = models.CharField(max_length=50)
    rating = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# ---------- Shopping, expiration detection, and money tracking ----------
class ShoppingItem(models.Model):
    """
    Items user adds to shopping list. If user takes a picture (e.g., about to expire),
    the item can be scheduled for reminder/purchase.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="shopping_items")
    name = models.CharField(max_length=255)
    image = models.ImageField(upload_to="shopping_images/", null=True, blank=True)
    note = models.TextField(blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit = models.CharField(max_length=30, blank=True)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    purchased = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="expenses")
    shopping_item = models.ForeignKey(ShoppingItem, null=True, blank=True, on_delete=models.SET_NULL,
                                      related_name="expenses")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=8, default="USD")
    category = models.CharField(max_length=120, blank=True)
    note = models.TextField(blank=True)
    spent_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)


# ---------- Rewards / Badges ----------
class Badge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="badges")
    key = models.CharField(max_length=120)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "key")


# ---------- Simple Reward summary (cached) ----------
class RewardSummary(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="reward_summary")
    xp = models.IntegerField(default=0)
    coins = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)
