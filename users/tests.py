import requests
from random import randint, choice
from time import time

URL = 'http://127.0.0.1:8000/'

def test_create_user():
    user_login = f'test_login_{time()}'
    user_password = f'test_password{time()}'

    response = requests.post(URL+'/users/register', data={
        'login': user_login,
        'password': user_password
    })
    
    assert response.status_code != 403
    assert response.status_code == 200

    response = requests.post(URL+'/users/register', data={
        'login': 'test_login',
        'password': user_password
    })

    assert response.url == 'http://127.0.0.1:8000/'
    assert response.history[0].url == 'http://127.0.0.1:8000//users/register'
    assert response.history[0].status_code == 302
    assert response.status_code == 200


'''

    1. Создайте тест в котором вы зарегистрируете пользователя 
    а после проверите, получется ли за него авторизоваться

'''