import { z } from "zod";

/** BE-15: 1 to 80 characters after trimming. Extra fields are dropped. */
export const createGroupBody = z.object({ name: z.string().trim().min(1).max(80) });
