#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline/promises';

// const loadTracks = ['go', 'python', 'sqlite', 'bash', 'lua'] as const
const log = console.log;
const logErr = console.error;

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

class ExercismCLI {
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
        log('--- // --- // ---')

        if (alreadyExists) return 'alreadyExists'
        if (notUnlocked) return 'locked'
        if (isOk) return 'ok'

        throw 'Unhandled CLI'
    }
}

class ExercismAPI {
    private baseURL = "https://exercism.org/api/v2/"
    private token: string | null = null;
    constructor() {
        const exercismCLI = new ExercismCLI();

        (async () => {
            this.token = await exercismCLI.getToken()
        })();
    }

    get = async <T>(resource: string) => {
        while (!this.token) await wait(100);

        const res = await fetch(this.baseURL + resource, {
            headers: {
              Authorization: `Bearer ${this.token}`
            }
        })

        if (!res.ok) return { isOk: false, data: res } as const

        try {
            return { isOk: true, data: await res.json() as T } as const
        } catch(err) {
            logErr(err)
            return { isOk: false, data: err as Error } as const
        }
    }

    getTracks = async (filter?: string[]) => {
        const res = await this.get<{ tracks: LangTrack[] }>('tracks');
        if (!res.isOk) throw "Couldn't get the track list";

        const tracks = res.data.tracks
        const set = new Set(filter)

        return filter ? tracks.filter(x => set.has(x.slug)) : tracks;
    }

    getExercises = async (track: string) => {
        const res = await this.get<{ exercises: Exercise[] }>(`tracks/${track}/exercises`);
        if (!res.isOk) throw `Couldn't get the exercise list for [${track}]`;

        return res.data.exercises;
    }

}

const CLI = new ExercismCLI();
const API = new ExercismAPI();

log('// CLI Starting ... //')
setTimeout(async () => {
    const _tracks = await API.getTracks();

    const tracks = { enr: [] as LangTrack[], not: [] as LangTrack[] };
    _tracks.forEach(t => tracks[t.is_joined ? 'enr' : 'not'].push(t));

    const wsPath = await CLI.getWorkspace();
    if (!existsSync(wsPath)) mkdirSync(wsPath);
    const ws = readdirSync(wsPath);
    const wsSet = new Set(ws);

    const dict: Dict<TrackData> = { };

    tracks.enr.forEach(track => {
        const slug = track.slug;
        dict[slug] = { track, exercises: {}, downloaded: new Set() }
        if (!wsSet.has(slug)) return;

        dict[slug].downloaded = new Set(readdirSync(join(wsPath, slug)))
    })

    log("\n < Joined Tracks >")
    log('| Track           | Completed | Downloaded |')
    log('|-----------------|-----------|------------|')
    tracks.enr.forEach(t => {
        const c1 = `${t.title} `.padEnd(15);
        const c2 = `${t.num_completed_exercises} / ${t.num_exercises}`.padEnd(9)
        const c3 = `${dict[t.slug]?.downloaded.size || 0}`.padEnd(10)
        log(`| ${c1} | ${c2} | ${c3} |`)
    });

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    let trackName: string | null = null

    while (!trackName) {
        trackName = (await rl.question(`\n(From 'joined') Select a 'track':\n`)).toLowerCase()
        if (!dict[trackName]) {
            log(`["${trackName}"] is not in the list of your 'joined' tracks`)
            trackName = null
        }
    }

    console.log('Loading...\n')
    const track = dict[trackName]!
    const _exrs = await API.getExercises(trackName)
    const completed = _exrs.slice(_exrs.length - track.track.num_completed_exercises)
    const incomplete = _exrs.slice(0, _exrs.length - track.track.num_completed_exercises)
    const unlocked = incomplete.filter(x => x.is_unlocked);

    completed.forEach((x) => x.is_completed = true);

    const exrs = [...incomplete, ...completed];
    exrs.forEach((ex, i) => {
        ex.is_downloaded = track.downloaded.has(ex.slug)
        if (ex.is_completed && ex.is_downloaded) {
            // ! TODO:
            // "Deleting completed exercises..."
        }

        printExrc(i, ex)
    })

    log(`\n Key:
 ✅ - Completed
 📦 - Downloaded
 🌐 - Available For Download
 🔒 - Locked\n`);

    let numToDownload: number | null = null

    while (!numToDownload) {
        const response = await rl.question(`\nHow many non-completed to download: `)
        numToDownload = Number(response);
        if (numToDownload !== numToDownload) {
            log(`"${response}" is an invalid number, please try again...`)
            numToDownload = null
        }
    }

    rl.close()

    if (numToDownload > unlocked.length) {
        log(`${numToDownload} is more that what is unlocked, downloading: ${unlocked.length} instead`);
        numToDownload = unlocked.length;
    }

    const toDownload = unlocked.slice(0, numToDownload);
    const outcome = { alreadyExists: 0, locked: 0, ok: 0, failed: 0 }
    toDownload.forEach(async ex => {
        if (ex.is_downloaded) return log(`"${ex.title}" is already downloaded (skipped)`)

        try {
            const x = await CLI.downloadExr(track.track.slug, ex.slug)
            outcome[x]++
        } catch(err) {
            logErr(err)
            outcome.failed++;
        }
    });

    printOutcome(outcome);
});

function printExrc(idx: number, ex: Exercise) {
    const status = ex.is_completed ? '✅'
        : ex.is_downloaded ? '📦'
        : ex.is_unlocked ? '🌐'
        : '🔒'

    const c1 = status
    const c2 = (idx + '').padEnd(3)
    const c3 = `${ex.title}`.padEnd(20)

    log(`| ${c1} | ${c2} | ${c3}`)
}

function printOutcome(outcome: DownloadOutcome) {
    if (outcome.ok) log(`💾 Downloaded: ${outcome.ok}`)
    if (outcome.failed) logErr(`🚫 Failed: ${outcome.failed}`);
    if (outcome.alreadyExists) logErr(`📌 Already downloaded: ${outcome.alreadyExists}`)
    if (outcome.locked) logErr(`🔒 Locked: ${outcome.locked}`)
}