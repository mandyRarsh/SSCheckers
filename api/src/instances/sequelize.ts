import { Sequelize, ISequelizeConfig } from 'sequelize-typescript';
//import { User, UserRole } from '../models/User';

import { Config } from './config';
// import { Vendor } from '../models/Vendor';



export class DatabaseConnection  {

	private readonly DB_NAME: string = Config.settings.db.name;
	private readonly DB_HOST: string = Config.settings.db.host;
	private readonly DB_USER: string = Config.settings.db.user;
	private readonly DB_PASSWORD: string = Config.settings.db.password;

	private static _db: Sequelize;

	private DB_CONFIG: ISequelizeConfig = {
		database: this.DB_NAME,
		dialect: 'mysql',
		host: this.DB_HOST,
		username: this.DB_USER,
		password: this.DB_PASSWORD
	}
	
	private constructor() {
		DatabaseConnection._db = new Sequelize(this.DB_CONFIG);	
		DatabaseConnection._db.addModels([
			// User, 
			// UserRole,
		])
	}

	public static get db() {
		if (typeof DatabaseConnection._db === 'undefined' ) {
			new DatabaseConnection();
		}
		return DatabaseConnection._db;
		
	}


	// Used for removing the metadata object that comes back from raw queries
	public static get SELECT() {
		return { type: Sequelize.QueryTypes.SELECT }
	}
} 







  




