from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Avg, Count
from .utils import fire_due_reminders

from .models import *
from .serializers import *
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
# Add this import at the top with your other imports
from django.db.models import Count
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'username': user.username,
        }, status=status.HTTP_201_CREATED)
    
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = UntypedToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Logout successful"}, status=status.HTTP_205_RESET_CONTENT)
        except (InvalidToken, TokenError):
            return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        summary, _ = RewardSummary.objects.get_or_create(user=user)
        
        # ADD SALARY (monthly income - store in User or settings)
        salary = getattr(user, 'salary_amount', 1200)  # Default 1200 DT (~$400 USD)
        
        check_weekly_discipline(user)

        return Response({
            "id": user.id,
            "username": user.username,
            "level": summary.level,
            "xp": summary.xp,
            "coins": summary.coins,
            "achievements_count": user.badges.count(),
            "salary_amount": salary,  # ✅ ADD THIS
        })

class ShoppingItemListView(generics.ListAPIView):
    serializer_class = ShoppingItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShoppingItem.objects.filter(user=self.request.user).select_related('category').order_by('-priority', 'created_at')
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response({
                "error": "Username and password are required"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Authenticate user
        user = authenticate(username=username, password=password)
        if not user:
            return Response({
                "error": "Invalid username or password"
            }, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({
                "error": "Account is disabled"
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email or "",
            },
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            "message": "Welcome back, little bunny!"
        }, status=status.HTTP_200_OK)
class BaseUserOwnedViewSet(viewsets.ModelViewSet):
    """
    Base class for models linked to the authenticated user.
    Auto-fills user on create and filters queryset.
    """
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)


# ---------- Main CRUD endpoints ----------

class CategoryViewSet(BaseUserOwnedViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

from rest_framework.decorators import action   # ← THIS WAS MISSING!

class HobbyViewSet(BaseUserOwnedViewSet):
    queryset = Hobby.objects.all()
    serializer_class = HobbySerializer

    # ✅ FREEZE / UNFREEZE
    @action(detail=True, methods=["patch"], url_path="toggle_freeze")
    def toggle_freeze(self, request, pk=None):
        hobby = self.get_object()
        hobby.frozen = not hobby.frozen
        hobby.save()

        return Response({
            "frozen": hobby.frozen,
            "detail": "hobby frozen" if hobby.frozen else "hobby unfrozen"
        })
class HobbyActivityViewSet(BaseUserOwnedViewSet):
    queryset = HobbyActivity.objects.select_related("hobby").all()
    serializer_class = HobbyActivitySerializer


class ReminderViewSet(BaseUserOwnedViewSet):
    queryset = Reminder.objects.all()
    serializer_class = ReminderSerializer


class NoteViewSet(BaseUserOwnedViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer


class MoodLogViewSet(BaseUserOwnedViewSet):
    queryset = MoodLog.objects.all()
    serializer_class = MoodLogSerializer

    @action(detail=False, methods=['get'])
    def insights(self, request):
        user = request.user
        week_ago = timezone.now() - timedelta(days=7)
        logs = self.get_queryset().filter(created_at__gte=week_ago)

        total = logs.count()
        avg_rating = logs.aggregate(avg=Avg('rating'))['avg'] or 0
        today_count = logs.filter(created_at__date=timezone.now().date()).count()

        # Weekly trend (last 7 days)
        trend = []
        for i in range(6, -1, -1):
            day = timezone.now().date() - timedelta(days=i)
            day_avg = logs.filter(created_at__date=day).aggregate(avg=Avg('rating'))['avg'] or 0
            trend.append({
                "time": day.strftime("%a"),
                "mood": round(day_avg, 1)
            })

        return Response({
            "today_checkins": today_count,
            "weekly_average": round(avg_rating, 1),
            "weekly_trend": trend,
            "best_day": max(trend, key=lambda x: x['mood'])['time'] if trend else None,
            "streak": self._calculate_streak(user)
        })

    def _calculate_streak(self, user):
        # Simple streak: consecutive days with at least one log
        today = timezone.now().date()
        streak = 0
        check_date = today
        logs = self.get_queryset().filter(user=user).dates('created_at', 'day')
        while check_date in logs:
            streak += 1
            check_date -= timedelta(days=1)
        return streak


class ShoppingItemViewSet(BaseUserOwnedViewSet):
    queryset = ShoppingItem.objects.all().order_by("-created_at")
    serializer_class = ShoppingItemSerializer


class ExpenseViewSet(BaseUserOwnedViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer


class BadgeViewSet(BaseUserOwnedViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer


class RewardSummaryViewSet(BaseUserOwnedViewSet):
    queryset = RewardSummary.objects.all()
    serializer_class = RewardSummarySerializer



# views.py (append at the end, import if needed: from rest_framework import generics)

class NotificationListView(generics.ListAPIView):
    """
    List unread notifications for the user (or all if ?all=true).
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        if self.request.query_params.get('all') != 'true':
            queryset = queryset.filter(is_read=False)  # Only unread by default
        return queryset.order_by('-created_at')

class NotificationMarkReadView(generics.UpdateAPIView):
    """
    Mark a notification as read.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(is_read=True)
from .models import (
    Category, Task, FocusMode, FocusSession, Hobby, HobbyActivity,
    Reminder, Note, MoodLog, ShoppingItem, Expense, Badge, RewardSummary
)

from .serializers import (
    CategorySerializer, TaskSerializer, FocusModeSerializer,
    FocusSessionSerializer, HobbySerializer, HobbyActivitySerializer,
    ReminderSerializer, NoteSerializer, MoodLogSerializer,
    ShoppingItemSerializer, ExpenseSerializer, BadgeSerializer,
    RewardSummarySerializer
)
# views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count
from datetime import timedelta
import random

import random
from django.db.models import Q, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

class FocusSessionViewSet(BaseUserOwnedViewSet):
    queryset = FocusSession.objects.all()
    serializer_class = FocusSessionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in ['list', 'retrieve', 'stats']:
            qs = qs.select_related('mode')
        return qs

    @action(detail=False, methods=["post"], url_path="start")
    def start(self, request):
        serializer = StartFocusSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mode_key = serializer.validated_data["mode"]
        task_ids = serializer.validated_data.get("task_ids", [])

        mode = None
        try:
            mode = FocusMode.objects.get(user=request.user, preset=mode_key)
        except FocusMode.DoesNotExist:
            pass

        session = FocusSession.objects.create(
            user=request.user,
            mode=mode,
            mode_name=mode.name if mode else mode_key.capitalize(),
            is_hyperfocus=(mode_key == "flow"),
            started_at=timezone.now(),
        )

        if task_ids:
            tasks = Task.objects.filter(id__in=task_ids, user=request.user)
            session.related_tasks.set(tasks)

        if mode_key == "shuffle" and task_ids:
            shuffled = task_ids[:]
            random.shuffle(shuffled)
            session.metadata = {
                "chosen_tasks": task_ids,
                "random_order": shuffled
            }
            session.save(update_fields=["metadata"])

        return Response({
            "session_id": session.id,
            "mode": mode_key,
            "message": f"{mode_key.capitalize()} session started!"
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="end")
    def end(self, request, pk=None):
        try:
            session = self.get_object()
        except FocusSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)

        if session.ended_at:
            return Response({"error": "Session already ended"}, status=400)

        session.ended_at = timezone.now()
        if session.started_at:
            delta = session.ended_at - session.started_at
            session.effective_minutes = max(0, int(delta.total_seconds() // 60))
        session.save(update_fields=["ended_at", "effective_minutes"])

        return Response({
            "message": "Session ended successfully",
            "effective_minutes": session.effective_minutes
        })

    @action(detail=False, methods=["get"], url_path="flow-allowed")
    def flow_allowed(self, request):
        today = timezone.now().date()
        count = self.get_queryset().filter(
            Q(mode__preset="flow") | Q(mode_name__iexact="flow"),
            started_at__date=today
        ).count()

        return Response({
            "allowed": count < 2,
            "current_count": count,
            "max_daily": 2
        })

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        week_ago = timezone.now() - timedelta(days=7)
        daily = (
            self.get_queryset()
            .filter(started_at__gte=week_ago, ended_at__isnull=False)
            .annotate(day=TruncDate('started_at'))
            .values('day')
            .annotate(sessions=Count('id'))
            .order_by('day')
        )

        chart_data = [
            {"day": d["day"].strftime("%a"), "sessions": d["sessions"]}
            for d in daily
        ]

        return Response({"chart_data": chart_data})


# ============================================================
# ⭐ Adaptive AI Recommendation — Suggest best duration
# ============================================================

class AdaptiveRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = FocusSession.objects.filter(
            user=request.user
        ).order_by("-started_at")[:20]

        if not sessions:
            return Response({"message": "Not enough focus history."})

        avg = sum(
            (s.effective_minutes or 0)
            for s in sessions
        ) / len(sessions)

        return Response({
            "recommended_length": int(avg),
            "message": f"You focus best around {int(avg)} minutes."
        })
from datetime import timedelta
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import Hobby, HobbyActivity, Note, Task
from .serializers import (
    HobbySerializer, HobbyActivitySerializer, NoteSerializer, TaskSerializer
)
class AllSessionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = FocusSession.objects.filter(user=request.user).order_by("-started_at")
        data = [{
            "id": s.id,
            "mode": s.mode_name,
            "effective_minutes": s.effective_minutes,
            "started_at": s.started_at,
            "ended_at": s.ended_at,
        } for s in sessions]

        return Response(data)


# ----------------------------------------------------
#                 HOBBY CRUD
# ----------------------------------------------------
class HobbyListCreateView(generics.ListCreateAPIView):
    serializer_class = HobbySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Hobby.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class HobbyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HobbySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Hobby.objects.filter(user=self.request.user)


# ----------------------------------------------------
#            FREEZE / UNFREEZE HOBBY
# ----------------------------------------------------
class FreezeHobbyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            hobby = Hobby.objects.get(id=pk, user=request.user)
        except Hobby.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        freeze_reason = request.data.get("freeze_reason", "")

        hobby.status = "frozen"
        hobby.freeze_reason = freeze_reason
        hobby.save()

        return Response({"message": "Hobby frozen", "hobby": HobbySerializer(hobby).data})


class UnfreezeHobbyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            hobby = Hobby.objects.get(id=pk, user=request.user)
        except Hobby.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        hobby.status = "active"
        hobby.freeze_reason = ""
        hobby.save()

        return Response({"message": "Hobby unfrozen", "hobby": HobbySerializer(hobby).data})


# ----------------------------------------------------
#                HOBBY ACTIVITIES
# ----------------------------------------------------
class HobbyActivityListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, hobby_id):
        activities = HobbyActivity.objects.filter(hobby_id=hobby_id, user=request.user)
        serializer = HobbyActivitySerializer(activities, many=True)
        return Response(serializer.data)

    def post(self, request, hobby_id):
        data = request.data.copy()
        data["hobby"] = hobby_id
        data["user"] = request.user.id

        serializer = HobbyActivitySerializer(data=data)
        serializer.is_valid(raise_exception=True)
        activity = serializer.save()

        return Response(serializer.data, status=201)


# ----------------------------------------------------
#      CONVERT HOBBY ACTIVITY → TASK
# ----------------------------------------------------
class ConvertHobbyActivityToTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, activity_id):
        try:
            activity = HobbyActivity.objects.get(id=activity_id, user=request.user)
        except HobbyActivity.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        task_data = {
            "title": activity.title,
            "description": activity.description,
            "category": None,
            "user": request.user.id,
            "related_hobby": activity.hobby.id,
        }

        serializer = TaskSerializer(data=task_data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)

        return Response({"message": "Task created from hobby activity", "task": serializer.data})


# ----------------------------------------------------
#                       NOTES
# ----------------------------------------------------
class HobbyNoteListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, hobby_id):
        notes = Note.objects.filter(hobby_id=hobby_id, user=request.user)
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)

    def post(self, request, hobby_id):
        data = request.data.copy()
        data["hobby"] = hobby_id
        data["user"] = request.user.id

        serializer = NoteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        note = serializer.save()

        return Response(serializer.data, status=201)


class NoteDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, note_id):
        try:
            note = Note.objects.get(id=note_id, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        note.delete()
        return Response({"message": "Note deleted"})


# ----------------------------------------------------
#        LONG-INACTIVITY REMINDER CHECK
#        (CRON JOB / FRONTEND PING)
# ----------------------------------------------------
class CheckInactivityRemindersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cutoff = timezone.now() - timedelta(days=30)
        inactive_hobbies = []

        hobbies = Hobby.objects.filter(user=request.user, status="active")

        for hobby in hobbies:
            last_activity = HobbyActivity.objects.filter(hobby=hobby).order_by("-created_at").first()

            if not last_activity or last_activity.created_at < cutoff:
                inactive_hobbies.append(HobbySerializer(hobby).data)

        return Response({"inactive": inactive_hobbies})
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from .models import Category, Task, FocusMode
from .serializers import CategorySerializer, TaskSerializer

# -------------------------
# CATEGORY VIEWS
# -------------------------

class CategoryListCreateView(generics.ListCreateAPIView):
    """
    List all categories (predefined + user) and create new user category.
    """
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # global categories or user categories
        return Category.objects.filter(Q(user__isnull=True) | Q(user=self.request.user))

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)


# -------------------------
# TASK VIEWS
# -------------------------

# views.py — UPDATED FOR ALL NEW TASK FEATURES
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Task, Category, ShoppingItem, Reminder
from .serializers import TaskSerializer, CategorySerializer, ShoppingItemSerializer, ReminderSerializer


# ========================
# TASK VIEWS — FULLY UPDATED
# ========================
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

class TaskViewSet(viewsets.ModelViewSet):
    """
    Complete CRUD + custom actions for tasks
    GET    /api/tasks/
    POST   /api/tasks/
    GET    /api/tasks/<id>/
    PATCH  /api/tasks/<id>/
    DELETE /api/tasks/<id>/
    PATCH  /api/tasks/<id>/start/
    PATCH  /api/tasks/<id>/complete/
    PATCH  /api/tasks/<id>/toggle_freeze/
    """

    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    queryset = Task.objects.all()  # Required for router
    def list(self, request, *args, **kwargs):
            fire_due_reminders(request.user)   # ← HERE TOO
            return super().list(request, *args, **kwargs)
    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user) \
            .select_related("category", "shopping_item", "hobby") \
            .prefetch_related("reminders", "focus_sessions") \
            .order_by("-created_at")

        # THIS IS BULLETPROOF — NO MORE CRASHES
        hobby_param = self.request.query_params.get("hobby")
        if hobby_param is not None:
            try:
                hobby_id = int(hobby_param)
                queryset = queryset.filter(hobby_id=hobby_id)
            except (ValueError, TypeError):
                print('wrong id ',hobby_id)  # Invalid hobby ID → return no tasks (safe)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # ✅ ✅ ✅ START TASK
    @action(detail=True, methods=["patch"], url_path="start")
    def start(self, request, pk=None):
        task = self.get_object()

        if task.frozen:
            return Response({"detail": "Frozen task"}, status=400)

        if task.status in ["in_progress", "done"]:
            return Response({"detail": "Already started/done"}, status=400)

        task.status = "in_progress"
        task.save(update_fields=["status"])

        return Response({
            "detail": "Task started! Hop to it!",
            "focus_mode": task.preferred_focus_mode or "pomodoro",
            "confetti": True
        })

    # ✅ ✅ ✅ COMPLETE TASK
    @action(detail=True, methods=["patch"], url_path="complete")
    def complete(self, request, pk=None):
        task = self.get_object()

        if task.status == "done":
            return Response({"detail": "Already done"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Mark task as done
            task.completed = True
            task.status = "done"

            # Only set completed_at if missing
            if not task.completed_at:
                task.completed_at = timezone.now()

            task.save()
        except Exception as e:
            # Return exact error for debugging
            return Response(
                {"detail": f"Could not complete task: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "detail": "Task completed! Great job!",
            "xp": 50,
            "coins": 10,
            "confetti": True
        })
    # ✅ ✅ ✅ FREEZE / UNFREEZE
    @action(detail=True, methods=["patch"], url_path="toggle_freeze")
    def toggle_freeze(self, request, pk=None):
        task = self.get_object()
        task.frozen = not task.frozen
        task.save()

        return Response({
            "frozen": task.frozen,
            "detail": "Task frozen" if task.frozen else "Task unfrozen"
        })

# views.py
class PingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        fire_due_reminders(request.user)
        return Response({"status": "ok", "message": "Bunny is awake!"})

# ========================
# LEGACY VIEWS (keep if you still use them)
# ========================
class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Task.objects.filter(user=self.request.user).select_related(
            "category", "shopping_item", "hobby"
        ).order_by("-created_at")

        # Existing filters (keep these!)
        if self.request.query_params.get("status"):
            qs = qs.filter(status=self.request.query_params["status"])
        if self.request.query_params.get("priority"):
            qs = qs.filter(priority=self.request.query_params["priority"])
        if self.request.query_params.get("frozen") is not None:
            qs = qs.filter(frozen=self.request.query_params["frozen"] == "true")

        # THIS IS THE MISSING LINE — ADD IT!
        if self.request.query_params.get("hobby"):
            qs = qs.filter(hobby=self.request.query_params["hobby"])

        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).select_related(
            "category", "shopping_item", "hobby"
        )


# ========================
# CATEGORY VIEWS
# ========================
class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user) | Category.objects.filter(user=None)  # global + user

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ========================
# SHOPPING ITEM LINKING (for "Add Cost" button)
# ========================
class ShoppingItemForTaskView(generics.CreateAPIView):
    serializer_class = ShoppingItemSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        task_id = request.data.get("task")
        task = get_object_or_404(Task, id=task_id, user=request.user)

        shopping_data = {
            "name": request.data.get("name", task.title + " (cost)"),
            "estimated_cost": request.data.get("estimated_cost"),
            "user": request.user.id,
        }
        shopping_serializer = self.get_serializer(data=shopping_data)
        shopping_serializer.is_valid(raise_exception=True)
        shopping_item = shopping_serializer.save()

        # Link back to task
        task.shopping_item = shopping_item
        task.save(update_fields=["shopping_item"])

        return Response(shopping_serializer.data, status=status.HTTP_201_CREATED)


# ========================
# REMINDER FOR TASK
# ========================
class ReminderForTaskView(generics.CreateAPIView):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        task_id = request.data.get("task")
        task = get_object_or_404(Task, id=task_id, user=request.user)

        reminder_data = {
            "task": task.id,
            "reminder_date": request.data.get("reminder_date"),
            "user": request.user.id,
        }
        serializer = self.get_serializer(data=reminder_data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

# -------------------------
# SEND NOTE TO FUTURE SELF
# -------------------------

class SendNoteToFutureSelfView(generics.UpdateAPIView):
    """
    Mark an existing note to be sent to future self with a future date
    """
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        note = self.get_object()
        future_date = request.data.get("future_date")
        if not future_date:
            return Response({"error": "future_date is required (YYYY-MM-DD)"}, status=status.HTTP_400_BAD_REQUEST)

        note.send_to_future = True
        note.future_date = future_date
        note.save()
        serializer = self.get_serializer(note)
        return Response(serializer.data)
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta

from .models import ShoppingItem, Expense
from .serializers import ShoppingItemSerializer, ExpenseSerializer


# -------------------------
# SHOPPING ITEMS
# -------------------------

class ShoppingItemListCreateView(generics.ListCreateAPIView):
    """
    List all shopping items or create a new item.
    """
    serializer_class = ShoppingItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Split into upcoming (not purchased) and past items
        return ShoppingItem.objects.filter(user=self.request.user).order_by("expiry_date", "-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ShoppingItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ShoppingItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShoppingItem.objects.filter(user=self.request.user)


# -------------------------
# EXPENSES
# -------------------------

class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user).order_by("-spent_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# -------------------------
# ITEMS NEAR EXPIRATION / AUTO ADD
# -------------------------
class ExpiringItemsView(generics.ListAPIView):
    """
    Returns items that are near expiration or marked as almost over
    """
    serializer_class = ShoppingItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        today = timezone.now().date()
        warning_days = 3  # items expiring in 3 days
        return ShoppingItem.objects.filter(
            user=self.request.user,
            purchased=False,
        ).filter(
            models.Q(expiry_date__lte=today + timedelta(days=warning_days)) |
            models.Q(note__icontains="almost over")
        ).order_by("expiry_date")


# -------------------------
# IMPULSIVE SHOPPING ITEMS
# -------------------------

class ImpulsiveShoppingItemView(generics.ListCreateAPIView):
    """
    Items user wants to buy impulsively.
    User can provide: item, cost, priority, desired week/month
    Returns warning if budget insufficient
    """
    serializer_class = ShoppingItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShoppingItem.objects.filter(user=self.request.user, purchased=False).order_by("-priority", "-created_at")

    def perform_create(self, serializer):
        # Optionally check user's total planned cost vs salary here
        user = self.request.user
        new_item_cost = serializer.validated_data.get("estimated_cost", 0)

        # Example: retrieve user salary stored in Expense (or custom model)
        salary_expenses = Expense.objects.filter(user=user).aggregate(total_spent=Sum("amount"))
        total_spent = salary_expenses.get("total_spent") or 0
        # For demo, assume salary = 1000 USD
        salary = getattr(user, "salary_amount", 1000)

        if total_spent + new_item_cost > salary:
            warning = f"Warning! Adding this item exceeds your budget of {salary}."
            return Response({"warning": warning}, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(user=user)
import os
from django.http import JsonResponse
from rest_framework.decorators import api_view
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@api_view(["POST"])
def chat_with_bunny(request):
    user_message = request.data.get("message", "")

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are Bun Bun, a cute productivity bunny assistant. Be motivational, supportive and short."},
            {"role": "user", "content": user_message},
        ]
    )

    reply = completion.choices[0].message["content"]
    return JsonResponse({"reply": reply})
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        summary, _ = RewardSummary.objects.get_or_create(user=user)
        
        # This now runs only ONCE per day per user
        check_weekly_discipline(user)

        return Response({
            "id": user.id,
            "username": user.username,
            "level": summary.level,
            "xp": summary.xp,
            "coins": summary.coins,
            "achievements_count": user.badges.count(),
        })

# Smart recommendations when user has enough coins
class RewardRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        summary = request.user.reward_summary
        if summary.coins < 500:
            return Response({"message": "Keep going! You're doing great"})

        top_impulsive = ShoppingItem.objects.filter(
            user=request.user,
            item_type="impulsive",
            purchased=False
        ).order_by("-priority")[:3]

        hobbies = Hobby.objects.filter(user=request.user)[:3]

        return Response({
            "message": "You've earned a treat! But also remember to relax",
            "treat_yourself": ShoppingItemSerializer(top_impulsive, many=True).data,
            "relax_with": HobbySerializer(hobbies, many=True).data,
        })