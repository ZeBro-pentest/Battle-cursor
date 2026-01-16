from django.shortcuts import render
from django.http import HttpResponseRedirect, JsonResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models import User
from .models import Game, GameData
from .serializers import GameDataModelSerializer
from .debafs import elements
from redis import Redis
import json

r = Redis()

def game_main(request):
    if user := User.is_authorized(request):
        return render(request, 'games/game.html', context={
            'user': user,
            'session': request.session,
        })
    return HttpResponseRedirect('/')

def create_game(request):
    if user := User.is_authorized(request):
        # ДОБАВИТЬ ПРОВЕРКУ: есть ли уже активная игра
        existing_game = Game.objects.filter(
            owner=user,
            done=False
        ).exists()
        
        if existing_game:
            # Если игра уже создана, не создаем новую
            return HttpResponseRedirect('/users')
        
        # Создаем игру только если нет активной
        max_players = request.POST.get('max_players') or 12
        game = Game.objects.create(
            owner=user,
            max_players=max_players
        )
        return HttpResponseRedirect('/users')
    return HttpResponseRedirect('/')


def delete_game(request, game_id):
    if user := User.is_authorized(request):
        Game.objects.filter(id=game_id).delete()
        return HttpResponseRedirect('/users')
    return HttpResponseRedirect('/')

def join_to_game(request, game_id):
    if user := User.is_authorized(request):
        game = Game.objects.filter(id=game_id)
        if game:
            request.session['game_id'] = game_id
            return HttpResponseRedirect('/game')
        return HttpResponseRedirect('/users')
    return HttpResponseRedirect('/')

def get_game(request, game_id):
    if game := r.get(game_id):
        game = json.loads(game.decode())
    else:
        game = Game.objects.filter(id=game_id).first()
        r.set(game_id, json.dumps(game.data))
        game = game.data
    if game:
        return JsonResponse({'result': game})
    return JsonResponse({'result': None})

def update_game_data(request, game_id):
    data = request.POST.get('data') or {}
    if game := r.get(game_id):
        game = json.loads(game.decode())
        game.update(data)
        r.set(game_id, json.dumps(game))
    else:
        game = Game.objects.filter(id=game_id).first()
        updated_data = game.data
        updated_data.update(data)
        game.data = updated_data
        game.save()
        r.set(game_id, json.dumps(game.data))
    return JsonResponse({'result': 'update success'})

def get_game_list(request):
    games = Game.objects.all()
    result = [str(game.id) for game in games]
    return JsonResponse({'result': result})



class GameAPIView(APIView):

    def get(self, request):
        data = request.data

        game_id = data.get('game_id')
        game = Game.objects.filter(id=game_id).first()

        game_data = GameData.objects.filter(owner=game)
        game_data = [{'user_id': game.user.id, 'game_id': game.owner.id,
                      'data': game.data} for game in game_data]
        return Response({'result': game_data})

    def post(self, request):
        data = request.data
 
        game_id = data.get('game_id')
        user_id = data.get('user_id')
        data = data.get('data')

        game = Game.objects.filter(id=game_id).first()
        user = User.objects.filter(id=user_id).first()
        game_data = GameData.objects.filter(owner=game, user=user).first()
        all_game_data = GameData.objects.filter(owner=game)
        if not game_data:
            game_data = GameData.objects.create(owner=game, user=user, data=data)
        else:
            updated_data = game_data.data
            updated_data.update(data)
            game_data.data = updated_data
            game_data.save()

        return Response({
            'result': 'saved success',
            'game_datas': GameDataModelSerializer(
                all_game_data, many=True
            ).data
        })

class DebafAPIView(APIView):
    def get(self, request):
        return Response(elements)

    def post(self, request):
        data = request.data

        user_id = data.get('user_id')
        action = data.get('action')
        game_id = data.get('game_id')

        game = Game.objects.get(id=game_id)
        game_data = GameData.objects.filter(owner=game)

        for gd in game_data:
            debafs = gd.data.get('debafs') or []
            body = {
                'user_id': user_id,
                'action': action
            }
            if not body in debafs:
                debafs.append(body)
            
            gd.data['debafs'] = debafs
            gd.save()

        return Response('success', status=200)