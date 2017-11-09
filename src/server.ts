import { resolve } from 'path';
import { userInfo } from 'os';
import { toInteger } from 'lodash';
import * as fs from './utils/fs_promise';
import { Request, Response } from './requestResponse';
import { Logger } from './logger';
import { Location } from './location';

export class Server {

    
    constructor(
            public name: string,
            public hostname: string,
            public port: number,
            public isDefault: boolean,
            public rootDir: string,
            public accessLog: string,
            public locations: Array<Location>,
            public errorPages: Map<number, string>,
    ) { }

    canHandle(req: Request): boolean {
        return this.port === toInteger(req.url.port)
            && this.hostname === req.url.hostname;
    }

    async handle(logger: Logger, req: Request, res: Response) {
        const location = this.locations.find(l => l.canHandle(req))!;

        if (location.shouldDeny(req.remoteAddress)) {
            this.sendError(res, 403, '403: Forbidden');
            logger.log(req, res);
            return;
        }

        const pathname = req.url.pathname!
            .replace(location.pathRegex, '')
            .replace(/^\//, '');
        let filename = resolve(location.rootDir, pathname);

        let exists = await fs.existsAsync(filename);
        if (!exists) {
            this.sendError(res, 404, `404: [${req.url.pathname!}] not found.`);
            logger.log(req, res);
            return;
        }

        let stats = await fs.statAsync(filename);
        if (stats.isDirectory()) {
            if (location.index) {
                for (const index of location.index.split(' ')) {
                    filename = resolve(location.rootDir, index);
                    exists = await fs.existsAsync(filename);
                    if (exists) {
                        res.streamFile(filename);
                        logger.log(req, res);
                        return;
                    }
                }
            }

            this.sendError(res, 403, `403: Access to [${req.url.pathname!}] is forbidden.`);
            logger.log(req, res);
            return;
        }

        stats = await fs.statAsync(filename);
        res.streamFile(filename);
        logger.log(req, res);
    }

    sendError(res: Response, code: number, message: string) {
        const page = this.errorPages.get(code);
        if (page) {
            const filename = resolve(this.rootDir, page);
            const exists = fs.existsSync(filename);
            if (exists) {
                res.streamFile(filename, code);
            }
        } else {
            res.sendMessage(message, code);
        }
    }
}
