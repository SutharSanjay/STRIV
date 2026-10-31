export type ColorScheme = 'light' | 'dark';

const lightColors = {
  background: '#F6F1EA',
  backgroundSecondary: '#FFF9F4',
  surface: '#FFFFFF',
  label: '#1C140F',
  secondaryLabel: '#6E5C50',
  tertiaryLabel: '#A08C80',
  separator: '#E7DCD2',
  accent: '#E85D04',
  accentSoft: '#FFE8D6',
  accentLabel: '#FFFFFF',
  highlight: '#F4A261',
  danger: '#C23B22',
  success: '#1F7A4D',
} as const;

const darkColors = {
  background: '#0C0F14',
  backgroundSecondary: '#161B22',
  surface: '#1A212C',
  label: '#F8F4EF',
  secondaryLabel: '#C9BDB3',
  tertiaryLabel: '#8F847C',
  separator: '#2C3542',
  accent: '#FF7A2F',
  accentSoft: '#3A2418',
  accentLabel: '#1A0C04',
  highlight: '#FFC46B',
  danger: '#FF6B5A',
  success: '#3DDC97',
} as const;

export type ThemeColors = {
  [Key in keyof typeof lightColors]: string;
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
} as const;

export const motion = {
  fast: 180,
  normal: 320,
  slow: 520,
} as const;

export const typography = {
  display: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },
  largeTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
  },
  callout: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  metric: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
} as const;

export const tabBarClearance = 120;

export const dimensions = {
  minTouchTarget: 48,
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  },
} as const;

type Shadow = {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
};

const noShadow: Shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 0 },
  elevation: 0,
};

function shadowsFor(scheme: ColorScheme): { none: Shadow; card: Shadow } {
  if (scheme === 'dark') {
    return {
      none: noShadow,
      card: {
        shadowColor: '#000000',
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
      },
    };
  }
  return {
    none: noShadow,
      card: {
        shadowColor: '#E85D04',
        shadowOpacity: 0.14,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 4,
      },
  };
}

export type AppTheme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  motion: typeof motion;
  typography: typeof typography;
  dimensions: typeof dimensions;
  shadows: { none: Shadow; card: Shadow };
};

export function resolveScheme(scheme: string | null | undefined): ColorScheme {
  return scheme === 'dark' ? 'dark' : 'light';
}

export function createTheme(scheme: ColorScheme): AppTheme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    motion,
    typography,
    dimensions,
    shadows: shadowsFor(scheme),
  };
}
