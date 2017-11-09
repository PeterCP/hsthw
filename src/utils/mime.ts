import { extname } from 'path';

const mimes: { [ext: string]: string } = {
    '.json': 'application/json',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.xml': 'text/xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
};

export function getMime(filename: string) {
    const ext = extname(filename);
    return mimes[ext] || 'text/plain';
}