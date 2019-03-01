import { Table, Column, Model, DataType, 
    PrimaryKey, ForeignKey, 
    BelongsTo, DefaultScope, BelongsToMany, Unique, AutoIncrement,
    CreatedAt
   } from 'sequelize-typescript'; 
import { User } from './User';
import { CheckerBoard } from './CheckerBoard';

@DefaultScope({
include: [
    () => User,
]
})

@Table({tableName: 'games', timestamps: false})
export class Game extends Model<Game> {

    @PrimaryKey
    @Column({type: DataType.STRING, field: 'game_id'})
    gameId?: string;

    @Column({type: DataType.STRING, field: 'code', allowNull: false})
    code: string;

    @ForeignKey( () => User)
    @Column({type: DataType.STRING, field: 'player1'})
    player1Id: string;

    @BelongsTo( () => User)
    player1: User

    @ForeignKey( () => User)
    @Column({type: DataType.STRING, field: 'player2'})
    player2Id: string;

    @BelongsTo( () => User)
    player2: User

    @ForeignKey( () => User)
    @Column({type: DataType.STRING, field: 'player_up'})
    playerUpId: string;

    @BelongsTo( () => User)
    playerUp: User

    @Column({type: DataType.JSON, field: 'board'})
    board: CheckerBoard;

    @Column({type: DataType.BOOLEAN, field: 'active'})
    active: boolean;

    public toResponse() : GameResponse {
        let g = new GameResponse();
        g.gameId = this.gameId;
        g.player1 = this.player1;
        g.player2 = this.player2;
        g.playerUp = this.playerUp;
        g.active = this.active;
        return g;
    }
}

export class GameResponse {
    gameId?: string;
    code: string;
    player1: User
    player2: User
    playerUp: User
    board: CheckerBoard;
    active: boolean;

    constructor(json?) {
        if (json) {
            for (let prop in json) {
                this[prop] = json[prop];
            }
        }
    }
   
}


