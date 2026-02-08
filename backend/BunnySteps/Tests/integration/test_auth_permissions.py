# tests/integration/test_auth_permissions.py
from django.urls import reverse
import pytest

from api.models import User

@pytest.mark.django_db
class TestPermissionsAcrossEndpoints:

    def test_user_cannot_access_other_users_data(self, api_client, authenticated_client):
        # User A creates task
        task_data = {"title": "My private task", "priority": "medium"}
        task_resp = authenticated_client.post(reverse("tasks-list"), task_data, format="json")
        task_id = task_resp.data["id"]

        # Create User B
        user_b = User.objects.create_user(username="userb", password="test123")
        api_client.force_authenticate(user=user_b)

        # Try to see User A's task
        list_resp = api_client.get(reverse("tasks-list"))
        assert list_resp.status_code == 200
        task_ids = [t["id"] for t in list_resp.data]
        assert task_id not in task_ids

        # Try direct access
        detail_resp = api_client.get(reverse("tasks-detail", args=[task_id]))
        assert detail_resp.status_code in (403, 404)

        # Try to delete
        delete_resp = api_client.delete(reverse("tasks-detail", args=[task_id]))
        assert delete_resp.status_code in (403, 404)

