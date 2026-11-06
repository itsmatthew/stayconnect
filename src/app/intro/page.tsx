import type { Metadata } from "next";
import { Caveat, Fraunces, Homemade_Apple, Karla, Shadows_Into_Light } from "next/font/google";
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
const caveat = Caveat({ subsets: ["latin"], weight: "700", variable: "--font-caveat" });
// The gift postcard's other handwriting (docs/specs/gifts.md, GIFT-7).
const giftShadows = Shadows_Into_Light({ subsets: ["latin"], weight: "400", variable: "--font-gift-shadows" });
const giftHomemade = Homemade_Apple({ subsets: ["latin"], weight: "400", variable: "--font-gift-homemade" });

export default function IntroPage() {
  return (
    <div className={`${fraunces.variable} ${karla.variable} ${caveat.variable} ${giftShadows.variable} ${giftHomemade.variable}`}>
      <IntroClient home={<AppClient />} />
    </div>
  );
}
