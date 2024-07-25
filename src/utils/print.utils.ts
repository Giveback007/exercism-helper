import { join } from "path";
import { makeTable } from "./table.utils";

export const print = {
    exerciseTableKey: () => log(`\n Key:
 ✓ - Completed
 📦 - Downloaded
 🔗 - Available For Download
 🔒 - Locked\n`),

    nextExercise(exr: _Exercise, track: string, ws: string) {
        log(`< Next Exercise >`)
        log(`(${exr.difficulty})`, `"${exr.title}"`)
        log('>>>', exr.blurb)
        log('[ Web-Path ]:', `https://exercism.org/${exr.links.self}`)
        log('[Local-Path]:', join(ws, track, exr.slug))
    },

    exerciseTable(exrs: Exercise[], track: string, ws: string) {
        const data = exrs.map((ex, i) => {
            const status = ex.is_completed ? '✓'
            : ex.is_downloaded ? '📦'
            : ex.is_unlocked ? '🔗'
            : '🔒'

            return [i + 1 + '', ex.slug, status]
        });

        log(makeTable(['#', 'Name / Folder', ''], data))

        print.exerciseTableKey();
        if (exrs[0]) print.nextExercise(exrs[0], track, ws)
    },

    downloadOutcome(outcome: DownloadOutcome) {
        log('\nResult:')
        if (outcome.ok) log(`💾 [${outcome.ok}] Downloaded Ok`)
        if (outcome.completed) log(`🮱  [${outcome.completed}] Already Completed (Skipped)`)
        if (outcome.failed) logErr(`🚫 [${outcome.failed}] Failed (Unhandled reason)`);
        if (outcome.alreadyExists) logErr(`📦 [${outcome.alreadyExists}] Already downloaded (Skipped)`)
        if (outcome.locked) logErr(`🔒 [${outcome.locked}] Locked (Unable to download)`)
    },

    trackTable(tracks: LangTrack[], trackDict: Dict<TrackData>) {
        const data = tracks.map(t => [t.title, `${t.num_completed_exercises} / ${t.num_exercises}`, `${trackDict[t.slug]?.downloaded.size || 0}`])
        log(makeTable(['Track', 'Progress', "Dwl'ed"], data, 'Joined Tracks'))
        log('Add more here: "https://exercism.org/tracks"')
    }
}