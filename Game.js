const EMPTY_SQUARE = '-';
const BLACK_ROOK = 'r';
const BLACK_BISHOP = 'b';
const BLACK_KNIGHT = 'n';
const BLACK_QUEEN = 'q';
const BLACK_KING = 'k';
const BLACK_PAWN = 'p';
const WHITE_ROOK = 'R';
const WHITE_BISHOP = 'B';
const WHITE_KNIGHT = 'N';
const WHITE_QUEEN = 'Q';
const WHITE_KING = 'K';
const WHITE_PAWN = 'P';
const WHITE = 'w';
const BLACK = 'b';
const WHITE_QUEENSIDE_ROOK_STARTING_POSITION = 81;
const WHITE_KINGSIDE_ROOK_STARTING_POSITION = 88;
const BLACK_QUEENSIDE_ROOK_STARTING_POSITION = 11;
const BLACK_KINGSIDE_ROOK_STARTING_POSITION = 18;
const BISHOP_MOVE_DIRECTIONS = [9, 11, -9, -11];
const KNIGHT_MOVE_DIRECTIONS = [-12, -21, -19, -8, 12, 21, 19, 8];
const KING_QUEEN_MOVE_DIRECTIONS = [-1, -11, -10, -9, 1, 11, 10, 9];
const ROOK_MOVE_DIRECTIONS = [-1, 1, -10, 10];
const WHITE_PAWN_STARTING_MOVE_DIRECTIONS = [-10, -20];
const BLACK_PAWN_STARTING_MOVE_DIRECTIONS = [10, 20];
const WHITE_PAWN_MOVED_MOVE_DIRECTIONS = [-10];
const BLACK_PAWN_MOVED_MOVE_DIRECTIONS = [10];
const whitePieces = new Set([WHITE_ROOK, WHITE_BISHOP, WHITE_KNIGHT, WHITE_QUEEN, WHITE_KING, WHITE_PAWN]);
const blackPieces = new Set([BLACK_ROOK, BLACK_BISHOP, BLACK_KNIGHT, BLACK_QUEEN, BLACK_KING, BLACK_PAWN]);
const isWhite = piece => whitePieces.has(piece);
const isBlack = piece => blackPieces.has(piece);
const BIT_ON = '1';
const BIT_OFF = '0';
const CURRENT_TURN_BLACK_BIT = 100;
const WHITE_QUEENSIDE_ROOK_MOVED_BIT = 101;
const WHITE_KINGSIDE_ROOK_MOVED_BIT = 102;
const BLACK_QUEENSIDE_ROOK_MOVED_BIT = 103;
const BLACK_KINGSIDE_ROOK_MOVED_BIT = 104;
const WHITE_KING_MOVED_BIT = 105;
const BLACK_KING_MOVED_BIT = 106;
const LAST_MOVE_FROM_TENS = 107;
const LAST_MOVE_FROM_ONES = 108;
const LAST_MOVE_TO_TENS = 109;
const LAST_MOVE_TO_ONES = 110;
const positionString = (from, to) => `${from}-${to}`;
const movedToPositionFromString = move => Number(move.split(EMPTY_SQUARE)[1]);
const movedFromPositionFromString = move => Number(move.split(EMPTY_SQUARE)[0]);
const canCastleKingSide = (position, board, color) => {
  const emptySpaceBetween = board[position + 1] === EMPTY_SQUARE && board[position + 2] === EMPTY_SQUARE;
  if (emptySpaceBetween) {
    if (color === WHITE) {
      const whiteKingHasMoved = board[WHITE_KING_MOVED_BIT] === BIT_ON;
      const whiteKingSideRookHasMoved = board[WHITE_KINGSIDE_ROOK_MOVED_BIT] === BIT_ON;
      return !(whiteKingHasMoved || whiteKingSideRookHasMoved);
    } else {
      const blackKingHasMoved = board[BLACK_KING_MOVED_BIT] === BIT_ON;
      const blackKingSideRookHasMoved = board[BLACK_KINGSIDE_ROOK_MOVED_BIT] === BIT_ON;
      return !(blackKingHasMoved || blackKingSideRookHasMoved);
    }
  }
  return false;
};
const canCastleQueenSide = (position, board, color) => {
  const emptySpaceBetween = board[position - 1] === EMPTY_SQUARE && board[position - 2] === EMPTY_SQUARE && board[position - 3] === EMPTY_SQUARE;
  if (emptySpaceBetween) {
    if (color === WHITE) {
      const whiteKingHasMoved = board[WHITE_KING_MOVED_BIT] === BIT_ON;
      const whiteQueenSideRookHasMoved = board[WHITE_QUEENSIDE_ROOK_MOVED_BIT] === BIT_ON;
      return !(whiteKingHasMoved || whiteQueenSideRookHasMoved);
    } else {
      const blackKingHasMoved = board[BLACK_KING_MOVED_BIT] === BIT_ON;
      const blackQueenSideRookHasMoved = board[BLACK_QUEENSIDE_ROOK_MOVED_BIT] === BIT_ON;
      return !(blackKingHasMoved || blackQueenSideRookHasMoved);
    }
  }
  return false;
};
const getNextBoardPosition = (board, pos, replacement) => {
  return board.substr(0, parseInt(pos)) + replacement + board.substr(parseInt(pos) + 1);
};

const testMove = (move, board, withLastMove) => {
  let from = movedFromPositionFromString(move);
  let to = movedToPositionFromString(move);
  let placePiece = getNextBoardPosition(board, to, board[from]);
  let removePiece = getNextBoardPosition(placePiece, from, EMPTY_SQUARE);
  let changedTurn = getNextBoardPosition(removePiece, CURRENT_TURN_BLACK_BIT, board[CURRENT_TURN_BLACK_BIT] === BIT_ON ? BIT_OFF : BIT_ON);
  if (withLastMove) {
    let board = changedTurn;
    const fromTens = String(from)[0];
    const fromOnes = String(from)[1];
    const toTens = String(to)[0];
    const toOnes = String(to)[1];
    board = getNextBoardPosition(board, LAST_MOVE_FROM_TENS, fromTens);
    board = getNextBoardPosition(board, LAST_MOVE_FROM_ONES, fromOnes);
    board = getNextBoardPosition(board, LAST_MOVE_TO_TENS, toTens);
    board = getNextBoardPosition(board, LAST_MOVE_TO_ONES, toOnes);
    return board;
  }
  return changedTurn;
};

class Board {
  constructor(board = '00000000000rnbqkbnr00pppppppp00--------00--------00--------00--------00PPPPPPPP00RNBQKBNR0000000000000000000000') {
    this.board = board;
    this.currentTurn = this.board[CURRENT_TURN_BLACK_BIT] === BIT_ON ? BLACK : WHITE;    
    this.legalMoves = this.findLegalMoves(this.board, this.currentTurn);
  }

  castle(from, to) {
    if (from > to) {
      this.board = getNextBoardPosition(this.board, to + 1, this.board[from - 4]);
      this.board = getNextBoardPosition(this.board, from - 4, EMPTY_SQUARE);
    } else {
      this.board = getNextBoardPosition(this.board, to - 1, this.board[from + 3]);
      this.board = getNextBoardPosition(this.board, from + 3, EMPTY_SQUARE);
    }
  }

  findLegalMoves(board = this.board, currentTurn = this.currentTurn) {
    let legalMoves = [];
    for (let i = 0; i < board.length; i++) {
      switch (board[i]) {

      case BLACK_ROOK:
        if (currentTurn === BLACK) {
          legalMoves = legalMoves.concat(this.getRookMoves(i, board, currentTurn));
        }
        break;

      case BLACK_KNIGHT:
        if (currentTurn === BLACK) {
          legalMoves = legalMoves.concat(this.getKnightMoves(i, board, currentTurn));
        }
        break;

      case BLACK_BISHOP:
        if (currentTurn === BLACK) {
          legalMoves = legalMoves.concat(this.getBishopMoves(i, board, currentTurn));
        }
        break;

      case BLACK_QUEEN:
        if (currentTurn === BLACK) {
          legalMoves = legalMoves.concat(this.getQueenMoves(i, board, currentTurn));
        }
        break;

      case BLACK_KING:
        if (currentTurn === BLACK) {
          legalMoves = legalMoves.concat(this.getKingMoves(i, board, currentTurn));
        }
        break;

      case BLACK_PAWN:
        if (currentTurn === BLACK) {
          legalMoves = legalMoves.concat(this.getPawnMoves(i, board, currentTurn));
        }
        break;

      case WHITE_ROOK:
        if (currentTurn === WHITE) {
          legalMoves = legalMoves.concat(this.getRookMoves(i, board, currentTurn));
        }
        break;
      
      case WHITE_KNIGHT:
        if (currentTurn === WHITE) {
          legalMoves = legalMoves.concat(this.getKnightMoves(i, board, currentTurn));
        }
        break;

      case WHITE_BISHOP:
        if (currentTurn === WHITE) {
          legalMoves = legalMoves.concat(this.getBishopMoves(i, board, currentTurn));
        }
        break;
      
      case WHITE_QUEEN:
        if (currentTurn === WHITE) {
          legalMoves = legalMoves.concat(this.getQueenMoves(i, board, currentTurn));
        }
        break;

      case WHITE_KING:
        if (currentTurn === WHITE) {
          legalMoves = legalMoves.concat(this.getKingMoves(i, board, currentTurn));
        }
        break;

      case WHITE_PAWN:
        if (currentTurn === WHITE) {
          legalMoves = legalMoves.concat(this.getPawnMoves(i, board, currentTurn));
        }
        break;

      default:
        break;
      }
    }

    const legalMovesWithoutBeingInCheck = legalMoves.filter( el => {
      return !this.isCheck(currentTurn, testMove(el, board));
    });

    return legalMovesWithoutBeingInCheck;
  }

  getBishopMoves(position, board, color) {
    return this.getSlidingPiecesMovements(position, board, color, BISHOP_MOVE_DIRECTIONS); 
  }

  getColor(position, board = this.board) {
    const square = board[position];
    return isWhite(square) ? WHITE : isBlack(square) ? BLACK : false;
  }

  getKnightMoves(position, board, color) {
    return this.getSteppingPiecesMovements(position, board, color, KNIGHT_MOVE_DIRECTIONS); 
  }

  getKingMoves(position, board, color, checkCastle = true) {
    let legalMoves = [];
    if (checkCastle && canCastleKingSide(position, board, color)) {
      if ((this.squareHasAttackers(position, board, color) === false) && this.squareHasAttackers(position + 1, board, color) === false) {
        legalMoves.push(positionString(position, position + 2));
      }
    }
    
    if (checkCastle && canCastleQueenSide(position, board, color)) {
      if ((this.squareHasAttackers(position, board, color) === false) && this.squareHasAttackers(position - 1, board, color) === false) {
        legalMoves.push(positionString(position, position - 2));
      }
    }
    
    return legalMoves.concat(this.getSteppingPiecesMovements(position, board, color, KING_QUEEN_MOVE_DIRECTIONS));
  }

  getPawnMovements(position, board, color, increments) {
    let legalMoves = [];
    for (let i = 0; i < increments.length; i++) {
      let pointer = position + increments[i];
      if (board[pointer] === EMPTY_SQUARE) {
        legalMoves.push(positionString(position, pointer));
      } else {
        break;
      }
    }

    let leftCapture = this.getColor(position + increments[0] - 1, board);
    let rightCapture = this.getColor(position + increments[0] + 1, board);
    
    if (leftCapture && leftCapture !== color) {
      legalMoves.push(positionString(position, position + increments[0] - 1));
    }
    if (rightCapture && rightCapture !== color) {
      legalMoves.push(positionString(position, position + increments[0] + 1));
    }
    return legalMoves;
  }

  getPawnMoves(position, board, color) {
    if (color === WHITE && position > 70 && position < 79) {
      return this.getPawnMovements(position, board, color, WHITE_PAWN_STARTING_MOVE_DIRECTIONS);
    } else if (color === BLACK && position > 20 && position < 29) {
      return this.getPawnMovements(position, board, color, BLACK_PAWN_STARTING_MOVE_DIRECTIONS);
    } else if (color === WHITE){
      return this.getPawnMovements(position, board, color, WHITE_PAWN_MOVED_MOVE_DIRECTIONS);
    } else {
      return this.getPawnMovements(position, board, color, BLACK_PAWN_MOVED_MOVE_DIRECTIONS);
    }
  }

  getQueenMoves(position, board, color) {
    return this.getSlidingPiecesMovements(position, board, color, KING_QUEEN_MOVE_DIRECTIONS);
  }

  getRookMoves(position, board, color) {
    return this.getSlidingPiecesMovements(position, board, color, ROOK_MOVE_DIRECTIONS);
  }

  getSlidingPiecesMovements(position, board, color, increments) {
    let legalMoves = [];
    for (let i = 0; i < increments.length; i++) {
      let pointer = position;
      while (board[pointer]) {
        pointer += increments[i];
        if (board[pointer] === EMPTY_SQUARE) {
          legalMoves.push(positionString(position, pointer));
        } else if (this.getColor(pointer, board) && this.getColor(pointer, board) !== color) {
          legalMoves.push(positionString(position, pointer));
          break;
        } else {
          break;
        }
      }
    }
    return legalMoves;
  }

  getSteppingPiecesMovements(position, board, color, increments) {
    let legalMoves = [];
    for (let i = 0; i < increments.length; i++) {
      let pointer = position + increments[i];
      if (!board[pointer]) {
        continue;
      } else if (board[pointer] === EMPTY_SQUARE) {
        legalMoves.push(positionString(position, pointer));
      } else if (this.getColor(pointer, board) && this.getColor(pointer, board) !== color) {
        legalMoves.push(positionString(position, pointer));
      }
    }
    return legalMoves;
  }

  isAttackedBy(moves, board, color, type) {
    return moves
      .map(move => movedToPositionFromString(move))
      .filter(moveToPosition => {
        return board[moveToPosition].toUpperCase() === type.toUpperCase() &&
          this.getColor(moveToPosition, board) !== color;
      });
  }

  findBishopAttackers(position, board, color) {
    const bishopMoves = this.getBishopMoves(position, board, color);
    return this.isAttackedBy(bishopMoves, board, color, 'b');
  }

  findKingAttackers(position, board, color) {
    const kingMoves = this.getKingMoves(position, board, color, false);
    return this.isAttackedBy(kingMoves, board, color, 'k');
  }

  findKnightAttackers(position, board, color) {
    const knightMoves = this.getKnightMoves(position, board, color);
    return this.isAttackedBy(knightMoves, board, color, 'n');
  }

  findPawnAttackers(position, board, color) {
    const pawnMoves = this.getPawnMoves(position, board, color);
    return this.isAttackedBy(pawnMoves, board, color, 'p');
  }

  findQueenAttackers(position, board, color) {
    const queenMoves = this.getQueenMoves(position, board, color);
    return this.isAttackedBy(queenMoves, board, color, 'q');
  }

  findRookAttackers(position, board, color) {
    const rookMoves = this.getRookMoves(position, board, color);
    return this.isAttackedBy(rookMoves, board, color, 'r');                   
  }
  
  isCheck(currentPlayer = this.currentTurn, board = this.board) {
    let kingPos = currentPlayer === WHITE ? board.indexOf(WHITE_KING) : board.indexOf(BLACK_KING);
    
    return this.squareHasAttackers(kingPos, board, currentPlayer);
  }

  squareHasAttackers(pos, board, currentPlayer) {
    let bishopAttackers = this.findBishopAttackers(pos, board, currentPlayer);
    if (bishopAttackers.length > 0) return true;
    
    let rookAttackers = this.findRookAttackers(pos, board, currentPlayer);
    if (rookAttackers.length > 0) return true;

    let knightAttackers = this.findKnightAttackers(pos, board, currentPlayer);
    if (knightAttackers.length > 0) return true;

    let queenAttackers = this.findQueenAttackers(pos, board, currentPlayer);
    if (queenAttackers.length > 0) return true;

    let kingAttackers = this.findKingAttackers(pos, board, currentPlayer);
    if (kingAttackers.length > 0) return true;

    let pawnAttackers = this.findPawnAttackers(pos, board, currentPlayer);
    if (pawnAttackers.length > 0) return true;

    return false;
  }

  isLegalMove(from, to) {
    return this.legalMoves.indexOf(positionString(from, to) !== -1);
  }

  makeMove(from, to) {
    switch (this.board[from]) {
    case WHITE_KING:
      if (this.board[WHITE_KING_MOVED_BIT] === BIT_OFF) {
        this.board = getNextBoardPosition(this.board, WHITE_KING_MOVED_BIT, BIT_ON);
      }
      if (Math.abs(from - to) === 2) {
        this.castle(from, to);
      }
      break;
    case BLACK_KING:
      if (this.board[BLACK_KING_MOVED_BIT] === BIT_OFF) {
        this.board = getNextBoardPosition(this.board, BLACK_KING_MOVED_BIT, BIT_ON);
      }
      if (Math.abs(from - to) === 2) {
        this.castle(from, to);
      }
      break;

    case WHITE_ROOK:
      if (from == WHITE_QUEENSIDE_ROOK_STARTING_POSITION && this.board[WHITE_QUEENSIDE_ROOK_MOVED_BIT] === BIT_OFF) {
        this.board = getNextBoardPosition(this.board, WHITE_QUEENSIDE_ROOK_MOVED_BIT, BIT_ON);
      } else if (from == WHITE_KINGSIDE_ROOK_STARTING_POSITION && this.board[WHITE_KINGSIDE_ROOK_MOVED_BIT] === BIT_OFF){
        this.board = getNextBoardPosition(this.board, WHITE_KINGSIDE_ROOK_MOVED_BIT, BIT_ON);
      }
      break;

    case BLACK_ROOK:

      if (from == BLACK_QUEENSIDE_ROOK_STARTING_POSITION && this.board[BLACK_QUEENSIDE_ROOK_MOVED_BIT] === BIT_OFF) {
        this.board = getNextBoardPosition(this.board, BLACK_QUEENSIDE_ROOK_MOVED_BIT, BIT_ON);
      } else if (from == BLACK_KINGSIDE_ROOK_STARTING_POSITION && this.board[BLACK_KINGSIDE_ROOK_MOVED_BIT] === BIT_OFF){
        this.board = getNextBoardPosition(this.board, BLACK_KINGSIDE_ROOK_MOVED_BIT, BIT_ON);
      }
      break;
  
    default:
      break;
    }
    this.board = getNextBoardPosition(this.board, to, this.board[from]);
    this.board = getNextBoardPosition(this.board, from, EMPTY_SQUARE);
    this.currentTurn = this.currentTurn === WHITE ? BLACK : WHITE;
    this.board = getNextBoardPosition(this.board, CURRENT_TURN_BLACK_BIT, this.currentTurn === BLACK ? BIT_ON : BIT_OFF);
    const fromTens = String(from)[0];
    const fromOnes = String(from)[1];
    const toTens = String(to)[0];
    const toOnes = String(to)[1];
    this.board = getNextBoardPosition(this.board, LAST_MOVE_FROM_TENS, fromTens);
    this.board = getNextBoardPosition(this.board, LAST_MOVE_FROM_ONES, fromOnes);
    this.board = getNextBoardPosition(this.board, LAST_MOVE_TO_TENS, toTens);
    this.board = getNextBoardPosition(this.board, LAST_MOVE_TO_ONES, toOnes);
  }
}

const WHITE_VALUE_MAP = {
  'R': 500,
  'N': 300,
  'B': 300,
  'Q': 900,
  'K': 9000,
  'P': 100,
};

const BLACK_VALUE_MAP = {
  'r': 500,
  'n': 300,
  'b': 300,
  'q': 900,
  'k': 9000,
  'p': 100,
};

const nonPieces = {
  '0': true,
  '-': true,
};

const BLACK_PAWN_POSITIONAL_VALUE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 20, 20, 20, 20, 20, 50, 50, 50, 0,
  0, 30, 30, 40, 40, 40, 20, 40, 40, 0,
  0, 10, 10, 50, 50, 50, 10, 30, 30, 0,
  0, 20, 20, 40, 40, 40, 20, 20, 20, 0,
  0, 20, 20, 30, 30, 30, 20, 20, 20, 0,
  0, 20, 20, 20, 20, 20, 20, 20, 20, 0,
  0, 100, 100, 100, 100, 100, 100, 100, 100, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const WHITE_PAWN_POSITIONAL_VALUE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 100, 100, 100, 100, 100, 100, 100, 100, 0,
  0, 20, 20, 20, 20, 20, 20, 20, 20, 0,
  0, 20, 20, 30, 30, 30, 20, 20, 20, 0,
  0, 20, 20, 40, 40, 40, 20, 20, 20, 0,
  0, 10, 10, 50, 50, 50, 10, 30, 30, 0,
  0, 30, 30, 40, 40, 40, 20, 40, 40, 0,
  0, 20, 20, 20, 20, 20, 50, 50, 50, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const BLACK_KNIGHT_POSITIONAL_VALUE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 30, 10, 10, 10, 10, 30, 0, 0,
  0, 10, 20, 20, 30, 30, 20, 20, 10, 0,
  0, 10, 20, 40, 40, 40, 40, 20, 10, 0,
  0, 20, 30, 50, 50, 50, 50, 30, 20, 0,
  0, 20, 30, 50, 50, 50, 50, 30, 20, 0,
  0, 10, 20, 40, 40, 40, 40, 20, 10, 0,
  0, 10, 20, 20, 30, 30, 20, 20, 10, 0,
  0, 0, 10, 10, 10, 10, 10, 10, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const WHITE_KNIGHT_POSITIONAL_VALUE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 10, 10, 10, 10, 10, 10, 0, 0,
  0, 10, 20, 20, 30, 30, 20, 20, 10, 0,
  0, 10, 20, 40, 40, 40, 40, 20, 10, 0,
  0, 20, 30, 50, 50, 50, 50, 30, 20, 0,
  0, 20, 30, 50, 50, 50, 50, 30, 20, 0,
  0, 10, 20, 40, 40, 40, 40, 20, 10, 0,
  0, 10, 20, 20, 30, 30, 20, 20, 10, 0,
  0, 0, 30, 10, 10, 10, 10, 30, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const BLACK_ROOK_POSITIONAL_VALUE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 50, 20, 20, 50, 50, 50, 0, 50, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 30, 30, 30, 30, 30, 30, 30, 30, 0,
  0, 30, 30, 30, 30, 30, 30, 30, 30, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const WHITE_ROOK_POSITIONAL_VALUE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 30, 30, 30, 30, 30, 30, 30, 30, 0,
  0, 30, 30, 30, 30, 30, 30, 30, 30, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 50, 20, 20, 50, 50, 50, 0, 50, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const BLACK_BISHOP_POSITIONAL_VALUE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 30, 0, 0, 30, 0, 0, 0,
  0, 0, 40, 0, 30, 30, 0, 40, 0, 0,
  0, 0, 0, 20, 20, 20, 20, 0, 0, 0,
  0, 0, 20, 40, 30, 30, 40, 20, 0, 0,
  0, 0, 40, 30, 20, 20, 30, 40, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const WHITE_BISHOP_POSITIONAL_VALUE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 40, 30, 20, 20, 30, 40, 0, 0,
  0, 0, 20, 40, 30, 30, 40, 20, 0, 0,
  0, 0, 0, 20, 20, 20, 20, 0, 0, 0,
  0, 0, 40, 0, 30, 30, 0, 40, 0, 0,
  0, 0, 0, 30, 0, 0, 30, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const BLACK_QUEEN_POSITIONAL_VALUE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const WHITE_QUEEN_POSITIONAL_VALUE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const BLACK_KING_POSITIONAL_VALUE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 100, 100, 0, 50, 0, 100, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const WHITE_KING_POSITIONAL_VALUE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 100, 100, 0, 50, 0, 100, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const BLACK_POSITIONAL_VALUE = {
  'r': BLACK_ROOK_POSITIONAL_VALUE,
  'n': BLACK_KNIGHT_POSITIONAL_VALUE,
  'b': BLACK_BISHOP_POSITIONAL_VALUE,
  'q': BLACK_QUEEN_POSITIONAL_VALUE,
  'k': BLACK_KING_POSITIONAL_VALUE,
  'p': BLACK_PAWN_POSITIONAL_VALUE,
};

const WHITE_POSITIONAL_VALUE = {
  'R': WHITE_ROOK_POSITIONAL_VALUE,
  'N': WHITE_KNIGHT_POSITIONAL_VALUE,
  'B': WHITE_BISHOP_POSITIONAL_VALUE,
  'Q': WHITE_QUEEN_POSITIONAL_VALUE,
  'K': WHITE_KING_POSITIONAL_VALUE,
  'P': WHITE_PAWN_POSITIONAL_VALUE,
};

const isPiece = piece => Boolean(!nonPieces[piece]);
class Eval {
  constructor() {

  }

  static getPositionalEvaluation(board, piece, pos, isBlack) {
    if (isBlack && BLACK_POSITIONAL_VALUE[piece]) {
      return BLACK_POSITIONAL_VALUE[piece][pos];
    } else if (!isBlack && WHITE_POSITIONAL_VALUE[piece]) {
      return WHITE_POSITIONAL_VALUE[piece][pos];
    }
    return 0;
  }

  static snapshotEvaluation(board) {
    const isBlack = board[CURRENT_TURN_BLACK_BIT] === BIT_ON;
    let blackMaterial = 0;
    let whiteMaterial = 0;
    let blackPositional = 0;
    let whitePositional = 0;
    for (let i = 11; i < 89; i++) {
      const piece = board[i];
      if (isPiece(piece)) {
        blackMaterial += BLACK_VALUE_MAP[piece] || 0;
        whiteMaterial += WHITE_VALUE_MAP[piece] || 0;
        blackPositional += Eval.getPositionalEvaluation(board, piece, i, true);
        whitePositional += Eval.getPositionalEvaluation(board, piece, i, false);
      }
    }
    const materialDifference = isBlack ? blackMaterial - whiteMaterial : whiteMaterial - blackMaterial;
    const positionalDifference = isBlack ? blackPositional - whitePositional : whitePositional - blackPositional;
    return materialDifference + positionalDifference;
  }

  static getBestMove(board, countNode = () => {}, depth = 4, isMaximizer, alpha = -Infinity, beta = Infinity, root = true) {
    if (depth === 0) {
      const value = Eval.snapshotEvaluation(board);
      if (isMaximizer) {
        return [value, null];
      } else {
        return [-value, null];
      }
    }
    let bestMove = null;
    let bestMoveValue = isMaximizer ? -Infinity : Infinity;
    let value;
    const moves = root ? new Board(board).legalMoves.sort((a, b) => {
      const posA = Eval.snapshotEvaluation(testMove(a, board));
      const posB = Eval.snapshotEvaluation(testMove(b, board));
      return posA - posB;
    }) : new Board(board).legalMoves;
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const nextBoardRep = testMove(move, board);
      value = Eval.getBestMove(nextBoardRep, countNode, depth - 1, !isMaximizer, alpha, beta, false)[0];
      countNode();
      if (isMaximizer) {
        if (value > bestMoveValue) {
          bestMoveValue = value;
          bestMove = move;
        }
        alpha = Math.max(alpha, value);
      } else {
        if (value < bestMoveValue) {
          bestMoveValue = value;
          bestMove = move;
        }
        beta = Math.min(beta, value);
      }
      if (beta <= alpha) {
        break;
      }
    }
    return [bestMoveValue, bestMove || moves[0]];
  }
}

module.exports = {
  Board,
  Eval,
  positionString,
  movedToPositionFromString,
  movedFromPositionFromString,
  testMove,
  CURRENT_TURN_BLACK_BIT,
  BIT_ON,
  BIT_OFF,
  WHITE_QUEENSIDE_ROOK_MOVED_BIT,
  WHITE_KINGSIDE_ROOK_MOVED_BIT,
  BLACK_QUEENSIDE_ROOK_MOVED_BIT,
  BLACK_KINGSIDE_ROOK_MOVED_BIT,
  WHITE_KING_MOVED_BIT,
  BLACK_KING_MOVED_BIT,
  LAST_MOVE_FROM_TENS,
  LAST_MOVE_FROM_ONES,
  LAST_MOVE_TO_TENS,
  LAST_MOVE_TO_ONES,
};