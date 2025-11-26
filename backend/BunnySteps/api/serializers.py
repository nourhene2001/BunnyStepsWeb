from rest_framework import serializers
from .models import (
    Category, Task, FocusMode, FocusSession, Hobby, HobbyActivity,
    Reminder, Note, MoodLog, ShoppingItem, Expense, Badge, RewardSummary
)


# ---------- Basic Serializers ----------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ("user", "created_at", "updated_at", "completed_at")


class FocusModeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FocusMode
        fields = "__all__"


class FocusSessionSerializer(serializers.ModelSerializer):
    mode_name = serializers.CharField(read_only=True)
    related_tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = FocusSession
        fields = "__all__"
        read_only_fields = ("user", "started_at", "effective_minutes")


class HobbySerializer(serializers.ModelSerializer):
    class Meta:
        model = Hobby
        fields = "__all__"


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