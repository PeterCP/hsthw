import { isBoolean } from 'lodash';
import { Request } from './requestResponse';

export class Location {

    constructor(
            public pathRegex: RegExp,
            public rootDir: string,
            public index?: string,
            public deny?: 'all' | Array<string>,
    ) { }

    canHandle(req: Request): boolean {
        return (!!req.url.pathname!.match(this.pathRegex)) || false;
    }

    shouldDeny(ip: string): boolean {
        if (!this.deny)
            return false;
        else if (this.deny === 'all')
            return true;
        else
            return !!this.deny.find(_ip => _ip === ip);
    }
}
