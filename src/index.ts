import * as http from 'http';
import * as path from 'path';
import { readJsonAsync } from './utils/fs_promise';
import { App } from './app';
import { AppConfig } from './config';
const concat = require('concat-stream');

async function main() {
    const configPath = path.resolve(process.argv[2] || 'config.json');
    const config = await readJsonAsync<AppConfig>(configPath);
    const app = new App(config);
    app.run();
    console.log(`Listening on ports [${app.ports.join(', ')}]`);
}

main();
