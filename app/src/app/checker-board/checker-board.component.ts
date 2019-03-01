import { Component, OnInit } from '@angular/core';
import { Square, Color, SquareLocation } from 'src/app/models/Square';
import { CheckerPiece } from '../models/CheckerPiece';
import { Player } from '../models/Player';
import { CheckerError } from '../models/CheckerError';
import { CommentStmt } from '@angular/compiler';
import { Comments } from '../models/Comments';
import { cp } from '@angular/core/src/render3';

@Component({
  selector: 'checker-board',
  templateUrl: './checker-board.component.html',
  styleUrls: ['./checker-board.component.scss']
})
export class CheckerBoardComponent implements OnInit {
  BOARD_WIDTH = 8;
  BOARD_HEIGHT = 8;
  board: Array<Square[]> = [];
  blackCheckers: CheckerPiece[] = [];
  redCheckers: CheckerPiece[] = [];
  playerUp: Player;
  player1: Player = new Player('Player 1', Color.BLACK);
  player2: Player = new Player('Player 2', Color.RED);
  commentary: string = '';
  gameOver: boolean;

  private _color = true;
  private _lockSelected = false;

  get playing() {
    return (null != this.playerUp || undefined != this.playerUp)
  }

  get opposingPlayer() {
    return this.playerUp === this.player1 ? this.player2 : this.player1;
  }

  get selectedChecker(): CheckerPiece {
    for (let checker of this.allCheckers) {
      if (checker.selected) {
        return checker;
      }
    }
    return null;
  }

  get allCheckers() {
    return this.redCheckers.concat(this.blackCheckers);
  }

  private getNextColor() {
    this._color = !this._color;
    return false == this._color ? Color.BLACK : Color.RED
  }

  constructor() { }

  ngOnInit() {
    for (let w = 1; w <= this.BOARD_WIDTH; ++w) {
      let row = [];
      this._color = !this._color;
      for (let h = 1; h <= this.BOARD_HEIGHT; ++h) {
        let location = new SquareLocation(h, w);
        let sq = new Square(this.getNextColor(), location);
        row.push(sq)
      }
      this.board.push(row);
    }
    // 12 pieces each player
    for (let x = 0; x < 12; ++x) {
      this.redCheckers.push(new CheckerPiece(Color.RED));
      this.blackCheckers.push(new CheckerPiece(Color.BLACK));
    }
  }

  allSquares(reversed = false): Square[] {
    let squares = [];
    let board = this.board;
    if (reversed) {
      for (let row = board.length - 1; row >= 0; --row) {
        let r = board[row]
        for (let sq = r.length - 1; sq >= 0; --sq) {
          squares.push(r[sq]);
        }
      }
    } else {
      for (let row of this.board) {
        for (let sq of row) {
          squares.push(sq);
        }
      }
    }
    return squares;
  }

  getSquare(x, y) {
    let squares = this.allSquares();
    for (let square of squares) {
      if (square.location.x == x && square.location.y == y) {
        return square;
      }
    }
    return null;
  }

  newGame() {
    this.gameOver = false;
    this.clearBoard();
    this.player1.reset();
    this.player2.reset();
    this.assignCheckers();
    //Add black
    for (let piece of this.redCheckers) {
      for(let square of this.allSquares()) {
        if (square.canBeOccupied && !square.occupiedBy) {
          piece.place(square);
          break;
        }
      }
    }
    for (let piece of this.blackCheckers) {
      for(let square of this.allSquares(true)) {
        if (square.canBeOccupied && !square.occupiedBy) {
          piece.place(square);
          break;
        }
      }
    }
  this.playerUp = this.player1;
  }

  assignCheckers() {
    for (let checker of this.allCheckers) {
      if (checker.color == Color.BLACK) {
        this.player1.checkersInPlay.push(checker);
      } else this.player2.checkersInPlay.push(checker);
    }
  }

  clearBoard() {
    this.deselectAllCheckers();
    for (let sq of this.allSquares()) {
      sq.clear();
    }
  }

  selectSquare(square: Square) {
    console.log(square)
    if (square.occupiedBy && square.occupiedBy.color != this.playerUp.color) return;
     // Move the checker if we have one selected
     let jumpMove = this.isJumpable(square);
     let jumpedChecker: CheckerPiece = null;
     if (this.selectedChecker && this.selectedChecker != square.occupiedBy && this.selectedChecker.canMoveTo(square, jumpMove)) {
      if (jumpMove) jumpedChecker = this.jumpedChecker(square);
      this.selectedChecker.moveTo(square, this.playerUp, this.opposingPlayer, jumpedChecker);
      let anotherJumpAvailable = this.canJumpAnOpposingChecker(this.selectedChecker) && jumpMove;
      this.nextTurn(anotherJumpAvailable, jumpMove);
    }// Just select the checker
    else if (square.occupiedBy && square.occupiedBy.color == this.playerUp.color) {
      if (this._lockSelected) return;
      this.deselectAllCheckers();
      square.occupiedBy.selected = true;
    }
   
  }

  canSelect(checker: CheckerPiece) {
    return checker && checker !== this.selectedChecker && this.playerUp.color == checker.color;
  }

  canMoveTo(tSquare: Square) {
    let checker = this.selectedChecker;
    if (!checker || tSquare.occupied || !tSquare.canBeOccupied || !this.selectedChecker) return false;
    let jump = this.isJumpable(tSquare);
    return checker.canMoveTo(tSquare, jump);
  }

  jumpedChecker(square: Square) {
    let checker = this.selectedChecker;
    if (square.occupied || !square.canBeOccupied) return null;
    if (checker) {
      if (!checker.isKing) {
        if (checker.color === Color.BLACK) {
          let vDiff = square.location.y - checker.position.location.y;
          let hDiff = square.location.x - checker.position.location.x;
          // Check square is 2 above, and +-2 to side
          if ( (hDiff == -2 || hDiff == 2) && vDiff == -2) {
            let jumpedSquareX = checker.position.location.x + (hDiff == 2 ? 1 : -1);
            let sq = this.getSquare(jumpedSquareX, checker.position.location.y - 1);
            if (sq && sq.occupied && sq.occupiedBy.color == Color.RED) {
              return sq.occupiedBy;
            }
            return null;
          }
        } else if (checker.color === Color.RED) {
          let vDiff = square.location.y - checker.position.location.y;
          let hDiff = square.location.x - checker.position.location.x;
        
          // Check square is 2 below, and +-2 to side
          if ( (hDiff == -2 || hDiff == 2) && vDiff == 2) {
            let jumpedSquareX = checker.position.location.x + (hDiff == 2 ? 1 : -1);
            let sq = this.getSquare(jumpedSquareX, checker.position.location.y + 1);
            if (sq && sq.occupied && sq.occupiedBy.color == Color.BLACK) {
              return sq.occupiedBy;
            }
            return null;
          }
        }
      // King jump
      } else {
          let vDiff = square.location.y - checker.position.location.y;
          let hDiff = square.location.x - checker.position.location.x;
          // Check square is +-2 above, and +-2 to side
          if ( (hDiff == -2 || hDiff == 2) && (vDiff == -2 || vDiff == 2)) {
            let jumpedSquareX = checker.position.location.x + (hDiff == 2 ? 1 : -1);
            let jumpedSquareY = checker.position.location.y + (vDiff == 2 ? 1 : -1);
            let sq = this.getSquare(jumpedSquareX, jumpedSquareY);
            if (sq && sq.occupied && sq.occupiedBy.color !== checker.color) {
              return sq.occupiedBy;
            }
            return null;
          }
      }
    }
  }

  isJumpable(square: Square) {
    return !!this.jumpedChecker(square);
  }

  deselectAllCheckers() {
    for (let checker of this.allCheckers) {
      checker.selected = false;
    } 
  }

  canJumpAnOpposingChecker(checker: CheckerPiece) {
    for (let square of this.allSquares()) {
      if (this.isJumpable(square)) return true;
    }
    return false;
  }

  nextTurn(anotherJumpAvailable?, jumped?: boolean) {
    if (!this.playerUp) return;
    if (this.player1.checkersInPlay.length == 0 || this.player2.checkersInPlay.length == 0) {
      this.gameOver = true;
    }
    if (anotherJumpAvailable) {
      this._lockSelected = true;
      return;
    }
    this.getCommentary(this.playerUp, jumped);
    this.playerUp = this.playerUp == this.player1 ? this.player2 : this.player1;
    this._lockSelected = false;
    this.deselectAllCheckers();
  }

  getCommentary(player: Player, jumped?: boolean) {
    this.commentary = '';
    let comment = '';
    if (!player) return;
    switch(true) {
      case (true == jumped):
        comment = Comments.getJumps();
        break;
      case (player.moveNumber == 1): 
        comment = Comments.getStart();
        break;
      case (player.moveNumber > 1):
        comment = Comments.getInterim();
        break;
    }
    this.commentary = comment;
  }

  getWinner() {
    if (this.player1.checkersInPlay && 
      this.player1.checkersInPlay.length == 0) return this.player2;
    else if (this.player2.checkersInPlay && 
      this.player2.checkersInPlay.length == 0) return this.player1;
  }

}
