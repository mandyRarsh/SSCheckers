import { ConfigSettings } from '../models/Configuration';
import * as c from 'config';

export class Config extends ConfigSettings {
   
    private static _instance: ConfigSettings;

    constructor() {
        super()
        Config._instance = new ConfigSettings();
        Config._instance.db = c.has('db') ? c.get('db') : null;
    }

    public static get settings() {
       if (typeof Config._instance === 'undefined') {
           new Config();
       }
       return Config._instance;
    }
}