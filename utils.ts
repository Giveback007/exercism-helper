import type { ExercismAPI } from './exercism-api';
import type { ExercismCLI } from './exercism-cli';

import { createInterface } from 'readline/promises';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export const log = console.log;

export const logErr = console.error;

export async function loadTrackData(API: ExercismAPI, CLI: ExercismCLI) {
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
            : ex.is_unlocked ? '🌐'
            : '🔒'

        const c1 = status
        const c2 = (idx + 1 + '').padEnd(3)
        const c3 = `${ex.title}`.padEnd(20)

        log(`| ${c1} | ${c2} | ${c3}`)
    },

    exerciseTableKey: () => log(`\n Key:
 ✅ - Completed
 📦 - Downloaded
 🌐 - Available For Download
 🔒 - Locked\n`),

    exerciseTable(exrs: Exercise[]) {
        let titleLen = 0;
        let slugLen = 0;
        exrs.forEach(ex => {
            if (ex.title.length > titleLen) titleLen = ex.title.length;
            if (ex.slug.length > slugLen) slugLen = ex.slug.length;
        })

        exrs.forEach((ex, i) => print.exerciseRow(i, ex));
        print.exerciseTableKey()
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
        log('| Track           | Completed | Downloaded |')
        log('|-----------------|-----------|------------|')
        tracks.forEach(t => {
            const c1 = `${t.title} `.padEnd(15);
            const c2 = `${t.num_completed_exercises} / ${t.num_exercises}`.padEnd(9)
            const c3 = `${trackDict[t.slug]?.downloaded.size || 0}`.padEnd(10)
            log(`| ${c1} | ${c2} | ${c3} |`)
        });
    }
}

export const ask = {
    trackName: async (dict: Dict<TrackData>) => {
        const rl = createInterface({ input: process.stdin, output: process.stdout });

        let trackName: string | null = null
        while (!trackName) {
            log("\ntype 'exit' to quit")
            trackName = (await rl.question(`(From 'joined') Select a 'track':\n`)).toLowerCase()
            if (trackName === 'exit') {
                log('Exiting...')
                process.exit(0)
            }

            if (!dict[trackName]) {
                log(`["${trackName}"] is not in the list of your 'joined' tracks`)
                trackName = null
            }
        }

        rl.close();
        return trackName;
    },

    howManyToDownload: async () => {
        const rl = createInterface({ input: process.stdin, output: process.stdout });

        let numToDownload: number | null = null
        while (!numToDownload) {
            const response = await rl.question(`\nHow many non-completed to download: `)
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