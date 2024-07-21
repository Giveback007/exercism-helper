#!/usr/bin/env tsx

import { ExercismAPI } from './exercism-api';
import { ExercismCLI } from './exercism-cli';
import {
    ask,
    loadTrackData, log, logErr, print,
    wait
} from './utils';



log('// -- Exercism Download Helper -- //')
setTimeout(async () => {
    log('Loading tracks...')

    const CLI = new ExercismCLI();
    const API = new ExercismAPI();

    const { tracks, dict } = await loadTrackData(API, CLI);

    while (true) {
        console.clear()
        print.trackTable(tracks, dict);

        const trackName = await ask.trackName(dict)
        const tr = dict[trackName]!

        if (!Object.keys(tr.exercises).length) {
            log(`Loading exercises for: "${tr.track.title}"...\n`)
            const _exrs = await API.getExercises(trackName)

            const completed = _exrs.slice(_exrs.length - tr.track.num_completed_exercises)
            const incomplete = _exrs.slice(0, _exrs.length - tr.track.num_completed_exercises)

            tr.track.num_unlocked_exercises = incomplete.filter(x => x.is_unlocked).length;
            completed.forEach(x => x.is_completed = true);

            const exrs = [...incomplete, ...completed];

            exrs.forEach((ex) => {
                ex.is_downloaded = tr.downloaded.has(ex.slug)
                if (ex.is_completed && ex.is_downloaded) {
                    // ! TODO:
                    // "Deleting completed exercises..."
                }

                tr.exercises[ex.slug] = ex
            })
        }

        const exrs = Object.values(tr.exercises);
        print.exerciseTable(exrs);

        let numToDownload = await ask.howManyToDownload();
        console.clear();

        const outcome = { alreadyExists: 0, locked: 0, ok: 0, failed: 0 }

        const nUnlocked = tr.track.num_unlocked_exercises!
        const nExercises = tr.track.num_exercises;
        if (numToDownload > tr.track.num_unlocked_exercises!) {
            outcome.locked = Math.min(numToDownload - nUnlocked, nExercises - nUnlocked)
            log(`\n${numToDownload} is more that what is 'unlocked', downloading: ${nUnlocked} instead\n`);
            numToDownload = nUnlocked;
        }

        const toDownload = Object.values(tr.exercises).filter(ex => ex.is_unlocked).slice(0, numToDownload);

        log(`Downloading ${toDownload.length} exercises...\n`)
        await Promise.all(toDownload.map(async ex => {
            if (ex.is_downloaded) {
                outcome.alreadyExists++
                return log(`"${ex.title}" is already downloaded (skipped)`)
            }

            try {
                const res = await CLI.downloadExr(tr.track.slug, ex.slug)
                outcome[res]++

                if (res == 'ok') {
                    tr.downloaded.add(ex.slug);
                    tr.exercises[ex.slug]!.is_downloaded = true;
                }
            } catch(err) {
                logErr(err)
                outcome.failed++;
            }
        }));

        print.downloadOutcome(outcome);
        await wait(2500)
    }
});

