import { createContext } from "react";

/**
 * True once the sunrise intro has ended and the app is showing. Things that greet the user, like a waiting gift
 * (docs/specs/gifts.md, GIFT-19), wait for it. False outside the intro, so a screen rendered on its own greets no one.
 */
export const AppShown = createContext(false);
