var websock = require('websock'); // npm install websock

var w = 10,
    h = 20;

function sendState(socket) {
    var blocks = new Array();
    for (y = 0; y < h; y++) {
        blocks[y] = new Array();
        for (x = 0; x < w; x++) {
            blocks[y][x] = [null, 'white', 'red', 'blue', 'green', 'yellow'][Math.floor(Math.random() * 6)];
        }
    }
    
    socket.send(JSON.stringify(blocks));
    
    setTimeout(sendState, 500, socket);
}

websock.listen(8888, function(socket) {
    sendState(socket);
});
