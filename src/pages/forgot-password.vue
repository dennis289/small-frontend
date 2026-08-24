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
                  Forgot your <span class="auth-italic">password?</span>
                </h2>

                <p class="text-body-2 text-medium-emphasis mt-2">
                  Enter your username or email and we'll send you a link to choose a new one.
                </p>
              </div>

              <!-- The success state deliberately says the same thing whether or not
                   the account existed, matching what the API reports. -->
              <v-alert
                v-if="sent"
                class="mb-6"
                icon="mdi-email-check-outline"
                type="success"
                variant="tonal"
              >
                {{ sentMessage }}
              </v-alert>

              <v-form v-else ref="form" @submit.prevent="onSubmit">
                <v-text-field
                  v-model="identifier"
                  autofocus
                  class="mb-6"
                  label="Username or email"
                  prepend-inner-icon="mdi-account-outline"
                  :readonly="loading"
                  :rules="[rules.required('your username or email address')]"
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
                  Send reset link
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
   * Step one of the password reset: ask for a link.
   *
   * The API answers identically whether or not the identifier matched, so this
   * page must not branch on the result — showing "no such account" here would
   * hand an attacker an account-enumeration oracle the API is careful to deny.
   */
  import { ref } from 'vue'
  import { toast } from 'vue-sonner'
  import * as rules from '@/validation'
  import { readApiError } from '@/validation'
  import api from '../api'

  const form = ref(null)
  const loading = ref(false)
  const sent = ref(false)
  const sentMessage = ref('')
  const identifier = ref('')

  async function onSubmit () {
    const { valid } = await form.value.validate()
    if (!valid) return
    loading.value = true
    try {
      const { data } = await api.post('/api/password-reset/', {
        identifier: identifier.value,
      })
      sentMessage.value = data.detail
      sent.value = true
    } catch (error) {
      toast.error(readApiError(error, 'Could not send the reset link. Try again.'))
    } finally {
      loading.value = false
    }
  }
</script>
