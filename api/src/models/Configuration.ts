export class ConfigSettings {
    db: Database;
}

export interface Database {
    host: string;
    port: number;
    user: string;
    name: string;
    password: string;
}

