import { createVuetify } from 'vuetify'
import { VRating } from 'vuetify/components'
import { VTimePicker } from 'vuetify/labs/VTimePicker'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// ─── Light: "Atlas" ──────────────────────────────────────────────────────────
// Clean white base with a confident blue primary and red used sparingly for
// small accents and alerts. Crisp, modern, high-contrast.
const lightTheme = {
  dark: false,
  colors: {
    'background': '#FFFFFF',
    'surface': '#FFFFFF',
    'surface-variant': '#EEF2F6',
    'surface-bright': '#FFFFFF',
    'surface-container': '#F4F7FA',
    'primary': '#1565C0',
    'primary-darken-1': '#0D47A1',
    'primary-lighten-1': '#42A5F5',
    'secondary': '#64748B',
    'secondary-darken-1': '#475569',
    'secondary-lighten-1': '#94A3B8',
    'tertiary': '#5C9CE6',
    'error': '#D32F2F',
    'warning': '#ED9C28',
    'info': '#1976D2',
    'success': '#2E7D32',
    'on-background': '#1A1A1A',
    'on-surface': '#1A1A1A',
    'on-surface-variant': '#475569',
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'outline': '#CBD5E1',
    'outline-variant': '#E2E8F0',
  },
}

// ─── Dark: "Hearth" ──────────────────────────────────────────────────────────
// Deep warm-charcoal surfaces with clay primary and stone secondary.
// Same warm, hand-crafted feel — but for late evenings.
const darkTheme = {
  dark: true,
  colors: {
    'background': '#14110E',
    'surface': '#1C1814',
    'surface-variant': '#241F19',
    'surface-bright': '#2A241D',
    'surface-container': '#1F1B16',
    'primary': '#C58A6E',
    'primary-darken-1': '#A0654A',
    'primary-lighten-1': '#D9A082',
    'secondary': '#A8A29E',
    'secondary-darken-1': '#78716C',
    'secondary-lighten-1': '#D6D3D1',
    'tertiary': '#D4B896',
    'error': '#D9756F',
    'warning': '#D9A176',
    'info': '#94A8B8',
    'success': '#9CB572',
    'on-background': '#E7E5E4',
    'on-surface': '#E7E5E4',
    'on-surface-variant': '#A8A29E',
    'on-primary': '#1C1814',
    'on-secondary': '#1C1814',
    'outline': '#3A332B',
    'outline-variant': '#2A241D',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: { light: lightTheme, dark: darkTheme },
  },
  defaults: {
    VCard: {
      rounded: 'xl',
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
      rounded: 'lg',
    },
    VAlert: {
      rounded: 'xl',
    },
    VDataTable: {
      hover: true,
    },
    VExpansionPanels: {
      rounded: 'xl',
    },
    VNavigationDrawer: {
      rounded: 'e-xl',
    },
  },
  components: { VTimePicker, VRating },
})
