"use client";

import type { FindMeSetting } from "./find-me";
import { useSavedSetting } from "./use-saved-setting";

/** The setting, on until loaded otherwise, and a setter that saves it (MAIL-7). */
export const useFindMe = (setting: FindMeSetting) => useSavedSetting(setting, true);
