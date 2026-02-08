# tests/integration/test_auth.py
import pytest
from django.urls import reverse

from api.models import User


@pytest.mark.django_db
class TestAuthenticationFlow:

    def test_register_new_user(self, api_client):
        url = reverse("register")  # adjust if your endpoint name is different
        data = {
            "username": "newhopbunny",
            "email": "hop@bunny.com",
            "password": "CarrotPower2026!"
        }

        response = api_client.post(url, data, format="json")

        assert response.status_code == 201
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["username"] == "newhopbunny"

        # Check user really exists
        assert User.objects.filter(username="newhopbunny").exists()

    def test_login_success(self, api_client):
        # First create user
        user = User.objects.create_user(
            username="loginbunny",
            password="testpass123"
        )

        url = reverse("token_obtain_pair")  # usually /api/token/
        data = {
            "username": "loginbunny",
            "password": "testpass123"
        }

        response = api_client.post(url, data, format="json")

        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data

    def test_protected_endpoint_requires_auth(self, api_client):
        url = reverse("tasks-list")  # example protected endpoint

        # Without auth → 401
        response = api_client.get(url)
        assert response.status_code == 401

        # With auth → 200
        api_client.force_authenticate(user=User.objects.first())
        response = api_client.get(url)
        assert response.status_code == 200