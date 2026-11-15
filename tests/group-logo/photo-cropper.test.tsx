import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PhotoCropper } from "@/components/shared/photo-cropper";

afterEach(cleanup);

// Drag and pinch need real pointer and layout events, so they're checked by hand on a phone (LOGO-7).
describe("the round cropper (LOGO-7)", () => {
  it("shows the photo", () => {
    render(<PhotoCropper src="blob:pic" alt="New photo" ring="#C8432B" onAreaChange={() => {}} />);
    expect(screen.getByRole("img", { name: "New photo" }).getAttribute("src")).toBe("blob:pic");
  });

  it("has a Zoom slider from 1× to 4× that zooms the photo", () => {
    render(<PhotoCropper src="blob:pic" alt="New photo" ring="#C8432B" onAreaChange={() => {}} />);
    const zoom = screen.getByRole("slider", { name: "Zoom" }) as HTMLInputElement;
    expect([zoom.min, zoom.max, zoom.value]).toEqual(["1", "4", "1"]);
    fireEvent.change(zoom, { target: { value: "2.5" } });
    expect(zoom.value).toBe("2.5");
    expect((screen.getByRole("img", { name: "New photo" }) as HTMLElement).style.transform).toContain("scale(2.5)");
  });

  it("once the photo is measured: a round crop area, and the kept square is reported", () => {
    const onAreaChange = vi.fn();
    const { container } = render(<PhotoCropper src="blob:pic" alt="New photo" ring="#C8432B" onAreaChange={onAreaChange} />);
    const img = screen.getByRole("img", { name: "New photo" }) as HTMLImageElement;
    const box = (w: number, h: number) => () => ({ width: w, height: h, top: 0, left: 0, right: w, bottom: h, x: 0, y: 0, toJSON: () => ({}) });
    (container.querySelector(".reactEasyCrop_Container") as HTMLElement).getBoundingClientRect = box(300, 300);
    img.getBoundingClientRect = box(450, 300);
    Object.defineProperties(img, { naturalWidth: { value: 1200 }, naturalHeight: { value: 800 }, offsetWidth: { value: 450 }, offsetHeight: { value: 300 } });
    fireEvent.load(img);
    expect(container.querySelector(".reactEasyCrop_CropAreaRound")).toBeTruthy();
    expect(onAreaChange).toHaveBeenCalled();
    const area = onAreaChange.mock.calls.at(-1)![0];
    expect(area.width).toBe(area.height);
  });
});
