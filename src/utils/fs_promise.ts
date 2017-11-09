import { exists, readFile, PathLike, stat, Stats } from 'fs';

export async function existsAsync(path: PathLike): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        exists(path, (res) => {
            resolve(res);
        });
    });
}

export async function statAsync(path: PathLike): Promise<Stats> {
    return new Promise<Stats>((resolve, reject) => {
        stat(path, (err, stats) => {
            if (err) {
                reject(err);
            } else {
                resolve(stats);
            }
        });
    });
}

export async function readFileAsync(
        name: PathLike | number,
        options?: string | { encoding?: string; flag?: string; }
): Promise<string | Buffer> {
    return new Promise<string | Buffer>((resolve, reject) => {
        readFile(name, options, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

export async function readJsonAsync<T>(
        name: PathLike | number,
        options?: string | { encoding?: string; flag?: string; }
): Promise<T> {
    const file = await readFileAsync(name, options);
    return JSON.parse(file.toString()) as T;
}

export * from 'fs';
