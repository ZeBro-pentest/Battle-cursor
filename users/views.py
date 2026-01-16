from django.shortcuts import render
from .models import User
from game.models import Game
from django.http import HttpResponseRedirect, JsonResponse


def users_index(request):
    return render(request, 'users/index.html')

def users_main(request):
    if user := User.is_authorized(request):
        games = Game.objects.all()
        return render(request, 'users/users.html', context={
            'user': user,
            'games': games,
        })
    return HttpResponseRedirect('/')

def users_auth(request):
    login, password = request.POST.get('login'), request.POST.get('password')
    if User.authorize(request, login, password):
        return HttpResponseRedirect('/users')
    return HttpResponseRedirect('/')

def users_register(request):
    login, password = request.POST.get('login'), request.POST.get('password')
    if User.registrate(request, login, password):
        return HttpResponseRedirect('/users')
    return HttpResponseRedirect('/')

def get_user_by_id(request, user_id):
    user = User.objects.filter(id=user_id).first()
    if user:
        return JsonResponse({'result': user.login})
    return JsonResponse({'result': None})