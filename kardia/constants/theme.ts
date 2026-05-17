// ─── Kardia Design System ─────────────────────────────────────────────────────
// Colors and typography tokens derived from the Figma design.

export const Colors = {
  // ── Primary palette ──
  burgundy:   '#5C1A2B',   // Deep dark — advocacy card bg, strong accents
  wine:       '#8C3A4D',   // Primary interactive — active tabs, buttons, headings
  blush:      '#F3D5D5',   // Light accent — badges, highlights
  ivory:      '#F5EFE6',   // Card backgrounds, input fields
  cream:      '#FBF7F0',   // Page background

  // ── Text ──
  textDark:   '#3D1119',   // Primary body text
  textWine:   '#8C3A4D',   // Subheadings and highlighted text
  textMuted:  'rgba(0,0,0,0.5)',  // Date lines, secondary info
  textLight:  '#FFFFFF',   // Text on dark backgrounds

  // ── Borders ──
  borderCard: '#DCD6CE',   // Card borders
  borderSubtle: '#D1CBC2', // Lighter card borders (mini charts)

  // ── Functional colors (health status) ──
  danger:     '#C0392B',
  dangerBg:   '#FDEDEC',
  dangerBorder: '#E74C3C',
  warning:    '#B7770D',
  warningBg:  '#FFFDE7',
  warningBorder: '#F1C40F',
  success:    '#1E8449',
  successBg:  '#EAFAF1',
  successBorder: '#27AE60',

  // ── Glucose accent ──
  glucose:    '#3D1119',   // Droplet icon color

  // ── Misc ──
  black:      '#000000',
  white:      '#FFFFFF',
} as const;

export const Fonts = {
  regular:   'Fraunces_400Regular',
  medium:    'Fraunces_500Medium',
  semibold:  'Fraunces_600SemiBold',
  bold:      'Fraunces_700Bold',
  light:     'Fraunces_300Light',
} as const;

// Shorthand for creating Fraunces text styles
export function fraunces(
  size: number,
  weight: keyof typeof Fonts = 'regular',
  color: string = Colors.textDark,
) {
  return {
    fontFamily: Fonts[weight],
    fontSize: size,
    color,
  } as const;
}
