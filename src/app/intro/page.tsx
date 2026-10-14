import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";
import { HomeClient } from "./home-client";
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

export default function IntroPage() {
  return (
    <div className={`${fraunces.variable} ${karla.variable}`}>
      <IntroClient home={<HomeClient />} />
    </div>
  );
}
