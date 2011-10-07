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

function maybeAddFalling(game) {
    if (game['falling'].length == 0) {
        var center = [Math.floor(w/2), -1];
        game['falling'][0] = {'color': 'blue',
                              'center': center,
                              'blocks': [[-1, 0], [0, 0], [1, 0], [1, -1]]};
    }
}

function fallOrFreeze(game) {
    var newFalling = new Array();

    for (var i in game['falling']) {
        var falling = game['falling'][i];
        var locs = pieceLocs(falling);
        var canFall = true;

        for (var j in locs) {
            var x = locs[j][0];
            var y = locs[j][1] + 1;
            if (y >= h || (y >= 0 && game['frozen'][y][x] != null)) {
                canFall = false;
                break;
            }
        }
        if (canFall) {
            falling['center'][1]++;
            newFalling.push(falling);
        } else {
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
    maybeAddFalling(game);
    socket.send(JSON.stringify(gameColors(game)));
    
    setTimeout(advanceGame, 100, socket, game);
}

websock.listen(8888, function(socket) {
    advanceGame(socket, newGame());
});