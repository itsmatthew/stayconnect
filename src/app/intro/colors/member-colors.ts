// Which colors a group's members already use (docs/specs/group-colors.md, COLOR-4).
// TODO(re-evaluate when member colors come from the server): the fake below is the only source.

export interface MemberColorSource {
  /** Every color these members use in their groups, repeats included, so `suggestGroupColor` can count them. */
  colorsUsedByMembers(memberIds: readonly string[]): Promise<readonly string[]>;
}

export const fakeMemberColors = (byMember: Readonly<Record<string, readonly string[]>>): MemberColorSource => ({
  colorsUsedByMembers: async (memberIds) => memberIds.flatMap((id) => byMember[id] ?? []),
});
