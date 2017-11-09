import { createServer, Server, Socket } from 'net';
import { parseRequestResponse, Request, Response } from './requestResponse';

export { Server as Handler };

export class HandlerPool {

    private handlers: Map<number, Server> = new Map();

    constructor(
            private callback: (req: Request, res: Response) => void,
            private ports: Array<number>,
    ) { }

    init() {
        for (const port of this.ports) {
            const handler = createServer({
                allowHalfOpen: true,
            }, this.handleRequest);
            handler.listen(port);
            this.handlers.set(port, handler);
        }
    }

    getHandler(port: number): Server {
        const handler = this.handlers.get(port);
        if (!handler) {
            throw `No handler exists for port ${port}`;
        }
        return handler;
    }

    handleRequest = async (socket: Socket) => {
        const [req, res] = await parseRequestResponse(socket);
        this.callback(req, res);
    }
}
