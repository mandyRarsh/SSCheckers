import { CheckerPiece } from "./CheckerPiece";

export class Square {
    color: Color;
    occupiedBy?: CheckerPiece;
    location: SquareLocation;
    canBeOccupied: boolean = false;

    constructor(color: Color, location: SquareLocation) {
        this.color = color;
        this.location = location;
        if (color == Color.RED) {
            this.canBeOccupied = true;
        }
    }

    clear() {
        this.occupiedBy = null;
    }

    get occupied() {
        return this.occupiedBy != null && this.occupiedBy != undefined
    }


}

export class SquareCollection {
    group: Square[] = [];

    getByLocation(x:number, y:number) {
        for (let square of this.group) {
            if (square.location.x == x && square.location.y == y) {
                return square;
            }
        }
    }
}

export enum Color {
    RED = 'red',
    BLACK = 'black'
}

export class SquareLocation {
    x: number;
    y: number;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}