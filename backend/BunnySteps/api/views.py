from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
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
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
        })
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


class ShoppingItemViewSet(BaseUserOwnedViewSet):
    queryset = ShoppingItem.objects.all()
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

class FocusSessionViewSet(BaseUserOwnedViewSet):
    queryset = FocusSession.objects.all().select_related("mode")
    serializer_class = FocusSessionSerializer

    def get_queryset(self):
        return super().get_queryset().select_related("mode")

    # ========================================
    # START SESSION (Pomodoro / Flow / Mini / Shuffle)
    # ========================================
    @action(detail=False, methods=["post"], url_path="start")
    def start(self, request):
        serializer = StartFocusSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mode_key = serializer.validated_data["mode"]
        task_ids = serializer.validated_data.get("task_ids", [])

        # Try to load preset config
        try:
            mode = FocusMode.objects.get(user=request.user, preset=mode_key)
        except FocusMode.DoesNotExist:
            mode = None

        # Create session
        session = FocusSession.objects.create(
            user=request.user,
            mode=mode,
            mode_name=mode.name if mode else mode_key.capitalize(),
            is_hyperfocus=(mode_key == "flow")
        )

        # Attach tasks
        if task_ids:
            tasks = Task.objects.filter(id__in=task_ids, user=request.user)
            session.related_tasks.set(tasks)

        # Special shuffle metadata
        if mode_key == "shuffle":
            random.shuffle(task_ids)
            session.metadata = {
                "chosen_tasks": task_ids,
                "random_order": task_ids
            }
            session.save()

        return Response({
            "session_id": session.id,
            "mode": mode_key,
            "message": f"{mode_key.capitalize()} session started!"
        }, status=status.HTTP_201_CREATED)

    # ========================================
    # END SESSION
    # ========================================
    @action(detail=True, methods=["post"], url_path="end")
    def end(self, request, pk=None):
        try:
            session = self.get_object()  # auto-filters by user
        except FocusSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)

        session.ended_at = timezone.now()
        session.save(update_fields=["ended_at"])

        return Response({
            "message": "Session ended",
            "effective_minutes": session.effective_minutes
        })

    # ========================================
    # FLOW: Check if allowed (max 2 per day)
    # ========================================
    @action(detail=False, methods=["get"], url_path="flow-allowed")
    def flow_allowed(self, request):
        today = timezone.now().date()
        count = self.get_queryset().filter(
            mode__preset="flow",
            started_at__date=today
        ).count()

        if count >= 2:
            return Response({"allowed": False, "reason": "Daily limit reached (2 Flow sessions max)"})
        return Response({"allowed": True})

    # ========================================
    # MINI: Quick session suggestions
    # ========================================
    @action(detail=False, methods=["get"], url_path="mini-info")
    def mini_info(self, request):
        return Response({
            "suggested_durations": [5, 7, 10],
            "bunny_text": "Let’s hop for 5 minutes — no pressure!"
        })

    # ========================================
    # SHUFFLE: Get shuffled task order
    # ========================================
    @action(detail=False, methods=["post"], url_path="shuffle")
    def shuffle_tasks(self, request):
        task_ids = request.data.get("task_ids", [])
        tasks = Task.objects.filter(id__in=task_ids, user=request.user)
        task_data = [{"id": t.id, "title": t.title} for t in tasks]

        order = task_ids[:]
        random.shuffle(order)

        return Response({
            "selected": task_data,
            "random_order": order
        })

    # ========================================
    # STATS: Weekly chart data
    # ========================================
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        now = timezone.now()
        week_ago = now - timedelta(days=7)

        daily = (
            self.get_queryset()
            .filter(started_at__gte=week_ago)
            .values("started_at__date")
            .annotate(count=Count("id"))
            .order_by("started_at__date")
        )

        chart_data = [
            {"day": d["started_at__date"].strftime("%a"), "sessions": d["count"]}
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
                pass  # Invalid hobby ID → return no tasks (safe)

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