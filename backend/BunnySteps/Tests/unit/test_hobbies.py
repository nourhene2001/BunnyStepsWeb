# tests/test_hobbies.py
import pytest
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from api.models import Hobby, HobbyActivity
from api.serializers import HobbySerializer, HobbyActivitySerializer

User = get_user_model()


@pytest.mark.django_db
class TestHobbyModel:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="hobbybunny", password="carrothobby")

    def test_create_basic_hobby(self, user):
        hobby = Hobby.objects.create(
            user=user,
            name="Urban Gardening",
            description="Growing herbs and veggies on the balcony",
            frozen=False
        )

        assert hobby.name == "Urban Gardening"
        assert hobby.description.startswith("Growing")
        assert hobby.frozen is False
        assert str(hobby).endswith("(user)")

    def test_freeze_and_unfreeze_methods(self, user):
        hobby = Hobby.objects.create(
            user=user,
            name="Digital Drawing",
            description="Learning Procreate"
        )

        assert hobby.frozen is False

        hobby.freeze(reason="Too busy with work")
        hobby.refresh_from_db()
        assert hobby.frozen is True
        # Note: your current model doesn't have freeze_reason field - add if needed

        hobby.unfreeze()
        hobby.refresh_from_db()
        assert hobby.frozen is False

    def test_hobby_uniqueness_per_user(self, user):
        Hobby.objects.create(user=user, name="Yoga")

        with pytest.raises(Exception):  # IntegrityError expected
            Hobby.objects.create(user=user, name="Yoga")


@pytest.mark.django_db
class TestHobbyActivityModel:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="activitybun", password="hopactivity")

    @pytest.fixture
    def hobby(self, user):
        return Hobby.objects.create(
            user=user,
            name="Language Learning",
            description="French & Spanish"
        )

    def test_create_activity(self, user, hobby):
        activity = HobbyActivity.objects.create(
            user=user,
            hobby=hobby,
            notes="Practiced 30 min Duolingo + watched French movie",
            custom_data={
                "duration_minutes": 45,
                "mood": "motivated",
                "vocabulary_learned": 18
            }
        )

        assert activity.hobby == hobby
        assert activity.notes.startswith("Practiced")
        assert activity.custom_data["duration_minutes"] == 45
        assert activity.timestamp is not None


@pytest.mark.django_db
class TestHobbySerializers:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="serialhobby", password="test123")

    def test_hobby_serializer(self, user):
        hobby = Hobby.objects.create(
            user=user,
            name="Photography",
            description="Street & nature photos",
            frozen=True
        )

        serializer = HobbySerializer(hobby)
        data = serializer.data

        assert data["name"] == "Photography"
        assert data["description"] == "Street & nature photos"
        assert data["frozen"] is True

    def test_activity_serializer_with_custom_data(self, user):
        hobby = Hobby.objects.create(user=user, name="Cooking")
        activity = HobbyActivity.objects.create(
            user=user,
            hobby=hobby,
            notes="Made carrot cake",
            custom_data={"difficulty": "medium", "time_spent": 90}
        )

        serializer = HobbyActivitySerializer(activity)
        data = serializer.data

        assert data["hobby_name"] == "Cooking"
        assert data["notes"] == "Made carrot cake"
        assert data["custom_data"]["difficulty"] == "medium"


@pytest.mark.django_db
class TestHobbyViews:

    @pytest.fixture
    def client(self):
        return APIClient()

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="apihobby", password="bunnygrow")

    @pytest.fixture
    def auth_client(self, client, user):
        client.force_authenticate(user=user)
        return client

    def test_create_hobby(self, auth_client):
        data = {
            "name": "Calligraphy",
            "description": "Modern Arabic calligraphy practice",
            "frozen": False
        }

        response = auth_client.post("/api/hobbies/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Calligraphy"

    def test_list_only_own_hobbies(self, auth_client, user):
        other_user = User.objects.create_user(username="other", password="xxx")
        Hobby.objects.create(user=other_user, name="Secret hobby")

        my_hobby = Hobby.objects.create(user=user, name="My visible hobby")

        response = auth_client.get("/api/hobbies/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["name"] == "My visible hobby"

    def test_toggle_freeze_action(self, auth_client, user):
        hobby = Hobby.objects.create(
            user=user,
            name="Guitar Practice",
            frozen=False
        )

        # Freeze
        response = auth_client.patch(f"/api/hobbies/{hobby.id}/toggle_freeze/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["frozen"] is True

        hobby.refresh_from_db()
        assert hobby.frozen is True

        # Unfreeze
        response = auth_client.patch(f"/api/hobbies/{hobby.id}/toggle_freeze/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["frozen"] is False


@pytest.mark.django_db
class TestHobbyActivityEndpoints:

    @pytest.fixture
    def auth_client(self, client, user):
        client.force_authenticate(user=user)
        return client

    def test_create_activity_via_api(self, auth_client, user):
        hobby = Hobby.objects.create(user=user, name="Journaling")

        data = {
            "hobby": hobby.id,
            "notes": "Gratitude entry today",
            "custom_data": {"mood": "peaceful", "pages": 3}
        }

        response = auth_client.post(f"/api/hobby-activities/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["notes"] == "Gratitude entry today"