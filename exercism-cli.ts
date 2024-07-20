import { spawn } from "child_process";
import { logErr, log } from "./utils";

export class ExercismCLI {
    runCli = (args: string[] = []) => new Promise<{
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

        child.stdout.on('data', (data: any) =>
            allData.push({data: data + ''}));

        child.stderr.on('data', (data: any) =>
            allData.push({data: data + '', err: true}));

        child.on('close', exitCode => res({
            fullMsg: allData.map(x => x.data).join(''),
            isOk: exitCode === 0,
            exitCode, allData,
        }))
    });

    getToken = async () => {
        const { isOk, exitCode, fullMsg } = await this.runCli(['configure', 'help']);
        if (!isOk) throw `getToken(): Exited with code ${exitCode} (no OK)`;

        const token = fullMsg.split('\n').find(s => s.includes('Token:'))?.split(' ').at(-1)
        if (!token) throw "Couldn't retrieve the token"

        return token
    }


    getWorkspace = async () => {
        const { isOk, exitCode, fullMsg } = await this.runCli(['workspace']);
        if (!isOk) throw `getToken(): Exited with code ${exitCode} (no OK)`;

        return fullMsg.replace('\n', '')
    }

    downloadExr = async (track: string, exercise: string) => { // 'ok' | 'alreadyExists' | 'locked'
        const { allData, isOk, fullMsg } = await this.runCli([
            "download",
            `--track=${track}`,
            `--exercise=${exercise}`
        ])

        const alreadyExists = allData.find(x => x.data.includes('already exists'))
        const notUnlocked = allData.find(x => x.data.includes('not unlocked'))

        log('--- // --- // ---')
        log(`${isOk ? '✅' : '❌'} [${track}]: "${exercise}":`)
        if (isOk) log(fullMsg)
        else logErr(fullMsg)

        if (alreadyExists) return 'alreadyExists'
        if (notUnlocked) return 'locked'
        if (isOk) return 'ok'

        throw 'Unhandled CLI'
    }
}