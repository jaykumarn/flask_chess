var board,
  game = new Chess(),
  statusEl = $('#status'),
  fenEl = $('#fen'),
  pgnEl = $('#pgn');


var removeHighlights = function() {
  $('#board .square-55d63').removeClass('highlight-legal');
  $('#board .square-55d63').removeClass('highlight-selected');
  $('#board .square-55d63').removeClass('highlight-capture');
};

var removeAllMovesHighlight = function() {
  $('#board .square-55d63').removeClass('highlight-all-moves');
};

var highlightAllPossibleMoves = function() {
  removeAllMovesHighlight();

  if (game.game_over()) return;

  var moves = game.moves({ verbose: true });

  for (var i = 0; i < moves.length; i++) {
    $('#board .square-' + moves[i].to).addClass('highlight-all-moves');
  }
};

var highlightLegalMoves = function(square) {
  var moves = game.moves({
    square: square,
    verbose: true
  });

  if (moves === null || moves.length === 0) return false;

  // Remove blue highlights when showing piece-specific moves
  removeAllMovesHighlight();

  // Highlight the selected square
  $('#board .square-' + square).addClass('highlight-selected');

  // Highlight all legal move targets
  for (var i = 0; i < moves.length; i++) {
    var targetSquare = moves[i].to;
    if (moves[i].captured) {
      $('#board .square-' + targetSquare).addClass('highlight-capture');
    } else {
      $('#board .square-' + targetSquare).addClass('highlight-legal');
    }
  }

  return true;
};

// do not pick up pieces if the game is over
// only pick up pieces for the side to move
var onDragStart = function(source, piece, position, orientation) {
  if (game.game_over() === true ||
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }

  removeHighlights();
  highlightLegalMoves(source);
};

var onDrop = function(source, target) {
  removeHighlights();
  removeAllMovesHighlight();

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return 'snapback';

  updateStatus();
  highlightAllPossibleMoves();
};

// update the board position after the piece snap
// for castling, en passant, pawn promotion
var onSnapEnd = function() {
    board.position(game.fen());
};

var onMouseoverSquare = function(square, piece) {
  if (game.game_over()) return;

  // If no piece on square, do nothing
  if (piece === false) return;

  var isWhitePiece = piece.search(/^w/) !== -1;
  var isBlackPiece = piece.search(/^b/) !== -1;

  // Only highlight if it's current player's piece
  if ((game.turn() === 'w' && isBlackPiece) ||
      (game.turn() === 'b' && isWhitePiece)) {
    return;
  }

  highlightLegalMoves(square);
};

var onMouseoutSquare = function(square, piece) {
  removeHighlights();
  highlightAllPossibleMoves();
};

var updateStatus = function() {
  var status = '';

  var moveColor = 'White';
  if (game.turn() === 'b') {
    moveColor = 'Black';
  }

  // checkmate?
  if (game.in_checkmate() === true) {
    status = 'Game over, ' + moveColor + ' is in checkmate.';
  }

  // draw?
  else if (game.in_draw() === true) {
    status = 'Game over, drawn position';
  }

  // game still on
  else {
    status = moveColor + ' to move';

    // check?
    if (game.in_check() === true) {
      status += ', ' + moveColor + ' is in check';
    }
  }

  setStatus(status);
  getLastCapture();
  createTable();
  updateScroll();

  statusEl.html(status);
  fenEl.html(game.fen());
  pgnEl.html(game.pgn());
};

var cfg = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  onMouseoverSquare: onMouseoverSquare,
  onMouseoutSquare: onMouseoutSquare
};

// did this based on a stackoverflow answer
// http://stackoverflow.com/questions/29493624/cant-display-board-whereas-the-id-is-same-when-i-use-chessboard-js
setTimeout(function() {
    board = ChessBoard('board', cfg);
    highlightAllPossibleMoves();
}, 0);


var setPGN = function() {
  var table = document.getElementById("pgn");
  var pgn = game.pgn().split(" ");
  var move = pgn[pgn.length - 1];
}

var createTable = function() {

    var pgn = game.pgn().split(" ");
    var data = [];

    for (i = 0; i < pgn.length; i += 3) {
        var index = i / 3;
        data[index] = {};
        for (j = 0; j < 3; j++) {
            var label = "";
            if (j === 0) {
                label = "moveNumber";
            } else if (j === 1) {
                label = "whiteMove";
            } else if (j === 2) {
                label = "blackMove";
            }
            if (pgn.length > i + j) {
                data[index][label] = pgn[i + j];
            } else {
                data[index][label] = "";
            }
        }
    }

    $('#pgn tr').not(':first').remove();
    var html = '';
    for (var i = 0; i < data.length; i++) {
        html += '<tr><td>' + data[i].moveNumber + '</td><td>'
        + data[i].whiteMove + '</td><td>'
        + data[i].blackMove + '</td></tr>';
    }

    $('#pgn tr').first().after(html);
}

var updateScroll = function() {
    $('#moveTable').scrollTop($('#moveTable')[0].scrollHeight);
}

var setStatus = function(status) {
  document.getElementById("status").innerHTML = status;
}

var takeBack = function() {
    game.undo();
    board.position(game.fen());
    updateStatus();
    highlightAllPossibleMoves();
}

var newGame = function() {
    game.reset();
    board.start();
    updateStatus();
    highlightAllPossibleMoves();
}

var getCapturedPieces = function() {
    var history = game.history({ verbose: true });
    for (var i = 0; i < history.length; i++) {
        if ("captured" in history[i]) {
            console.log(history[i]["captured"]);
        }
    }
}

var getLastCapture = function() {
    var history = game.history({ verbose: true });
    var index = history.length - 1;

    if (history[index] != undefined && "captured" in history[index]) {
        console.log(history[index]["captured"]);
    }
}
