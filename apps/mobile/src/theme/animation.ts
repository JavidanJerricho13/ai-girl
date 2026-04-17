export const timing = {
  instant:  100,
  fast:     200,
  normal:   300,
  slow:     500,
  dramatic: 800,
};

export const springConfig = {
  snappy: { damping: 20, stiffness: 300 },
  gentle: { damping: 15, stiffness: 150 },
  bouncy: { damping: 10, stiffness: 200 },
  heavy:  { damping: 25, stiffness: 400 },
};

export const easingCurve = {
  enter: [0.25, 0.1, 0.25, 1.0] as const,
  exit:  [0.55, 0.0, 1.0, 0.45] as const,
  move:  [0.37, 0.0, 0.63, 1.0] as const,
};
