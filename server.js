var websock = require('websock');

var w = 20,
    h = 20;

var playerColors = ['red', 'blue'];
var game = newGame();
var playerSockets = [null, null];
var sockets = [];

websock.listen(8888, function(socket) {
    var player = null;
    if (playerSockets[0] == null || playerSockets[1] == null) {
        player = playerSockets[0] == null ? 0 : 1;
        playerSockets[player] = socket;
        socket.on('message', function(message) {
            userInput(player, JSON.parse(message));
        });
    }
    socket.on('close', function() {
        if (player != null) {
            playerSockets[player] = null;
        }
        var index = sockets.indexOf(socket);
        sockets = sockets.slice(0, index).concat(sockets.slice(index+1));
        drawGame();
    });
    sockets.push(socket);
    drawGame();
});

advanceGame();

function newGame() {
    var frozen = new Array();
    for (var y = 0; y < h; y++) {
        frozen[y] = new Array();
        for (var x = 0; x < w; x++) {
            frozen[y][x] = null;
        }
    }
    
    return {'frozen': frozen,
            'falling': [newPiece(0), newPiece(1)],
            'over': false};
}


function pieceLocs(piece) {
    var locs = new Array();
    var center = piece['center'];
    for (var j in piece['blocks']) {
        var block = piece['blocks'][j];
        locs.push([block[0] + center[0], block[1] + center[1]])
    }
    return locs;
}

function gameColors() {
    var colors = new Array();

    for (var y in game['frozen']) {
        colors[y] = game['frozen'][y].slice(0);
    }
    for (var i in game['falling']) {
        var locs = pieceLocs(game['falling'][i]);
        for (var j in locs) {
            var x = locs[j][0];
            var y = locs[j][1];
            if (y >= 0 && y < h) {
                colors[y][x] = game['falling'][i]['color'];
            }
        }
    }

    return colors;
}

function newPiece(player) {
    var center = [Math.floor(w*(player+1)/3), 0];
    return {'color': playerColors[player],
            'center': center,
            'blocks': [[-1, 0], [0, 0], [1, 0], [1, -1]]}
}

function tryMove(piece, dx, dy) {
    var result = 'success';

    var aboveTop = false;
    var locs = pieceLocs(piece);
    for (var j in locs) {
        // TODO: check for collisions with other pieces
        var x = locs[j][0] + dx;
        var y = locs[j][1] + dy;
        if (y <= 0 && dy > 0) {
            aboveTop = true;
        }
        if (x < 0 || x >= w) {
            result = 'hit-wall';
        } else if (y >= h || (y >= 0 && game['frozen'][y][x] != null)) {
            result = 'hit-ground-or-frozen-block';
        }
    }
    
    if (result == 'hit-ground-or-frozen-block' && aboveTop) {
        return 'lose';
    } else if (result == 'success') {
        piece['center'][0] += dx;
        piece['center'][1] += dy;
    }
    return result;
}

function fallOrFreeze() {
    for (var i in game['falling']) {
        var falling = game['falling'][i];
        var result = tryMove(falling, 0, +1);
        if (result == 'lose') {
            game['over'] = true;
        } else if (result == 'hit-ground-or-frozen-block') {
            // TODO: only freeze if hit frozen block, not other piece
            var locs = pieceLocs(falling);
            for (var j in locs) {
                var x = locs[j][0];
                var y = locs[j][1];
                game['frozen'][y][x] = falling['color'];
            }
            
            // TODO: possibly destroy row
            game['falling'][i] = newPiece(Number(i));
        }
    }
}

function waitingOnPlayers() {
    return playerSockets.indexOf(null) != -1;
}

function gamePaused() {
    return game['over'] || waitingOnPlayers();
}

function advanceGame() {
    if (!gamePaused()) {
        fallOrFreeze();
    }
    
    drawGame();
    setTimeout(advanceGame, 300);
}

function drawGame() {
    var colors = gameColors();
    for (var i in sockets) {
        var socket = sockets[i];
        var player = playerSockets.indexOf(socket);
        playerColor = player != -1 ? playerColors[player] : null;
        
        socket.send(JSON.stringify({'colors': colors,
                                    'player': playerColor,
                                    'waiting': waitingOnPlayers(),
                                    'over': game['over']}));
    }
}

function userInput(player, input) {
    if (input == 'new-game') {
        game = newGame();
    } else if (!gamePaused()) {
        var cr = String.fromCharCode(input);
        switch (cr) {
        case 'j':
            tryMove(game['falling'][player], -1, 0);
            break;
        case 'l':
            tryMove(game['falling'][player], +1, 0);
            break;
        case ' ':
            tryMove(game['falling'][player], 0, +1);
            break;
        }
    }

    drawGame();
}

