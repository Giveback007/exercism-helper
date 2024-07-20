export const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export const log = console.log;

export const logErr = console.error;

export function printExrc(idx: number, ex: Exercise) {
    const status = ex.is_completed ? '✅'
        : ex.is_downloaded ? '📦'
        : ex.is_unlocked ? '🌐'
        : '🔒'

    const c1 = status
    const c2 = (idx + 1 + '').padEnd(3)
    const c3 = `${ex.title}`.padEnd(20)

    log(`| ${c1} | ${c2} | ${c3}`)
}

export function printOutcome(outcome: DownloadOutcome) {
    log('\nResult:')
    if (outcome.ok) log(`💾 [${outcome.ok}] Downloaded Ok`)
    if (outcome.failed) logErr(`🚫 [${outcome.failed}] Failed (Unhandled reason)`);
    if (outcome.alreadyExists) logErr(`📦 [${outcome.alreadyExists}] Already downloaded (Skipped)`)
    if (outcome.locked) logErr(`🔒 [${outcome.locked}] Locked (Unable to download)`)
}

export function printTracks(tracks: LangTrack[], trackDict: Dict<TrackData>) {
    log("\n < Joined Tracks >")
    log('| Track           | Completed | Downloaded |')
    log('|-----------------|-----------|------------|')
    tracks.forEach(t => {
        const c1 = `${t.title} `.padEnd(15);
        const c2 = `${t.num_completed_exercises} / ${t.num_exercises}`.padEnd(9)
        const c3 = `${trackDict[t.slug]?.downloaded.size || 0}`.padEnd(10)
        log(`| ${c1} | ${c2} | ${c3} |`)
    });
}