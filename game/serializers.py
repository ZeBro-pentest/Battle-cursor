from rest_framework import serializers
from django.contrib.auth.models import User
from .models import GameData

class GameDataModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameData
        fields = '__all__'