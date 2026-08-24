<template>
  <v-container class="pa-6 pa-md-8" fluid>

    <PageHeader
      eyebrow="Menu"
      :subtitle="selectedDate ? formatDisplayDate(selectedDate) : 'Pick a date to see who is serving.'"
      title="Schedule"
    />

    <!-- Date picker -->
    <v-card class="pa-5 mb-6 date-toolbar" rounded="lg" variant="outlined">
      <div class="d-flex align-center flex-wrap" style="gap: 12px;">
        <div class="date-block">
          <p class="field-label">Event date</p>
          <v-select
            v-model="selectedDate"
            class="date-field"
            density="comfortable"
            hide-details
            item-title="label"
            item-value="value"
            :items="dateOptions"
            :loading="loadingDates"
            :no-data-text="loadingDates ? 'Loading…' : 'No rosters published yet'"
            placeholder="Pick a date"
            prepend-inner-icon="mdi-calendar"
            @update:model-value="loadDay"
          />
        </div>

        <v-spacer />

        <v-chip
          v-if="day && linkedPersonId"
          color="primary"
          prepend-icon="mdi-account-check-outline"
          size="small"
          variant="tonal"
        >
          {{ myAssignmentCount }} {{ myAssignmentCount === 1 ? 'role' : 'roles' }} for you
        </v-chip>
      </div>
    </v-card>

    <!-- Not linked to a member record -->
    <v-alert
      v-if="day && !linkedPersonId"
      class="mb-6"
      density="compact"
      icon="mdi-information-outline"
      rounded="lg"
      type="info"
      variant="tonal"
    >
      Your login isn't linked to a team member yet, so nothing is highlighted below.
      Ask an administrator to link it if you'd like to see your own assignments called out.
    </v-alert>

    <!-- Day-level leadership. The producer and assistant producer oversee every
         event on the date, so they sit above the events rather than inside
         whichever event happens to hold their assignment row. -->
    <v-card
      v-if="day && leadership.length > 0"
      class="mb-6 overflow-hidden oversight-card"
      rounded="lg"
      variant="outlined"
    >
      <div class="event-card-header px-5 py-4 d-flex align-center ga-2">
        <v-icon color="primary" size="16">mdi-account-star-outline</v-icon>
        <span class="text-subtitle-1 font-weight-medium font-serif">Overseeing the day</span>
        <v-spacer />
        <span class="text-caption text-medium-emphasis">
          {{ day.events.length === 1 ? 'Across the event' : `Across all ${day.events.length} events` }}
        </span>
      </div>

      <v-row class="pa-4" dense>
        <v-col v-for="lead in leadership" :key="lead.label" cols="12" sm="6">
          <div :class="['lead-row d-flex align-center px-4 py-3', lead.person.is_you ? 'mine' : '']">
            <v-avatar class="lead-avatar mr-3" size="36">
              <span class="text-caption font-weight-bold">{{ initialsOf(lead.person.name) }}</span>
            </v-avatar>
            <div class="min-w-0">
              <p class="lead-label">{{ lead.label }}</p>
              <p class="lead-name text-truncate d-flex align-center ga-2">
                <span class="text-truncate">{{ lead.person.name }}</span>
                <v-chip
                  v-if="lead.person.is_you"
                  class="you-badge flex-shrink-0"
                  color="primary"
                  label
                  size="x-small"
                  variant="flat"
                >You</v-chip>
              </p>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- Special roles are day-level too: they are configured against the day
         rather than a single event, and the generator page shows them in their
         own section for the same reason. -->
    <v-card
      v-if="day && specialRoles.length > 0"
      class="mb-6 overflow-hidden oversight-card"
      rounded="lg"
      variant="outlined"
    >
      <div class="event-card-header px-5 py-4 d-flex align-center ga-2">
        <v-icon color="warning" size="16">mdi-star-outline</v-icon>
        <span class="text-subtitle-1 font-weight-medium font-serif">Special roles</span>
        <v-spacer />
        <span class="text-caption text-medium-emphasis">
          {{ day.events.length === 1 ? 'Across the event' : `Across all ${day.events.length} events` }}
        </span>
      </div>

      <v-row class="pa-4" dense>
        <v-col v-for="entry in specialRoles" :key="entry.role" cols="12" sm="6">
          <div class="lead-row d-block px-4 py-3">
            <p class="lead-label mb-2">{{ entry.role }}</p>
            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="person in entry.people"
                :key="person.person_id"
                :class="person.is_you ? 'font-weight-bold' : ''"
                :color="person.is_you ? 'primary' : 'warning'"
                size="small"
                variant="tonal"
              >
                {{ person.name }}
                <template v-if="person.is_you">
                  <v-chip
                    class="you-badge ml-2"
                    color="primary"
                    label
                    size="x-small"
                    variant="flat"
                  >You</v-chip>
                </template>
              </v-chip>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- The day's roster -->
    <div v-if="day">
      <v-row>
        <v-col
          v-for="event in day.events"
          :key="event.roster_id"
          cols="12"
          md="6"
        >
          <v-card class="overflow-hidden mb-1 event-card" rounded="lg" variant="outlined">
            <div class="event-card-header px-5 py-4 d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-2">
                <v-icon color="primary" size="16">mdi-calendar-star-outline</v-icon>
                <span class="text-subtitle-1 font-weight-medium font-serif">{{ event.event_name }}</span>
              </div>

              <v-chip
                v-if="event.assignments.length > 0"
                color="primary"
                size="small"
                variant="tonal"
              >{{ event.assignments.length }} {{ event.assignments.length === 1 ? 'role' : 'roles' }}</v-chip>
            </div>

            <v-list v-if="event.assignments.length > 0" class="py-1" density="compact">
              <v-list-item
                v-for="(assignment, idx) in event.assignments"
                :key="`${assignment.role}-${assignment.person_id}-${idx}`"
                :class="['px-4', assignment.is_you ? 'mine' : '']"
                min-height="44"
              >
                <template #prepend>
                  <v-chip
                    class="mr-3 text-truncate"
                    :color="assignment.is_you ? 'primary' : 'secondary'"
                    label
                    size="x-small"
                    style="min-width: 100px; max-width: 120px; justify-content: center;"
                    variant="tonal"
                  >{{ assignment.role }}</v-chip>
                </template>

                <v-list-item-title class="text-body-2 font-weight-medium d-flex align-center ga-2">
                  <span class="text-truncate">{{ assignment.name }}</span>

                  <v-chip
                    v-if="assignment.is_you"
                    class="you-badge flex-shrink-0"
                    color="primary"
                    label
                    size="x-small"
                    variant="flat"
                  >You</v-chip>
                </v-list-item-title>
              </v-list-item>
            </v-list>

            <v-card-text v-else class="text-body-2 text-medium-emphasis font-italic">
              Nobody assigned for this event.
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Empty / error states -->
    <v-card
      v-else-if="!loadingDay && !error"
      class="pa-16 text-center empty-state"
      rounded="lg"
      variant="outlined"
    >
      <v-icon class="mb-4" color="primary" size="52" style="opacity:.45;">mdi-calendar-month-outline</v-icon>

      <h3 class="text-h5 font-serif font-weight-medium mb-2">
        {{ dateOptions.length > 0 ? 'Pick a date' : 'Nothing published yet' }}
      </h3>

      <p class="text-body-2 text-medium-emphasis mx-auto" style="max-width:380px;">
        {{ dateOptions.length > 0
          ? 'Choose a date above to see the duty roster for that day.'
          : 'Once a roster has been generated and saved, it will appear here.' }}
      </p>
    </v-card>

    <v-skeleton-loader v-if="loadingDay" type="card, card" />

    <v-alert v-if="error" class="mt-4" rounded="lg" type="error">{{ error }}</v-alert>

  </v-container>
</template>

<script setup>
  /**
   * Read-only published schedule — the only roster page a member can open, and a
   * convenient way for admins and schedulers to look up a past date (the /rosters
   * page is the generator, and only holds the roster it just produced).
   *
   * Backed by two endpoints that every tenant role may call:
   *   GET /api/rosters/dates/          the dates that have a saved roster
   *   GET /api/rosters/day/<date>/     that day's events and assignments
   *
   * The backend flags each assignment with `is_you` by matching the requesting
   * login against `Persons.user`. Logins with no linked person still see the whole
   * roster, just without highlighting — hence the notice at the top.
   *
   * `producer`, `assistant_producer` and `special_roles` come back at the top
   * level rather than inside `events`: they cover the whole date, so they are
   * shown once above the events instead of inside whichever one stores their row.
   * This is the same split `/rosters` and the PDF already use.
   */
  import { computed, onMounted, ref } from 'vue'
  import api from '@/api'
  import { readApiError } from '@/validation'

  const dates = ref([])
  const selectedDate = ref(null)
  const day = ref(null)
  const linkedPersonId = ref(null)
  const loadingDates = ref(false)
  const loadingDay = ref(false)
  const error = ref(null)

  const dateOptions = computed(() =>
    dates.value.map(d => ({ value: d, label: formatDisplayDate(d) })),
  )

  /**
   * Producer and assistant producer, in that order, skipping whichever the day
   * doesn't have. The backend lifts them out of the per-event assignments
   * because they cover the whole date rather than a single event.
   */
  const leadership = computed(() => {
    if (!day.value) {
      return []
    }
    return [
      { label: 'Producer', person: day.value.producer },
      { label: 'Assistant Producer', person: day.value.assistant_producer },
    ].filter(entry => entry.person)
  })

  /**
   * Day-level roles that aren't leadership — Hospitality and anything else marked
   * `is_special_role`. Keyed by role name on the wire; unpacked here into a list
   * so the template can iterate it in a stable order.
   */
  const specialRoles = computed(() => {
    if (!day.value) {
      return []
    }
    return Object.entries(day.value.special_roles || {}).map(([role, people]) => ({
      role: formatRoleName(role),
      people,
    }))
  })

  const myAssignmentCount = computed(() => {
    if (!day.value) {
      return 0
    }
    // Leadership and special roles no longer sit in `events`, so count them
    // separately — otherwise a producer with no other duty would be told they
    // have nothing on.
    const eventRoles = day.value.events.reduce(
      (total, event) => total + event.assignments.filter(a => a.is_you).length,
      0,
    )
    const dayRoles = leadership.value.filter(entry => entry.person.is_you).length
      + specialRoles.value.reduce(
        (total, entry) => total + entry.people.filter(p => p.is_you).length,
        0,
      )
    return eventRoles + dayRoles
  })

  /** `special_roles` arrives keyed by lower-cased role name, as on /rosters. */
  function formatRoleName (name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  function initialsOf (name) {
    const [first = '', last = ''] = (name || '').split(' ')
    return ((first[0] || '?') + (last[0] || '')).toUpperCase()
  }

  function formatDisplayDate (date) {
    if (!date) {
      return ''
    }
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  async function loadDates () {
    loadingDates.value = true
    try {
      const res = await api.get('/api/rosters/dates/')
      dates.value = res.data
      // Default to the most recent published date so the page is useful on arrival.
      if (dates.value.length > 0) {
        selectedDate.value = dates.value[0]
        await loadDay(selectedDate.value)
      }
    } catch (error_) {
      error.value = readApiError(error_, 'Could not load event dates.')
    } finally {
      loadingDates.value = false
    }
  }

  async function loadDay (date) {
    if (!date) {
      return
    }
    loadingDay.value = true
    error.value = null
    day.value = null
    try {
      const res = await api.get(`/api/rosters/day/${date}/`)
      day.value = res.data
      linkedPersonId.value = res.data.linked_person_id
    } catch (error_) {
      error.value = error_.response?.status === 404
        ? 'No roster has been published for that date.'
        : (readApiError(error_, 'Could not load that roster.'))
    } finally {
      loadingDay.value = false
    }
  }

  onMounted(loadDates)
</script>

<style scoped>
.date-toolbar {
  background: rgb(var(--v-theme-surface)) !important;
}
.date-block {
  min-width: 240px;
}
.date-field {
  max-width: 320px;
}
/* The label sits above the field rather than floating inside it — the same
   pattern the roster generator uses, and it avoids the floating label colliding
   with a long selected date. */
.field-label {
  font-size: .75rem;
  font-weight: 500;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0 0 6px 2px;
}
.date-field :deep(.v-field) {
  background: rgb(var(--v-theme-surface-variant)) !important;
}

.event-card-header {
  background: rgb(var(--v-theme-surface-variant));
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.08);
}
.v-theme--dark .event-card-header {
  border-bottom-color: rgba(var(--v-theme-primary), 0.10);
}

/* The requesting user's own rows */
.mine {
  background: rgba(var(--v-theme-primary), 0.06);
  border-left: 3px solid rgb(var(--v-theme-primary));
}
.v-theme--dark .mine {
  background: rgba(var(--v-theme-primary), 0.10);
}

.empty-state {
  background: rgb(var(--v-theme-surface)) !important;
}

/* Day-level leadership ───────────────────────────────────────────────────── */
.oversight-card {
  background: rgb(var(--v-theme-surface)) !important;
}
.lead-row {
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  min-height: 64px;
}
/* `.mine` is declared above, but `.lead-row`'s own border comes later in the
   sheet and would win at equal specificity — so restate the accent here. */
.lead-row.mine {
  border-left: 3px solid rgb(var(--v-theme-primary));
  border-color: rgba(var(--v-theme-primary), 0.35);
  border-left-color: rgb(var(--v-theme-primary));
}
.lead-avatar {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface));
  flex: 0 0 36px;
}
.lead-label {
  font-size: .6875rem;
  font-weight: 500;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0 0 2px;
}
.lead-name {
  font-size: .9375rem;
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
}
.min-w-0 { min-width: 0; }

/* The "You" badge — reads as a marker beside the name rather than a second
   piece of data. Sized down and letterspaced so it sits quietly at x-small,
   with its own inline padding since the chip default is tight at this size. */
.you-badge {
  font-size: .625rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  height: 18px;
  padding-inline: 7px;
}
</style>
