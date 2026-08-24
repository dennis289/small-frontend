<template>
  <v-app>
    <v-main>
      <v-container class="fill-height pa-0" fluid>
        <v-row class="fill-height" no-gutters>

          <!-- Left branding panel -->
          <v-col class="d-none d-md-flex auth-brand-panel" cols="12" md="5">
            <div class="brand-content">
              <div class="d-flex align-center ga-2 mb-4 brand-eyebrow">
                <span class="eyebrow-rule" />
                <span class="text-caption text-uppercase font-weight-medium" style="letter-spacing:.3em; opacity:.7;">
                  Team roster
                </span>
              </div>
              <h1 class="brand-title font-serif">
                Bring the<br>
                <span class="brand-italic">team together.</span>
              </h1>
              <p class="brand-sub mt-5">
                Schedule events, manage members, recognise commitment — all in one place.
              </p>

              <div class="brand-footer">
                <div class="d-flex align-center ga-3">
                  <span class="footer-dot" />
                  <span class="text-caption" style="letter-spacing:.15em;">CRAFTED FOR TEAMS</span>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Right form panel -->
          <v-col class="d-flex align-center justify-center auth-form-panel" cols="12" md="7">
            <v-card class="pa-8 ma-4 auth-card" flat max-width="440" width="100%">
              <div class="mb-7">
                <div class="d-flex align-center ga-2 mb-3 auth-eyebrow">
                  <span class="eyebrow-rule" />
                  <span class="text-caption text-uppercase font-weight-medium text-medium-emphasis" style="letter-spacing:.25em;">
                    Sign in
                  </span>
                </div>
                <h2 class="auth-title font-serif">
                  Welcome <span class="auth-italic">back</span>
                </h2>
                <p class="text-body-2 text-medium-emphasis mt-2">Sign in to continue managing your team.</p>
              </div>
              <v-form ref="form" @submit.prevent="onSubmit">
                <v-text-field
                  v-model="email"
                  class="mb-3"
                  label="Email"
                  prepend-inner-icon="mdi-email-outline"
                  :readonly="loading"
                  :rules="[rules.required('your email address'), rules.email()]"
                />
                <v-text-field
                  v-model="password"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  class="mb-6"
                  label="Password"
                  prepend-inner-icon="mdi-lock-outline"
                  :rules="[rules.required('your password')]"
                  :type="showPassword ? 'text' : 'password'"
                  @click:append-inner="showPassword = !showPassword"
                  @keyup.enter="onSubmit"
                />
                <v-btn
                  block
                  color="primary"
                  :loading="loading"
                  size="large"
                  type="submit"
                  variant="flat"
                >
                  Sign in
                </v-btn>
              </v-form>
              <div class="text-center mt-4">
                <router-link class="text-body-2" to="/forgot-password">
                  Forgot your password?
                </router-link>
              </div>
              <div class="text-center mt-3">
                <span class="text-body-2 text-medium-emphasis">
                  Need an account? Contact your administrator.
                </span>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
  /**
   * Login page.
   *
   * Posts email + password, then writes the session keys (via `@/session`) and sets
   * the axios Authorization header directly rather than going through the auth store.
   * The cached `user` must include `role` and `is_platform_admin` — the router guard
   * reads both from there to gate routes and pick a landing page without an extra
   * round trip.
   *
   * Honours `?redirect=` so a user bounced here by an expired session lands back
   * where they were. The value is only accepted if it's a same-site absolute path
   * (no `//host` open redirects) and isn't an admin route for a non-admin.
   */
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { toast } from 'vue-sonner'
  import { homeRoute, setTokens, USER_KEY } from '@/session'
  import * as rules from '@/validation'
  import api from '../api'

  const router = useRouter()
  const route = useRoute()
  const form = ref(null)
  const loading = ref(false)
  const showPassword = ref(false)
  const password = ref('')
  const email = ref('')

  async function onSubmit () {
    const { valid } = await form.value.validate()
    if (!valid) return
    loading.value = true
    try {
      const response = await api.post('/api/login/', {
        email: email.value,
        password: password.value,
      })
      const accessToken = response.data.access || response.data.token
      if (accessToken) {
        setTokens(accessToken, response.data.refresh)
        localStorage.setItem(USER_KEY, JSON.stringify({
          username: response.data.username,
          email: response.data.email,
          client: response.data.client || null,
          role: response.data.role ?? null,
          is_platform_admin: !!response.data.is_platform_admin,
        }))
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      }
      email.value = ''
      password.value = ''
      // Send them back where they were when the session expired, if that's still
      // somewhere they're allowed to be; otherwise to whichever landing page suits
      // their role. `homeRoute()` reads the user we just cached above.
      const isPlatformAdmin = !!response.data.is_platform_admin
      const home = homeRoute()
      const redirect = route.query.redirect
      const canReturn = typeof redirect === 'string'
        && redirect.startsWith('/')
        && !redirect.startsWith('//')
        && redirect !== '/login'
        && (isPlatformAdmin || !redirect.startsWith('/admin/'))
      // The router guard has the final say: if the remembered path isn't open to
      // this role it will bounce them on to their home anyway.
      router.push(canReturn ? redirect : home)
      toast.success('Welcome back!')
    } catch {
      toast.error('Invalid credentials. Please try again.')
    } finally {
      loading.value = false
    }
  }

</script>

<style scoped>
/* ── Brand panel ─────────────────────────────────────────────────────────── */
/* The panel is deliberately theme-independent.
 *
 * It used to build its gradient from `--v-theme-primary`, but primary is a role,
 * not a colour: it is near-black in the light theme and near-white in the dark
 * one. In dark mode that turned the panel white underneath white text, which
 * left the branding all but unreadable. The panel is always the dark half of the
 * page, so its colours are stated outright — they match the light theme's
 * primary ramp, which is what the design was drawn against. */
.auth-brand-panel {
  --brand-deep: #131316;
  --brand-mid: #26262B;
  --brand-warm: #B5926B;

  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse 60% 50% at 80% 10%, rgba(255, 255, 255, 0.06), transparent 60%),
    radial-gradient(ellipse 50% 40% at 10% 90%, rgba(0, 0, 0, 0.18), transparent 60%),
    linear-gradient(135deg, var(--brand-deep) 0%, var(--brand-mid) 50%, var(--brand-warm) 100%);
  color: #FFFFFF;
}
.auth-brand-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.04) 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(0, 0, 0, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.brand-content {
  position: relative;
  width: 100%;
  padding: 64px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-eyebrow .eyebrow-rule {
  display: inline-block;
  width: 28px;
  height: 1px;
  background: currentColor;
  opacity: .55;
}

.brand-title {
  font-size: clamp(2.4rem, 4vw, 3.4rem);
  line-height: 1.1;
  font-weight: 500;
  margin: 0;
  letter-spacing: -.01em;
}
.brand-italic {
  font-style: italic;
  font-weight: 500;
  opacity: .92;
}
.brand-sub {
  font-size: 1.05rem;
  line-height: 1.6;
  max-width: 38ch;
  opacity: .82;
}

.brand-footer {
  position: absolute;
  bottom: 64px;
  left: 64px;
  opacity: .8;
}
.footer-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: .7;
}

/* ── Form panel ──────────────────────────────────────────────────────────── */
.auth-form-panel {
  background: rgb(var(--v-theme-background));
}
.auth-card {
  background: transparent !important;
  border: none !important;
}

.auth-eyebrow .eyebrow-rule {
  display: inline-block;
  width: 28px;
  height: 1px;
  background: currentColor;
  opacity: .5;
}

.auth-title {
  font-size: clamp(2rem, 3.4vw, 2.6rem);
  line-height: 1.05;
  font-weight: 500;
  margin: 0;
  letter-spacing: -.01em;
}
.auth-italic {
  font-style: italic;
  font-weight: 600;
  color: rgb(var(--v-theme-primary-darken-1));
}
.v-theme--dark .auth-italic {
  color: rgb(var(--v-theme-primary-lighten-1));
}
</style>
