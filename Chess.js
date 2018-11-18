const { Board, Eval } = require('./Game.js');

class Chess {
  constructor() {
    
  }

  static getValidMoves(board) {
    let boardObj = new Board(board);
    return {
      legalMoves: Array.from(boardObj.legalMoves),
      isCheck: boardObj.isCheck()
    };
  }

  static getBestMove(board, countNode) {
    let bestMove = Eval.getBestMove(board, countNode)[1];
    return bestMove;
  }
}

module.exports = Chess;