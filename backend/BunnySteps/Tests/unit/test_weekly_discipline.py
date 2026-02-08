# tests/test_weekly_discipline.py

from datetime import timedelta
from django.utils import timezone
import pytest
from api.models import Badge, Expense, RewardSummary, ShoppingItem, User, check_weekly_discipline


@pytest.mark.django_db
class TestWeeklyDiscipline:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="disciplinebun", password="x")

    def test_no_impulsive_in_week_gives_badge(self, user):
        # Clean week
        

        check_weekly_discipline(user)

        badge = Badge.objects.filter(user=user, key="no_impulsive_week").first()
        assert badge is not None
        assert "Discipline Bunny" in badge.title

        summary = RewardSummary.objects.get(user=user)
        assert summary.coins > 0  # at least some reward

    def test_impulsive_buy_prevents_badge(self, user):
        ShoppingItem.objects.create(
            user=user,
            name="Impulse candy",
            item_type="impulsive",
            purchased=True
        )
        Expense.objects.create(user=user, amount=5)

        check_weekly_discipline(user)

        assert not Badge.objects.filter(user=user, key="no_impulsive_week").exists()