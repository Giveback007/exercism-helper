import { readFile, writeFile } from "fs/promises";

export const wait = (ms: number) =>
    new Promise(res => setTimeout(res, ms));

export async function readJSON<T>(path: string)  {
    try {
        return JSON.parse(await readFile(path, { encoding: 'utf-8' })) as T;
    } catch(err) {
        logErr(err)
        return null;
    } finally {
        return null;
    }
}

export async function writeJSON(path: string, data: any) {
    try {
        const jsonStr =  JSON.stringify(data)
        await writeFile(path, jsonStr, { encoding: 'utf-8' });
        return true;
    } catch(err) {
        logErr(`Problem writing JSON to path: ${path}`);
        logErr(err);
        return false;
    }
}