import { Square, Color, SquareLocation } from "./CheckerBoard";
import { InvalidMove } from "./CheckerError";
import { Player } from "./Player";

export class CheckerPiece {
    //Black starts at bottom of board
    color: Color;
    position: Square;
    selected: boolean = false;
    private _isKing: boolean = false;
    private _isJumped: boolean = false;

    get isKing() {
        return this._isKing;
    }

    get isJumped() {
        return this._isJumped;
    }

    constructor(color: Color) {
        this.color = color;
    }

    canMoveTo(square: Square, isJump: boolean = false) {
        if (isJump) {
            return true;
        }
        //Normal move
        else if (square.canBeOccupied && !square.occupied && this.isDiagonal(square)) {
            return true;
        }
       
    }

    // Check that move is diagonal
    isDiagonal(square: Square) {
        if (!this._isKing) {
            if (this.color == Color.BLACK && square.location.y == this.position.location.y - 1 && 
                (square.location.x === this.position.location.x + 1 || 
                    square.location.x === this.position.location.x - 1)) {
                return true;
            } else if (this.color == Color.RED && square.location.y == this.position.location.y + 1 && 
                (square.location.x === this.position.location.x + 1 || 
                    square.location.x === this.position.location.x - 1)) {
                return true;
            }
        } else {
            if ( (square.location.y == this.position.location.y - 1 || 
                    square.location.y == this.position.location.y + 1) && 
                (square.location.x === this.position.location.x + 1 || 
                    square.location.x === this.position.location.x - 1))
                return true;
        }
    }

    // Override any validation of the move
    place(square: Square) {
        this.position = square;
        square.occupiedBy = this;
    }

    moveTo(square: Square, player: Player, opposingPlayer: Player, jumpedChecker?: CheckerPiece) {
        if (this.canMoveTo(square, !!jumpedChecker)) {
            this.position.occupiedBy = null;
            this.position = square;
            square.occupiedBy = this;
            this.tryKing(square);
        } else throw new InvalidMove(this, square);
        
    }

    tryKing(square: Square) {
        if (!this.isKing) {
            if (this.color === Color.BLACK && square.location.y == 1) {
                this.king();
            }
            else if (this.color === Color.RED && square.location.y == 8) {
                this.king();
            }
        }
    }

    king() {
        this._isKing = true;
    }


    reset() {
        this._isJumped = false;
        this._isKing = false;
    }

   



}

