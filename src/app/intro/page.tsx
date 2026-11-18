import type { Metadata } from "next";
import { Caveat, Fraunces, Homemade_Apple, Karla, Reenie_Beanie, VT323 } from "next/font/google";
import { AppClient } from "./app-client";
import { IntroClient } from "./intro-client";

export const metadata: Metadata = {
  title: "stayconnect",
};

// The home screen's typefaces, from the designer's reference.
// Variable weight plus the optical-size axis: the wordmark's curly "&" is Fraunces' large-opsz glyph.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
});
const karla = Karla({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-karla" });
// Daily 5's handwritten polaroid dates.
const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-caveat" });
// Gifts (docs/specs/gifts.md): Pencil and Script handwriting, and the date stamp's digits, as in the design.
const giftPencil = Reenie_Beanie({ subsets: ["latin"], weight: "400", variable: "--font-gift-pencil" });
const giftScript = Homemade_Apple({ subsets: ["latin"], weight: "400", variable: "--font-gift-script" });
const giftStamp = VT323({ subsets: ["latin"], weight: "400", variable: "--font-gift-stamp" });

export default function IntroPage() {
  return (
    <div className={`${fraunces.variable} ${karla.variable} ${caveat.variable} ${giftPencil.variable} ${giftScript.variable} ${giftStamp.variable}`}>
      <IntroClient home={<AppClient />} />
    </div>
  );
}
