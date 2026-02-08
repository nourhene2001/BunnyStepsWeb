# tests/test_focus_sessions.py
import pytest
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from api.models import FocusMode, FocusSession, RewardSummary, Task
from api.serializers import FocusSessionSerializer, StartFocusSessionSerializer



User = get_user_model()


@pytest.mark.django_db
class TestFocusSessionModel:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="focusbunny", password="carrotflow")

    @pytest.fixture
    def pomodoro_mode(self, user):
        return FocusMode.objects.create(
            user=user,
            name="Pomodoro Classic",
            preset="pomodoro",
            config={"work": 25, "break": 5}
        )

    def test_create_basic_session(self, user):
        session = FocusSession.objects.create(
            user=user,
            mode_name="Mini Focus",
            started_at=timezone.now(),
            is_hyperfocus=False
        )

        assert session.user == user
        assert session.mode is None
        assert session.mode_name == "Mini Focus"
        assert session.effective_minutes is None
        assert session.interruptions == 0

    def test_calculate_effective_minutes_on_end(self, user):
        now = timezone.now()
        session = FocusSession.objects.create(
            user=user,
            started_at=now - timedelta(minutes=42),
            mode_name="Flow"
        )

        session.ended_at = now
        session.save()

        assert session.effective_minutes == 42

    def test_session_with_related_tasks(self, user):
        task1 = Task.objects.create(user=user, title="Task A")
        task2 = Task.objects.create(user=user, title="Task B")

        session = FocusSession.objects.create(user=user, mode_name="Shuffle")
        session.related_tasks.set([task1, task2])

        assert session.related_tasks.count() == 2
        assert task1 in session.related_tasks.all()


@pytest.mark.django_db
class TestFocusSessionSerializer:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="serialfocus", password="hopfocus")

    def test_start_serializer_validation(self, user):
        data = {
            "mode": "pomodoro",
            "task_ids": [1, 3, 7]  # fake ids, just for structure
        }

        serializer = StartFocusSessionSerializer(data=data)
        assert serializer.is_valid()

        assert serializer.validated_data["mode"] == "pomodoro"
        assert serializer.validated_data["task_ids"] == [1, 3, 7]

    def test_full_session_serializer_read(self, user):
        mode = FocusMode.objects.create(user=user, name="Deep Work", preset="flow")
        session = FocusSession.objects.create(
            user=user,
            mode=mode,
            mode_name="Deep Work",
            started_at=timezone.now() - timedelta(minutes=55),
            ended_at=timezone.now(),
            effective_minutes=55
        )

        serializer = FocusSessionSerializer(session)
        data = serializer.data

        assert data["mode_name"] == "Deep Work"
        assert data["effective_minutes"] == 55
        assert "related_tasks" in data


@pytest.mark.django_db
class TestFocusSessionViewSet:

    @pytest.fixture
    def client(self):
        return APIClient()

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="apifocus", password="focusjump")

    @pytest.fixture
    def auth_client(self, client, user):
        client.force_authenticate(user=user)
        return client

    def test_start_new_session(self, auth_client):
        data = {
            "mode": "flow",
            "task_ids": []  # no tasks this time
        }

        response = auth_client.post("/api/focus-sessions/start/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert "session_id" in response.data
        assert response.data["mode"] == "flow"
        assert "Flow session started!" in response.data["message"]

        session = FocusSession.objects.last()
        assert session.user == auth_client.handler._force_user
        assert session.mode_name == "Flow"
        assert session.is_hyperfocus is True  # because mode_key == "flow"

    def test_end_session(self, auth_client, user):
        session = FocusSession.objects.create(
            user=user,
            mode_name="Pomodoro",
            started_at=timezone.now() - timedelta(minutes=32)
        )

        response = auth_client.post(f"/api/focus-sessions/{session.id}/end/")
        assert response.status_code == status.HTTP_200_OK
        assert "Session ended successfully" in response.data["message"]
        assert response.data["effective_minutes"] == 32

        session.refresh_from_db()
        assert session.ended_at is not None

    def test_cannot_end_already_ended_session(self, auth_client, user):
        now = timezone.now()
        session = FocusSession.objects.create(
            user=user,
            mode_name="Test",
            started_at=now - timedelta(minutes=10),
            ended_at=now
        )

        response = auth_client.post(f"/api/focus-sessions/{session.id}/end/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already ended" in response.data["error"]

    def test_flow_allowed_limit(self, auth_client, user):
        # Create 2 flow sessions today
        today = timezone.now().date()
        for _ in range(2):
            FocusSession.objects.create(
                user=user,
                mode_name="Flow",
                started_at=timezone.now(),
                is_hyperfocus=True
            )

        response = auth_client.get("/api/focus-sessions/flow-allowed/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["allowed"] is False
        assert response.data["current_count"] == 2
        assert response.data["max_daily"] == 2


@pytest.mark.django_db
class TestFocusRewardIntegration:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="rewardfocus", password="flowcarrot")

    def test_focus_completion_gives_rewards(self, user):
        session = FocusSession.objects.create(
            user=user,
            mode_name="Deep Work",
            started_at=timezone.now() - timedelta(minutes=67),
            ended_at=timezone.now()
        )

        # Trigger save → reward signal
        session.save()

        summary = RewardSummary.objects.get(user=user)
        assert summary.xp >= 67
        assert summary.coins >= 6   # 67 // 10 = 6