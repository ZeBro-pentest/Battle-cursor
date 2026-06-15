from django.urls import path

from servers.views import (
    ServerDetailView,
    ServerJoinView,
    ServerLeaveView,
    ServerListView,
)

urlpatterns = [
    path("", ServerListView.as_view(), name="server-list"),
    path("<str:room_code>/", ServerDetailView.as_view(), name="server-detail"),
    path("<str:room_code>/join/", ServerJoinView.as_view(), name="server-join"),
    path("<str:room_code>/leave/", ServerLeaveView.as_view(), name="server-leave"),
]
