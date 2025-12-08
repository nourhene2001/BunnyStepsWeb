# api/apps.py
from django.apps import AppConfig

class ApiConfig(AppConfig):
    name = 'api'
    def ready(self):
        import api.models  # This triggers signal registration
