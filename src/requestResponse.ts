import { parse, UrlObject } from 'url';
import { Socket } from 'net';
import { Writable } from 'stream';
import { STATUS_CODES } from 'http';
import { toInteger, toString } from 'lodash';
import { getMime } from './utils/mime';
import * as fs from './utils/fs_promise';
const concat = require('concat-stream');

export async function parseRequestResponse(socket: Socket): Promise<[Request, Response]> {
    const plainRequestPromise = new Promise<string>((resolve, reject) => {
        socket.on('data', (req: Buffer) => {
            resolve(req.toString());
        });
    });
    const plainRequest = await plainRequestPromise;

    const [head, ...splitBody] = plainRequest.split('\r\n\r\n');
    const body = splitBody.join('\r\n\r\n');
    const [firstLine, ...rawHeaders] = head.split('\r\n');
    const [method, path, version] = firstLine.split(' ');
    const headers = new Map<string, string>();
    for (const header of rawHeaders) {
        const [name, value] = header.split(':');
        headers.set(name.trim().toLowerCase(), value.trim());
    }
    const url = parse(`http://${headers.get('host')}${path}`);

    if (!url.port) {
        url.port = toString(socket.localPort);
    }

    return [
        new Request(socket, url, headers, body, version, method),
        new Response(socket, version)
    ];
}

export class Request {

    constructor(
            public socket: Socket,
            public url: UrlObject,
            public headers: Map<string, string>,
            public body: string,
            public httpVersion: string,
            public method: string,
    ) { }

    get statLine(): string {
        return `${this.method} ${this.url.path} ${this.httpVersion}`;
    }
    
    get remoteAddress(): string {
        return this.socket.remoteAddress!;
    }
}

export class Response {

    private headWritten: boolean = false;
    private _statusMessage?: string = undefined;

    public statusCode: number = 200;
    private headers: Map<string, string> = new Map();

    constructor(
            public socket: Socket,
            public httpVersion: string,
    ) { }

    get statusMessage(): string {
        return this._statusMessage
            || STATUS_CODES[this.statusCode]
            || 'Unknown';
    }

    set statusMessage(message: string) {
        this._statusMessage = message;
    }

    get contentLength(): number {
        return toInteger(this.headers.get('Content-Length'));
    }

    writeHead() {
        if (!this.headWritten) {
            this.socket.write(
                `${this.httpVersion} ${this.statusCode} ${this.statusMessage}\n`
            );

            for (const [name, value] of this.headers.entries()) {
                this.socket.write(`${name}: ${value}\n`);
            }

            this.socket.write('\n');
            this.headWritten = true;
        }
    }

    setHeader(name: string, value: any) {
        if (this.headWritten) {
            throw 'Response headers have already been written';
        }
        this.headers.set(name, value.toString());
    }

    getHeader(name: string) {
        return this.headers.get(name);
    }

    writeDateHeader() {
        this.setHeader('Date', new Date().toISOString());
    }

    write(content: string) {
        this.writeHead();
        this.socket.write(content);
    }

    writable(): Writable {
        this.writeHead();
        return this.socket;
    }

    end(content?: string) {
        this.writeHead();
        if (content)
            this.write(content);
        this.socket.end();
    }

    streamFile(filename: string, code: number = 200) {
        const stream = fs.createReadStream(filename);
        const stats = fs.statSync(filename);

        this.statusCode = code;
        this.setHeader('Content-Type', getMime(filename));
        this.setHeader('Content-Length', stats.size);
        this.writeDateHeader();

        stream.pipe(this.writable());
    }

    sendMessage(message: string, code: number = 200) {
        this.statusCode = code;
        this.setHeader('Content-Type', 'text/plain');
        this.setHeader('Content-Length', message.length);
        this.writeDateHeader();
        this.end(message);
    }
}
