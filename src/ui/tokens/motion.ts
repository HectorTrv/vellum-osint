export const easing = {
  editorial: [0.76, 0, 0.24, 1] as [number, number, number, number],
  soft: [0.32, 0.72, 0, 1] as [number, number, number, number],
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
};

export const duration = {
  fast: 0.18,
  med: 0.32,
  slow: 0.6,
  poster: 0.9,
};

export const motionPresets = {
  fadeUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: duration.med, ease: easing.editorial },
  },
  posterReveal: {
    initial: { opacity: 0, y: 64, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: duration.poster, ease: easing.editorial },
  },
  shapeFloat: {
    animate: {
      y: [0, -12, 0],
      rotate: [0, 2, 0],
    },
    transition: { duration: 8, ease: "easeInOut", repeat: Infinity },
  },
};
