import { ExercismCLI } from "./exercism-cli";
import { logErr, wait } from "./utils";

export class ExercismAPI {
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