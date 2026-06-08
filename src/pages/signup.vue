<template>
  <v-app>
    <v-main>
      <v-container class="fill-height pa-0" fluid>
        <v-row class="fill-height" no-gutters>

          <!-- Left branding panel -->
          <v-col class="d-none d-md-flex auth-brand-panel" cols="12" md="5">
            <div class="brand-content">
              <div class="d-flex align-center gap-2 mb-4 brand-eyebrow">
                <span class="eyebrow-rule" />
                <span class="text-caption text-uppercase font-weight-medium" style="letter-spacing:.3em; opacity:.7;">
                  Team roster
                </span>
              </div>
              <h1 class="brand-title font-serif">
                Build a<br>
                <span class="brand-italic">team that shows up.</span>
              </h1>
              <p class="brand-sub mt-5">
                Create your account and start scheduling, recognising and growing your team.
              </p>

              <div class="brand-footer">
                <div class="d-flex align-center gap-3">
                  <span class="footer-dot" />
                  <span class="text-caption" style="letter-spacing:.15em;">FREE TO START</span>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Right form panel -->
          <v-col class="d-flex align-center justify-center auth-form-panel" cols="12" md="7">
            <v-card class="pa-8 ma-4 auth-card" flat max-width="480" width="100%">
              <div class="mb-7">
                <div class="d-flex align-center gap-2 mb-3 auth-eyebrow">
                  <span class="eyebrow-rule" />
                  <span class="text-caption text-uppercase font-weight-medium text-medium-emphasis" style="letter-spacing:.25em;">
                    Sign up
                  </span>
                </div>
                <h2 class="auth-title font-serif">
                  Create your <span class="auth-italic">account</span>
                </h2>
                <p class="text-body-2 text-medium-emphasis mt-2">It only takes a minute.</p>
              </div>
              <v-form v-model="form" @submit.prevent="onSubmit">
                <v-text-field
                  v-model="fullname"
                  class="mb-3"
                  label="Full name"
                  prepend-inner-icon="mdi-account-outline"
                  :readonly="loading"
                  :rules="[required]"
                />
                <v-text-field
                  v-model="email"
                  class="mb-3"
                  label="Email"
                  prepend-inner-icon="mdi-email-outline"
                  :readonly="loading"
                  :rules="[required]"
                />
                <v-text-field
                  v-model="password"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  class="mb-3"
                  label="Password"
                  prepend-inner-icon="mdi-lock-outline"
                  :rules="[required, matchPassword]"
                  :type="showPassword ? 'text' : 'password'"
                  @click:append-inner="showPassword = !showPassword"
                />
                <v-text-field
                  v-model="confirmPassword"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  class="mb-6"
                  label="Confirm password"
                  prepend-inner-icon="mdi-lock-check-outline"
                  :rules="[required, matchPassword]"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
                />
                <v-btn
                  block
                  color="primary"
                  :disabled="!form"
                  :loading="loading"
                  size="large"
                  type="submit"
                  variant="flat"
                >Create account</v-btn>
              </v-form>
              <div class="text-center mt-6">
                <span class="text-body-2 text-medium-emphasis">Already have an account?</span>
                <v-btn
                  class="ml-1"
                  color="primary"
                  size="small"
                  to="/login"
                  variant="text"
                >Sign in</v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
  import api from '../api'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const form = ref(null)
  const fullname = ref('')
  const password = ref('')
  const showPassword = ref(false)
  const showConfirmPassword = ref(false)
  const loading = ref(false)
  const email = ref('')
  const confirmPassword = ref('')

  const matchPassword = value => {
    return value === password.value || 'Passwords do not match'
  }

  async function onSubmit () {
    if (!form.value) return
    loading.value = true
    try {
      const response = await api.post('/api/signup/', {
        username: email.value,
        fullname: fullname.value,
        email: email.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
      })

      fullname.value = ''
      email.value = ''
      password.value = ''
      confirmPassword.value = ''
      console.log('Sign up successful:', response.data)

      router.push('/login')
    } catch (error) {
      console.error('Sign up failed:', error)
    } finally {
      loading.value = false
    }
  }

  function required (value) {
    return !!value || 'Field is required'
  }
</script>

<style scoped>
/* ── Brand panel ─────────────────────────────────────────────────────────── */
.auth-brand-panel {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse 60% 50% at 80% 10%, rgba(255, 255, 255, 0.06), transparent 60%),
    radial-gradient(ellipse 50% 40% at 10% 90%, rgba(0, 0, 0, 0.18), transparent 60%),
    linear-gradient(135deg, rgb(var(--v-theme-primary-darken-1)) 0%, rgb(var(--v-theme-primary)) 50%, #B5926B 100%);
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
