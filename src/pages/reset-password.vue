<template>
  <v-app>
    <v-main>
      <v-container class="fill-height pa-0" fluid>
        <v-row class="fill-height" no-gutters>
          <v-col class="d-flex align-center justify-center auth-form-panel" cols="12">
            <v-card class="pa-8 ma-4 auth-card" flat max-width="440" width="100%">
              <div class="mb-7">
                <div class="d-flex align-center ga-2 mb-3 auth-eyebrow">
                  <span class="eyebrow-rule" />

                  <span class="text-caption text-uppercase font-weight-medium text-medium-emphasis" style="letter-spacing:.25em;">
                    Reset password
                  </span>
                </div>

                <h2 class="auth-title font-serif">
                  Choose a <span class="auth-italic">new password</span>
                </h2>
              </div>

              <v-alert
                v-if="!hasLink"
                class="mb-6"
                type="warning"
                variant="tonal"
              >
                This page needs a reset link. Request one from the
                <router-link to="/forgot-password">forgot password</router-link> page.
              </v-alert>

              <v-alert
                v-else-if="done"
                class="mb-6"
                icon="mdi-check-circle-outline"
                type="success"
                variant="tonal"
              >
                Password updated. You can sign in with it now.
              </v-alert>

              <v-form v-else ref="form" @submit.prevent="onSubmit">
                <v-text-field
                  v-model="password"
                  :append-inner-icon="show ? 'mdi-eye-off' : 'mdi-eye'"
                  autofocus
                  class="mb-3"
                  label="New password"
                  prepend-inner-icon="mdi-lock-outline"
                  :readonly="loading"
                  :rules="[rules.required('a new password'), rules.minLength(8, 'Your password')]"
                  :type="show ? 'text' : 'password'"
                  @click:append-inner="show = !show"
                />

                <v-text-field
                  v-model="confirm"
                  class="mb-6"
                  label="Confirm new password"
                  prepend-inner-icon="mdi-lock-check-outline"
                  :readonly="loading"
                  :rules="[
                    rules.required('your new password again'),
                    rules.matches(() => password, 'This does not match the new password above'),
                  ]"
                  :type="show ? 'text' : 'password'"
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
                  Update password
                </v-btn>
              </v-form>

              <div class="text-center mt-6">
                <router-link class="text-body-2" to="/login">Back to sign in</router-link>
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
   * Step two of the password reset: redeem the token from the emailed link.
   *
   * `uid` and `token` arrive as query params and are passed straight back to the
   * API, which is the only thing that can judge them — an expired, tampered or
   * already-used token all come back as the same 400, and that message is shown
   * verbatim rather than guessed at here.
   *
   * The confirm field and length rule are convenience only. Django's configured
   * validators are the real gate, and their message is surfaced on failure.
   */
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { toast } from 'vue-sonner'
  import * as rules from '@/validation'
  import { readApiError } from '@/validation'
  import api from '../api'

  const route = useRoute()
  const router = useRouter()
  const form = ref(null)
  const loading = ref(false)
  const done = ref(false)
  const show = ref(false)
  const password = ref('')
  const confirm = ref('')

  const uid = computed(() => route.query.uid || '')
  const token = computed(() => route.query.token || '')
  const hasLink = computed(() => !!uid.value && !!token.value)

  async function onSubmit () {
    const { valid } = await form.value.validate()
    if (!valid) return
    loading.value = true
    try {
      await api.post('/api/password-reset/confirm/', {
        uid: uid.value,
        token: token.value,
        new_password: password.value,
      })
      done.value = true
      setTimeout(() => router.push('/login'), 2000)
    } catch (error) {
      toast.error(readApiError(error, 'Could not update the password. Try again.'))
    } finally {
      loading.value = false
    }
  }
</script>
