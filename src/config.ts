export interface LocationConfig {
    root?: string;
    index?: string;
    deny?: Array<string> | 'all';
}

export interface ServerConfig {
    listen: number | string;
    serverName: string;
    isDefault: boolean;
    accessLog: string;
    root: string;
    errorPage: {
        [code: string]: string;
    };
    location: {
        [location: string]: LocationConfig;
    }
}

export interface AppConfig {
    server: {
        [server: string]: ServerConfig;
    }
}
