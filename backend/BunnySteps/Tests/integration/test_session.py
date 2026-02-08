from django.urls import reverse
import pytest


@pytest.mark.django_db
class TestFocusSessionFlow:

    def test_start_and_end_session(self, authenticated_client):
        # Start
        start_url = reverse("focus-sessions-start")
        data = {"mode": "pomodoro"}

        start_resp = authenticated_client.post(start_url, data, format="json")
        assert start_resp.status_code == 201
        session_id = start_resp.data["session_id"]

        # End
        end_url = reverse("focus-sessions-end", args=[session_id])
        end_resp = authenticated_client.post(end_url, format="json")

        assert end_resp.status_code == 200
        assert "Session ended successfully" in end_resp.data["message"]

        # Check reward given
        from api.models import RewardSummary
        summary = RewardSummary.objects.get(user=authenticated_client.user)
        assert summary.xp > 0  # at least some reward