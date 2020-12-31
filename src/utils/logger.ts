import fs from 'fs';
import path from 'path';
import stringify from 'json-stringify-safe';

import 'colors';

export enum LogType {
    Console,
    File
}

class Logger {
    public readonly logType: LogType; 
    public readonly logPath: string;
    public readonly timestamp: Date;
    public readonly file: string;
    public readonly loggerName: string;

    constructor(logType: LogType, logPath: string, loggerName: string) {
        this.logType = logType;
        this.logPath = logPath;
        this.timestamp = new Date();
        this.loggerName = loggerName;

        this.file = path.join(this.logPath, `${this.loggerName}-${(this.timestamp.getTime() / 1000) | 0}.txt`);
    }

    // morgan pipe
    get stream() {
        return {
            write: (message: string) => {
                this.info(message);
            }   
        }
    }
    
    createDirIfDoesntExist() {
        if(!fs.existsSync(this.logPath)) {
            fs.mkdirSync(this.logPath);
        }
    }

    formatMessage(message: any, level: string) {
        return `[${Date().toLocaleString()}] ${level}: ${message}\n`;
    }

    info(msg: any) {
        this.write(msg, 'info');
    }

    error(msg: any) {
        this.write(msg, 'error');
    }

    warn(msg: any) {
        this.write(msg, 'warn');
    }

    debug(msg: any) {
        this.write(msg, 'debug');
    }

    write(message: any, level: string) {
        if(!(message instanceof Error) && typeof message === 'object') message = stringify(message, null, '  ');

        if(this.logType === LogType.Console) {
            switch (level) {
                case 'info':
                    console.log('Info: '.blue + message);
                    break;
                case 'warn':
                    console.warn('Warn: '.yellow + message);
                    break;
                case 'error':
                    console.error('Error: '.red + message);
                    break;
                case 'debug':
                    console.debug('Debug: '.green + message);
            }
        } else {
            this.createDirIfDoesntExist();

            if(!fs.existsSync(this.file)) {
                fs.writeFileSync(this.file, this.formatMessage(message, level));
            } else {
                fs.appendFileSync(this.file, this.formatMessage(message, level));
            }
        }
    }
}

export default Logger;