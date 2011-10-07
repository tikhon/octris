var ws;

function start() {
    ws = new WebSocket('ws://localhost:8888/');
    ws.onmessage = function(evt) {
        draw(JSON.parse(evt.data));
    };
}

function keyPress(key) {
    ws.send(key);
}

function draw(blocks) {
    var canvas = document.getElementById("canvas"),
        ctx = canvas.getContext("2d"),
        width = canvas.width,
        height = canvas.height,
        padding = 80,
        gameWidth = blocks[0].length,
        gameHeight = blocks.length,
        squareSize = Math.min((width - padding*2)/gameWidth, (height - padding*2)/gameHeight),
        gameTop = height - padding - squareSize * gameHeight,
        gameLeft = (width - squareSize * gameWidth) / 2;

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