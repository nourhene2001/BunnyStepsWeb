from datetime import timezone
from rest_framework import serializers
from .models import (
    Category, Task, FocusMode, FocusSession, Hobby, HobbyActivity,
    Reminder, Note, MoodLog, ShoppingItem, Expense, Badge, RewardSummary
)


# ---------- Basic Serializers ----------
# serializers.py
from rest_framework import serializers
from .models import Task, Category, ShoppingItem

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "color"]


# serializers.py
from rest_framework import serializers
from .models import Task, Category, Hobby

class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True, default="#e2e8f0")
    hobby_name = serializers.CharField(source="hobby.name", read_only=True, allow_null=True)

    # Accept hobby/category as IDs (from frontend)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        allow_null=True,
        required=False
    )
    hobby = serializers.PrimaryKeyRelatedField(
        queryset=Hobby.objects.all(),
        allow_null=True,
        required=False  # This is the key fix!
    )

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "priority", "status",
            "due_date", "preferred_datetime", "preferred_focus_mode",
            "estimated_minutes", "frozen", "completed", "completed_at",
            "created_at", "updated_at",
            "category", "category_name", "category_color",
            "hobby", "hobby_name",
            "image", "voice_note", "custom_fields"
        ]
        read_only_fields = (
            "user", "created_at", "updated_at", "completed_at",
            "category_name", "category_color", "hobby_name"
        )

    def create(self, validated_data):
        # Auto-set the current user
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Allow partial updates (PATCH)
        return super().update(instance, validated_data)


class FocusModeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FocusMode
        fields = "__all__"


class FocusSessionSerializer(serializers.ModelSerializer):
    # ✅ Accept mode as ID on write
    mode = serializers.PrimaryKeyRelatedField(
        queryset=FocusMode.objects.all(),
        write_only=True
    )

    # ✅ Expose mode name for frontend display
    mode_name = serializers.CharField(source="mode.name", read_only=True)

    related_tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = FocusSession
        fields = "__all__"
        read_only_fields = ("user", "started_at", "effective_minutes")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        validated_data.setdefault("started_at", timezone.now())
        return super().create(validated_data)

class StartFocusSessionSerializer(serializers.Serializer):
    mode = serializers.CharField()
    task_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'message', 'related_task', 'related_reminder', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
class HobbySerializer(serializers.ModelSerializer):
    class Meta:
        model = Hobby
        fields = "__all__"
        read_only_fields = ("user",)  # Add this line

class HobbyActivitySerializer(serializers.ModelSerializer):
    hobby_name = serializers.CharField(source="hobby.name", read_only=True)

    class Meta:
        model = HobbyActivity
        fields = "__all__"
        read_only_fields = ("user", "created_at")


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = "__all__"
        read_only_fields = ("user", "created_at")


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = "__all__"
        read_only_fields = ("user", "created_at")


class MoodLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodLog
        fields = "__all__"
        read_only_fields = ("user", "created_at")


class ShoppingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShoppingItem
        fields = "__all__"
        read_only_fields = ("user", "created_at")


class ExpenseSerializer(serializers.ModelSerializer):
    shopping_item_name = serializers.CharField(source="shopping_item.name", read_only=True)

    class Meta:
        model = Expense
        fields = "__all__"
        read_only_fields = ("user", "created_at")


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = "__all__"


class RewardSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = RewardSummary
        fields = "__all__"
# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User

# serializers.py — FINAL CLEAN VERSION
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': False, 'allow_blank': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user