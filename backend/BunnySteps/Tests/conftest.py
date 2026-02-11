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

# =========================
# pytest-html styling hooks
# =========================
def pytest_html_report_title(report):
    report.title = "BunnySteps Backend Test Report"

def pytest_html_results_table_header(cells):
    cells.insert(2, '<th>Test Node</th>')

def pytest_html_results_table_row(report, cells):
    cells.insert(2, f'<td>{report.nodeid}</td>')

def pytest_html_report_stylesheet():
    return """
    body { font-family: Arial, sans-serif; background: #f8f8f8; }
    h1, h2, h3 { color: #2c3e50; }
    table { border-collapse: collapse; width: 100%; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    tr.failed { background-color: #f8d7da !important; }
    tr.passed { background-color: #d4edda !important; }
    tr.skipped { background-color: #fff3cd !important; }
    """
