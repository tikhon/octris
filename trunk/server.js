var websock = require('websock');

var w = 20,
    h = 20;

var pieceShapes = [[[-1, 0], [0, 0], [1, 0], [1, -1]],  //   o
                                                        // ooo

                   [[-1, 0], [0, 0], [1, 0], [2, 0]],   // oooo
                                                        // 

                   [[-1, -1], [-1, 0], [0, 0], [1, 0]], // o
                                                        // ooo

                   [[0, 0], [1, 0], [0, -1], [1, -1]],  // oo
                                                        // oo

                   [[-1, 0], [0, 0], [1, 0], [0, -1]],  //  o
                                                        // ooo

                   [[-1, 0], [0, 0], [0, -1], [-1, 1]], //  oo
                                                        // oo

                   [[-1, -1], [0, -1], [0, 0], [1, 0]]  // oo
                                                        //  oo
    ];

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

function newRow() {
    var row = new Array();
    for (var x = 0; x < w; x++) {
        row[x] = null;
    }
    return row;
}

function newGame() {
    var frozen = new Array();
    for (var y = 0; y < h; y++) {
        frozen[y] = newRow();
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
            'blocks': pieceShapes[Math.floor(Math.random() * pieceShapes.length)]}
}

var SUCCESS = 0,
    HIT_WALL_OR_OTHER_PIECE = 1,
    HIT_GROUND_OR_FROZEN_BLOCK = 2,
    LOSE = 3;

function modifyPiece(piece, dx, dy, dr) {
    piece['center'][0] += dx;
    piece['center'][1] += dy;

    while (dr < 0) dr += 4;
    while (dr % 4 > 0) {
        for (var i in piece['blocks']) {
            var block = piece['blocks'][i];
            piece['blocks'][i] = [-block[1], block[0]];
        }
        dr--;
    }
}

function tryMove(piece, dx, dy, dr) {
    var result = SUCCESS;

    var aboveTop = false;
    modifyPiece(piece, dx, dy, dr);
    var locs = pieceLocs(piece);

    // TODO: this and a lot of other things should be done functionally
    var otherPieceLocs = new Array();
    for (var i in game['falling']) {
        var otherPiece = game['falling'][i];
        if (otherPiece == piece) continue;
        otherPieceLocs = otherPieceLocs.concat(pieceLocs(otherPiece));
    }
    

    for (var i in locs) {
        var x = locs[i][0];
        var y = locs[i][1];
        if (y <= 0 && dy > 0) {
            aboveTop = true;
        }

        for (var j in otherPieceLocs) {
            if (x == otherPieceLocs[j][0] && y == otherPieceLocs[j][1]) {
                result = Math.max(result, HIT_WALL_OR_OTHER_PIECE);
            }
        }

        if (x < 0 || x >= w) {
            result = Math.max(result, HIT_WALL_OR_OTHER_PIECE);
        } else if (y >= h || (y >= 0 && game['frozen'][y][x] != null)) {
            result = Math.max(result, HIT_GROUND_OR_FROZEN_BLOCK);
        }
    }
    
    if (result != SUCCESS) {
        modifyPiece(piece, -dx, -dy, -dr);
        if (result == HIT_GROUND_OR_FROZEN_BLOCK && aboveTop) {
            result = LOSE;
        }
    }
    return result;
}

function fallOrFreeze() {
    for (var i in game['falling']) {
        var falling = game['falling'][i];
        var result = tryMove(falling, 0, +1, 0);
        if (result == LOSE) {
            game['over'] = true;
        } else if (result == HIT_GROUND_OR_FROZEN_BLOCK) {
            var locs = pieceLocs(falling);
            for (var j in locs) {
                var x = locs[j][0];
                var y = locs[j][1];
                game['frozen'][y][x] = falling['color'];
            }
            
            destroyRows();
            game['falling'][i] = newPiece(Number(i));
        }
    }
}

function destroyRows() {
    for (var y = h - 1; y >= 0; y--) {
        var destroy = true;
        for (var x = 0; x < w; x++) {
            if (game['frozen'][y][x] == null) destroy = false;
        }
        
        if (destroy) {
            game['frozen'].splice(y, 1);
            game['frozen'].unshift(newRow());
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
    setTimeout(advanceGame, 400);
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
            tryMove(game['falling'][player], -1, 0, 0);
            break;
        case 'l':
            tryMove(game['falling'][player], +1, 0, 0);
            break;
        case 'i':
            tryMove(game['falling'][player], 0, 0, +1);
            break;
        case 'k':
            tryMove(game['falling'][player], 0, 0, -1);
            break;
        case ' ':
            tryMove(game['falling'][player], 0, +1);
            break;
        }
    }

    drawGame();
}
