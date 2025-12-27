# utils.py (create this file in your app)
from django.utils import timezone

from .models import Notification, Reminder


def fire_due_reminders(user):
    """
    Call this on any authenticated view the user hits.
    Checks and fires reminders that are due.
    """
    now = timezone.now()
    due_reminders = Reminder.objects.filter(
        user=user,
        remind_at__lte=now,
        notified=False,           # ← Use the real field name        frozen=False,
        snoozed_until__isnull=True
    )

    for reminder in due_reminders:
        Notification.objects.create(
            user=user,
            type='reminder_due',
            title=reminder.title or "Time's up!",
            message=reminder.note or "Your reminder is due now!",
            related_reminder=reminder,
            related_task=reminder.task,
        )
        reminder.reminded = True
        reminder.save(update_fields=['reminded'])