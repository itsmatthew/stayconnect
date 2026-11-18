import { DEFAULT_WHO_CAN_DROP, isWhoCanDrop, type MailboxSetting } from "./mailbox-setting";

export const mailboxSettingKey = (suffix: string) => `nowandthen.mailboxFrom.v1${suffix}`;

/** TODO(server): a fake, kept in this browser. */
export function localMailboxSetting(suffix: string): MailboxSetting {
  const key = mailboxSettingKey(suffix);
  return {
    load: async () => {
      try {
        const v = localStorage.getItem(key);
        return isWhoCanDrop(v) ? v : DEFAULT_WHO_CAN_DROP;
      } catch {
        return DEFAULT_WHO_CAN_DROP;
      }
    },
    save: async (setting) => {
      try {
        localStorage.setItem(key, setting);
      } catch {
        // Blocked: the choice still shows until the app closes.
      }
    },
  };
}
