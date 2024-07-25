import { spawn } from "child_process";
import { errorAndExit } from "./utils/error.util";
import { ask } from "./utils/ask.utils";

export class ExercismCLI {
    static runCli = (args: string[] = []) => new Promise<{
        fullMsg: string;
        isOk: boolean;
        exitCode: number | null;
        allData: {
            err?: boolean;
            data: string;
        }[];
    }>(res => {
        const child = spawn("exercism", args);

        const allData: {err?: boolean, data: string}[] = [];

        child.on('error', error => res({
            fullMsg: error.message,
            isOk: false,
            exitCode: null,
            allData: [{ err: true, data: error.message }]
        }))

        child.stdout.on('data', (data: any) =>
            allData.push({data: data + ''}));

        child.stderr.on('data', (data: any) =>
            allData.push({data: data + '', err: true}));

        child.on('close', exitCode => res({
            fullMsg: allData.map(x => x.data).join(''),
            isOk: exitCode === 0,
            exitCode, allData,
        }))
    })

    /** Test if 'Exercism CLI' is installed */
    static test = async () => {
        const { isOk, exitCode, fullMsg } = await this.runCli();
        if (fullMsg.includes('ENOENT')) return false;

        if (fullMsg.includes('your Exercism workspace')) return true;

        logErr({ isOk, exitCode, fullMsg })
        throw errorAndExit({ isOk, exitCode, fullMsg }, 'Unhandled')
    }

    /** Try to add the token and return `true` if succeeds */
    static addToken = async (token: string) => {
        const { isOk, fullMsg, exitCode } = await this.runCli([
            'configure',
            `--token=${token}`,
        ]);

        if (!isOk && fullMsg.includes('is invalid.')) return false
        if (!isOk) errorAndExit({ isOk, exitCode, fullMsg }, 'Unhandled');

        return true;
    }

    static getToken = async () => {
        let token: string | null = null;
        const { isOk, exitCode, fullMsg } = await this.runCli(['configure', 'help']);
        if (!isOk && fullMsg.includes('Error: There is no token configured.')) {
            token = await ask.addToken();
        } else if(!isOk) {
            errorAndExit({ isOk, exitCode, fullMsg }, `getToken(): Exited with code ${exitCode} (no OK)`)
        } else {
            token = fullMsg.split('\n').find(s => s.includes('Token:'))?.split(' ').at(-1) || null;
        }

        if (!token) throw errorAndExit({ isOk, exitCode, fullMsg }, "Couldn't retrieve the token")

        return token
    }

    static getWorkspace = async () => {
        const { isOk, exitCode, fullMsg } = await this.runCli(['workspace']);
        if (!isOk) errorAndExit({ isOk, exitCode, fullMsg }, `getToken(): Exited with code ${exitCode} (no OK)`)

        return fullMsg.replace('\n', '')
    }

    static downloadExr = async (track: string, exercise: string) => {
        const { allData, isOk, exitCode, fullMsg } = await this.runCli([
            "download", `--track=${track}`, `--exercise=${exercise}`
        ])

        const alreadyExists = allData.find(x => x.data.includes('already exists'))
        const notUnlocked = allData.find(x => x.data.includes('not unlocked'))

        // log('--- // --- // ---');
        log(`${isOk ? '✅' : '❌'} [${track}]: "${exercise}":`)
        if (isOk) log(fullMsg)
        else logErr(fullMsg)

        if (alreadyExists) return 'alreadyExists'
        if (notUnlocked) return 'locked'
        if (isOk) return 'ok'

        throw errorAndExit({ isOk, exitCode, fullMsg }, 'Unhandled CLI')
    }
}