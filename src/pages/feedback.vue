<template>
  <v-container class="pa-6 pa-md-8" fluid>

    <PageHeader
      eyebrow="Menu"
      subtitle="Mark attendance and record notes for the team after each event."
      title="Feedback"
    />

    <!-- Step 1 — select a date -->
    <div class="step-block mb-6">
      <div class="step-marker mb-3 d-flex align-center ga-3">
        <span class="step-number font-serif">01</span>
        <span class="step-label text-overline font-weight-bold">Select a date</span>
        <v-divider class="flex-grow-1" />
      </div>
      <v-card class="pa-5" rounded="lg" variant="outlined">
        <v-select
          v-model="selectedDate"
          hide-details
          item-title="label"
          item-value="value"
          :items="availableDates"
          label="Choose an event date"
          :loading="loadingRosters"
          prepend-inner-icon="mdi-calendar-outline"
          @update:model-value="onDateSelected"
        />
      </v-card>
    </div>

    <!-- Step 2 — shareable all-events feedback link (shown first) -->
    <div v-if="selectedDate" class="step-block mb-6">
      <div class="step-marker mb-3 d-flex align-center ga-3">
        <span class="step-number font-serif">02</span>
        <span class="step-label text-overline font-weight-bold">Share feedback link</span>
        <v-divider class="flex-grow-1" />
      </div>
      <v-card class="pa-5 share-card" rounded="lg" variant="outlined">
        <div class="d-flex align-center ga-3 mb-4">
          <v-avatar class="share-avatar" size="40">
            <v-icon size="20">mdi-link-variant</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-subtitle-1 font-serif font-weight-medium">All-events feedback link</h3>
            <p class="text-caption text-medium-emphasis">
              One link covering every event on {{ formatDayLabel(selectedDate) }} — single use.
            </p>
          </div>
        </div>

        <v-text-field
          v-model="shareUrl"
          density="comfortable"
          hide-details
          :loading="generatingLink"
          placeholder="Generating link…"
          readonly
          variant="outlined"
          @focus="$event.target.select()"
        />
        <div class="d-flex ga-2 mt-3 flex-wrap">
          <v-btn
            :color="copied ? 'success' : 'primary'"
            :disabled="!shareUrl"
            :prepend-icon="copied ? 'mdi-check' : 'mdi-content-copy'"
            variant="flat"
            @click="copyShareUrl"
          >{{ copied ? 'Copied' : 'Copy link' }}</v-btn>
          <v-btn
            :disabled="!shareUrl"
            :href="shareUrl"
            prepend-icon="mdi-open-in-new"
            target="_blank"
            variant="outlined"
          >Open preview</v-btn>
          <v-spacer />
          <v-btn
            :loading="generatingLink"
            prepend-icon="mdi-refresh"
            variant="text"
            @click="generateShareForDate(selectedDate, true)"
          >New link</v-btn>
        </div>
      </v-card>
    </div>

    <!-- Step 3 — record attendance manually for one event -->
    <div v-if="selectedDate" class="step-block mb-6">
      <div class="step-marker mb-3 d-flex align-center ga-3">
        <span class="step-number font-serif">03</span>
        <span class="step-label text-overline font-weight-bold">Or record attendance yourself</span>
        <v-divider class="flex-grow-1" />
      </div>
      <v-card class="pa-5" rounded="lg" variant="outlined">
        <v-select
          v-model="selectedRosterId"
          clearable
          hide-details
          item-title="label"
          item-value="id"
          :items="eventsForSelectedDate"
          label="Choose an event from this date"
          prepend-inner-icon="mdi-calendar-star-outline"
          @update:model-value="loadPersons"
        />
      </v-card>
    </div>

    <!-- Attendance + feedback for the selected event -->
    <div v-if="persons.length > 0" class="step-block">
      <div class="step-marker mb-3 d-flex align-center ga-3">
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
              <v-col class="d-flex align-center ga-3" cols="12" sm="3">
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

    <!-- Empty state after an event is selected but has no members -->
    <v-alert
      v-else-if="selectedRosterId && !loading"
      class="mt-4"
      rounded="lg"
      type="info"
      variant="tonal"
    >
      No assigned members found for this event.
    </v-alert>

    <!-- Initial empty state -->
    <v-card
      v-else-if="!selectedDate"
      class="pa-16 text-center empty-state"
      rounded="lg"
      variant="outlined"
    >
      <v-icon class="mb-4" color="primary" size="48" style="opacity:.45;">mdi-calendar-outline</v-icon>
      <h3 class="text-h6 font-serif font-weight-medium mb-2">Select a date above</h3>
      <p class="text-body-2 text-medium-emphasis mx-auto" style="max-width: 360px;">
        Pick a date to get a shareable feedback link for all its events, or record attendance yourself.
      </p>
    </v-card>

    <!-- Collected feedback history -->
    <div v-if="summaries.length > 0" class="step-block mt-10">
      <div class="step-marker mb-3 d-flex align-center ga-3">
        <span class="step-label text-overline font-weight-bold">Collected feedback</span>
        <v-divider class="flex-grow-1" />
        <v-btn
          :loading="loadingSummary"
          prepend-icon="mdi-refresh"
          size="small"
          variant="text"
          @click="fetchSummary"
        >Refresh</v-btn>
      </div>

      <v-expansion-panels variant="accordion">
        <v-expansion-panel v-for="s in summaries" :key="s.date" rounded="lg">
          <v-expansion-panel-title>
            <div class="d-flex align-center flex-wrap ga-3" style="width: 100%;">
              <span class="font-weight-medium">{{ formatDayLabel(s.date) }}</span>
              <v-chip class="ms-2" color="success" size="x-small" variant="tonal">{{ s.present_count }} present</v-chip>
              <v-chip
                v-if="s.absent_count"
                class="ms-1"
                color="error"
                size="x-small"
                variant="tonal"
              >{{ s.absent_count }} absent</v-chip>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="mb-3">
              <p class="text-caption text-uppercase text-medium-emphasis mb-2" style="letter-spacing:.08em;">
                Present
              </p>
              <div v-if="s.present.length > 0" class="d-flex flex-wrap ga-1">
                <v-chip
                  v-for="name in s.present"
                  :key="name"
                  class="ms-1 mt-1"
                  color="success"
                  size="small"
                  variant="tonal"
                >{{ name }}</v-chip>
              </div>
              <span v-else class="text-caption text-medium-emphasis font-italic">No one marked present</span>
            </div>

            <div v-if="s.absent.length > 0" class="mb-3">
              <p class="text-caption text-uppercase text-medium-emphasis mb-2" style="letter-spacing:.08em;">
                Absent
              </p>
              <div class="d-flex flex-wrap ga-1">
                <v-chip
                  v-for="name in s.absent"
                  :key="name"
                  class="ms-1 mt-1"
                  color="error"
                  size="small"
                  variant="tonal"
                >{{ name }}</v-chip>
              </div>
            </div>

            <div>
              <p class="text-caption text-uppercase text-medium-emphasis mb-1" style="letter-spacing:.08em;">
                Feedback of the day
              </p>
              <p class="text-body-2">
                {{ s.feedback || '—' }}
              </p>
            </div>
            <div>
              <p class="text-caption text-uppercase text-medium-emphasis mb-1" style="letter-spacing:.08em;">
                Recommendations for the day
              </p>
              <p class="text-body-2">
                {{ s.recommendations || '—' }}
              </p>
            </div>

            <div class="d-flex justify-end mt-3">
              <v-btn
                color="primary"
                prepend-icon="mdi-pencil-outline"
                size="small"
                variant="tonal"
                @click="openEdit(s)"
              >Edit notes</v-btn>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Edit day-level notes dialog -->
    <v-dialog v-model="editDialog" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="font-serif">
          Edit notes — {{ formatDayLabel(editTarget?.date) }}
        </v-card-title>
        <v-card-text>
          <p class="text-caption text-medium-emphasis mb-3">
            These notes apply to the whole day and replace the existing feedback and recommendations.
          </p>
          <v-textarea
            v-model="editForm.feedback"
            auto-grow
            class="mb-3"
            hide-details
            label="Feedback of the day"
            rows="3"
            variant="outlined"
          />
          <v-textarea
            v-model="editForm.recommendations"
            auto-grow
            hide-details
            label="Recommendations for the day"
            rows="3"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn :disabled="savingEdit" variant="text" @click="editDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="savingEdit"
            variant="flat"
            @click="saveEdit"
          >Save changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
  /**
   * Feedback admin page — two ways to collect attendance for a past event date.
   *
   * 1. Direct entry: pick a date, pick one of that date's events, mark each assigned
   *    person present/absent with an optional note, rating and category.
   * 2. Share link: generate a one-time, unauthenticated URL that a non-admin fills in
   *    (see feedback-share.vue). One link per date, and only before any feedback for
   *    that date exists.
   *
   * A date is "collected" once it appears in the summaries list; collected dates are
   * removed from the picker and can only be amended through the edit dialog, which
   * rewrites the day-level note for every row on that date.
   *
   * Submitting attendance is what moves members' streaks.
   */
  import { computed, onMounted, ref } from 'vue'
  import { toast } from 'vue-sonner'
  import { useRostersStore } from '@/stores/rosters'
  import { readApiError } from '@/validation'
  import api from '../api'

  const rostersStore = useRostersStore()

  const rawRosters = ref([])
  const summaries = ref([])
  const selectedDate = ref(null)
  const selectedRosterId = ref(null)
  const persons = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const loadingRosters = ref(false)
  const loadingSummary = ref(false)

  const generatingLink = ref(false)
  const shareUrl = ref('')
  const shareCache = ref({})
  const copied = ref(false)

  const editDialog = ref(false)
  const editTarget = ref(null)
  const editForm = ref({ feedback: '', recommendations: '' })
  const savingEdit = ref(false)

  // Dates that already have collected feedback — excluded from the picker.
  const collectedDates = computed(() => new Set(summaries.value.map(s => s.date)))

  // Distinct event dates with NO feedback yet, most recent first, labelled with
  // the weekday the date actually falls on — e.g. "Wednesday 12 May 2026".
  const availableDates = computed(() => {
    const seen = new Set()
    const out = []
    for (const r of rawRosters.value) {
      if (!seen.has(r.date) && !collectedDates.value.has(r.date)) {
        seen.add(r.date)
        out.push({ value: r.date, label: formatDayLabel(r.date) })
      }
    }
    return out.sort((a, b) => (a.value < b.value ? 1 : -1))
  })

  // Events (rosters) for the chosen date; show a timestamp when the day has more than one.
  const eventsForSelectedDate = computed(() => {
    if (!selectedDate.value) {
      return []
    }
    const sameDay = rawRosters.value.filter(r => r.date === selectedDate.value)
    const multi = sameDay.length > 1
    return sameDay
      .slice()
      .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
      .map(r => ({
        id: r.id,
        label: multi
          ? `${r.event_name || 'Event'} · ${formatTime(r.created_at)}`
          : (r.event_name || 'Event'),
      }))
  })

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'punctuality', label: 'Punctuality' },
    { value: 'teamwork', label: 'Teamwork' },
    { value: 'performance', label: 'Performance' },
    { value: 'attitude', label: 'Attitude' },
    { value: 'excellent', label: 'Excellence' },
  ]

  const presentCount = computed(() => persons.value.filter(p => p.is_present).length)

  function initials (p) {
    return ((p.first_name?.[0] || '') + (p.last_name?.[0] || '')).toUpperCase()
  }

  onMounted(() => {
    fetchRosters()
    fetchSummary()
  })

  function formatDayLabel (dateStr) {
    if (!dateStr) {
      return ''
    }
    // e.g. "Wednesday 12 May 2026" — whatever weekday the date falls on.
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  function formatTime (ts) {
    if (!ts) {
      return ''
    }
    return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  async function fetchRosters () {
    loadingRosters.value = true
    const result = await rostersStore.fetchRosters()
    if (result.success) {
      rawRosters.value = result.data
    } else {
      toast.error(result.error || 'Failed to load rosters')
    }
    loadingRosters.value = false
  }

  async function fetchSummary () {
    loadingSummary.value = true
    try {
      const res = await api.get('/api/feedback/summary/')
      summaries.value = res.data
    } catch {
      // Non-fatal — the summary is informational.
    }
    loadingSummary.value = false
  }

  function openEdit (summary) {
    editTarget.value = summary
    editForm.value = {
      feedback: summary.feedback || '',
      recommendations: summary.recommendations || '',
    }
    editDialog.value = true
  }

  async function saveEdit () {
    if (!editTarget.value) return
    savingEdit.value = true
    try {
      const res = await api.patch(`/api/feedback/summary/${editTarget.value.date}/`, {
        feedback: editForm.value.feedback || '',
        recommendations: editForm.value.recommendations || '',
      })
      // Reflect the saved values locally without a full refetch.
      editTarget.value.feedback = res.data.feedback
      editTarget.value.recommendations = res.data.recommendations
      toast.success('Notes updated.')
      editDialog.value = false
    } catch (error) {
      toast.error(readApiError(error, 'Failed to update notes'))
    } finally {
      savingEdit.value = false
    }
  }

  // Selecting a date resets the manual flow and surfaces the all-events link first.
  function onDateSelected (date) {
    selectedRosterId.value = null
    persons.value = []
    if (date) {
      generateShareForDate(date)
    }
  }

  async function generateShareForDate (date, force = false) {
    if (!date) {
      return
    }
    // Reuse a link already generated for this date this session unless forced.
    if (!force && shareCache.value[date]) {
      shareUrl.value = shareCache.value[date]
      copied.value = false
      return
    }
    generatingLink.value = true
    shareUrl.value = ''
    try {
      const res = await api.post('/api/feedback/share/links/', { date })
      // Prefer the absolute URL the backend builds from FRONTEND_BASE_URL (always
      // reachable); fall back to this app's own origin in local dev.
      const url = res.data.share_url || `${window.location.origin}/feedback/share/${res.data.token}`
      shareCache.value[date] = url
      shareUrl.value = url
      copied.value = false
    } catch (error) {
      toast.error(readApiError(error, 'Failed to generate share link'))
    } finally {
      generatingLink.value = false
    }
  }

  async function copyShareUrl () {
    try {
      await navigator.clipboard.writeText(shareUrl.value)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch {
      toast.error('Could not copy. Long-press the link instead.')
    }
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
      // Refresh the collected-feedback summary; the date now drops out of the picker.
      await fetchSummary()
      selectedRosterId.value = null
      selectedDate.value = null
      persons.value = []
      shareUrl.value = ''
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

/* Share-link card */
.share-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05), rgb(var(--v-theme-surface)) 60%) !important;
}
.v-theme--dark .share-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08), rgb(var(--v-theme-surface)) 60%) !important;
}
.share-avatar {
  background: rgb(var(--v-theme-surface-variant)) !important;
  color: rgb(var(--v-theme-primary));
  border: 1px solid rgba(var(--v-theme-primary), 0.20);
}
.v-theme--dark .share-avatar {
  border-color: rgba(var(--v-theme-primary), 0.22);
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
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.08);
}
.v-theme--dark .feedback-toolbar {
  border-bottom-color: rgba(var(--v-theme-primary), 0.10);
}

.empty-state {
  background: rgb(var(--v-theme-surface)) !important;
}
</style>
