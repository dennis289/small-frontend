<template>
  <v-container class="py-6 py-md-10" fluid style="max-width: 760px;">

    <!-- Header -->
    <header class="mb-6 text-center">
      <div class="text-caption text-uppercase font-weight-medium text-medium-emphasis" style="letter-spacing:.25em;">
        Roster feedback
      </div>
      <h1 class="hero-title font-serif mt-2">
        Mark <span class="hero-italic">attendance</span>
      </h1>
      <p v-if="payload?.date" class="text-body-2 text-medium-emphasis mt-2">
        For <strong>{{ formatDate(payload.date) }}</strong>
      </p>
    </header>

    <!-- Loading -->
    <v-card v-if="loading" class="pa-8 text-center" rounded="lg" variant="outlined">
      <v-progress-circular color="primary" indeterminate />
      <p class="text-body-2 text-medium-emphasis mt-4">Loading form...</p>
    </v-card>

    <!-- Error / used / 404 -->
    <v-card v-else-if="error" class="pa-8 text-center" rounded="lg" variant="outlined">
      <v-icon class="mb-3" color="warning" size="40">mdi-alert-circle-outline</v-icon>
      <h3 class="text-h6 font-serif mb-2">{{ errorTitle }}</h3>
      <p class="text-body-2 text-medium-emphasis">{{ error }}</p>
    </v-card>

    <!-- Submitted -->
    <v-card v-else-if="submitted" class="pa-8 text-center" rounded="lg" variant="outlined">
      <v-icon class="mb-3" color="success" size="48">mdi-check-circle-outline</v-icon>
      <h3 class="text-h5 font-serif mb-2">Feedback received</h3>
      <p class="text-body-2 text-medium-emphasis">
        Thanks — we've recorded attendance and your notes for {{ formatDate(payload.date) }}.
      </p>
    </v-card>

    <!-- Form -->
    <template v-else-if="payload">
      <!-- Events overview -->
      <v-card
        v-for="event in payload.events"
        :key="event.roster_id"
        class="mb-4"
        rounded="lg"
        variant="outlined"
      >
        <div class="event-header px-5 py-3 d-flex align-center gap-2">
          <v-icon color="primary" size="18">mdi-calendar-star-outline</v-icon>
          <span class="text-subtitle-1 font-serif font-weight-medium">{{ event.event_name }}</span>
          <v-spacer />
          <v-chip color="primary" size="x-small" variant="tonal">
            {{ event.assignments.length }} roles
          </v-chip>
        </div>
        <v-list density="compact">
          <v-list-item v-for="a in event.assignments" :key="`${event.roster_id}-${a.person_id}-${a.role}`">
            <template #prepend>
              <v-chip
                class="mr-3"
                color="secondary"
                label
                size="x-small"
                variant="tonal"
              >{{ a.role }}</v-chip>
            </template>
            <v-list-item-title class="text-body-2">{{ a.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>

      <!-- Attendance -->
      <div class="section-label d-flex align-center gap-3 mt-6 mb-3">
        <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Attendance</span>
        <v-divider class="flex-grow-1" />
      </div>

      <v-card class="pa-2" rounded="lg" variant="outlined">
        <v-list density="comfortable">
          <v-list-item
            v-for="(member, idx) in attendance"
            :key="member.person_id"
            :class="{ 'attendance-row-alt': idx % 2 === 1 }"
          >
            <v-list-item-title class="text-body-1 font-weight-medium">
              {{ member.name }}
            </v-list-item-title>
            <template #append>
              <v-radio-group
                v-model="member.is_present"
                class="attendance-radios"
                hide-details
                inline
              >
                <v-radio color="success" :value="true">
                  <template #label>
                    <span class="text-body-2">Present</span>
                  </template>
                </v-radio>
                <v-radio color="error" :value="false">
                  <template #label>
                    <span class="text-body-2">Absent</span>
                  </template>
                </v-radio>
              </v-radio-group>
            </template>
          </v-list-item>
        </v-list>
      </v-card>

      <!-- Global feedback -->
      <div class="section-label d-flex align-center gap-3 mt-6 mb-3">
        <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Notes</span>
        <v-divider class="flex-grow-1" />
      </div>

      <v-textarea
        v-model="globalFeedback"
        auto-grow
        label="Overall feedback for the service"
        placeholder="Anything you'd like to share about how the service went..."
        rows="4"
        variant="outlined"
      />

      <!-- Submit -->
      <div class="d-flex justify-end mt-6">
        <v-btn
          color="primary"
          :disabled="submitting"
          :loading="submitting"
          prepend-icon="mdi-send-outline"
          rounded="lg"
          size="large"
          variant="flat"
          @click="submitForm"
        >Submit feedback</v-btn>
      </div>

      <p class="text-caption text-medium-emphasis text-center mt-4">
        This link can only be submitted once.
      </p>
    </template>
  </v-container>
</template>

<script setup>
  import api from '../api'
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { toast } from 'vue-sonner'

 
  const route = useRoute()

  const loading = ref(true)
  const submitting = ref(false)
  const submitted = ref(false)
  const error = ref(null)
  const errorTitle = ref('Something went wrong')
  const payload = ref(null)
  const attendance = ref([])
  const globalFeedback = ref('')

  function formatDate (d) {
    if (!d) {
      return ''
    }
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  async function loadForm () {
    loading.value = true
    try {
      const res = await api.get(`/api/feedback/share/${route.params.token}/`)
      payload.value = res.data
      attendance.value = res.data.members.map(m => ({
        person_id: m.person_id,
        name: m.name,
        is_present: true,
      }))
    } catch (error_) {
      const status = error_.response?.status
      if (status === 404) {
        errorTitle.value = 'Link not found'
        error.value = 'This feedback link is invalid or no longer exists.'
      } else if (status === 410) {
        errorTitle.value = 'Already submitted'
        error.value = 'This feedback link has already been used. Ask the admin for a new one if you need to update.'
      } else {
        error.value = error_.response?.data?.error || 'Could not load the form. Check your connection and try again.'
      }
    } finally {
      loading.value = false
    }
  }

  async function submitForm () {
    submitting.value = true
    try {
      await api.post(`/api/feedback/share/${route.params.token}/submit/`, {
        attendance: attendance.value.map(m => ({
          person_id: m.person_id,
          is_present: m.is_present,
        })),
        global_feedback: globalFeedback.value,
      })
      submitted.value = true
    } catch (error_) {
      const status = error_.response?.status
      if (status === 410) {
        errorTitle.value = 'Already submitted'
        error.value = 'This feedback link has already been used.'
        submitted.value = false
        payload.value = null
      } else {
        toast.error(error_.response?.data?.error || 'Submission failed. Please try again.')
      }
    } finally {
      submitting.value = false
    }
  }

  onMounted(loadForm)
</script>

<style scoped>
.hero-title {
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  line-height: 1.1;
  font-weight: 500;
  margin: 0;
}
.hero-italic {
  font-style: italic;
  font-weight: 600;
  color: rgb(var(--v-theme-primary-darken-1));
}
.v-theme--dark .hero-italic {
  color: rgb(var(--v-theme-primary-lighten-1));
}

.event-header {
  background: rgb(var(--v-theme-surface-variant));
  border-bottom: 1px solid rgba(160, 101, 74, 0.10);
}
.v-theme--dark .event-header {
  border-bottom-color: rgba(197, 138, 110, 0.12);
}

.attendance-row-alt {
  background: rgba(0, 0, 0, 0.02);
}
.v-theme--dark .attendance-row-alt {
  background: rgba(255, 255, 255, 0.03);
}

.attendance-radios {
  flex: 0 0 auto;
}
.attendance-radios :deep(.v-selection-control) {
  margin-inline-end: 12px;
}

@media (max-width: 600px) {
  .attendance-radios :deep(.v-selection-control-group) {
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>
