# tests/integration/test_notifications_rewards.py

from django.urls import reverse
import pytest

from api.models import Notification


@pytest.mark.django_db
class TestSideEffects:

    def test_task_completion_creates_notification_and_reward(self, authenticated_client):
        # Create task
        task_resp = authenticated_client.post(
            reversed("tasks-list"),
            {"title": "Test completion", "status": "in_progress"},
            format="json"
        )
        task_id = task_resp.data["id"]

        # Complete
        complete_url = reverse("tasks-complete", args=[task_id])  # adjust if needed
        complete_resp = authenticated_client.patch(complete_url, format="json")

        assert complete_resp.status_code == 200
        assert complete_resp.data["xp"] > 0
        assert complete_resp.data["coins"] > 0

        # Check notification
        notification = Notification.objects.filter(
            user=authenticated_client.user,
            type="task_complete"
        ).last()
        assert notification is not None
        assert "completed" in notification.message.lower()
        assert task_id == notification.related_task_id