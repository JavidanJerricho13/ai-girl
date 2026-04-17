const BASE = 8;

export const space = {
  xs:    BASE * 0.5,  // 4
  sm:    BASE,        // 8
  md:    BASE * 1.5,  // 12
  lg:    BASE * 2,    // 16
  xl:    BASE * 2.5,  // 20
  '2xl': BASE * 3,    // 24
  '3xl': BASE * 4,    // 32
  '4xl': BASE * 5,    // 40
};

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string, intensity = 0.3) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 20,
    elevation: 0,
  }),
};
