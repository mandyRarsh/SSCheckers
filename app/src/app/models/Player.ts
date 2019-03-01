import { CheckerPiece } from "./CheckerPiece";
import { Color } from "./Square";

export class Player {
    name: string;
    isUp: boolean;
    color: Color;
    moveNumber = 0;
    checkersJumped: CheckerPiece[] = [];
    checkersInPlay: CheckerPiece[] = [];

    constructor(name, color) {
        this.name = name;
        this.color = color;
    }

    get allCheckers() {
        return this.checkersInPlay.concat(this.checkersJumped);
    }

    reset() {
        for (let checker of this.allCheckers) {
            checker.reset();
        }
        this.checkersInPlay = [];
        this.checkersJumped = [];
        this.isUp = false;
        this.moveNumber = 0;
    }

    removeChecker(_checker: CheckerPiece) {
        let i = 0;
        for (let checker of this.checkersInPlay) {
            if (checker === _checker) {
                this.checkersJumped.push(_checker);
                this.checkersInPlay.splice(i, 1);
            }
            ++i;
        }
    }
}