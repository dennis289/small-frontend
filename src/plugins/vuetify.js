import { createVuetify } from 'vuetify'
import { VRating } from 'vuetify/components'
import { VTimePicker } from 'vuetify/labs/VTimePicker'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// ─── Light: "Linen" ──────────────────────────────────────────────────────────
// Warm off-white base with muted clay primary and soft stone secondary.
// Editorial, calm, human — like quality stationery.
const lightTheme = {
  dark: false,
  colors: {
    'background': '#FAF8F5',
    'surface': '#FFFFFF',
    'surface-variant': '#F0EDE6',
    'surface-bright': '#FFFFFF',
    'surface-container': '#F5F2EC',
    'primary': '#A0654A',
    'primary-darken-1': '#8A5640',
    'primary-lighten-1': '#B57860',
    'secondary': '#78716C',
    'secondary-darken-1': '#57534E',
    'secondary-lighten-1': '#A8A29E',
    'tertiary': '#B5926B',
    'error': '#B85450',
    'warning': '#C08552',
    'info': '#6B8295',
    'success': '#6B8E3D',
    'on-background': '#292524',
    'on-surface': '#292524',
    'on-surface-variant': '#57534E',
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'outline': '#D6D3D1',
    'outline-variant': '#E7E5E4',
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
