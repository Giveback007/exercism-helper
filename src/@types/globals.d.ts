type Key = {
    env: 'dev' | 'prod';
}

type ENV = {
    isProd: boolean;
    isDev: boolean;
}

const env: Key & ENV;
const appDir: string;
function log(...message: any[]): void;
function logErr(...message: any[]): void;
function joinAppDir(filePath: string): string;

type Globals = {
    env: typeof env;
    appDir: typeof appDir;
    log: typeof log;
    logErr: typeof logErr;
    joinAppDir: typeof joinAppDir;
}

