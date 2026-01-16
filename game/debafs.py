from .models import Debaf

elements = [
    Debaf(
        title='Реклама',
        description='Заполните рекламой экран игроку',
        action='1'
    ).json(),
    Debaf(
        title='Скример',
        description='Напугайте пользователя рандомным скримером',
        action='2'
    ).json(),
    Debaf(
        title='Гравитация',
        description='Наложите рандмоный эффект гравитации на курсор мыши игрока',
        action='3'
    ).json(),
    Debaf(
        title='Капча',
        description='Пусть игрок будет занят, дайте ему капчу',
        action='4'
    ).json(),
    Debaf(
        title='Гиганский курсор мыши',
        description='Пусть у игрока будет мешать его же инструмент',
        action='5'
    ).json(),
    Debaf(
        title='Гиганский ластик',
        description='Дайте рандомный размер ластика (вместо курсора) игроку',
        action='6'
    ).json(),
    Debaf(
        title='Купи слона',
        description='Измените рандомно стоимость дебафоф игроку',
        action='7'
    ).json(),
    Debaf(
        title='Настройки',
        description='Снесите параметры инструмента игрока',
        action='8'
    ).json(),
    Debaf(
        title='Иной-мир',
        description='Переверните страницу игроку',
        action='9'
    ).json(),
    Debaf(
        title='Крутите-барабан!!!',
        description='Раскрутите всю страницу игроку',
        action='10'
    ).json(),
]