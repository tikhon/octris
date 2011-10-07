var websock = require('websock');

websock.listen(8888, function(socket) {
    socket.send(JSON.stringify([['white', null, null, null],
                                [null, 'blue', null, null],
                                [null, null, 'white', null],
                                [null, null, null, 'white'],
                                [null, null, null, 'white'],
                                [null, null, null, 'green'],
                                [null, null, null, 'white'],
                                [null, null, null, 'white'],
                                [null, 'red', null, 'white']]));
});
