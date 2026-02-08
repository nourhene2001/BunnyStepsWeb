# tests/test_moods.py
import pytest
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from api.models import MoodLog
from api.serializers import MoodLogSerializer
from api.views import MoodLogViewSet


User = get_user_model()


@pytest.mark.django_db
class TestMoodLogModel:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="moodbunny", password="carrotmood")

    def test_create_basic_mood_log(self, user):
        log = MoodLog.objects.create(
            user=user,
            mood="happy",
            rating=8,
            note="Great day, finished all tasks!"
        )

        assert log.mood == "happy"
        assert log.rating == 8
        assert log.note.startswith("Great day")
        assert log.created_at is not None

    def test_rating_validation(self, user):
        # Assuming your model has validators=[MinValueValidator(1)]
        with pytest.raises(Exception):  # ValidationError
            MoodLog.objects.create(user=user, mood="neutral", rating=0)

        # Should work
        log = MoodLog.objects.create(user=user, mood="calm", rating=1)
        assert log.rating == 1

    def test_default_rating_none(self, user):
        log = MoodLog.objects.create(user=user, mood="stressed")
        assert log.rating is None  # allowed if not required


@pytest.mark.django_db
class TestMoodLogSerializer:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="serialmood", password="testmood")

    def test_serialize_mood_log(self, user):
        log = MoodLog.objects.create(
            user=user,
            mood="excited",
            rating=9,
            note="Finished a big project today!"
        )

        serializer = MoodLogSerializer(log)
        data = serializer.data

        assert data["mood"] == "excited"
        assert data["rating"] == 9
        assert data["note"] == "Finished a big project today!"

    def test_create_via_serializer(self, user):
        data = {
            "mood": "tired",
            "rating": 4,
            "note": "Long day at work"
        }

        serializer = MoodLogSerializer(data=data, context={"request": type("Req", (), {"user": user})})
        assert serializer.is_valid(raise_exception=True)
        log = serializer.save()

        assert log.user == user
        assert log.mood == "tired"
        assert log.rating == 4


@pytest.mark.django_db
class TestMoodLogViews:

    @pytest.fixture
    def client(self):
        return APIClient()

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="apimood", password="moodhop")

    @pytest.fixture
    def auth_client(self, client, user):
        client.force_authenticate(user=user)
        return client

    def test_create_mood_log(self, auth_client):
        data = {
            "mood": "content",
            "rating": 7,
            "note": "Productive day with focus sessions"
        }

        response = auth_client.post("/api/mood-logs/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["mood"] == "content"
        assert response.data["rating"] == 7

    def test_list_only_own_logs(self, auth_client, user):
        other_user = User.objects.create_user(username="other", password="xxx")
        MoodLog.objects.create(user=other_user, mood="angry", rating=2)

        my_log = MoodLog.objects.create(
            user=user,
            mood="peaceful",
            rating=8
        )

        response = auth_client.get("/api/mood-logs/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["mood"] == "peaceful"

    def test_insights_endpoint(self, auth_client, user):
        # Create logs for last 7 days
        today = timezone.now().date()
        MoodLog.objects.bulk_create([
            MoodLog(
                user=user,
                mood="good",
                rating=rating,
                created_at=timezone.now() - timedelta(days=i)
            )
            for i, rating in enumerate([6, 7, 8, 9, 5, 8, 7], 0)
        ])

        response = auth_client.get("/api/mood-logs/insights/")
        assert response.status_code == status.HTTP_200_OK

        data = response.data
        assert "weekly_average" in data
        assert "weekly_trend" in data
        assert len(data["weekly_trend"]) == 7
        assert "today_checkins" in data
        assert "streak" in data


@pytest.mark.django_db
class TestMoodInsightsLogic:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="insightbun", password="moodinsights")

    def test_weekly_trend_calculation(self, user):
        base_time = timezone.now()
        MoodLog.objects.bulk_create([
            MoodLog(
                user=user,
                mood="neutral",
                rating=5,
                created_at=base_time - timedelta(days=i)
            )
            for i in range(8)  # 7 days + today
        ])

        # Call the insights view (or simulate)
        view = MoodLogViewSet.as_view({"get": "insights"})
        request = type("Req", (), {"user": user, "query_params": {}})
        response = view(request)

        trend = response.data["weekly_trend"]
        assert len(trend) == 7
        assert all(item["mood"] == 5.0 for item in trend)  # average 5 each day