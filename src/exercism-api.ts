const logErr = console.error;

export class ExercismAPI {
    private baseURL = "https://exercism.org/api/v2/"
    constructor(private token: string) {}

    get = async <T>(resource: string) => {
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
