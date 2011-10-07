var websock = require('websock'); // npm install websock

var w = 10,
    h = 20;

function newGame() {
    var frozen = new Array();
    for (var y = 0; y < h; y++) {
        frozen[y] = new Array();
        for (var x = 0; x < w; x++) {
            frozen[y][x] = null;
        }
    }
    
    return {'frozen': frozen, 'falling': new Array()};
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

function gameColors(game) {
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

function maybeAddPiece(game) {
    if (game['falling'].length == 0) {
        var center = [Math.floor(w/2), 0];
        game['falling'][0] = {'color': 'blue',
                              'center': center,
                              'blocks': [[-1, 0], [0, 0], [1, 0], [1, -1]]};
    }
}

function tryMove(game, piece, dx, dy) {
    var success = true;

    var locs = pieceLocs(piece);
    for (var j in locs) {
        var x = locs[j][0] + dx;
        var y = locs[j][1] + dy;
        if (x < 0 || x >= w ||
            y >= h || (y >= 0 && game['frozen'][y][x] != null)) {
            return false;
        }
    }

    piece['center'][0] += dx;
    piece['center'][1] += dy;
    return true;
}

function fallOrFreeze(game) {
    var newFalling = new Array();

    for (var i in game['falling']) {
        var falling = game['falling'][i];
        if (tryMove(game, falling, 0, +1)) {
            newFalling.push(falling);
        } else {
            var locs = pieceLocs(falling);
            for (var j in locs) {
                var x = locs[j][0];
                var y = locs[j][1];
                if (y < 0) {
                    // TODO: lose
                }
                game['frozen'][y][x] = falling['color'];
            }
        }
    }

    game['falling'] = newFalling;
}

function advanceGame(socket, game) {
    fallOrFreeze(game);
    maybeAddPiece(game);
    socket.send(JSON.stringify(gameColors(game)));
    
    setTimeout(advanceGame, 250, socket, game);
}

function userInput(socket, game, input) {
    var cr = String.fromCharCode(input);
    switch (cr) {
    case 'j':
        tryMove(game, game['falling'][0], -1, 0);
        break;
    case 'l':
        tryMove(game, game['falling'][0], +1, 0);
        break;
    }

    socket.send(JSON.stringify(gameColors(game)));
}

websock.listen(8888, function(socket) {
    var game = newGame();
    advanceGame(socket, game);
    socket.on('message', function(message) {
        userInput(socket, game, JSON.parse(message));
    });
});