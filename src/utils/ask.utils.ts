import { createInterface } from 'readline/promises';
import { ExercismCLI } from "../exercism-cli";

export const ask = {
    addToken: async (): Promise<string> => {
        const CLI = ExercismCLI;
        const rl = createInterface({ input: process.stdin, output: process.stdout });

        let isOk = false;
        while (!isOk) {
            log('1. Goto: https://exercism.org/settings/api_cli');
            log('2. Copy the "AUTHENTICATION TOKEN"');
            const response = await rl.question(`3. Add the token here: `)

            isOk = await CLI.addToken(response);
            if (!isOk) logErr(`\nERROR: The token '${response}' is invalid.\n`)
        }

        rl.close();
        return await CLI.getToken();
    },

    trackName: async (dict: Dict<TrackData>) => {
        const rl = createInterface({ input: process.stdin, output: process.stdout });

        let trackName: string | null = null;
        while (!trackName) {
            log("\ntype 'exit' to quit");
            trackName = (await rl.question(`(From 'joined') Select a 'track':\n`)).toLowerCase();
            if (trackName === 'exit') exit();

            if (!dict[trackName]) {
                log(`["${trackName}"] is not in the list of your 'joined' tracks`);
                trackName = null;
            }
        }

        rl.close();
        return trackName;
    },

    howManyToDownload: async () => {
        const rl = createInterface({ input: process.stdin, output: process.stdout });

        let numToDownload: number | null = null;
        while (numToDownload === null) {
            log("\ntype 'exit' to quit");
            const response = await rl.question(`Up to what number to download: `);
            if (response === 'exit') exit();

            numToDownload = Number(response);
            if (numToDownload !== numToDownload) {
                log(`"${response}" is an invalid number, please try again...`)
                numToDownload = null
            }
        }

        rl.close();
        return numToDownload;
    }
}

function exit() {
    console.clear();
    log('Exiting App...');
    process.exit(0);
}