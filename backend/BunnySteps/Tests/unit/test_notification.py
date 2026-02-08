# tests/test_notifications.py


from rest_framework import status
import pytest

from api.models import Notification, Task, User


@pytest.mark.django_db
class TestNotifications:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="notifybun", password="x")

    def test_task_completion_creates_notification(self, user):
        task = Task.objects.create(
            user=user,
            title="Important task",
            status="in_progress"
        )

        task.status = "done"
        task.completed = True
        task.save()

        notification = Notification.objects.filter(
            user=user,
            type="task_complete"
        ).last()

        assert notification is not None
        assert "Great job" in notification.message
        assert task.title in notification.message
        assert notification.related_task == task

    def test_notification_mark_as_read(self, user, client):
        client.force_authenticate(user=user)

        note = Notification.objects.create(
            user=user,
            type="task_complete",
            message="Test notification",
            is_read=False
        )

        response = client.patch(
            f"/api/notifications/{note.id}/",
            {"is_read": True},
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK

        note.refresh_from_db()
        assert note.is_read is True