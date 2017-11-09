import { resolve } from 'path';
import { isInteger, isString, toInteger } from 'lodash';
import { AppConfig, ServerConfig, LocationConfig } from './config';
import { Server } from './server';
import { Location } from './location';

export function buildServers(config: AppConfig): Array<Server> {
    return Object.keys(config.server)
        .map<[string, ServerConfig]>(k => ([k, config.server[k]]))
        .map(([name, config]) => {
            let port: number, isDefault: boolean;
            if (isInteger(config.listen)) {
                port = (config.listen as number);
                isDefault = false;
            } else {
                const split = (config.listen as string).split(' ');
                port = Number.parseInt(split[0]);
                isDefault = split[1] === 'default_server';
            }

            const rootDir = resolve(config.root);
            const accessLog = resolve(config.accessLog);
            const locations = buildLocations(rootDir, config.location);
            const errorPages = buildErrorPages(config.errorPage);

            const server = new Server(
                name,
                config.serverName,
                port,
                isDefault,
                rootDir,
                accessLog,
                locations,
                errorPages,
            );


            return server;
        });
}

function buildLocations(
        rootDir: string,
        locations: { [name: string]: LocationConfig }
): Array<Location> {
    return Object.keys(locations)
        .map<[string, LocationConfig]>(k => [k, locations[k]])
        .map(([name, config]) => {
            return new Location(
                new RegExp(name),
                config.root ? resolve(config.root) : rootDir,
                config.index,
                config.deny,
            );
        })
        .concat([
            new Location(
                /.*/,
                rootDir,
                undefined,
                undefined,
            )
        ]);
}

function buildErrorPages(errorPages: { [code: string]: string }): Map<number, string> {
    return Object.keys(errorPages).reduce((map, code) => {
        map.set(toInteger(code), errorPages[code].replace(/^\//, ''));
        return map;
    }, new Map<number, string>());
}
