type Dict<T> = { [P: string]: T; };

type TrackData = {
  track: LangTrack;
  exercises: Dict<Exercise[]>;
  downloaded: Set<string>;
}

type DownloadOutcome = {
  alreadyExists: number;
  locked: number;
  ok: number;
  failed: number;
}

interface LangTrack {
    slug: string;
    title: string;
    course: boolean;
    num_concepts: number;
    num_exercises: number;
    web_url: string;
    icon_url: string;
    tags: string[];
    last_touched_at: string;
    is_new: boolean;
    links: {
        self: string;
        exercises: string;
        concepts: string;
    };
    is_joined?: boolean;
    num_learnt_concepts: number;
    num_completed_exercises: number;
    num_solutions: number;
    has_notifications: boolean;
}

interface Exercise {
  slug: string;
  type: string;
  title: string;
  icon_url: string;
  difficulty: string;
  blurb: string;
  is_external: boolean;
  is_unlocked: boolean;
  is_recommended: boolean;
  links: {
    self: string;
  };

  is_completed?: boolean;
  is_downloaded?: boolean;
}