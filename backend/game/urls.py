from django.urls import path

from game.views import GameDetailView, GameRoundsView, GameScoresView

urlpatterns = [
    path("<str:room_code>/", GameDetailView.as_view(), name="game-detail"),
    path("<str:room_code>/rounds/", GameRoundsView.as_view(), name="game-rounds"),
    path("<str:room_code>/scores/", GameScoresView.as_view(), name="game-scores"),
]
