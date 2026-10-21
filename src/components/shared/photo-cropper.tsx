import { useState, type CSSProperties } from "react";
import Cropper from "react-easy-crop";
import { CREAM, NAVY, s } from "../home/units";

/** The kept part of the photo, in the photo's own pixels. */
export type CropArea = { x: number; y: number; width: number; height: number };

type PhotoCropperProps = {
  src: string;
  alt: string;
  /** The circle's rim colour: the group's or the ornament's. */
  ring: string;
  onAreaChange: (area: CropArea) => void;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * A round cropper (docs/specs/group-logo.md, LOGO-7): drag or touch to position, pinch, scroll or the Zoom slider to zoom.
 * The photo always covers the circle. Used for group logos and ornaments.
 */
export function PhotoCropper({ src, alt, ring, onAreaChange }: PhotoCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s(10), alignSelf: "stretch" }}>
      <div style={{ position: "relative", width: s(220), height: s(220), borderRadius: s(16), overflow: "hidden", background: NAVY, touchAction: "none" }}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => onAreaChange(pixels)}
          mediaProps={{ alt }}
          style={{ cropAreaStyle: { border: `${s(3)} solid ${ring}`, color: "rgba(27,31,52,.6)" } as CSSProperties }}
        />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: s(10), alignSelf: "stretch", fontSize: s(13), fontWeight: 800, color: NAVY }}>
        Zoom
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: ring, background: CREAM }}
        />
      </label>
    </div>
  );
}
