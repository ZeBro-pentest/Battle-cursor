from django.db.models import (
    Model, CharField, IntegerField
)
from uuid import uuid4

class User(Model):
    id = CharField(
        default=uuid4,
        primary_key=True,
        max_length=36
    )
    login = CharField(max_length=32)
    password = CharField(max_length=32)
    balance = IntegerField(default=1000)

    @classmethod
    def is_authorized(cls, request):
        if user_id := request.session.get('user_id'):
            return User.objects.get(id=user_id)
    
    @classmethod
    def registrate(cls, request, login, password):
        if not User.objects.filter(login=login).first():
            user = User.objects.create(
                login=login,
                password=password
            )
            User.authorize(request, login, password)
            return user
    
    @classmethod
    def authorize(cls, request, login, password):
        if user := User.objects.filter(
            login=login,
            password=password
        ).first():
            request.session['user_id'] = str(user.id)
            request.session['login'] = user.login
            return user