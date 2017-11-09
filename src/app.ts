import { isInteger, toInteger } from 'lodash';
import { AppConfig, ServerConfig } from './config';
import { buildServers } from './configParser';
import { Server } from './server';
import { Request, Response } from './requestResponse';
import { LoggerPool } from './logger';
import { HandlerPool } from './handler';

/**
 * Main application class responsible of managing servers and resolving request
 * handlers.
 */
export class App {

    private servers: Array<Server>;
    private loggerPool: LoggerPool;
    private handlerPool: HandlerPool;

    constructor(config: AppConfig) {
        this.servers = buildServers(config);
        this.loggerPool = new LoggerPool(this.logFiles);
        this.handlerPool = new HandlerPool(this.handleRequest, this.ports);
    }

    /**
     * Run the application.
     */
    run() {
        this.handlerPool.init();
        this.loggerPool.init();
    }

    /**
     * Get an array containing all ports used by the application.
     */
    get ports(): Array<number> {
        return this.servers
            .map(s => s.port)
            .filter((value, index, self) => self.indexOf(value) === index);
    }

    /**
     * Get an array containing all log file paths used by the application.
     */
    get logFiles(): Array<string> {
        return this.servers
            .map(s => s.accessLog)
            .filter((value, index, self) => self.indexOf(value) === index);
    }

    handleRequest = (req: Request, res: Response) => {
        let server = this.servers.find(
            s => s.port === toInteger(req.url.port) &&
                s.hostname === req.url.hostname
        );
        if (!server) {
            server = this.servers.find(
                s => s.isDefault && s.port === toInteger(req.url.port)
            );
        }
        if (!server) {
            res.end();
            throw `No server can handle request to ${req.url.href} on port ${req.url.port}`;
        }
        const logger = this.loggerPool.getLogger(server.accessLog);
        server.handle(logger, req, res);
    }
}
