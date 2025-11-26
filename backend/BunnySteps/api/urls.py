from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.urls import path
from .views import (
    AdaptiveRecommendationView,
    CategoryDetailView,
    CategoryListCreateView,
    ExpenseListCreateView,
    ExpiringItemsView,
    ImpulsiveShoppingItemView,
    MoodLogDetailView,
    MoodLogListCreateView,
    NoteDetailView,
    NoteListCreateView,
    SendNoteToFutureSelfView,
    ShoppingItemDetailView,
    ShoppingItemListCreateView,
    StartFocusSessionView,
    EndFocusSessionView,
    PomodoroConfigView,
    FlowSessionAllowedView,
    MiniFocusModeView,
    ShuffleTasksView,
    HobbyListCreateView, HobbyDetailView,
    FreezeHobbyView,
    TaskDetailView,
    TaskListCreateView, UnfreezeHobbyView,
    HobbyActivityListCreateView, ConvertHobbyActivityToTaskView,
    HobbyNoteListCreateView, NoteDeleteView,
    CheckInactivityRemindersView,
    UserProfileView)

router = DefaultRouter()
router.register("categories", views.CategoryViewSet)
router.register("tasks", views.TaskViewSet)
router.register("focus-modes", views.FocusModeViewSet)
router.register("focus-sessions", views.FocusSessionViewSet)
router.register("hobbies", views.HobbyViewSet)
router.register("hobby-activities", views.HobbyActivityViewSet)
router.register("reminders", views.ReminderViewSet)
router.register("notes", views.NoteViewSet)
router.register("moods", views.MoodLogViewSet)
router.register("shopping-items", views.ShoppingItemViewSet)
router.register("expenses", views.ExpenseViewSet)
router.register("badges", views.BadgeViewSet)
router.register("rewards", views.RewardSummaryViewSet)

urlpatterns = [
    path("", include(router.urls)),
        # JWT auth routes
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),


    path("focus/start/", StartFocusSessionView.as_view()),
    path("focus/end/<int:session_id>/", EndFocusSessionView.as_view()),

    path("focus/pomodoro/config/", PomodoroConfigView.as_view()),
    path("focus/flow/allowed/", FlowSessionAllowedView.as_view()),
    path("focus/mini/info/", MiniFocusModeView.as_view()),

    path("focus/shuffle/", ShuffleTasksView.as_view()),

    path("focus/adaptive/", AdaptiveRecommendationView.as_view()),

    # HOBBIES
    path("hobbies/", HobbyListCreateView.as_view()),
    path("hobbies/<int:pk>/", HobbyDetailView.as_view()),

    # FREEZE / UNFREEZE
    path("hobbies/<int:pk>/freeze/", FreezeHobbyView.as_view()),
    path("hobbies/<int:pk>/unfreeze/", UnfreezeHobbyView.as_view()),

    # ACTIVITIES
    path("hobbies/<int:hobby_id>/activities/", HobbyActivityListCreateView.as_view()),
    path("activities/<int:activity_id>/convert-to-task/", ConvertHobbyActivityToTaskView.as_view()),

    # NOTES
    path("hobbies/<int:hobby_id>/notes/", HobbyNoteListCreateView.as_view()),
    path("notes/<int:note_id>/delete/", NoteDeleteView.as_view()),

    # INACTIVITY REMINDERS
    path("hobbies/check-inactivity/", CheckInactivityRemindersView.as_view()),
       # Categories
    path("categories/", CategoryListCreateView.as_view(), name="category-list-create"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),

    # Tasks
    path("tasks/", TaskListCreateView.as_view(), name="task-list-create"),
    path("tasks/<int:pk>/", TaskDetailView.as_view(), name="task-detail"),
        # Mood Logs
    path("moods/", MoodLogListCreateView.as_view(), name="mood-list-create"),
    path("moods/<int:pk>/", MoodLogDetailView.as_view(), name="mood-detail"),

    # Notes
    path("notes/", NoteListCreateView.as_view(), name="note-list-create"),
    path("notes/<int:pk>/", NoteDetailView.as_view(), name="note-detail"),
    path("notes/<int:pk>/send_future/", SendNoteToFutureSelfView.as_view(), name="note-send-future"),
        # Shopping Items
    path("shopping/items/", ShoppingItemListCreateView.as_view(), name="shopping-item-list-create"),
    path("shopping/items/<int:pk>/", ShoppingItemDetailView.as_view(), name="shopping-item-detail"),

    # Expenses
    path("shopping/expenses/", ExpenseListCreateView.as_view(), name="expense-list-create"),

    # Expiring / almost over items
    path("shopping/items/expiring/", ExpiringItemsView.as_view(), name="expiring-items"),

    # Impulsive shopping
    path("shopping/items/impulsive/", ImpulsiveShoppingItemView.as_view(), name="impulsive-items"),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path("auth/me/", UserProfileView.as_view(), name="user-profile"),
]



