// TODO(re-evaluate when the real homepage components are built): replace this static screenshot with the real home UI.

type Image = { src: string; srcSet?: string };
type MobileImage = Image & { width: number; height: number; sizes?: string };

type HomePlaceholderProps = {
  /** Wide screens (≥ 768px): shown whole, over a blurred copy of itself. */
  desktop: Image;
  /** Phone image; also the fallback <img>. */
  mobile: MobileImage;
};

export function HomePlaceholder({ desktop, mobile }: HomePlaceholderProps) {
  return (
    <>
      {/* Wide screens: a blurred, darkened, enlarged copy fills the space the uncropped image leaves.
          Small sizes hint because it's blurred; lazy so phones (display: none) never fetch it. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- srcSet is already optimized via getImageProps in the page */}
      <img
        src={desktop.src}
        srcSet={desktop.srcSet}
        sizes="25vw"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 hidden h-full w-full scale-125 object-cover blur-2xl brightness-50 md:block"
      />
      <picture>
        <source media="(min-width: 768px)" srcSet={desktop.srcSet ?? desktop.src} sizes="100vw" />
        <img
          {...mobile}
          alt="Home screen, your circles tab"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover md:object-contain"
        />
      </picture>
    </>
  );
}
