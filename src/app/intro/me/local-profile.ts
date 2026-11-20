import { emptyProfile, validProfile, type ProfileStore } from "./profile";

export const profileKey = (suffix: string) => `nowandthen.profile.v1${suffix}`;

/** TODO(server): a fake, kept in this browser until `GET`/`PUT /api/me/profile`. */
export function localProfile(suffix: string): ProfileStore {
  const key = profileKey(suffix);
  return {
    load: async () => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? validProfile(JSON.parse(raw)) : emptyProfile();
      } catch {
        return emptyProfile();
      }
    },
    save: async (p) => {
      try {
        localStorage.setItem(key, JSON.stringify(p));
      } catch {
        // Blocked: the change still shows until the app closes.
      }
    },
  };
}
