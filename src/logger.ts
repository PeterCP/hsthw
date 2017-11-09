import { userInfo } from 'os';
import { resolve } from 'path';
import { isString } from 'lodash';
import * as moment from 'moment';
import { createWriteStream, WriteStream } from './utils/fs_promise';
import { Request, Response } from './requestResponse';

export class Logger {

    private stream: WriteStream;

    constructor (
            public filename: string,
    ) {
        this.stream = createWriteStream(filename);
    }

    log(req: Request, res: Response) {
        const address = req.remoteAddress;
        const user = userInfo().username;
        const statLine = req.statLine;
        const code = res.statusCode;
        const size = res.contentLength;
        const timestamp = moment().format('DD/MMM/YYYY:HH:mm:ss');

        this.stream.write(
            `${address} - ${user} [${timestamp}]  "${statLine}" ${code} ${size}\n`
        );
    }
}

export class LoggerPool {

    private loggers: Map<string, Logger> = new Map();

    constructor(
            private logFiles: Array<string>,
    ) { }

    init() {
        for (const file of this.logFiles) {
            const logger = new Logger(file);
            this.loggers.set(file, logger);
        }
    }

    getLogger(path: string) {
        const logger = this.loggers.get(path);
        if (!logger) {
            throw `Log file [${path}] not registered`;
        }
        return logger;
    }
}
