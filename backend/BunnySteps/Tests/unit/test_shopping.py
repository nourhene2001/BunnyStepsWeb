# tests/test_shopping.py
import pytest
from datetime import date, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from api.models import (
    ShoppingItem, Expense, Category,
    Notification  # if you add shopping-related notifications later
)
from api.serializers import ShoppingItemSerializer, ExpenseSerializer

User = get_user_model()


@pytest.mark.django_db
class TestShoppingItemModel:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="shopbunny", password="carrot123")

    def test_create_basic_shopping_item(self, user):
        item = ShoppingItem.objects.create(
            user=user,
            name="Organic carrots 2kg",
            quantity=2,
            unit="kg",
            estimated_cost=8.50,
            priority="high",
            item_type="needed"
        )

        assert item.name == "Organic carrots 2kg"
        assert item.quantity == 2
        assert item.estimated_cost == 8.50
        assert item.purchased is False
        assert item.priority == "high"
        assert item.item_type == "needed"

    def test_expiring_item_query(self, user):
        today = date.today()

        # Soon expiring
        soon = ShoppingItem.objects.create(
            user=user,
            name="Milk",
            expiry_date=today + timedelta(days=2),
            purchased=False
        )

        # Far away
        far = ShoppingItem.objects.create(
            user=user,
            name="Rice 5kg",
            expiry_date=today + timedelta(days=90),
            purchased=False
        )

        # Already purchased (should be excluded)
        purchased = ShoppingItem.objects.create(
            user=user,
            name="Old bread",
            expiry_date=today - timedelta(days=5),
            purchased=True
        )

        expiring = ShoppingItem.objects.filter(
            user=user,
            purchased=False,
            expiry_date__lte=today + timedelta(days=3)
        )

        assert soon in expiring
        assert far not in expiring
        assert purchased not in expiring

    def test_impulsive_flag(self, user):
        impulsive = ShoppingItem.objects.create(
            user=user,
            name="Cute bunny plushie",
            estimated_cost=45.00,
            item_type="impulsive",
            priority="medium"
        )

        needed = ShoppingItem.objects.create(
            user=user,
            name="Toilet paper",
            item_type="needed"
        )

        assert impulsive.item_type == "impulsive"
        assert needed.item_type == "needed"


@pytest.mark.django_db
class TestExpenseModel:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="expensebun", password="lettuce42")

    @pytest.fixture
    def shopping_item(self, user):
        return ShoppingItem.objects.create(
            user=user,
            name="New mechanical keyboard",
            estimated_cost=120.00,
            item_type="impulsive"
        )

    def test_create_expense_linked_to_item(self, user, shopping_item):
        expense = Expense.objects.create(
            user=user,
            shopping_item=shopping_item,
            amount=115.99,
            currency="USD",
            note="Got it on sale!",
            spent_at=timezone.now()
        )

        assert expense.amount == 115.99
        assert expense.shopping_item == shopping_item
        assert expense.user == user

    def test_expense_without_shopping_item(self, user):
        """Expenses can exist without linked shopping item (direct cash spend)"""
        expense = Expense.objects.create(
            user=user,
            amount=35.00,
            currency="TND",
            note="Coffee with friends"
        )
        assert expense.shopping_item is None
        assert expense.amount == 35.00


@pytest.mark.django_db
class TestShoppingItemSerializer:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="serialshop", password="testshop")

    def test_serialize_shopping_item(self, user):
        item = ShoppingItem.objects.create(
            user=user,
            name="Protein powder",
            quantity=1,
            unit="jar",
            estimated_cost=65.00,
            priority="high",
            item_type="needed",
            expiry_date=date.today() + timedelta(days=180)
        )

        serializer = ShoppingItemSerializer(item)
        data = serializer.data

        assert data["name"] == "Protein powder"
        assert data["estimated_cost"] == "65.00"
        assert data["priority"] == "high"
        assert data["item_type"] == "needed"
        assert "expiry_date" in data


@pytest.mark.django_db
class TestShoppingViews:

    @pytest.fixture
    def client(self):
        return APIClient()

    @pytest.fixture
    def user(self):
        user = User.objects.create_user(username="apishop", password="bunnyhop")
        return user

    @pytest.fixture
    def auth_client(self, client, user):
        client.force_authenticate(user=user)
        return client

    def test_create_shopping_item(self, auth_client):
        data = {
            "name": "Wireless mouse",
            "estimated_cost": "45.00",
            "quantity": 1,
            "unit": "piece",
            "priority": "medium",
            "item_type": "impulsive",
            "note": "For better productivity"
        }

        response = auth_client.post("/api/shopping-items/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Wireless mouse"
        assert response.data["item_type"] == "impulsive"

    def test_list_only_own_items(self, auth_client, user):
        other_user = User.objects.create_user(username="other", password="xxx")
        ShoppingItem.objects.create(user=other_user, name="Secret item")

        my_item = ShoppingItem.objects.create(
            user=user,
            name="My shopping list item"
        )

        response = auth_client.get("/api/shopping-items/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["name"] == "My shopping list item"

    def test_create_expense(self, auth_client, user):
        data = {
            "amount": "89.99",
            "currency": "TND",
            "note": "Birthday gift for sister",
            "spent_at": timezone.now().isoformat()
        }

        response = auth_client.post("/api/expenses/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert float(response.data["amount"]) == 89.99
        assert response.data["currency"] == "TND"


@pytest.mark.django_db
class TestShoppingBusinessRules:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="rulebunny", password="carrots")

    def test_expiring_items_endpoint(self, user, client):
        client.force_authenticate(user=user)

        today = date.today()
        ShoppingItem.objects.bulk_create([
            ShoppingItem(
                user=user,
                name=f"Item {i}",
                expiry_date=today + timedelta(days=days),
                purchased=False
            )
            for i, days in enumerate([1, 3, 5, 10], 1)
        ])

        response = client.get("/api/shopping/expiring/")  # assuming you have this endpoint
        assert response.status_code == status.HTTP_200_OK

        # Should return items expiring in ≤ 3 days (based on your view logic)
        names = {item["name"] for item in response.data}
        assert "Item 1" in names
        assert "Item 2" in names
        assert "Item 3" not in names
        assert "Item 4" not in names