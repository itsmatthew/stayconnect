import type { Metadata } from "next";
import { getImageProps } from "next/image";
import { HomePlaceholder } from "@/components/intro/home-placeholder";
import { IntroClient } from "./intro-client";

export const metadata: Metadata = {
  title: "stayconnect",
};

export default function IntroPage() {
  // Art direction: phone and wide screens get different screenshots (see docs/specs/intro.md, INTRO-7/9).
  const common = { alt: "", sizes: "100vw" };
  const {
    props: { src: desktopSrc, srcSet: desktopSrcSet },
  } = getImageProps({ ...common, src: "/your-circles-desktop.png", width: 1312, height: 816 });
  const {
    props: { src, srcSet, width, height, sizes },
  } = getImageProps({ ...common, src: "/your-circles.jpg", width: 1170, height: 2532 });

  return (
    <IntroClient
      home={
        <HomePlaceholder
          desktop={{ src: desktopSrc, srcSet: desktopSrcSet }}
          mobile={{ src, srcSet, width: Number(width), height: Number(height), sizes }}
        />
      }
    />
  );
}
