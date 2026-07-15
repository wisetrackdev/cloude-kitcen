export const theme = {
  colors: {
    primary: '#FFB300',
    primaryLight: '#FFCC00',
    background: '#0A0A0A',
    card: '#121212',
    border: '#1F1F1F',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FFCC00',
    gold: '#FFD700',
    veg: '#249B3E',
    nonVeg: '#E43B3F',
  },
  // hysgfhsdgdg

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 26,
      xxl: 32,
    },
    weights: {
      light: '300' as const,
      regular: '400' as const,
      medium: '600' as const,
      bold: '800' as const,
    }
  },
  shadows: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    }
  },
  glass: {
    backgroundColor: 'rgba(18, 18, 18, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
  }
};
