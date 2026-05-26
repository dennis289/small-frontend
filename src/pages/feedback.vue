<template>
  <v-container class="pa-6 pa-md-8" fluid>

    <PageHeader
      eyebrow="Post-service"
      italic="feedback"
      subtitle="Mark attendance and record notes for the team after each service."
      title="Roster"
    />

    <!-- Step 1 — select roster -->
    <div class="step-block mb-6">
      <div class="step-marker mb-3 d-flex align-center gap-3">
        <span class="step-number font-serif">01</span>
        <span class="step-label text-overline font-weight-bold">Select a roster</span>
        <v-divider class="flex-grow-1" />
      </div>
      <v-card class="pa-5" rounded="lg" variant="outlined">
        <v-select
          v-model="selectedRosterId"
          hide-details
          item-title="label"
          item-value="id"
          :items="rosters"
          label="Choose a roster"
          :loading="loadingRosters"
          prepend-inner-icon="mdi-calendar-star-outline"
          @update:model-value="loadPersons"
        />
      </v-card>
    </div>

    <!-- Step 2 — attendance + feedback -->
    <div v-if="persons.length > 0" class="step-block">
      <div class="step-marker mb-3 d-flex align-center gap-3">
        <span class="step-number font-serif">02</span>
        <span class="step-label text-overline font-weight-bold">Attendance &amp; feedback</span>
        <v-divider class="flex-grow-1" />
        <v-chip color="success" size="small" variant="tonal">{{ presentCount }} present</v-chip>
        <v-chip color="error" size="small" variant="tonal">{{ persons.length - presentCount }} absent</v-chip>
      </div>

      <v-card class="overflow-hidden" rounded="lg" variant="outlined">
        <div class="feedback-toolbar pa-5 d-flex align-center justify-space-between flex-wrap" style="gap:12px;">
          <span class="text-body-2 text-medium-emphasis">
            <strong>{{ persons.length }}</strong> assigned members — toggle attendance and rate as needed
          </span>
          <v-btn
            color="primary"
            :loading="saving"
            prepend-icon="mdi-content-save-outline"
            variant="flat"
            @click="saveFeedback"
          >Save feedback</v-btn>
        </div>

        <v-divider />

        <!-- Members list -->
        <div v-for="(p, idx) in persons" :key="p.person_id">
          <v-divider v-if="idx > 0" />
          <div
            class="pa-4"
            :class="p.is_present ? '' : 'absent-row'"
          >
            <v-row align="center">
              <!-- Avatar + name -->
              <v-col class="d-flex align-center gap-3" cols="12" sm="3">
                <v-avatar
                  :color="p.is_present ? 'success' : 'error'"
                  rounded="lg"
                  size="38"
                >
                  <span class="text-caption font-weight-bold text-white">
                    {{ initials(p) }}
                  </span>
                </v-avatar>
                <div>
                  <p class="text-body-2 font-weight-semibold mb-0">{{ p.first_name }} {{ p.last_name }}</p>
                  <p class="text-caption text-medium-emphasis">{{ p.role }}</p>
                </div>
              </v-col>

              <!-- Present toggle -->
              <v-col class="d-flex align-center" cols="6" sm="2">
                <v-switch
                  v-model="p.is_present"
                  :color="p.is_present ? 'success' : 'error'"
                  density="compact"
                  hide-details
                  inset
                  :label="p.is_present ? 'Present' : 'Absent'"
                />
              </v-col>

              <!-- Rating -->
              <v-col cols="6" sm="3">
                <p class="text-caption text-medium-emphasis mb-1">Rating</p>
                <v-rating
                  v-model="p.rating"
                  color="warning"
                  density="compact"
                  :disabled="!p.is_present"
                  empty-icon="mdi-star-outline"
                  full-icon="mdi-star"
                  half-icon="mdi-star-half-full"
                  length="5"
                  size="22"
                />
              </v-col>

              <!-- Category -->
              <v-col cols="12" sm="4">
                <v-select
                  v-model="p.feedback_category"
                  clearable
                  density="compact"
                  :disabled="!p.is_present"
                  hide-details
                  item-title="label"
                  item-value="value"
                  :items="categories"
                  label="Category"
                  variant="outlined"
                />
              </v-col>

              <!-- Comment (full width on next row) -->
              <v-col class="pt-2" cols="12">
                <v-textarea
                  v-model="p.feedback"
                  auto-grow
                  density="compact"
                  hide-details
                  :placeholder="p.is_present ? 'Optional comment...' : 'Reason for absence (optional)...'"
                  rows="2"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </div>
        </div>

        <!-- Footer action bar -->
        <v-divider />
        <div class="pa-4 d-flex justify-end">
          <v-btn
            color="primary"
            :loading="saving"
            prepend-icon="mdi-content-save-outline"
            size="large"
            variant="flat"
            @click="saveFeedback"
          >Save all feedback</v-btn>
        </div>
      </v-card>
    </div>

    <!-- Loading state -->
    <div v-else-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <!-- Empty state after roster selected -->
    <v-alert
      v-else-if="selectedRosterId && !loading"
      class="mt-4"
      rounded="lg"
      type="info"
      variant="tonal"
    >
      No assigned members found for this roster.
    </v-alert>

    <!-- Initial empty state -->
    <v-card
      v-else-if="!selectedRosterId"
      class="pa-16 text-center empty-state"
      rounded="lg"
      variant="outlined"
    >
      <v-icon class="mb-4" color="primary" size="48" style="opacity:.45;">mdi-clipboard-list-outline</v-icon>
      <h3 class="text-h6 font-serif font-weight-medium mb-2">Select a roster above</h3>
      <p class="text-body-2 text-medium-emphasis mx-auto" style="max-width: 360px;">
        Choose a saved roster to start marking attendance and recording performance feedback.
      </p>
    </v-card>

  </v-container>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { toast } from 'vue-sonner'
  import { useRostersStore } from '@/stores/rosters'

  const rostersStore = useRostersStore()

  const rosters = ref([])
  const selectedRosterId = ref(null)
  const persons = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const loadingRosters = ref(false)

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'punctuality', label: 'Punctuality' },
    { value: 'teamwork', label: 'Teamwork' },
    { value: 'performance', label: 'Performance' },
    { value: 'attitude', label: 'Attitude' },
    { value: 'excellent', label: 'Excellent Service' },
  ]

  const presentCount = computed(() => persons.value.filter(p => p.is_present).length)

  function initials (p) {
    return ((p.first_name?.[0] || '') + (p.last_name?.[0] || '')).toUpperCase()
  }

  onMounted(fetchRosters)

  async function fetchRosters () {
    loadingRosters.value = true
    const result = await rostersStore.fetchRosters()
    if (result.success) {
      rosters.value = result.data.map(r => ({
        id: r.id,
        label: `${r.event_name} — ${r.date}`,
      }))
    } else {
      toast.error(result.error || 'Failed to load rosters')
    }
    loadingRosters.value = false
  }

  async function loadPersons () {
    if (!selectedRosterId.value) return
    loading.value = true
    const result = await rostersStore.fetchRosterPersons(selectedRosterId.value)
    if (result.success) {
      persons.value = result.data.map(p => ({
        ...p,
        rating: p.rating || null,
        feedback_category: p.feedback_category || null,
      }))
    } else {
      toast.error(result.error || 'Failed to load members')
      persons.value = []
    }
    loading.value = false
  }

  async function saveFeedback () {
    if (!selectedRosterId.value) return
    saving.value = true
    const feedback = persons.value.map(p => ({
      person_id: p.person_id,
      is_present: p.is_present,
      feedback: p.feedback || '',
      rating: p.rating || null,
      feedback_category: p.feedback_category || null,
    }))
    const result = await rostersStore.submitFeedback(selectedRosterId.value, feedback)
    if (result.success) {
      toast.success('Feedback saved — streaks updated automatically.')
    } else {
      toast.error(result.error || 'Failed to save feedback')
    }
    saving.value = false
  }
</script>

<style scoped>
.absent-row {
  background: rgba(var(--v-theme-error), 0.04);
}

/* Step blocks */
.step-block .step-marker .step-number {
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: -.02em;
  color: rgb(var(--v-theme-primary-darken-1));
  opacity: .55;
  min-width: 32px;
  font-feature-settings: 'tnum';
}
.v-theme--dark .step-block .step-marker .step-number {
  color: rgb(var(--v-theme-primary-lighten-1));
}
.step-block .step-marker .step-label {
  letter-spacing: .2em;
}

.feedback-toolbar {
  background: rgb(var(--v-theme-surface-variant));
  border-bottom: 1px solid rgba(160, 101, 74, 0.08);
}
.v-theme--dark .feedback-toolbar {
  border-bottom-color: rgba(197, 138, 110, 0.10);
}

.empty-state {
  background: rgb(var(--v-theme-surface)) !important;
}
</style>
