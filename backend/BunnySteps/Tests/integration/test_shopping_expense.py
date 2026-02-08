# tests/integration/test_shopping.py

from decimal import Decimal
from django.urls import reverse
import pytest

from api.models import Expense


@pytest.mark.django_db
class TestShoppingIntegration:

    def test_create_impulsive_item_with_warning(self, authenticated_client):
        url = reverse("shopping-items-list")  # adjust if different

        data = {
            "name": "Luxury bunny plush",
            "estimated_cost": "150.00",
            "item_type": "impulsive",
            "priority": "high"
        }

        response = authenticated_client.post(url, data, format="json")

        # Depending on your business logic:
        # - either 201 with warning in response
        # - or 400 with warning message
        assert response.status_code in (201, 400)

        if response.status_code == 400:
            assert "Warning" in str(response.data) or "budget" in str(response.data).lower()

    def test_mark_item_as_purchased_creates_expense(self, authenticated_client):
        # Create shopping item
        item_resp = authenticated_client.post(
            reverse("shopping-items-list"),
            {"name": "New keyboard", "estimated_cost": "89.99"},
            format="json"
        )
        item_id = item_resp.data["id"]

        # Simulate purchase (your endpoint)
        purchase_url = reverse("shopping-items-purchase", args=[item_id])  # adjust name
        purchase_resp = authenticated_client.post(purchase_url, {
            "actual_cost": "85.00",
            "currency": "TND"
        }, format="json")

        assert purchase_resp.status_code == 200

        # Check expense was created
        expense = Expense.objects.filter(shopping_item_id=item_id).first()
        assert expense is not None
        assert expense.amount == Decimal("85.00")