"""
URL configuration for battle_cursor project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from users.views import (
    users_auth, users_index, users_register, users_main,
    get_user_by_id
)
from game.views import (
    create_game, delete_game, join_to_game, game_main,
    get_game, get_game_list, update_game_data,
    GameAPIView, DebafAPIView
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('', users_index),
    path('users/', users_main),
    path('users/register', users_register),
    path('users/auth', users_auth),
    path('users/get/<str:user_id>', get_user_by_id),

    path('games/create', create_game),
    path('games/delete/<str:game_id>', delete_game),
    path('games/join/<str:game_id>', join_to_game),
    path('game', game_main),
    path('games/get/<str:game_id>', get_game),
    path('games/list', get_game_list),
    # path('games/update/<str:game_id>', update_game_data),
    
    path('api/v1/games', GameAPIView.as_view()),
    path('api/v1/debafs', DebafAPIView.as_view()),
]
