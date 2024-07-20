#!/usr/bin/env tsx

import { ExercismAPI } from './exercism-api';
import { ExercismCLI } from './exercism-cli';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline/promises';
import { log, logErr, printExrc, printOutcome, printTracks } from './utils';

log('// -- Exercism Download Helper -- //')
setTimeout(async () => {
    log('Loading tracks...')

    const CLI = new ExercismCLI();
    const API = new ExercismAPI();

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

    printTracks(tracks, dict)

    const rl = createInterface({ input: process.stdin, output: process.stdout });

    let trackName: string | null = null
    while (!trackName) {
        trackName = (await rl.question(`\n(From 'joined') Select a 'track':\n`)).toLowerCase()
        if (!dict[trackName]) {
            log(`["${trackName}"] is not in the list of your 'joined' tracks`)
            trackName = null
        }
    }

    const track = dict[trackName]!
    log(`Loading exercises for: "${track.track.title}"...\n`)

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

    rl.close();
    const outcome = { alreadyExists: 0, locked: 0, ok: 0, failed: 0 }

    if (numToDownload > unlocked.length) {
        outcome.locked = Math.min(numToDownload - unlocked.length, exrs.length - unlocked.length)
        log(`\n${numToDownload} is more that what is 'unlocked', downloading: ${unlocked.length} instead\n`);
        numToDownload = unlocked.length;
    }

    const toDownload = unlocked.slice(0, numToDownload);

    await Promise.all(toDownload.map(async ex => {
        if (ex.is_downloaded) {
            outcome.alreadyExists++
            return log(`"${ex.title}" is already downloaded (skipped)`)
        }

        try {
            const res = await CLI.downloadExr(track.track.slug, ex.slug)
            outcome[res]++
        } catch(err) {
            logErr(err)
            outcome.failed++;
        }
    }));

    printOutcome(outcome);
});

