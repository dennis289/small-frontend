import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// ─── Light: "Slate" ──────────────────────────────────────────────────────────
// Neutral, high-contrast SaaS palette. Near-white page, white cards, and a
// near-black primary used for the one thing that matters on a screen: the active
// nav item and the primary button. Colour is reserved for status, never chrome.
const lightTheme = {
  dark: false,
  colors: {
    'background': '#FFFFFF',
    'surface': '#FFFFFF',
    // The tinted band behind table headers, sidebars and icon tiles.
    'surface-variant': '#F5F5F4',
    'surface-bright': '#FFFFFF',
    'surface-container': '#FAFAF9',
    // Near-black rather than a hue: the active pill and primary button read as
    // weight, not decoration.
    'primary': '#26262B',
    'primary-darken-1': '#131316',
    'primary-lighten-1': '#4A4A52',
    'secondary': '#71717A',
    'secondary-darken-1': '#52525B',
    'secondary-lighten-1': '#A1A1AA',
    // The one accent, used for counts on the active tab and links.
    'tertiary': '#2563EB',
    'error': '#DC2626',
    'warning': '#D97706',
    'info': '#2563EB',
    'success': '#16A34A',
    'on-background': '#18181B',
    'on-surface': '#18181B',
    'on-surface-variant': '#71717A',
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'outline': '#E4E4E7',
    'outline-variant': '#F4F4F5',
  },
}

// ─── Dark: "Slate Night" ─────────────────────────────────────────────────────
// A true counterpart to the light theme rather than a different design: same
// neutral greys and same status hues, inverted. Primary becomes near-white so the
// active pill keeps reading as weight against a dark page.
const darkTheme = {
  dark: true,
  colors: {
    'background': '#0B0B0D',
    'surface': '#141417',
    'surface-variant': '#1D1D21',
    'surface-bright': '#26262B',
    'surface-container': '#171719',
    'primary': '#F4F4F5',
    'primary-darken-1': '#D4D4D8',
    'primary-lighten-1': '#FFFFFF',
    'secondary': '#A1A1AA',
    'secondary-darken-1': '#71717A',
    'secondary-lighten-1': '#D4D4D8',
    'tertiary': '#60A5FA',
    'error': '#F87171',
    'warning': '#FBBF24',
    'info': '#60A5FA',
    'success': '#4ADE80',
    'on-background': '#FAFAFA',
    'on-surface': '#FAFAFA',
    'on-surface-variant': '#A1A1AA',
    'on-primary': '#18181B',
    'on-secondary': '#18181B',
    'outline': '#2A2A30',
    'outline-variant': '#1D1D21',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: { light: lightTheme, dark: darkTheme },
  },
  defaults: {
    VCard: {
      rounded: 'lg',
      elevation: 0,
    },
    VBtn: {
      rounded: 'lg',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VChip: {
      rounded: 'md',
      variant: 'tonal',
    },
    VAlert: {
      rounded: 'lg',
    },
    VDataTable: {
      hover: true,
    },
    VExpansionPanels: {
      rounded: 'lg',
    },
    VNavigationDrawer: {
      rounded: 'e-xl',
    },
  },
})
