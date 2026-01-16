from django.db.models import (
    Model, CharField, JSONField, IntegerField,
    ForeignKey, BooleanField, CASCADE
)
from uuid import uuid4
from users.models import User

def uniq_number():
    from random import randint
    return ''.join([str(randint(0,9)) for x in range(6)])

class Game(Model):
    id = CharField(max_length=36, default=uuid4, primary_key=True)  # UUID как первичный ключ
    number = CharField(max_length=6, default=uniq_number)  # Уникальный номер игры
    owner = ForeignKey(User, on_delete=CASCADE)  # Владелец игры (создатель)
    max_players = IntegerField(default=12)  # Максимум игроков
    done = BooleanField(default=False)  # Игра завершена?
    started = BooleanField(default=False)  # Игра началась?

class GameData(Model):
    owner = ForeignKey(Game, on_delete=CASCADE)
    user = ForeignKey(User, on_delete=CASCADE)
    data = JSONField(default=dict)

class Debaf:
    def __init__(self, title, description, action, coins = 0):
        self.title = title
        self.description = description
        self.action = action
        self.coins = coins
        
    def json(self):
        return {
            'title': self.title,
            'description': self.description,
            'action': self.action,
            'coins': self.coins,
        }