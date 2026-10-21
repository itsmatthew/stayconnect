"use client";

import { useState } from "react";
import { OrnamentSheet } from "@/components/home/ornament-sheet";
import type { CircleGroup } from "@/components/home/types";
import type { CropArea } from "../photo-file";
import { usePickedPhoto } from "../use-picked-photo";
import { CAPTION_MAX } from "./ornaments";
import type { OrnamentEdit } from "./use-ornaments";

/** Changing a group's ornaments (docs/specs/home.md, HOME-14–17). `groups` already carry the changes. */
export type OrnamentControls = {
  lineOf: (groupId: string, index: number) => string | undefined;
  canUndo: (groupId: string, index: number) => boolean;
  onSave: (groupId: string, index: number, edit: OrnamentEdit) => void;
  onUndo: (groupId: string, index: number) => void;
  /** Downscales a picked photo before it's previewed and cropped. */
  decode: (f: File) => Promise<Blob>;
  /** Cuts the cropper's square out of the downscaled photo (docs/specs/group-logo.md, LOGO-7). */
  crop: (image: Blob, area: CropArea | undefined, max: number) => Promise<Blob>;
};

export const noOrnaments: OrnamentControls = {
  lineOf: () => undefined,
  canUndo: () => false,
  onSave: () => {},
  onUndo: () => {},
  decode: async (f) => f,
  crop: async (image) => image,
};

/** Saved ornament photos are at most this big (HOME-14). */
const ORNAMENT_MAX = 1024;

/**
 * The ornament sheet for one group, opened on `index`, with the photo picked in it until Save.
 * Home opens it from a tree, the group profile from an ornament's "Edit" (docs/specs/group-profile.md, GP-4).
 */
export function OrnamentSheetClient({ group, index, controls, onClose }: { group: CircleGroup; index: number; controls: OrnamentControls; onClose: () => void }) {
  const [selected, setSelected] = useState(index);
  const { pending, choose, drop } = usePickedPhoto(controls.decode);
  const select = (i: number) => {
    drop();
    setSelected(i);
  };
  const close = () => {
    drop();
    onClose();
  };
  return (
    <OrnamentSheet
      groupName={group.name}
      rim={group.palette.rim}
      ornaments={
        group.memories.map((memory, i) => ({
          memory,
          line: controls.lineOf(group.id, i),
          canUndo: controls.canUndo(group.id, i),
        })) as unknown as Parameters<typeof OrnamentSheet>[0]["ornaments"]
      }
      selected={selected}
      preview={pending?.url}
      captionMax={CAPTION_MAX}
      onSelect={select}
      onPickFile={choose}
      onSave={async (caption, area) => {
        const picked = pending?.image;
        close();
        const image = picked && (await controls.crop(picked, area, ORNAMENT_MAX));
        controls.onSave(group.id, selected, { image, caption });
      }}
      onUndo={() => {
        controls.onUndo(group.id, selected);
        drop();
      }}
      onCancel={close}
    />
  );
}
