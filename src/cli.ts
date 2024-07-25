#!/usr/bin/env tsx

import './init'
import { ExercismAPI } from './exercism-api';
import { ExercismCLI } from './exercism-cli';
import { loadTrackData, wait } from './utils/app.utils';
import { ask } from './utils/ask.utils';
import { print } from './utils/print.utils';

log('// -- Exercism Download Helper -- //')
wait(0).then(async () => {
    log('Loading tracks...')

    const CLI = ExercismCLI;
    if (!await CLI.test()) {
        console.clear()
        logErr('Please make sure Exercism is installed:');
        log('Goto: https://exercism.org/docs/using/solving-exercises/working-locally#h-installing-the-cli');
        process.exit(1)
    }

    const token = await CLI.getToken();
    const ws = await CLI.getWorkspace();

    const API = new ExercismAPI(token);

    const { tracks, dict } = await loadTrackData(API);

    while (true) {
        console.clear();
        print.trackTable(tracks, dict);

        const trackName = await ask.trackName(dict);
        const tr = dict[trackName]!

        if (!Object.keys(tr.exercises).length) {
            log(`Loading exercises for: "${tr.track.title}"...\n`);
            const [exrsOrdered, _exrs] = await Promise.all([
                // To have the correct order of the exercises calling the api without a token is required
                API.getExercises(trackName, false),
                // Completed exercises are ordered at the end when API is given a token
                API.getExercises(trackName),
            ]);

            const exrsMap = new Map<string, Exercise>(exrsOrdered.map((x, idx) => [x.slug, {
                ...x, idx, is_completed: false, is_downloaded: false,
            }]))

            const completed = _exrs.slice(_exrs.length - tr.track.num_completed_exercises);
            const incomplete = _exrs.slice(0, _exrs.length - tr.track.num_completed_exercises);

            tr.track.num_unlocked_exercises = incomplete.filter(x => x.is_unlocked).length;
            completed.forEach(x => exrsMap.get(x.slug)!.is_completed = true);

            exrsMap.forEach((ex) => {
                ex.is_downloaded = tr.downloaded.has(ex.slug);
                if (ex.is_completed && ex.is_downloaded) {
                    // ! TODO:
                    // "Deleting completed exercises..."
                }

                tr.exercises[ex.slug] = ex;
            })
        }

        const exrs = Object.values(tr.exercises);
        print.exerciseTable(exrs, tr.track.slug, ws);

        let toNumToDwld = await ask.howManyToDownload();
        console.clear();

        const outcome = { alreadyExists: 0, locked: 0, ok: 0, failed: 0, completed: 0 };

        const nUnlocked = tr.track.num_unlocked_exercises!
        const nExercises = tr.track.num_exercises;
        if (toNumToDwld > tr.track.num_unlocked_exercises!) {
            outcome.locked = Math.min(toNumToDwld - nUnlocked, nExercises - nUnlocked)
            log(`\n${toNumToDwld} is more that what is 'unlocked', downloading: ${nUnlocked} instead\n`);
            toNumToDwld = nUnlocked;
        }

        const toDownload = Object.values(tr.exercises).filter(ex => ex.is_unlocked).slice(0, toNumToDwld);

        log(`Starting exercises downloads...\n`)
        await Promise.all(toDownload.map(async ex => {
            if (ex.is_completed) {
                outcome.completed++
                return;
            }
            if (ex.is_downloaded) {
                outcome.alreadyExists++
                return;
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