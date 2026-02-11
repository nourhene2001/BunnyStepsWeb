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
    NotificationListView,
    NotificationMarkReadView,
    PingView,

    ReminderForTaskView,
    RewardRecommendationView,
    SendNoteToFutureSelfView,
    ShoppingItemDetailView,
    ShoppingItemForTaskView,
    ShoppingItemListCreateView,

    HobbyListCreateView, HobbyDetailView,
    FreezeHobbyView,
    ShoppingItemListView,
    TaskDetailView,
    TaskListCreateView, UnfreezeHobbyView,
    HobbyActivityListCreateView, ConvertHobbyActivityToTaskView,
    HobbyNoteListCreateView, NoteDeleteView,
    CheckInactivityRemindersView,
    UserProfileView,
    )

router = DefaultRouter()
router.register("categories", views.CategoryViewSet)
router.register("tasks", views.TaskViewSet, basename="tasks")          # basename fixed!
router.register("focus-sessions", views.FocusSessionViewSet, basename="focus-session")
router.register("hobbies", views.HobbyViewSet)
router.register("hobby-activities", views.HobbyActivityViewSet)
router.register("reminders", views.ReminderViewSet)
router.register("notes", views.NoteViewSet)
router.register("mood-logs", views.MoodLogViewSet)
router.register("shopping-items", views.ShoppingItemViewSet)
router.register("expenses", views.ExpenseViewSet)
router.register("badges", views.BadgeViewSet)
router.register("rewards", views.RewardSummaryViewSet)

urlpatterns = [
    path("", include(router.urls)),
        # JWT auth routes
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),



    # HOBBIES
    path("hobbies/", HobbyListCreateView.as_view()),
    path("hobbies/<int:pk>/", HobbyDetailView.as_view()),
    path('shopping-items/', ShoppingItemListView.as_view(), name='shopping-items'),
    path('expenses/', ExpenseListCreateView.as_view(), name='expenses'),
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

    # Notes
    path("notes/<int:pk>/send_future/", SendNoteToFutureSelfView.as_view(), name="note-send-future"),
        # Shopping Items
    path("shopping/items/", ShoppingItemListCreateView.as_view(), name="shopping-item-list-create"),
    path("shopping/items/<int:pk>/", ShoppingItemDetailView.as_view(), name="shopping-item-detail"),

    # Expenses
    path("shopping/expenses/", ExpenseListCreateView.as_view(), name="expense-list-create"),

    # Expiring / almost over items
    path("shopping/items/expiring/", ExpiringItemsView.as_view(), name="expiring-items"),
    path('ping/', PingView.as_view()),
    # Impulsive shopping
    path("shopping/items/impulsive/", ImpulsiveShoppingItemView.as_view(), name="impulsive-items"),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path("auth/me/", UserProfileView.as_view(), name="user-profile"),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('reward-recommendations/', RewardRecommendationView.as_view(), name='recommendations'),
    path('expiring-items/', ExpiringItemsView.as_view(), name='expiring-items'),
    path('reward-recommendations/', RewardRecommendationView.as_view(), name='reward-recommendations'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/mark-read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
]



