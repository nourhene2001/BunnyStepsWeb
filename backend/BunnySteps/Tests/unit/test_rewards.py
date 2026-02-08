# tests/test_rewards.py

from datetime import timedelta

from django.utils import timezone
import pytest

from api.models import FocusSession, RewardSummary, Task, User, level_up


@pytest.mark.django_db
class TestRewardSystem:

    @pytest.fixture
    def user(self):
        user = User.objects.create_user(username="rewardtest", password="x")
        RewardSummary.objects.create(user=user, xp=0, coins=0, level=1)
        return user

    def test_level_up_calculation(self, user):
        summary = user.reward_summary
        summary.xp = 140
        level_up(summary)  # or call the function/logic you use

        assert summary.level == 3
        assert summary.xp == 40  # 140 - 50 - 50
        assert summary.coins == 300  # example: level bonuses

    def test_task_completion_gives_reward(self, user):
        summary = user.reward_summary
        initial_xp = summary.xp
        initial_coins = summary.coins

        task = Task.objects.create(user=user, title="Test", status="in_progress")
        task.status = "done"
        task.completed = True
        task.save()  # should trigger signal

        summary.refresh_from_db()
        assert summary.xp >= initial_xp + 40  # or whatever value you give
        assert summary.coins >= initial_coins + 8

    def test_focus_session_completion_reward(self, user):
        summary = user.reward_summary
        initial_xp = summary.xp

        session = FocusSession.objects.create(
            user=user,
            started_at=timezone.now() - timedelta(minutes=38),
            ended_at=timezone.now()
        )
        session.save()  # triggers reward

        summary.refresh_from_db()
        assert summary.xp >= initial_xp + 30  # at least 30+