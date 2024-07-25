import type { ExercismAPI } from '../exercism-api';
import { ExercismCLI } from '../exercism-cli';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

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
