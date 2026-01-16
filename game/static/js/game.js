let canvas = document.querySelector("#canvas");
let ctx = canvas.getContext("2d");
let lineWidthInput = document.querySelector('#lineWidth');

let previousMouseX = null;
let previousMouse = null;
let isDrawing = false;

let lineWidth = 10;
let brush = 1;
let myColor = "#FF0000";

let mousePosition = [0,0];

let players_canvas = [];
let players_cursor = [];
let players_container = document.querySelector('.players');

let debafs = null;

let selectedPlayer = null;
let playersCount = 0;

setInterval(()=>{
    let playersCanvases = document.querySelectorAll('.player-canvas');
    if (playersCanvases){
        if (playersCount != playersCanvases.length){
            playersCount = playersCanvases.length;
            for (let i=0; i<playersCanvases.length; i++){
            
                let player = playersCanvases[i];
                player.onclick = (e)=>{
                    if (selectedPlayer == player.id){
                        selectedPlayer = null;
                        player.style = 'border: 1px solid silver;';
                    }else{
                        for (let j=0; j<playersCanvases.length; j++){
                            if (player != playersCanvases[j]){
                                playersCanvases[j].style = 'border: 1px solid silver;';
                            }
                        }
                        selectedPlayer = player.id;
                        player.style = 'border: 1px solid red;';
                    }
                }
            }
        }
    }
}, 1000)


function invertHexColor(hex) {
  hex = hex.replace('#', '');

  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r = 255 - r;
  g = 255 - g;
  b = 255 - b;

  const toHex = (value) =>
    value.toString(16).padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function create_players_canvas(data){
    let player_canvas = document.createElement('div');
    player_canvas.setAttribute('class', 'player-canvas');
    player_canvas.setAttribute('id', data.user);
    players_canvas.push(player_canvas);
    players_container.appendChild(player_canvas);

    let player_cursor = document.createElement('img');
    player_cursor.src = mouseLink;
    player_cursor.setAttribute('class', 'player-mouse');
    player_canvas.appendChild(player_cursor);
    players_cursor.push(player_cursor);
}

function getMousePosition(canvas, evt) {
    
    let rect = canvas.getBoundingClientRect();
    
    if (evt.clientX !== undefined && evt.clientY !== undefined) {
        mousePosition = [evt.clientX - rect.left, evt.clientY - rect.top]
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };   
    } 
}

function setLineWidth(lineChangeInput, evt, lineWidth){
    value = Number(lineChangeInput.value);
    if (value < 2){ value = 2 };
    if (value > 100){ value = 100 };
    lineWidth = Number(value);
}

/* BUTTONS */
$("#btn1").on("click", function() {
    ctx.globalAlpha = "0.2";
});

$("#btn2").on("click", function() {
    ctx.globalAlpha = "1";
});

$("#change-color").on("click", function() {
    ctx.strokeStyle = "#009933";
});

$("#canvas").on("mousedown", function(e) {
    isDrawing = true;
    let pos = getMousePosition(canvas, e);
    move(pos.x, pos.y);

});

$("#canvas").on("mousemove", function(e) {
    if(isDrawing) {
        let pos = getMousePosition(canvas, e);
        stroke(pos.x, pos.y, lineWidth);   
    }
});

$("#body").on("mousemove", function(e) {
    getMousePosition(canvas, e);
});

$("#canvas").on("mouseup", function() {
    isDrawing = false;
});

$("#lineWidth").on("change", function(e) {
    setLineWidth(lineWidthInput, e, lineWidth);
    // console.log(lineWidthInput.value)
})

function stroke(mouseX, mouseY, lineWidth) {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineJoin = ctx.lineCap = "round";
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(previousMouseX, previousMouseY);
        ctx.lineTo(mouseX, mouseY);
        ctx.closePath();
        ctx.stroke();
        move(mouseX, mouseY);
}

function move(mouseX, mouseY) {
        previousMouseX = mouseX;
        previousMouseY = mouseY;
}


// Она нужна, чтобы запоминать, сколько дебаффов мы уже применили.
let appliedDebafsCount = 0;

function check_debafs(data) {
    const allDebafs = data.game_datas[0].data.debafs || [];
    const myDebafs = allDebafs.filter(d => d.user_id == userId);
    if (myDebafs.length > appliedDebafsCount) {
        for (let i = appliedDebafsCount; i < myDebafs.length; i++) {
            const action = String(myDebafs[i].action);
            activateDebafEffect(action);
        }
        appliedDebafsCount = myDebafs.length;
    }
}


function updateGameData(){
    // console.log(mousePosition);
    // console.log(gameId, userId);

    response = fetch('/api/v1/games', {
        method: 'POST',
        body: JSON.stringify({
            'game_id': gameId,
            'user_id': userId, 
            'data':{
                'mousePosition': mousePosition,
            }
        }),
        headers: {'Content-Type': 'application/json'} 
    }).then(response =>{
        return response.json();
    }).then(data => {
        // console.log(data);

        if (players_canvas.length < data.game_datas.length){
            let index = data.game_datas.length - 1
            create_players_canvas(data.game_datas[index]);
        }

        for (let i=0; i<players_cursor.length; i++){
            let offsetX = data.game_datas[i].data.mousePosition[0] / 3.125;
            let offsetY = data.game_datas[i].data.mousePosition[1] / 3.125;
            if (offsetX > 160){ offsetX = 160; }
            if (offsetY > 160){ offsetY = 160; }
            if (offsetX < 0){ offsetX = 0; }
            if (offsetY < 0){ offsetY = 0; }
            players_cursor[i].style = `margin-left: ${offsetX}px;
            margin-top: ${offsetY}px;`;
        }

    })

}

function loadDebafs() {
    const select = document.getElementById('debaf-select');
    
    fetch('/api/v1/debafs', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'} 
    })
    .then(response => response.json())
    .then(data => {
        data.forEach(debaf => {
            const option = document.createElement('option');
            option.value = debaf.action;
            option.title = debaf.description;
            option.textContent = debaf.title;
            select.appendChild(option);
        });

        // ДОБАВЛЯЕМ СОБЫТИЕ: Активация при выборе
        select.addEventListener('change', function() {
            const selectedAction = this.value;
            if (selectedAction) {
                activateDebafEffect(selectedAction);
            }
        });
    })
    .catch(error => console.error('Ошибка загрузки дебаффов:', error));
}

function activateDebafEffect(action) {
    console.log("Активация дебаффа №:", action);

    // Приводим к строке, чтобы switch работал корректно
    switch (String(action)) {
        case "1": showAds(); break;
        case "2": playScreamer(); break;
        case "3": applyGravity(); break;
        case "4": showCaptcha(); break;
        case "5": giantCursor(); break;
        case "6": giantEraser(); break;
        case "7": changeDebafPrices(); break;
        case "8": resetSettings(); break;
        case "9": invertWorld(); break;
        case "10": rotatePage(); break;
        default:
            console.warn("Получен неизвестный код дебаффа:", action);
    }
}

// ----- ДЕБАФЫ -----
function rotatePage() {
    const body = document.body;
    body.style.overflowX = "hidden"; 
    body.style.transition = "transform 50s linear";
    body.style.transform = "rotate(36000deg)";
    setTimeout(() => {
        body.style.transition = "none";
        body.style.transform = "rotate(0deg)";
        body.style.overflowX = "auto";
    }, 5000);
}

function invertWorld() {
    // Просто переворачиваем вверх ногами без возврата
    document.body.style.transition = "transform 2s ease-in-out";
    document.body.style.transform = "rotate(180deg)";
}
// ----- ДЕБАФЫ -----

// Запуск при загрузке страницы
loadDebafs();

setInterval(updateGameData, 100);

