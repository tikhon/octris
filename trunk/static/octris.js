var ws;

function start() {
    var host = window.location.hostname || 'localhost';
    ws = new WebSocket('ws://localhost:8888/');
    ws.onmessage = function(evt) {
        draw(JSON.parse(evt.data));
    };
}

function keyPress(key) {
    ws.send(JSON.stringify(key));
}

function newGame() {
    ws.send(JSON.stringify('new-game'));
}

function draw(gameState) {
    var blocks = gameState['colors'],
        player = gameState['player'],
        canvas = document.getElementById('canvas'),
        ctx = canvas.getContext('2d'),
        width = canvas.width,
        height = canvas.height,
        padding = 10,
        gameWidth = blocks[0].length,
        gameHeight = blocks.length,
        squareSize = Math.min((width - padding*2)/gameWidth, (height - padding*2)/gameHeight),
        gameTop = height - padding - squareSize * gameHeight,
        gameLeft = (width - squareSize * gameWidth) / 2;

    if (player != null) {
        document.getElementById('msg').innerHTML = 'You are <font color="'+player+'">'+player+'</font>.';
    } else {
        document.getElementById('msg').innerHTML = 'You are a lowly observer.';
    }
    if (gameState['over']) {
        document.getElementById('msg').innerHTML += '<br/><b>Game over. :(</b>';
    }
    if (gameState['waiting']) {
        document.getElementById('msg').innerHTML += '<br/>Waiting on another player.';
    }
    document.getElementById('newgame').hidden = !(gameState['over'] && player != null);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'black';
    ctx.fillRect(gameLeft, gameTop, squareSize*gameWidth, squareSize*gameHeight);

    for (y = 0; y < gameHeight; y++) {
        for (x = 0; x < gameWidth; x++) {
            if ((color = blocks[y][x]) != null) {
                ctx.fillStyle = blocks[y][x];
                ctx.fillRect(gameLeft + squareSize*x, gameTop + squareSize*y,
                             squareSize, squareSize);
                
                ctx.strokeStyle = 'gray';
                ctx.strokeRect(gameLeft + squareSize*x, gameTop + squareSize*y,
                               squareSize, squareSize);
            }
        }
    }
}