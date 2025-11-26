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
# views.py  ← Add this right next to your RegisterView
# Get current user (for frontend check)
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


class TaskViewSet(BaseUserOwnedViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    @action(detail=True, methods=["post"])
    def mark_done(self, request, pk=None):
        task = self.get_object()
        task.mark_done()
        return Response({"status": "completed", "completed_at": task.completed_at})


class FocusModeViewSet(BaseUserOwnedViewSet):
    queryset = FocusMode.objects.all()
    serializer_class = FocusModeSerializer


class FocusSessionViewSet(BaseUserOwnedViewSet):
    queryset = FocusSession.objects.select_related("mode").all()
    serializer_class = FocusSessionSerializer

    @action(detail=False, methods=["post"])
    def end_session(self, request):
        session_id = request.data.get("session_id")
        try:
            session = FocusSession.objects.get(id=session_id, user=request.user)
            session.ended_at = timezone.now()
            session.save()
            return Response({"message": "Session ended", "effective_minutes": session.effective_minutes})
        except FocusSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)


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

# ----------------------------
# Extra serializer for session start
# ----------------------------
from rest_framework import serializers

class StartFocusSessionSerializer(serializers.Serializer):
    mode = serializers.CharField()
    task_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )


# ============================================================
# ⭐ MAIN: Start a session (Pomodoro / Flow / Mini / Shuffle)
# ============================================================

class StartFocusSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StartFocusSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        mode_key = serializer.validated_data["mode"]
        task_ids = serializer.validated_data.get("task_ids", [])

        # Try to load the FocusMode object (preset config)
        try:
            mode = FocusMode.objects.get(user=request.user, preset=mode_key)
        except FocusMode.DoesNotExist:
            mode = None

        # Create session
        session = FocusSession.objects.create(
            user=request.user,
            mode=mode,
            mode_name=mode.name if mode else mode_key,
            is_hyperfocus=True if mode_key == "flow" else False
        )

        # Attach tasks if provided
        if task_ids:
            tasks = Task.objects.filter(id__in=task_ids, user=request.user)
            session.related_tasks.set(tasks)

        # Special logic for shuffle
        if mode_key == "shuffle":
            session.metadata = {
                "chosen_tasks": task_ids,
                "random_order": task_ids[:]
            }
            session.save()

        return Response({
            "session_id": session.id,
            "mode": mode_key,
            "message": f"{mode_key.capitalize()} session started."
        })


# ============================================================
# ⭐ END SESSION — Calculates effective minutes
# ============================================================

class EndFocusSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = FocusSession.objects.get(id=session_id, user=request.user)
        except FocusSession.DoesNotExist:
            return Response({"error": "Session not found."}, status=404)

        session.ended_at = timezone.now()
        session.save()

        return Response({
            "message": "Session ended.",
            "effective_minutes": session.effective_minutes
        })


# ============================================================
# ⭐ Pomodoro preset (work, break)
# ============================================================

class PomodoroConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            mode = FocusMode.objects.get(user=request.user, preset="pomodoro")
            return Response(mode.config)
        except FocusMode.DoesNotExist:
            return Response({
                "work_seconds": 25 * 60,
                "break_seconds": 5 * 60
            })


# ============================================================
# ⭐ Flow mode — allowed only twice/day
# ============================================================

class FlowSessionAllowedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        count = FocusSession.objects.filter(
            user=request.user,
            mode__preset="flow",
            started_at__date=today
        ).count()

        if count >= 2:
            return Response({"allowed": False, "reason": "Daily limit reached"})

        return Response({"allowed": True})


# ============================================================
# ⭐ Mini Focus ("Hop In") — quick 5–10 minute session info
# ============================================================

class MiniFocusModeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "suggested_durations": [5, 7, 10],
            "bunny_text": "Let’s hop for 5 minutes — no pressure."
        })


# ============================================================
# ⭐ Shuffle Tasks Session
# ============================================================

class ShuffleTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        task_ids = request.data.get("task_ids", [])

        tasks = Task.objects.filter(id__in=task_ids, user=request.user)
        task_data = [{"id": t.id, "title": t.title} for t in tasks]

        import random
        order = task_ids[:]
        random.shuffle(order)

        return Response({
            "selected": task_data,
            "random_order": order
        })


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

class TaskListCreateView(generics.ListCreateAPIView):
    """
    List tasks or create new task
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Optionally filter by category, priority, or focus type
        """
        user = self.request.user
        qs = Task.objects.filter(user=user)

        category_id = self.request.query_params.get("category")
        priority = self.request.query_params.get("priority")
        focus_type = self.request.query_params.get("focus_type")

        if category_id:
            qs = qs.filter(category_id=category_id)
        if priority:
            qs = qs.filter(priority=priority)
        if focus_type:
            # assuming FocusMode preset name maps to tasks (user can configure)
            qs = qs.filter(custom_fields__focus_type=focus_type)

        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .models import MoodLog, Note
from .serializers import MoodLogSerializer, NoteSerializer


# -------------------------
# MOOD LOG VIEWS
# -------------------------

class MoodLogListCreateView(generics.ListCreateAPIView):
    """
    List all mood logs for the user, or create a new mood log
    """
    serializer_class = MoodLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MoodLog.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MoodLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MoodLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MoodLog.objects.filter(user=self.request.user)


# -------------------------
# NOTES VIEWS
# -------------------------

class NoteListCreateView(generics.ListCreateAPIView):
    """
    List all notes or create a new note
    """
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Optionally filter by task
        task_id = self.request.query_params.get("task")
        qs = Note.objects.filter(user=self.request.user).order_by("-created_at")
        if task_id:
            qs = qs.filter(task_id=task_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)


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
