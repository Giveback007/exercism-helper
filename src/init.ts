
import { key } from "./_key";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

{
    // set the serve TZ to UTC
    process.env.TZ = 'UTC';

    const appDir = dirname(fileURLToPath(import.meta.url));
    const joinAppDir = (filePath: string) => join(appDir, filePath);

    const isDev = key.env === 'dev'

    const globals: Globals = {
        env: { ...key, isDev, isProd: !isDev },
        log: console.log,
        logErr: console.error,
        appDir,
        joinAppDir,
    }

    Object.assign(globalThis, globals);

    process.on('uncaughtException', (err) => {
        console.error('An uncaughtException was found, the program will end.');
        console.error(err.stack);

        if (env.isDev) debugger;
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);

        if (env.isDev) debugger;
        process.exit(1);
    });
}