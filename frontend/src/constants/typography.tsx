// HustleHub Typography System

export const typography = {
  // Font Families (using system fonts for better performance)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  } as const,
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// Pre-defined text styles
export const textStyles = {
  // Headings
  h1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.lineHeight.tight,
  },
  h4: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.lineHeight.normal,
  },
  h5: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
  },
  
  // Body
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.relaxed,
  },
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  bodySmall: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  
  // Caption
  caption: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  captionSmall: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  
  // Button
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.lineHeight.tight,
  },
  buttonSmall: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.lineHeight.tight,
  },
  
  // Label
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
  },
};

export default typography;
