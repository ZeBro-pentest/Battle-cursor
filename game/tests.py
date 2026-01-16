import requests

URL = 'http://127.0.0.1:8000/'

def test_game_list():

    response = requests.get(URL+'games/list')
    data = response.json()

    assert data
    assert 'result' in data
    assert isinstance(data['result'], list)

    game_id = data['result'][0]
    print(f'{game_id=}')

    assert game_id
    response = requests.get(URL+'games/get/'+game_id)
    data = response.json()

    assert data 


def test_update_game_data():
    response = requests.get(URL+'games/list')
    data = response.json()

    assert data
    assert 'result' in data
    assert isinstance(data['result'], list)

    game_id = data['result'][0]
    print(f'{game_id=}')

    assert game_id
    response = requests.get(URL+'games/get/'+game_id)
    data = response.json()

    assert data
    assert 'result' in data
    assert isinstance(data['result'], dict)

    print(f'{data=}')
    assert data['result']['players_count'] == len(data['result']['players'])
    data['result'].update({
        'mouse_positions': [(240, 250),],
    })
    response = requests.post(URL+'games/update/'+game_id, json={
        'data': data['result']
    })
    result = response.json()
    assert 'result' in result
    assert result['result'] == 'update success'