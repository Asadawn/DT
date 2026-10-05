export const BREAKPOINTS = {
  smallMobile: 360,
  mobile: 480,
  tablet: 768,
  smallDesktop: 1024,
  desktop: 1280,
  largeDesktop: 1440,
  ultraWide: 1920,
} as const;

export const MEDIA_QUERIES = {
  upToMobile: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,
  upToTablet: `(max-width: ${BREAKPOINTS.smallDesktop - 1}px)`,
  upToSmallDesktop: `(max-width: ${BREAKPOINTS.desktop - 1}px)`,
  desktopUp: `(min-width: ${BREAKPOINTS.smallDesktop}px)`,
  largeDesktopUp: `(min-width: ${BREAKPOINTS.largeDesktop}px)`,
} as const;
