// Reading the drop sheet's one search box (docs/specs/mail.md, MAIL-2). Plain TypeScript.

export type FindQuery = { kind: "empty" } | { kind: "phone"; /** E.164: "+15550123456". */ phone: string } | { kind: "username"; username: string } | { kind: "name"; text: string };

/** A phone number in E.164, or undefined. Ten digits are taken as US numbers; anything shorter than ten isn't a number. */
export function normalizePhone(raw: string): string | undefined {
  const plus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return undefined;
  if (plus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

/** Common country codes, longest first, so "+44…" splits as 44 rather than 4. */
const COUNTRY_CODES = ["353", "852", "971", "44", "61", "33", "49", "81", "86", "91", "52", "55", "34", "39", "64", "27", "7"];

/** "(555) 012-3456" for US numbers; other countries as "+44 2079460958". */
export function formatPhone(e164: string): string {
  const us = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  if (us) return `(${us[1]}) ${us[2]}-${us[3]}`;
  const code = COUNTRY_CODES.find((c) => e164.startsWith(`+${c}`));
  return code ? `+${code} ${e164.slice(code.length + 1)}` : e164;
}

/** A number if it looks like one, an @username if it starts with @, a name otherwise. */
export function parseFindQuery(raw: string): FindQuery {
  const text = raw.trim();
  if (!text) return { kind: "empty" };
  if (/^[+\d(][\d\s().-]*$/.test(text)) {
    const phone = normalizePhone(text);
    if (phone) return { kind: "phone", phone };
  }
  if (text.startsWith("@")) return { kind: "username", username: text.slice(1).toLowerCase() };
  return { kind: "name", text: text.toLowerCase() };
}
