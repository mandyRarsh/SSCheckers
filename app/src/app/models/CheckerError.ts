import { CheckerPiece } from "./CheckerPiece";
import { Square } from "./Square";

export class CheckerError extends Error {
    message: string;
    constructor(message: string) {
        super();
        this.message = message;
    }
}

export class InvalidMove extends CheckerError {

    constructor(checker: CheckerPiece, square: Square) {
        super(`Checker located at ${checker.position.location.x}, ${checker.position.location.y} 
            cannot move to square ${square.location.x}, ${square.location.y}`);
    }
}