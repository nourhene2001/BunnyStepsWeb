from django.contrib import admin
from .models import (
    Category, Task, FocusMode, FocusSession, FocusMetric,
    Hobby, HobbyActivity, Reminder, Note, MoodLog,
    ShoppingItem, Expense, Badge, RewardSummary
)

admin.site.register(Category)
admin.site.register(Task)
admin.site.register(FocusMode)
admin.site.register(FocusSession)
admin.site.register(FocusMetric)
admin.site.register(Hobby)
admin.site.register(HobbyActivity)
admin.site.register(Reminder)
admin.site.register(Note)
admin.site.register(MoodLog)
admin.site.register(ShoppingItem)
admin.site.register(Expense)
admin.site.register(Badge)
admin.site.register(RewardSummary)
