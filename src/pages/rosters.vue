<template>
  <v-container class="pa-6 pa-md-8" fluid>

    <PageHeader
      eyebrow="Schedule"
      italic="generator"
      :subtitle="selectedDate ? `Scheduled for ${formatDisplayDate(selectedDate)}` : 'Pick a date below to generate a roster.'"
      title="Roster"
    />

    <!-- Generator toolbar -->
    <v-card class="generator-toolbar pa-5 mb-6" rounded="lg" variant="outlined">
      <div class="d-flex align-center flex-wrap" style="gap: 12px;">
        <v-text-field
          v-model="selectedDate"
          class="date-field"
          density="comfortable"
          hide-details
          label="Roster date"
          prepend-inner-icon="mdi-calendar"
          type="date"
        />

        <v-btn
          color="primary"
          :disabled="!selectedDate"
          prepend-icon="mdi-calendar-sync-outline"
          variant="flat"
          @click="showGenerateDialog = true"
        >Generate roster</v-btn>

        <v-spacer />

        <template v-if="roster">
          <v-btn
            v-if="!editMode"
            prepend-icon="mdi-pencil-outline"
            variant="outlined"
            @click="enterEditMode"
          >Edit</v-btn>
          <v-btn
            v-else
            color="error"
            prepend-icon="mdi-close"
            variant="outlined"
            @click="cancelEdit"
          >Cancel</v-btn>

          <v-btn
            :loading="saving"
            prepend-icon="mdi-content-save-outline"
            variant="outlined"
            @click="saveRoster"
          >{{ editMode ? 'Save changes' : 'Save' }}</v-btn>

          <v-tooltip :text="!rosterSaved ? 'Save the roster first to enable PDF export' : 'Download PDF'">
            <template #activator="{ props }">
              <span v-bind="props">
                <v-btn
                  :disabled="!rosterSaved"
                  prepend-icon="mdi-file-pdf-box"
                  variant="outlined"
                  @click="downloadRosterPDF"
                >PDF</v-btn>
              </span>
            </template>
          </v-tooltip>

          <v-btn icon="mdi-printer" title="Print" variant="outlined" @click="printRoster" />
        </template>
      </div>

      <v-alert
        v-if="roster && !rosterSaved"
        class="mt-4"
        density="compact"
        icon="mdi-information-outline"
        rounded="lg"
        type="warning"
        variant="tonal"
      >
        Roster not yet saved. Click <strong>Save</strong> to persist your roster, then PDF export will be available.
      </v-alert>
    </v-card>

    <!-- ── Roster output ────────────────────────────────────── -->
    <div v-if="roster" ref="rosterRef">

      <!-- Stats strip -->
      <v-card
        v-if="roster.metadata"
        class="mb-6 stats-strip px-5 py-4"
        rounded="lg"
        variant="outlined"
      >
        <div class="d-flex align-center flex-wrap" style="gap: 28px;">
          <div class="d-flex align-center gap-2">
            <v-icon color="primary" size="16" style="opacity:.7;">mdi-clock-check-outline</v-icon>
            <span class="text-caption">Generated <strong>{{ new Date(roster.metadata.generated_at).toLocaleString() }}</strong></span>
          </div>
          <v-divider style="height:18px;" vertical />
          <div class="d-flex align-center gap-2">
            <v-icon color="success" size="16" style="opacity:.7;">mdi-account-group-outline</v-icon>
            <span class="text-caption"><strong>{{ roster.metadata.total_people_available }}</strong> available</span>
          </div>
          <v-divider style="height:18px;" vertical />
          <div class="d-flex align-center gap-2">
            <v-icon color="primary" size="16" style="opacity:.7;">mdi-briefcase-check-outline</v-icon>
            <span class="text-caption"><strong>{{ roster.metadata.total_assignments }}</strong> total assignments</span>
          </div>
          <v-chip
            v-if="editMode"
            color="warning"
            prepend-icon="mdi-pencil"
            size="small"
            variant="tonal"
          >
            Edit mode
          </v-chip>
        </div>
      </v-card>

      <!-- Leadership banner -->
      <v-card
        v-if="roster.producer || roster.assistant_producer"
        class="mb-6 leadership-card"
        rounded="lg"
        variant="outlined"
      >
        <v-card-text class="pa-6">
          <div class="d-flex align-center gap-2 mb-5">
            <v-icon color="primary" size="16">mdi-star-circle-outline</v-icon>
            <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Leadership</span>
          </div>
          <v-row>
            <v-col cols="12" sm="6">
              <div v-if="!editMode" class="d-flex align-center gap-4">
                <v-avatar class="leadership-avatar" size="48">
                  <span class="text-h6 font-weight-bold font-serif">
                    {{ roster.producer?.name?.[0]?.toUpperCase() || 'P' }}
                  </span>
                </v-avatar>
                <div>
                  <p class="text-caption text-medium-emphasis text-uppercase mb-1" style="letter-spacing:.18em;">Producer</p>
                  <p class="text-h6 font-serif font-weight-medium">{{ roster.producer?.name || '—' }}</p>
                </div>
              </div>
              <v-autocomplete
                v-else
                v-model="editableRoster.producer"
                density="comfortable"
                hide-details
                item-title="fullname"
                :items="producers"
                label="Producer"
                prepend-inner-icon="mdi-account-star-outline"
                return-object
                @update:model-value="onProducerChange"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <div v-if="!editMode" class="d-flex align-center gap-4">
                <v-avatar class="leadership-avatar leadership-avatar-secondary" size="48">
                  <span class="text-h6 font-weight-bold font-serif">
                    {{ roster.assistant_producer?.name?.[0]?.toUpperCase() || 'A' }}
                  </span>
                </v-avatar>
                <div>
                  <p class="text-caption text-medium-emphasis text-uppercase mb-1" style="letter-spacing:.18em;">Assistant producer</p>
                  <p class="text-h6 font-serif font-weight-medium">{{ roster.assistant_producer?.name || '—' }}</p>
                </div>
              </div>
              <v-autocomplete
                v-else
                v-model="editableRoster.assistant_producer"
                density="comfortable"
                hide-details
                item-title="fullname"
                :items="assistants"
                label="Assistant producer"
                prepend-inner-icon="mdi-account-tie-outline"
                return-object
                @update:model-value="onAssistantChange"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Service assignments -->
      <div v-if="roster.events?.length" class="mb-6">
        <div class="section-label d-flex align-center gap-3 mb-4">
          <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Service assignments</span>
          <v-divider class="flex-grow-1" />
          <v-chip color="primary" size="small" variant="tonal">{{ roster.events.length }} {{ roster.events.length === 1 ? 'event' : 'events' }}</v-chip>
        </div>

        <v-row>
          <v-col
            v-for="(event, eIdx) in (editMode ? editableRoster.events : roster.events)"
            :key="event.event_id"
            cols="12"
            md="6"
          >
            <v-card class="overflow-hidden mb-1 event-card" rounded="lg" variant="outlined">
              <div class="event-card-header px-5 py-4 d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-2">
                  <v-icon color="primary" size="16">mdi-calendar-star-outline</v-icon>
                  <span class="text-subtitle-1 font-weight-medium font-serif">{{ event.event_name }}</span>
                </div>
                <v-chip
                  v-if="event.assignments?.length"
                  color="primary"
                  size="small"
                  variant="tonal"
                >{{ event.assignments.length }} roles</v-chip>
              </div>

              <v-list class="py-1" density="compact">
                <v-list-item
                  v-for="(assignment, aIdx) in event.assignments"
                  :key="assignment.role"
                  class="px-4"
                  min-height="44"
                >
                  <template #prepend>
                    <v-chip
                      class="mr-3 text-truncate"
                      color="secondary"
                      label
                      size="x-small"
                      style="min-width: 100px; max-width: 120px; justify-content: center;"
                      variant="tonal"
                    >{{ assignment.role }}</v-chip>
                  </template>
                  <v-list-item-title v-if="!editMode" class="text-body-2 font-weight-medium">
                    <span v-if="assignment.name">{{ assignment.name }}</span>
                    <span v-else class="text-medium-emphasis font-italic">Unassigned — edit to fill</span>
                  </v-list-item-title>
                  <v-autocomplete
                    v-else
                    v-model="editableRoster.events[eIdx].assignments[aIdx].person_id"
                    density="compact"
                    hide-details
                    item-title="fullname"
                    item-value="id"
                    :items="allMembers"
                    style="min-width: 160px;"
                    variant="plain"
                    @update:model-value="(id) => onAssignmentChange(eIdx, aIdx, id)"
                  />
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Special roles -->
      <div
        v-if="roster.special_roles && Object.keys(roster.special_roles).length > 0"
        class="mb-6"
      >
        <div class="section-label d-flex align-center gap-3 mb-4">
          <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Special roles</span>
          <v-divider class="flex-grow-1" />
        </div>
        <v-row>
          <v-col
            v-for="(people, roleName) in (editMode ? editableRoster.special_roles : roster.special_roles)"
            :key="roleName"
            cols="12"
            md="4"
            sm="6"
          >
            <v-card border class="pa-4" rounded="lg">
              <div class="d-flex align-center gap-2 mb-3">
                <v-icon color="warning" size="16">mdi-star</v-icon>
                <span class="text-caption font-weight-bold text-uppercase text-medium-emphasis" style="letter-spacing:.06em;">
                  {{ formatRoleName(roleName) }}
                </span>
                <v-chip color="warning" size="x-small" variant="tonal">{{ people.length }}</v-chip>
              </div>
              <div v-if="!editMode" class="d-flex flex-wrap" style="gap: 8px;">
                <v-chip
                  v-for="person in people"
                  :key="person.person_id"
                  color="warning"
                  size="small"
                  variant="tonal"
                >{{ person.name }}</v-chip>
              </div>
              <v-autocomplete
                v-else
                chips
                closable-chips
                density="compact"
                hide-details
                item-title="fullname"
                item-value="id"
                :items="allMembers"
                :model-value="people.map(p => p.person_id)"
                multiple
                variant="outlined"
                @update:model-value="(ids) => onSpecialRoleChange(roleName, ids)"
              />
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Summary -->
      <v-expansion-panels v-if="roster.summary" rounded="lg" variant="accordion">
        <v-expansion-panel elevation="0" rounded="lg">
          <v-expansion-panel-title class="py-3">
            <div class="d-flex align-center gap-2">
              <v-icon color="info" size="20">mdi-chart-bar</v-icon>
              <span class="text-subtitle-2 font-weight-medium">Roster Summary</span>
              <v-chip class="ml-1" color="success" size="x-small" variant="tonal">
                {{ roster.summary.people_assigned?.length || 0 }} assigned
              </v-chip>
              <v-chip
                v-if="roster.summary.people_not_assigned?.length"
                color="warning"
                size="x-small"
                variant="tonal"
              >{{ roster.summary.people_not_assigned.length }} unassigned</v-chip>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div v-if="roster.summary.people_not_assigned?.length">
              <p class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3" style="letter-spacing:.06em;">
                Not Assigned
              </p>
              <div class="d-flex flex-wrap" style="gap: 8px;">
                <v-chip
                  v-for="person in roster.summary.people_not_assigned"
                  :key="person.person_id"
                  color="warning"
                  size="small"
                  variant="tonal"
                >{{ person.name }}</v-chip>
              </div>
            </div>
            <div v-else class="d-flex align-center gap-2 py-1">
              <v-icon color="success" size="20">mdi-check-circle</v-icon>
              <span class="text-body-2">All available members have been assigned.</span>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Empty state -->
    <v-card
      v-else-if="!error"
      class="pa-16 text-center empty-state"
      rounded="lg"
      variant="outlined"
    >
      <v-icon class="mb-4" color="primary" size="52" style="opacity:.45;">mdi-calendar-month-outline</v-icon>
      <h3 class="text-h5 font-serif font-weight-medium mb-2">No roster generated yet</h3>
      <p class="text-body-2 text-medium-emphasis mb-6 mx-auto" style="max-width:380px;">
        Choose a date above and click <strong>Generate roster</strong> to automatically assign your team members to service roles.
      </p>
      <v-btn
        color="primary"
        :disabled="!selectedDate"
        prepend-icon="mdi-calendar-sync-outline"
        size="large"
        variant="flat"
        @click="showGenerateDialog = true"
      >Generate roster</v-btn>
    </v-card>

    <v-alert v-if="error" class="mt-4" rounded="lg" type="error">{{ error }}</v-alert>

    <!-- ── Generate dialog ──────────────────────────────────── -->
    <v-dialog v-model="showGenerateDialog" width="520">
      <v-card class="overflow-hidden" rounded="lg">
        <div class="generate-dialog-header pa-5 d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-3">
            <v-avatar class="generate-dialog-avatar" size="40">
              <v-icon size="20">mdi-calendar-sync-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline font-weight-bold" style="letter-spacing:.2em; opacity:.7;">
                Schedule
              </div>
              <h3 class="text-h6 font-serif font-weight-medium">Generate roster</h3>
              <p class="text-caption text-medium-emphasis">
                {{ selectedDate ? formatDisplayDate(selectedDate) : '' }}
              </p>
            </div>
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" @click="showGenerateDialog = false" />
        </div>

        <v-card-text class="pa-6">
          <v-alert
            class="mb-5"
            density="compact"
            rounded="lg"
            type="info"
            variant="tonal"
          >
            Optionally mark members as absent or deactivate events for this generation run.
          </v-alert>

          <v-autocomplete
            v-model="selectedMember"
            chips
            class="mb-4"
            clearable
            closable-chips
            item-title="fullname"
            item-value="id"
            :items="members"
            label="Absent Members"
            :loading="loadingMembers"
            multiple
            :no-data-text="loadingMembers ? 'Loading...' : 'No members found'"
            prepend-inner-icon="mdi-account-off-outline"
          />

          <v-autocomplete
            v-model="selectedEvent"
            chips
            clearable
            closable-chips
            item-title="name"
            item-value="id"
            :items="events"
            label="Inactive Events"
            :loading="loadingEvents"
            multiple
            :no-data-text="loadingEvents ? 'Loading...' : 'No events found'"
            prepend-inner-icon="mdi-calendar-remove-outline"
          />
        </v-card-text>

        <v-divider />
        <v-card-actions class="justify-space-between px-6 py-4">
          <v-btn variant="text" @click="showGenerateDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-calendar-sync"
            variant="flat"
            @click="generateRoster"
          >Generate</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { toast } from 'vue-sonner'
  import { useEventsStore } from '@/stores/events'
  import { usePeopleStore } from '@/stores/people'
  import { useRostersStore } from '@/stores/rosters'

  const rostersStore = useRostersStore()
  const peopleStore = usePeopleStore()
  const eventsStore = useEventsStore()

  const selectedDate = ref(null)
  const roster = ref(null)
  const error = ref(null)
  const rosterRef = ref(null)
  const selectedMember = ref(null)
  const selectedEvent = ref(null)
  const showGenerateDialog = ref(false)
  const members = ref([])
  const loadingMembers = ref(false)
  const events = ref([])
  const loadingEvents = ref(false)
  const saving = ref(false)
  const rosterSaved = ref(false)
  const editMode = ref(false)
  const editableRoster = ref(null)
  const rawMembers = ref([])

  const allMembers = computed(() =>
    rawMembers.value.map(m => ({
      id: m.id,
      fullname: `${m.first_name} ${m.last_name}`.trim(),
      is_producer: m.is_producer,
      is_assistant_producer: m.is_assistant_producer,
    })),
  )
  const producers = computed(() => allMembers.value.filter(m => m.is_producer))
  const assistants = computed(() => allMembers.value.filter(m => m.is_assistant_producer))

  function formatDate (date) {
    if (date instanceof Date) return date.toISOString().split('T')[0]
    if (typeof date === 'string' && date.includes('T')) return date.split('T')[0]
    return date
  }

  function formatDisplayDate (date) {
    if (!date) return ''
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  function formatRoleName (name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  function enterEditMode () {
    // eslint-disable-next-line unicorn/prefer-structured-clone -- structuredClone chokes on Vue reactive proxies
    editableRoster.value = JSON.parse(JSON.stringify(roster.value))
    // Map producer/AP to the items shape so the autocompletes pre-fill them
    if (editableRoster.value.producer?.id) {
      const match = producers.value.find(m => m.id === editableRoster.value.producer.id)
      if (match) editableRoster.value.producer = { ...match, name: match.fullname }
    }
    if (editableRoster.value.assistant_producer?.id) {
      const match = assistants.value.find(m => m.id === editableRoster.value.assistant_producer.id)
      if (match) editableRoster.value.assistant_producer = { ...match, name: match.fullname }
    }
    editMode.value = true
  }

  function cancelEdit () {
    editableRoster.value = null
    editMode.value = false
  }

  function onProducerChange (selected) {
    if (!selected) return
    editableRoster.value.producer = { ...selected, name: selected.fullname }
  }

  function onAssistantChange (selected) {
    if (!selected) return
    editableRoster.value.assistant_producer = { ...selected, name: selected.fullname }
  }

  function onAssignmentChange (eIdx, aIdx, personId) {
    const member = allMembers.value.find(m => m.id === personId)
    if (member) {
      editableRoster.value.events[eIdx].assignments[aIdx].person_id = personId
      editableRoster.value.events[eIdx].assignments[aIdx].name = member.fullname
    }
  }

  function onSpecialRoleChange (roleName, ids) {
    editableRoster.value.special_roles[roleName] = ids.map(id => {
      const m = allMembers.value.find(x => x.id === id)
      return { person_id: id, name: m ? m.fullname : '' }
    })
  }

  async function generateRoster () {
    error.value = null
    roster.value = null
    rosterSaved.value = false
    editMode.value = false
    const payload = {
      date: formatDate(selectedDate.value),
      absent_members: selectedMember.value || [],
      inactive_events: selectedEvent.value || [],
    }
    const result = await rostersStore.createRoster(payload)
    if (result.success) {
      roster.value = result.data
      showGenerateDialog.value = false
      toast.success('Roster generated. Review it, then Save before exporting to PDF.')
    } else {
      error.value = result.error || 'Failed to generate roster.'
      toast.error(error.value)
    }
  }

  function printRoster () {
    const printContents = rosterRef.value.innerHTML
    const printWindow = window.open('', '', 'height=600,width=800')
    printWindow.document.open()
    printWindow.document.title = 'Roster'
    printWindow.document.body.innerHTML = printContents
    printWindow.document.close()
    printWindow.print()
  }

  async function downloadRosterPDF () {
    if (!roster.value) {
      toast.error('No roster to download.')
      return
    }
    const result = await rostersStore.downloadRosterPDF({
      roster_data: roster.value,
      date: formatDate(selectedDate.value),
    })
    if (result.success) {
      const url = window.URL.createObjectURL(new Blob([result.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `roster_${formatDate(selectedDate.value) || 'export'}.pdf`)
      document.body.append(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded successfully.')
    } else {
      toast.error('Failed to download PDF.')
    }
  }

  async function saveRoster () {
    saving.value = true
    const dataToSave = editMode.value ? editableRoster.value : roster.value
    if (editMode.value) {
      // eslint-disable-next-line unicorn/prefer-structured-clone -- structuredClone chokes on Vue reactive proxies
      roster.value = JSON.parse(JSON.stringify(editableRoster.value))
      editMode.value = false
    }
    const result = await rostersStore.saveRoster({
      date: formatDate(selectedDate.value),
      data: dataToSave,
    })
    saving.value = false
    if (result.success) {
      rosterSaved.value = true
      toast.success('Roster saved successfully. You can now download the PDF.')
    } else {
      toast.error(result.error || 'Failed to save roster.')
    }
  }

  async function fetchMember () {
    loadingMembers.value = true
    const result = await peopleStore.fetchActivePersons()
    if (result.success) {
      rawMembers.value = result.data
      members.value = result.data.map(m => ({
        id: m.id,
        fullname: `${m.first_name} ${m.last_name}`.trim(),
      }))
    }
    loadingMembers.value = false
  }

  async function fetchEvents () {
    loadingEvents.value = true
    const result = await eventsStore.fetchEvents()
    if (result.success) events.value = eventsStore.events
    loadingEvents.value = false
  }

  onMounted(fetchEvents)
  onMounted(fetchMember)
</script>

<style scoped>
/* Generator toolbar */
.generator-toolbar {
  background: rgb(var(--v-theme-surface)) !important;
}
.date-field {
  max-width: 240px;
  flex: 1 1 200px;
}
.date-field :deep(.v-field) {
  background: rgb(var(--v-theme-surface-variant)) !important;
}

/* Stats strip */
.stats-strip {
  background: rgb(var(--v-theme-surface-variant)) !important;
}

/* Leadership card */
.leadership-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05), rgb(var(--v-theme-surface)) 60%) !important;
}
.v-theme--dark .leadership-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08), rgb(var(--v-theme-surface)) 60%) !important;
}
.leadership-avatar {
  background: rgb(var(--v-theme-surface-variant)) !important;
  color: rgb(var(--v-theme-primary-darken-1));
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
}
.v-theme--dark .leadership-avatar {
  color: rgb(var(--v-theme-primary-lighten-1));
  border-color: rgba(var(--v-theme-primary), 0.30);
}
.leadership-avatar-secondary {
  color: rgb(var(--v-theme-on-surface-variant));
  border-color: rgba(var(--v-theme-secondary), 0.30);
}
.v-theme--dark .leadership-avatar-secondary {
  border-color: rgba(var(--v-theme-secondary), 0.30);
}

/* Event cards */
.event-card-header {
  background: rgb(var(--v-theme-surface-variant));
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.08);
}
.v-theme--dark .event-card-header {
  border-bottom-color: rgba(var(--v-theme-primary), 0.10);
}

/* Empty state */
.empty-state {
  background: rgb(var(--v-theme-surface)) !important;
}

/* Generate dialog header */
.generate-dialog-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.06), rgba(var(--v-theme-primary), 0.02));
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.10);
}
.v-theme--dark .generate-dialog-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.10), rgba(var(--v-theme-primary), 0.03));
  border-bottom-color: rgba(var(--v-theme-primary), 0.12);
}
.generate-dialog-avatar {
  background: rgb(var(--v-theme-surface-variant)) !important;
  color: rgb(var(--v-theme-primary));
  border: 1px solid rgba(var(--v-theme-primary), 0.20);
}
.v-theme--dark .generate-dialog-avatar {
  border-color: rgba(var(--v-theme-primary), 0.22);
}
</style>
