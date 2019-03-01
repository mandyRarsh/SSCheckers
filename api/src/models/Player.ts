import { Table, Column, Model, DataType, 
    PrimaryKey, ForeignKey, 
    BelongsTo, DefaultScope, BelongsToMany, Unique, AutoIncrement,
    CreatedAt
   } from 'sequelize-typescript';  

@Table({tableName: 'users', timestamps: false})
export class Player extends Model<Player> {

    @PrimaryKey
    @Column({type: DataType.STRING, field: 'user_id'})
    playerId?: string;

    @Column({type: DataType.STRING, field: 'name', allowNull: false})
    name: string;

    @Column({type: DataType.INTEGER, field: 'wins', allowNull: false})
    wins: number;

    @Column({type: DataType.INTEGER, field: 'losses'})
    losses: number;

    @Column({type: DataType.STRING, field: 'password'})
    password?: string;

    public toResponse() : UserResponse {
        let u = new UserResponse();
        u.playerId = this.playerId;
        u.name = this.name;
        u.wins = this.wins;
        u.losses = this.losses;
        return u;
    }
}

export class UserResponse {
    playerId?: string;
    name: string;
    wins: number;
    losses: number;
    password: string;

    constructor(json?) {
        if (json) {
            for (let prop in json) {
                this[prop] = json[prop];
            }
        }
    }
   
}


