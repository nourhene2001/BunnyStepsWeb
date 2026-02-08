# tests/integration/test_focus.py

from django.urls import reverse
import pytest

from api.models import RewardSummary


@pytest.mark.django_db
class TestFocusSessionIntegration:

    def test_flow_mode_daily_limit_enforced(self, authenticated_client):
        url = reverse("focus-sessions-start")

        # Create 2 flow sessions today
        for _ in range(2):
            authenticated_client.post(url, {"mode": "flow"}, format="json")

        # 3rd attempt should fail
        response = authenticated_client.post(url, {"mode": "flow"}, format="json")
        assert response.status_code == 400  # or 403 depending on your logic
        assert "limit" in str(response.data).lower() or "not allowed" in str(response.data).lower()

        # Check reward after valid session
        start_resp = authenticated_client.post(url, {"mode": "pomodoro"}, format="json")
        session_id = start_resp.data["session_id"]

        end_resp = authenticated_client.post(
            reverse("focus-sessions-end", args=[session_id]),
            format="json"
        )
        assert end_resp.status_code == 200

        summary = RewardSummary.objects.get(user=authenticated_client.user)
        assert summary.xp > 0 or summary.coins > 0