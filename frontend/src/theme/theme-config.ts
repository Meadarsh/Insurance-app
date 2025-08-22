import type { CommonColors } from '@mui/material/styles';

import type { ThemeCssVariables } from './types';
import type { PaletteColorNoChannels } from './core/palette';

// ----------------------------------------------------------------------

type ThemeConfig = {
  classesPrefix: string;
  cssVariables: ThemeCssVariables;
  fontFamily: Record<'primary' | 'secondary', string>;
  palette: Record<
    'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error',
    PaletteColorNoChannels
  > & {
    common: Pick<CommonColors, 'black' | 'white'>;
    grey: Record<
      '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900',
      string
    >;
  };
};

export const themeConfig: ThemeConfig = {
  /** **************************************
   * Base
   *************************************** */
  classesPrefix: 'minimal',
  /** **************************************
   * Typography
   *************************************** */
  fontFamily: {
    primary: 'DM Sans Variable',
    secondary: 'Barlow',
  },
  /** **************************************
   * CSS Variables Configuration
   *************************************** */
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
    disableCssColorScheme: false,
    shouldSkipGeneratingVar: () => false,
  },
  /** **************************************
   * Palette - Limited Color Scheme (1-2 colors as requested by Adarsh)
   * Primary: Blue (#1976D2) - Main brand color
   * Secondary: Purple (#9C27B0) - Accent color only
   * All other colors derived from primary for consistency
   *************************************** */
  palette: {
    primary: {
      lighter: '#E3F2FD',
      light: '#64B5F6',
      main: '#1976D2',
      dark: '#0D47A1',
      darker: '#0A3D91',
      contrastText: '#FFFFFF',
    },
    secondary: {
      lighter: '#F3E5F5',
      light: '#BA68C8',
      main: '#9C27B0',
      dark: '#7B1FA2',
      darker: '#6A1B9A',
      contrastText: '#FFFFFF',
    },
    info: {
      lighter: '#E3F2FD',
      light: '#64B5F6',
      main: '#1976D2',
      dark: '#0D47A1',
      darker: '#0A3D91',
      contrastText: '#FFFFFF',
    },
    success: {
      lighter: '#E3F2FD',
      light: '#64B5F6',
      main: '#1976D2',
      dark: '#0D47A1',
      darker: '#0A3D91',
      contrastText: '#FFFFFF',
    },
    warning: {
      lighter: '#E3F2FD',
      light: '#64B5F6',
      main: '#1976D2',
      dark: '#0D47A1',
      darker: '#0A3D91',
      contrastText: '#FFFFFF',
    },
    error: {
      lighter: '#E3F2FD',
      light: '#64B5F6',
      main: '#1976D2',
      dark: '#0D47A1',
      darker: '#0A3D91',
      contrastText: '#FFFFFF',
    },
    grey: {
      '50': '#FAFAFA',
      '100': '#F5F5F5',
      '200': '#EEEEEE',
      '300': '#E0E0E0',
      '400': '#BDBDBD',
      '500': '#9E9E9E',
      '600': '#757575',
      '700': '#616161',
      '800': '#424242',
      '900': '#212121',
    },
    common: { 
      black: '#000000', 
      white: '#FFFFFF' 
    },
  },
};
