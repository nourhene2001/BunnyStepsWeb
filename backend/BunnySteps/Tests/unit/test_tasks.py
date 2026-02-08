# tests/test_tasks.py
import pytest
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework import status

from api.models import (
    Task, Category, ShoppingItem, Hobby, Reminder,
    FocusSession, Notification
)
from api.serializers import TaskSerializer
from api.views import TaskViewSet

User = get_user_model()


@pytest.mark.django_db
class TestTaskModel:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="tasktester", password="hop123")

    @pytest.fixture
    def category(self, user):
        return Category.objects.create(user=user, name="Work", color="#4ade80")

    def test_create_minimal_task(self, user):
        task = Task.objects.create(
            user=user,
            title="Write test cases",
            priority="medium",
            status="todo"
        )
        assert task.pk is not None
        assert task.title == "Write test cases"
        assert task.priority == "medium"
        assert task.status == "todo"
        assert task.completed is False
        assert task.frozen is False
        assert task.completed_at is None

    def test_auto_set_completed_at_on_done(self, user):
        task = Task.objects.create(user=user, title="Finish report")
        assert task.completed_at is None

        task.status = "done"
        task.completed = True
        task.save()

        assert task.completed_at is not None
        assert (timezone.now() - task.completed_at).total_seconds() < 5

    def test_preferred_focus_mode_persisted(self, user):
        task = Task.objects.create(
            user=user,
            title="Deep work session",
            preferred_focus_mode="flow"
        )
        assert task.preferred_focus_mode == "flow"

    def test_task_with_shopping_link(self, user):
        shopping = ShoppingItem.objects.create(user=user, name="New laptop")
        task = Task.objects.create(
            user=user,
            title="Research laptop prices",
            shopping_item=shopping
        )
        assert task.shopping_item == shopping

    def test_freeze_and_unfreeze(self, user):
        task = Task.objects.create(user=user, title="Test freeze")
        assert task.frozen is False

        task.frozen = True
        task.save()
        task.refresh_from_db()
        assert task.frozen is True

        task.frozen = False
        task.save()
        task.refresh_from_db()
        assert task.frozen is False

    def test_str_representation(self, user):
        task = Task.objects.create(user=user, title="Very important task")
        assert str(task) == "Very important task"


@pytest.mark.django_db
class TestTaskSerializer:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="serialbunny", password="testpass")

    @pytest.fixture
    def category(self, user):
        return Category.objects.create(user=user, name="Study")

    def test_create_task_with_category_id(self, user, category):
        data = {
            "title": "Study pytest",
            "priority": "high",
            "category": category.id,
            "estimated_minutes": 45,
            "preferred_focus_mode": "pomodoro"
        }

        serializer = TaskSerializer(data=data, context={"request": type("Request", (), {"user": user})})
        assert serializer.is_valid(raise_exception=True)
        task = serializer.save()

        assert task.title == "Study pytest"
        assert task.category == category
        assert task.estimated_minutes == 45
        assert task.preferred_focus_mode == "pomodoro"

    def test_read_only_fields_not_overwritten(self, user):
        task = Task.objects.create(
            user=user,
            title="Old title",
            completed_at=timezone.now() - timedelta(days=1)
        )

        data = {
            "title": "New title",
            "completed_at": "2025-12-01T10:00:00Z"  # should be ignored
        }

        serializer = TaskSerializer(task, data=data, partial=True, context={"request": type("Req", (), {"user": user})})
        assert serializer.is_valid()
        updated = serializer.save()

        assert updated.title == "New title"
        assert updated.completed_at != "2025-12-01T10:00:00Z"  # not changed


@pytest.mark.django_db
class TestTaskViewSet:

    @pytest.fixture
    def client(self):
        return APIClient()

    @pytest.fixture
    def user(self):
        user = User.objects.create_user(username="apitest", password="bunnyhop")
        return user

    @pytest.fixture
    def authenticated_client(self, client, user):
        client.force_authenticate(user=user)
        return client

    def test_list_only_own_tasks(self, authenticated_client, user):
        other_user = User.objects.create_user(username="other", password="xxx")
        Task.objects.create(user=other_user, title="Secret task")
        Task.objects.create(user=user, title="My task")

        response = authenticated_client.get("/api/tasks/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["title"] == "My task"

    def test_create_task(self, authenticated_client):
        category = Category.objects.create(user=authenticated_client.handler._force_user, name="Personal")

        data = {
            "title": "Buy carrots",
            "priority": "high",
            "status": "todo",
            "category": category.id,
            "estimated_minutes": 15
        }

        response = authenticated_client.post("/api/tasks/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "Buy carrots"
        assert response.data["category_name"] == "Personal"

    def test_start_task_action(self, authenticated_client, user):
        task = Task.objects.create(
            user=user,
            title="Start me!",
            status="todo"
        )

        response = authenticated_client.patch(f"/api/tasks/{task.id}/start/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["detail"] == "Task started! Hop to it!"

        task.refresh_from_db()
        assert task.status == "in_progress"

    def test_start_frozen_task_fails(self, authenticated_client, user):
        task = Task.objects.create(
            user=user,
            title="Frozen task",
            status="todo",
            frozen=True
        )

        response = authenticated_client.patch(f"/api/tasks/{task.id}/start/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_complete_task_action(self, authenticated_client, user):
        task = Task.objects.create(
            user=user,
            title="Finish documentation",
            status="in_progress"
        )

        response = authenticated_client.patch(f"/api/tasks/{task.id}/complete/")
        assert response.status_code == status.HTTP_200_OK
        assert "Great job!" in response.data["detail"]
        assert response.data["xp"] == 50
        assert response.data["coins"] == 10

        task.refresh_from_db()
        assert task.status == "done"
        assert task.completed is True
        assert task.completed_at is not None

    def test_cannot_complete_already_done_task(self, authenticated_client, user):
        task = Task.objects.create(
            user=user,
            title="Already done",
            status="done",
            completed=True,
            completed_at=timezone.now()
        )

        response = authenticated_client.patch(f"/api/tasks/{task.id}/complete/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_toggle_freeze_action(self, authenticated_client, user):
        task = Task.objects.create(user=user, title="Toggle test", frozen=False)

        # Freeze
        response = authenticated_client.patch(f"/api/tasks/{task.id}/toggle_freeze/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["frozen"] is True

        task.refresh_from_db()
        assert task.frozen is True

        # Unfreeze
        response = authenticated_client.patch(f"/api/tasks/{task.id}/toggle_freeze/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["frozen"] is False


@pytest.mark.django_db
class TestTaskRewardIntegration:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="rewardtest", password="carrots")

    def test_complete_task_creates_notification(self, user):
        task = Task.objects.create(
            user=user,
            title="Task with reward",
            status="in_progress"
        )

        task.status = "done"
        task.completed = True
        task.save()  # should trigger signal

        notification = Notification.objects.filter(
            user=user,
            type="task_complete"
        ).last()

        assert notification is not None
        assert "Great job!" in notification.message
        assert task.title in notification.message