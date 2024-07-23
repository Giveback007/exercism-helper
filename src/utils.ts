import type { ExercismAPI } from './exercism-api';
import { ExercismCLI } from './exercism-cli';

import { createInterface } from 'readline/promises';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export const log = console.log;

export const logErr = console.error;

export async function loadTrackData(API: ExercismAPI) {
    const CLI = ExercismCLI
    const tracks = (await API.getTracks()).filter(t => t.is_joined);

    const wsPath = await CLI.getWorkspace();
    if (!existsSync(wsPath)) mkdirSync(wsPath);
    const ws = readdirSync(wsPath);
    const wsSet = new Set(ws);

    const dict: Dict<TrackData> = { };
    tracks.forEach(track => {
        const slug = track.slug;
        dict[slug] = { track, exercises: {}, downloaded: new Set() }
        if (!wsSet.has(slug)) return;

        dict[slug].downloaded = new Set(readdirSync(join(wsPath, slug)))
    });

    return { tracks, dict }
}

export const print = {
    exerciseRow(idx: number, ex: Exercise) {
        const status = ex.is_completed ? '✅'
            : ex.is_downloaded ? '📦'
            : ex.is_unlocked ? '🔗'
            : '🔒'

        const c1 = status
        const c2 = (idx + 1 + '').padEnd(3)
        const c3 = `${ex.slug}`.padEnd(20)

        log(`| ${c1} | ${c2} | ${c3}`)
    },

    exerciseTableKey: () => log(`\n Key:
 ✅ - Completed
 📦 - Downloaded
 🔗 - Available For Download
 🔒 - Locked\n`),

    nextExercise(exr: Exercise, track: string, ws: string) {
        log(`< Next Exercise >`)
        log(`(${exr.difficulty})`, `"${exr.title}"`)
        log('>>>', exr.blurb)
        log('[ Web-Path ]:', `https://exercism.org/${exr.links.self}`)
        log('[Local-Path]:',join(ws, track, exr.slug))
    },

    exerciseTable(exrs: Exercise[], track: string, ws: string) {
        exrs.forEach((ex, i) => print.exerciseRow(i, ex));
        print.exerciseTableKey();
        if (exrs[0]?.is_downloaded) print.nextExercise(exrs[0], track, ws)
    },

    downloadOutcome(outcome: DownloadOutcome) {
        log('\nResult:')
        if (outcome.ok) log(`💾 [${outcome.ok}] Downloaded Ok`)
        if (outcome.failed) logErr(`🚫 [${outcome.failed}] Failed (Unhandled reason)`);
        if (outcome.alreadyExists) logErr(`📦 [${outcome.alreadyExists}] Already downloaded (Skipped)`)
        if (outcome.locked) logErr(`🔒 [${outcome.locked}] Locked (Unable to download)`)
    },

    trackTable(tracks: LangTrack[], trackDict: Dict<TrackData>) {
        log("< Joined Tracks >")
        log("/--------------------------------------\\")
        log("| Track           | Progress  | Dwl'ed |")
        log("|-----------------|-----------|--------|")
        tracks.forEach(t => {
            const c1 = `${t.title} `.padEnd(15);
            const c2 = `${t.num_completed_exercises} / ${t.num_exercises}`.padEnd(9)
            const c3 = `${trackDict[t.slug]?.downloaded.size || 0}`.padEnd(6)
            log(`| ${c1} | ${c2} | ${c3} |`)
        });
        log("\\--------------------------------------/")
        log('Add more here: "https://exercism.org/tracks"')
    }
}

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
            const response = await rl.question(`How many non-completed to download: `);
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