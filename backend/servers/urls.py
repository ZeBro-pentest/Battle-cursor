from django.urls import path

from servers.views import (
    ServerCreateView,
    ServerDeleteView,
    ServerDetailView,
    ServerJoinView,
    ServerLeaveView,
)

urlpatterns = [
    path("", ServerCreateView.as_view(), name="server-list"),
    path("<str:room_code>/", ServerDetailView.as_view(), name="server-detail"),
    path("<str:room_code>/join/", ServerJoinView.as_view(), name="server-join"),
    path("<str:room_code>/leave/", ServerLeaveView.as_view(), name="server-leave"),
    path("<str:room_code>/delete/", ServerDeleteView.as_view(), name="server-delete"),
]
