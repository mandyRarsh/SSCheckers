import * as winston from 'winston';


export class Log {
    private static _logger: winston.Logger

    constructor() {
        let opts: any = {
            format: winston.format.combine(
                winston.format.splat(),
                winston.format.simple()
              ),
            transports: [
              new winston.transports.Console(),
              new winston.transports.File({ filename: 'api.log' })
            ],
            
        };
        Log._logger = winston.createLogger(opts); 
    }

    public static get logger() {
        if (typeof this._logger === 'undefined') {
            new Log();
        }
        return Log._logger;
    }
}