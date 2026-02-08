# tests/integration/test_tasks.py
from django.urls import reverse
import pytest
from rest_framework import status

from api.models import User


@pytest.mark.django_db
class TestTaskEndpoints:

    def test_create_and_own_task(self, authenticated_client):
        url = reverse("tasks-list")
        data = {
            "title": "Buy more carrots",
            "priority": "high",
            "status": "todo",
            "estimated_minutes": 15
        }

        response = authenticated_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "Buy more carrots"
        assert response.data["user"] == authenticated_client.user.id  # if you expose it

        task_id = response.data["id"]

        # Get own task
        detail_url = reverse("tasks-detail", args=[task_id])
        get_response = authenticated_client.get(detail_url)
        assert get_response.status_code == 200

    def test_cannot_see_other_users_task(self, api_client, authenticated_client):
        # User A creates task
        task = authenticated_client.post(
            reverse("tasks-list"),
            {"title": "Secret task"},
            format="json"
        ).data["id"]

        # User B (unauthenticated here) cannot see it
        response = api_client.get(reverse("tasks-list"))
        assert response.status_code == 401  # or 403 depending on your auth

        # Even authenticated different user cannot see
        other_user = User.objects.create_user(username="intruder", password="x")
        api_client.force_authenticate(user=other_user)

        response = api_client.get(reverse("tasks-list"))
        assert response.status_code == 200
        assert len(response.data) == 0  # no tasks
        assert task not in [t["id"] for t in response.data]

    def test_complete_task_action(self, authenticated_client):
        # Create task
        create_resp = authenticated_client.post(
            reverse("tasks-list"),
            {"title": "Finish report", "status": "in_progress"},
            format="json"
        )
        task_id = create_resp.data["id"]

        # Complete it
        complete_url = reverse("tasks-complete", args=[task_id])  # adjust if different
        response = authenticated_client.patch(complete_url, format="json")

        assert response.status_code == 200
        assert "Great job" in response.data["detail"]

        # Check status updated
        detail = authenticated_client.get(reverse("tasks-detail", args=[task_id]))
        assert detail.data["status"] == "done"
        assert detail.data["completed"] is True