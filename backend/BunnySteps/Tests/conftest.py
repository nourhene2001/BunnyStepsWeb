# tests/conftest.py
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def api_client():
    """Unauthenticated client"""
    return APIClient()


@pytest.fixture
def authenticated_client(api_client):
    """Authenticated client with a real user"""
    user = User.objects.create_user(
        username="testbunny",
        password="carrotjump2026",
        email="test@bunny.com"
    )
    api_client.force_authenticate(user=user)
    api_client.user = user  # for easy access in tests
    return api_client
