# Chess
[Live Demo](https://robtaussig.com/chess)

Module with two purposes: it takes a string representation of a chess board and returns an array of legal moves, and if requested, best available move.

Live demo is part of a React app that instantiates a [HTML Canvas chess UI](https://github.com/robtaussig/canvas-chess). Moves are sent to an express server that runs the board state through this module and returns all valid moves, and if it is the AI's turn, the best available move (remember to check off which side(s) should be played by an AI).

## Getting Started
The string representation of a chess board contains 111 characters. The first 100 characters can be thought of as the physical board. `0` represents an edge of the board (while technically suboptimal in terms of space, it makes it much more pleasant to program with as detecting edges is straight forward, as is representing vertical adjacency). `-` represents empty squares. Pieces are represented by the first character in their name (`n` for knights). Black pieces are lowercase characters, and white pieces are uppercase. (newlines added for visual aid):

```
0000000000
0rnbqkbnr0
0pppppppp0
0--------0
0--------0
0--------0
0--------0
0PPPPPPPP0
0RNBQKBNR0
0000000000
```

The remaining 11 characters represent meta-information:

```
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
```

An example of the initial board state:

`00000000000rnbqkbnr00pppppppp00--------00--------00--------00--------00PPPPPPPP00RNBQKBNR0000000000000000000000`

Getting valid moves:

```
const initialBoard = `00000000000rnbqkbnr00pppppppp00--------00--------00--------00--------00PPPPPPPP00RNBQKBNR0000000000000000000000`;
const results = Chess.getValidMoves(initialBoard);
console.log(results);
//=>
{
  legalMoves: [ '71-61',
    '71-51',
    '72-62',
    '72-52',
    '73-63',
    '73-53',
    '74-64',
    '74-54',
    '75-65',
    '75-55',
    '76-66',
    '76-56',
    '77-67',
    '77-57',
    '78-68',
    '78-58',
    '82-61',
    '82-63',
    '87-66',
    '87-68' ],
  isCheck: false, //Checkmate can be inferred if this is true and legalMoves.length is 0
}

let nodeCount = 0;
const nodeCounter = () => nodeCount++;

const bestMove = Chess.getBestMove(initialBoard, nodeCounter);

console.log(bestMove);
//=> '73-53' // C2-C4;

console.log(nodeCount);
//=> 5147 //Number of board states evaluated

const board = new Board();
const from = Number(bestMove.split('-')[0]);
const to = Number(bestMove.split('-')[1]);
board.makeMove(from, to);

const nextBestMove = Chess.getBestMove(board.board);

console.log(nextBestMove);
//=> '23-43' // C7-C5;
```

## Installing
The only dependency is [jest](https://github.com/facebook/jest) if you want to run tests.

## Running Tests
[Tests here](https://github.com/robtaussig/chess/blob/master/Game.test.js)

```
yarn global add jest
jest
```

## How I used it from my server
While it is not the cleanest code, I have a singly get endpoint that takes the board string as a param:

```
app.get('/chess/:board', (req, res, next) => {

  const board = req.params.board;
  const validMoveResult = Chess.getValidMoves(board);

  if (req.query && req.query.withBestMove === 'true') {

    //Previously found best moves are stored in a database with the board state used as an index. I have also seeded my database with popular opening books.

    return db.select('chessBestMoves', ['bestMove', 'nodesExplored', 'inOpeningBook'], {
      board,
    })
      .then(results => {
        if (results && results.length > 0) {
          const randomIndex = Math.floor(Math.random() * results.length);
          const randomBestMove = results[randomIndex];

          return res.json({
            legalMoves: validMoveResult.legalMoves,
            isCheck: validMoveResult.isCheck,
            bestMove: randomBestMove.bestMove,
            nodesExplored: randomBestMove.nodesExplored,
            inOpeningBook: randomBestMove.inOpeningBook,
            fromCache: true,
            timeElapsed: 0,
          });
        } else {
          let nodesExplored = 0;
          const countNode = () => nodesExplored++;
          const start = new Date();
          const bestMove = Chess.getBestMove(board, countNode);
          const end = new Date();
          const timeElapsed= end - start;

          db.insert('chessBestMoves', {
            board: board,
            bestMove,
            nodesExplored,
          });

          return res.json({
            legalMoves: response.legalMoves,
            isCheck: response.isCheck,
            bestMove,
            nodesExplored,
            fromCache: false,
            inOpeningBook: false,
            timeElapsed,
          });
        }
      });
  } else {

    return res.json({
      legalMoves: response.legalMoves,
      isCheck: response.isCheck,
    });
  }
});
```

## Using a database to cache best moves

The above code represents my entire server-side handling of storing and retrieving best moves into a mysql database.

The commands used to create the table:

```
CREATE TABLE IF NOT EXISTS chessBestMoves (id int NOT NULL AUTO_INCREMENT, board VARCHAR(255), bestMove VARCHAR(255), nodesExplored INT(11), inOpeningBook TINYINT(1), createdAt DATETIME, updatedAt DATETIME, PRIMARY KEY (id));
```

`db` is a helper class I wrote as a lightweight ORM. What you see above are simple insert and select queries:

```
insert(table, object) {
  let query = `INSERT INTO ${table} (`;
  let values = `VALUES (`;
  let time = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let newObject = Object.assign({}, object, {
    createdAt: time,
    updatedAt: time
  });
  for (let key in newObject) {
    let currentValue = newObject[key];
    if (Number.isInteger(currentValue)) {
      values += `${currentValue},`;
    } else {
      values += `'${currentValue}',`;
    }
    query += `${key},`;
  }
  query = query.slice(0, query.length - 1);
  values = values.slice(0, values.length - 1);
  query += `)
  `;
  values += ');';    
  return this.rawQuery(query + values)
    .then(response => {
      return Promise.resolve(Object.assign({}, newObject, {
        id: response.insertId
      }));
    });
}

select(table, columns, where) {
  let query = `SELECT `;
  if (columns) {
    columns.forEach((el, idx) => {
      query += el;
      if (idx < columns.length - 1) {
        query += ', ';
      }
    });
  } else {
    query += '*';
  }
  query += ` FROM ${table}`;
  if (where) {
    query += ' WHERE ';
  }
  for (let field in where) {
    let currentValue = where[field];
    if (Number.isInteger(currentValue)) {
      query += `${field} = ${currentValue} AND `;
    } else {
      query += `${field} = '${currentValue}' AND `;
    }
  }
  query = query.slice(0, query.length - 4);
  return this.rawQuery(query)
    .then(response => {
      return Promise.resolve(response.map(el => Object.assign({}, el)));
    });
}
```

## Storing opening books
I found a helpful list of openings that I copied into a [text file](https://github.com/robtaussig/chess/blob/master/lib/openings.txt).

You will have to implement your own database solution in [line 108](https://github.com/robtaussig/chess/blob/master/lib/seedDatabase.js), but outside of my db methods, running:

```
node ./lib/seedDatabase.js
```
Would parse and call 'addMove' on 1009 board positions that represent all board positions found in the openings in `openings.txt`. For each position, there are many variations (depending on the opening), but for my purposes, I only save one continuation for each position.

## Plans
- There's really no excuse for this, but I have not yet implemented en-passant. It would be pretty trivial since the last move is captured in each board state.

- Right now, at depth 4, most board positions can be evaluated in 2-6 seconds. This is a complete search; so in theory (assuming there are no bugs), it should find all possible mate in 2s (at the default settings). I am no satisfied with the speed, and so I plan to continue to investigate other optimization techniques (of which there are many). It is possible that I need to look into a more efficient way to represent board state, especially in terms of how many board representations will be stored in memory while performing the algorithm (this as opposed to creating a class instance that is capable of making moves and undoing moves)