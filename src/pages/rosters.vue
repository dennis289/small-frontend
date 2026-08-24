<template>
  <v-container class="pa-6 pa-md-8" fluid>

    <PageHeader
      eyebrow="Menu"
      :subtitle="selectedDate ? `Scheduled for ${formatDisplayDate(selectedDate)}` : 'Pick a date below to generate a roster.'"
      title="Roster generator"
    />

    <!-- Generator toolbar. Two bands: choosing a date is the one thing to do on an
         empty page, so it sits alone up top; the document actions only appear once
         there is a roster to act on. -->
    <v-card class="generator-toolbar mb-6 overflow-hidden" rounded="lg" variant="outlined">
      <div class="pa-5">
        <div class="d-flex align-center flex-wrap" style="gap: 16px;">
          <div class="date-block">
            <p class="text-caption text-medium-emphasis text-uppercase mb-2" style="letter-spacing:.16em;">
              Roster date
            </p>
            <v-text-field
              v-model="selectedDate"
              class="date-field"
              density="comfortable"
              hide-details
              prepend-inner-icon="mdi-calendar"
              type="date"
            />
          </div>

          <div class="d-flex flex-column" style="gap: 6px;">
            <p class="text-caption text-medium-emphasis text-uppercase mb-0" style="letter-spacing:.16em;">
              Jump to
            </p>
            <div class="d-flex flex-wrap" style="gap: 6px;">
              <v-chip
                v-for="option in upcomingDates"
                :key="option.value"
                :color="selectedDate === option.value ? 'primary' : undefined"
                size="small"
                :variant="selectedDate === option.value ? 'flat' : 'tonal'"
                @click="selectedDate = option.value"
              >{{ option.label }}</v-chip>
            </div>
          </div>

          <v-spacer />

          <v-btn
            color="primary"
            :disabled="!selectedDate"
            prepend-icon="mdi-calendar-sync-outline"
            size="large"
            variant="flat"
            @click="showGenerateDialog = true"
          >{{ roster ? 'Regenerate' : 'Generate roster' }}</v-btn>
        </div>

        <p v-if="selectedDate" class="text-caption text-medium-emphasis mt-3 mb-0">
          <v-icon size="14">mdi-information-outline</v-icon>
          Generating replaces whatever is on screen — {{ formatDisplayDate(selectedDate) }}.
        </p>

        <v-alert
          v-if="rosterDateMismatch"
          class="mt-4"
          density="compact"
          icon="mdi-calendar-alert"
          rounded="lg"
          type="warning"
          variant="tonal"
        >
          The roster below is still the unsaved one for
          <strong>{{ formatDisplayDate(rosterDate) }}</strong>. Save it, or generate
          a new one for {{ formatDisplayDate(selectedDate) }}.
        </v-alert>

        <!-- Only shown when auto-loading was skipped to protect unsaved work. -->
        <v-alert
          v-if="savedRosterAvailable"
          class="mt-4"
          density="compact"
          icon="mdi-history"
          rounded="lg"
          type="info"
          variant="tonal"
        >
          <div class="d-flex align-center flex-wrap" style="gap: 12px;">
            <span class="text-body-2">
              A roster is already saved for this date. Loading it will replace the
              unsaved one on screen.
            </span>
            <v-spacer />
            <v-btn
              :loading="loadingSaved"
              size="small"
              variant="flat"
              @click="loadSavedRoster(selectedDate)"
            >Load saved roster</v-btn>
          </div>
        </v-alert>
      </div>

      <!-- Document actions: separated by a rule so they read as acting on the
           roster below, not on the date field above. -->
      <template v-if="roster">
        <v-divider />
        <div class="action-bar px-5 py-3 d-flex align-center flex-wrap" style="gap: 8px;">
          <v-chip
            v-if="editMode"
            color="warning"
            prepend-icon="mdi-pencil"
            size="small"
            variant="tonal"
          >Editing</v-chip>
          <v-chip
            v-else-if="rosterSaved"
            color="success"
            prepend-icon="mdi-check-circle-outline"
            size="small"
            variant="tonal"
          >Saved</v-chip>
          <v-chip
            v-else
            color="warning"
            prepend-icon="mdi-content-save-alert-outline"
            size="small"
            variant="tonal"
          >Unsaved</v-chip>

          <v-spacer />

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
          >Discard changes</v-btn>

          <v-btn
            color="primary"
            :loading="saving"
            prepend-icon="mdi-content-save-outline"
            variant="flat"
            @click="saveRoster"
          >{{ editMode ? 'Save changes' : 'Save' }}</v-btn>

          <v-tooltip :text="rosterSaved ? 'See exactly how the PDF will look' : 'Save the roster first to preview the PDF'">
            <template #activator="{ props }">
              <span v-bind="props">
                <v-btn
                  :disabled="!rosterSaved"
                  :loading="previewLoading"
                  prepend-icon="mdi-file-eye-outline"
                  variant="outlined"
                  @click="openPreview"
                >Preview</v-btn>
              </span>
            </template>
          </v-tooltip>

          <v-tooltip :text="rosterSaved ? 'Download PDF' : 'Save the roster first to enable PDF export'">
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
        </div>
      </template>

      <v-alert
        v-if="roster && !rosterSaved"
        class="ma-5 mt-0"
        density="compact"
        icon="mdi-information-outline"
        rounded="lg"
        type="warning"
        variant="tonal"
      >
        Roster not yet saved. Click <strong>Save</strong> to persist it — PDF export
        unlocks after that. <strong>Rotation only counts saved rosters</strong>, so
        generating next week before saving this one will hand the same people the
        same roles again.
      </v-alert>

      <v-alert
        v-if="editMode"
        class="ma-5 mt-0"
        density="compact"
        icon="mdi-drag-horizontal-variant"
        rounded="lg"
        type="info"
        variant="tonal"
      >
        Drag rows by their handle to set the order they print in. Roles keep the
        default arrangement from the <strong>Roles</strong> page unless you change it here.
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
          <div class="d-flex align-center ga-2">
            <v-icon color="primary" size="16" style="opacity:.7;">mdi-clock-check-outline</v-icon>
            <span class="text-caption">Generated <strong>{{ new Date(roster.metadata.generated_at).toLocaleString() }}</strong></span>
          </div>
          <v-divider style="height:18px;" vertical />
          <div class="d-flex align-center ga-2">
            <v-icon color="success" size="16" style="opacity:.7;">mdi-account-group-outline</v-icon>
            <span class="text-caption"><strong>{{ roster.metadata.total_people_available }}</strong> available</span>
          </div>
          <v-divider style="height:18px;" vertical />
          <div class="d-flex align-center ga-2">
            <v-icon color="primary" size="16" style="opacity:.7;">mdi-briefcase-check-outline</v-icon>
            <!-- Counted from what's on screen, not from metadata, so it tracks edits. -->
            <span class="text-caption"><strong>{{ personMetrics.length }}</strong> serving</span>
          </div>
          <v-divider style="height:18px;" vertical />
          <div class="d-flex align-center ga-2">
            <v-icon color="primary" size="16" style="opacity:.7;">mdi-format-list-checks</v-icon>
            <span class="text-caption"><strong>{{ totalSlots }}</strong> slots filled</span>
          </div>
          <template v-if="unfilledSlots">
            <v-divider style="height:18px;" vertical />
            <div class="d-flex align-center ga-2">
              <v-icon color="error" size="16" style="opacity:.8;">mdi-alert-circle-outline</v-icon>
              <span class="text-caption"><strong>{{ unfilledSlots }}</strong> unfilled</span>
            </div>
          </template>
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
          <div class="d-flex align-center ga-2 mb-5">
            <v-icon color="primary" size="16">mdi-star-circle-outline</v-icon>
            <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Leadership</span>
          </div>
          <v-row>
            <v-col cols="12" sm="6">
              <div v-if="!editMode" class="d-flex align-center ga-4">
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
              <div v-if="!editMode" class="d-flex align-center ga-4">
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

      <!-- Event assignments -->
      <div v-if="roster.events?.length" class="mb-6">
        <div class="section-label d-flex align-center ga-3 mb-4">
          <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Event assignments</span>
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
                <div class="d-flex align-center ga-2">
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
                  class="px-4 assignment-row"
                  :class="{
                    'assignment-row--dragging': editMode && isDragging(eIdx, aIdx),
                    'assignment-row--over': editMode && isDragTarget(eIdx, aIdx),
                  }"
                  :draggable="editMode"
                  min-height="44"
                  @dragend="onRowDragEnd"
                  @dragover="e => onRowDragOver(eIdx, aIdx, e)"
                  @dragstart="e => onRowDragStart(eIdx, aIdx, e)"
                  @drop="e => onRowDrop(eIdx, aIdx, e)"
                >
                  <template #prepend>
                    <v-icon
                      v-if="editMode"
                      class="drag-handle mr-2"
                      size="16"
                      title="Drag to reorder — this is the order the PDF prints in"
                    >mdi-drag-horizontal-variant</v-icon>
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
        <div class="section-label d-flex align-center ga-3 mb-4">
          <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Special roles</span>
          <v-divider class="flex-grow-1" />
        </div>
        <v-row>
          <v-col
            v-for="(people, roleName, sIdx) in (editMode ? editableRoster.special_roles : roster.special_roles)"
            :key="roleName"
            cols="12"
            md="4"
            sm="6"
          >
            <v-card
              border
              class="pa-4 special-card"
              :class="{ 'special-card--dragging': editMode && specialDragIndex === sIdx }"
              :draggable="editMode"
              rounded="lg"
              @dragend="specialDragIndex = null"
              @dragover.prevent
              @dragstart="e => onSpecialDragStart(sIdx, e)"
              @drop="e => onSpecialDrop(sIdx, e)"
            >
              <div class="d-flex align-center ga-2 mb-3">
                <v-icon
                  v-if="editMode"
                  class="drag-handle"
                  size="16"
                  title="Drag to reorder special roles"
                >mdi-drag-horizontal-variant</v-icon>
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

      <!-- Summary — recomputed from what's on screen, so editing an assignment
           moves the numbers immediately. -->
      <v-expansion-panels rounded="lg" variant="accordion">
        <v-expansion-panel elevation="0" rounded="lg">
          <v-expansion-panel-title class="py-3">
            <div class="d-flex align-center flex-wrap ga-2">
              <v-icon color="info" size="20">mdi-chart-bar</v-icon>
              <span class="text-subtitle-2 font-weight-medium">Roster summary</span>
              <v-chip class="ml-1" color="success" size="x-small" variant="tonal">
                {{ personMetrics.length }} serving
              </v-chip>
              <v-chip color="primary" size="x-small" variant="tonal">
                {{ totalSlots }} {{ totalSlots === 1 ? 'slot' : 'slots' }} filled
              </v-chip>
              <v-chip
                v-if="unfilledSlots"
                color="error"
                size="x-small"
                variant="tonal"
              >{{ unfilledSlots }} unfilled</v-chip>
              <v-chip
                v-if="unassignedPeople.length > 0"
                color="warning"
                size="x-small"
                variant="tonal"
              >{{ unassignedPeople.length }} on the bench</v-chip>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <p class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3" style="letter-spacing:.06em;">
              Who is doing what
            </p>

            <div v-if="personMetrics.length === 0" class="text-body-2 text-medium-emphasis py-2">
              Nobody is assigned yet.
            </div>

            <v-card v-else class="mb-6 overflow-hidden" rounded="lg" variant="outlined">
              <div class="metric-row metric-row--head px-4 py-2">
                <span class="text-caption font-weight-bold text-uppercase text-medium-emphasis">Member</span>
                <span class="text-caption font-weight-bold text-uppercase text-medium-emphasis text-center">Slots</span>
                <span class="text-caption font-weight-bold text-uppercase text-medium-emphasis">Assignments</span>
              </div>

              <template v-for="(row, index) in personMetrics" :key="row.id">
                <v-divider />
                <div class="metric-row px-4 py-3" :class="{ 'metric-row--heavy': row.slots.length > 1 }">
                  <div class="d-flex align-center ga-3 min-w-0">
                    <v-avatar class="metric-avatar" size="30">
                      <span class="text-caption font-weight-bold">{{ row.name[0]?.toUpperCase() }}</span>
                    </v-avatar>
                    <span class="text-body-2 font-weight-medium text-truncate">{{ row.name }}</span>
                  </div>

                  <div class="text-center">
                    <v-chip
                      :color="row.slots.length > 1 ? 'warning' : 'primary'"
                      size="small"
                      variant="tonal"
                    >{{ row.slots.length }}</v-chip>
                  </div>

                  <div class="d-flex flex-wrap" style="gap: 6px;">
                    <v-tooltip
                      v-for="(slot, sIdx) in row.slots"
                      :key="`${index}-${sIdx}`"
                      :text="slot.context"
                    >
                      <template #activator="{ props }">
                        <v-chip
                          v-bind="props"
                          :color="slotColor(slot.kind)"
                          size="x-small"
                          variant="tonal"
                        >{{ slot.label }}</v-chip>
                      </template>
                    </v-tooltip>
                  </div>
                </div>
              </template>
            </v-card>

            <p class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3" style="letter-spacing:.06em;">
              Not assigned
            </p>
            <div v-if="unassignedPeople.length > 0" class="d-flex flex-wrap" style="gap: 8px;">
              <v-chip
                v-for="person in unassignedPeople"
                :key="person.person_id"
                color="warning"
                size="small"
                variant="tonal"
              >{{ person.name }}</v-chip>
            </div>
            <div v-else class="d-flex align-center ga-2 py-1">
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
      <!-- No button here on purpose. The toolbar above already carries the one
           primary action, and it is always on screen; a second identical
           button 200px below it just made the page ask the same question
           twice. The copy points at it instead, and changes once a date is
           chosen so the next step is never ambiguous. -->
      <p class="text-body-2 text-medium-emphasis mx-auto" style="max-width:400px;">
        <template v-if="selectedDate">
          Ready for <strong>{{ formatDisplayDate(selectedDate) }}</strong> — use
          <strong>Generate roster</strong> above to assign your team to event roles.
        </template>
        <template v-else>
          Pick a roster date above, then use <strong>Generate roster</strong> to
          assign your team to event roles automatically.
        </template>
      </p>
    </v-card>

    <v-alert v-if="error" class="mt-4" rounded="lg" type="error">{{ error }}</v-alert>

    <!-- ── Generate dialog ──────────────────────────────────── -->
    <v-dialog v-model="showGenerateDialog" persistent width="520">
      <v-card class="overflow-hidden" rounded="lg">
        <div class="generate-dialog-header pa-5 d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-3">
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

    <!-- ── PDF preview ──────────────────────────────────────── -->
    <!-- Rendered by the same endpoint the download uses, so this is the actual
         file rather than a separate approximation of it. -->
    <v-dialog v-model="showPreviewDialog" fullscreen transition="dialog-bottom-transition">
      <v-card class="d-flex flex-column" rounded="0">
        <div class="preview-header px-5 py-3 d-flex align-center" style="gap: 12px;">
          <v-icon color="primary" size="20">mdi-file-eye-outline</v-icon>
          <div>
            <h3 class="text-subtitle-1 font-weight-medium font-serif">PDF preview</h3>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ selectedDate ? formatDisplayDate(selectedDate) : '' }}
            </p>
          </div>

          <v-spacer />

          <v-btn
            prepend-icon="mdi-download"
            variant="outlined"
            @click="downloadRosterPDF"
          >Download</v-btn>
          <v-btn icon="mdi-close" variant="text" @click="closePreview" />
        </div>

        <v-divider />

        <div class="preview-body flex-grow-1">
          <div v-if="previewLoading" class="d-flex flex-column align-center justify-center fill-height" style="gap: 12px;">
            <v-progress-circular color="primary" indeterminate size="40" />
            <span class="text-body-2 text-medium-emphasis">Rendering the PDF…</span>
          </div>
          <iframe
            v-else-if="previewUrl"
            class="preview-frame"
            :src="previewUrl"
            title="Roster PDF preview"
          />
        </div>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
  /**
   * Roster generator page.
   *
   * Three states drive the whole screen:
   *   roster         the generated payload as returned by the backend (display source)
   *   editableRoster a deep copy taken when entering edit mode; discarded on cancel
   *   rosterSaved    gates PDF export — the PDF is rendered from what's on screen, so
   *                  requiring a save first keeps the exported file and the stored
   *                  history in agreement
   *
   * Generation does not persist anything; `saveRoster()` is what creates the Rosters
   * and Assignment rows that future generations rotate against. Absent members and
   * inactive events chosen in the dialog apply to this run only and don't change the
   * members' stored flags.
   */
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { toast } from 'vue-sonner'
  import api from '@/api'
  import { moveItem } from '@/composables/useDragOrder'
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
  // Dates that already have a saved roster. Only used to work out which weekday
  // this team rosters on — see `usualWeekday`.
  const rosteredDates = ref([])
  const saving = ref(false)
  const rosterSaved = ref(false)
  const editMode = ref(false)
  const editableRoster = ref(null)
  const rawMembers = ref([])
  // A saved roster exists for the chosen date but wasn't loaded, because there is
  // unsaved work on screen that auto-loading would have thrown away.
  // The date the roster on screen was built for. It can differ from `selectedDate`
  // while unsaved work is being protected from a date change, and the page says so
  // rather than showing one date's roster under another date's heading.
  const rosterDate = ref(null)
  const savedRosterAvailable = ref(false)
  const loadingSaved = ref(false)
  // PDF preview: the blob URL currently rendered in the dialog's iframe.
  const showPreviewDialog = ref(false)
  const previewUrl = ref(null)
  const previewLoading = ref(false)

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

  function toDateValue (date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')
  }

  /**
   * The weekday this team actually rosters on, inferred from the dates that
   * already have one, or null while there is no history to learn from.
   *
   * Nothing in the system fixes a roster day: a team may meet on a Sunday, a
   * Saturday, a Wednesday, or several. Rather than assuming one, the most
   * frequent weekday among saved rosters is used — which is self-correcting if a
   * team changes when it meets.
   */
  const usualWeekday = computed(() => {
    if (rosteredDates.value.length === 0) {
      return null
    }
    const tally = Array.from({ length: 7 }, () => 0)
    for (const value of rosteredDates.value) {
      // Parse as local midnight; `new Date('2026-08-30')` is parsed as UTC and
      // can land on the previous day west of Greenwich.
      const day = new Date(`${value}T00:00:00`).getDay()
      if (!Number.isNaN(day)) {
        tally[day]++
      }
    }
    const best = tally.indexOf(Math.max(...tally))
    return tally[best] > 0 ? best : null
  })

  /**
   * The next few likely roster dates, as one-click shortcuts — typing into a
   * native date input is the slow way to say "the next one".
   *
   * Once a team has history, these are the next four occurrences of the weekday
   * it rosters on. Before that there is nothing to infer from, so the next four
   * days are offered instead of guessing at a weekday.
   */
  const upcomingDates = computed(() => {
    const options = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const cursor = new Date(today)
    const weekday = usualWeekday.value
    const step = weekday === null ? 1 : 7
    if (weekday !== null) {
      // Step forward to that weekday, staying put if today already is one.
      cursor.setDate(cursor.getDate() + ((weekday - cursor.getDay() + 7) % 7))
    }

    for (let i = 0; i < 4; i++) {
      const value = toDateValue(cursor)
      options.push({
        value,
        label: value === toDateValue(today)
          ? 'Today'
          : cursor.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      })
      cursor.setDate(cursor.getDate() + step)
    }
    return options
  })

  // The roster currently on screen. Everything derived below reads through this,
  // so the stats and the summary describe what the user is actually looking at
  // rather than what the generator originally produced.
  const activeRoster = computed(() => (editMode.value ? editableRoster.value : roster.value))

  /**
   * Per-person breakdown of the roster on screen, rebuilt whenever an assignment
   * changes.
   *
   * The backend's `summary` is computed at generation time and goes stale the
   * moment anything is edited, so it's only used as a fallback for the pool of
   * people to report on when the members list hasn't loaded. Leadership counts as
   * a slot: producing is a job like any other, and a producer who is also on
   * camera is genuinely carrying two.
   *
   * Returns rows sorted heaviest-first, so whoever is over-committed is the first
   * thing the eye lands on.
   */
  const personMetrics = computed(() => {
    const data = activeRoster.value
    if (!data) return []

    // person_id -> { id, name, slots: [{ label, context, kind }] }
    const rows = new Map()

    function addSlot (personId, name, slot) {
      if (!personId) return
      if (!rows.has(personId)) rows.set(personId, { id: personId, name, slots: [] })
      const row = rows.get(personId)
      // A name from the members list is more trustworthy than one baked into the
      // payload, which may predate a rename.
      if (name) row.name = name
      row.slots.push(slot)
    }

    function nameFor (personId, fallback) {
      return allMembers.value.find(m => m.id === personId)?.fullname || fallback || 'Unknown'
    }

    if (data.producer?.id) {
      addSlot(data.producer.id, nameFor(data.producer.id, data.producer.name), {
        label: 'Producer', context: 'Leadership', kind: 'leadership',
      })
    }
    if (data.assistant_producer?.id) {
      addSlot(data.assistant_producer.id, nameFor(data.assistant_producer.id, data.assistant_producer.name), {
        label: 'Assistant producer', context: 'Leadership', kind: 'leadership',
      })
    }

    for (const event of data.events || []) {
      for (const assignment of event.assignments || []) {
        addSlot(assignment.person_id, nameFor(assignment.person_id, assignment.name), {
          label: assignment.role, context: event.event_name, kind: 'event',
        })
      }
    }

    for (const [roleName, people] of Object.entries(data.special_roles || {})) {
      for (const person of people || []) {
        addSlot(person.person_id, nameFor(person.person_id, person.name), {
          label: formatRoleName(roleName), context: 'Special role', kind: 'special',
        })
      }
    }

    return [...rows.values()].toSorted(
      (a, b) => b.slots.length - a.slots.length || a.name.localeCompare(b.name),
    )
  })

  /** Available members who ended up with nothing to do on this roster. */
  const unassignedPeople = computed(() => {
    const data = activeRoster.value
    if (!data) return []
    const assigned = new Set(personMetrics.value.map(r => r.id))

    // Prefer the live members list; fall back to the generated summary when it
    // hasn't loaded, so the section is never silently empty.
    const pool = allMembers.value.length > 0
      ? allMembers.value.map(m => ({ person_id: m.id, name: m.fullname }))
      : [
        ...(data.summary?.people_assigned || []),
        ...(data.summary?.people_not_assigned || []),
      ]

    return pool
      .filter(p => !assigned.has(p.person_id))
      .toSorted((a, b) => a.name.localeCompare(b.name))
  })

  /** Total slots filled — the number that changes as you reassign. */
  /** True while the roster on screen was built for a date other than the selected one. */
  const rosterDateMismatch = computed(
    () => !!roster.value && !!rosterDate.value && rosterDate.value !== selectedDate.value,
  )

  const totalSlots = computed(() =>
    personMetrics.value.reduce((sum, row) => sum + row.slots.length, 0),
  )

  /** Slots left empty, i.e. a role on the roster with nobody in it. */
  const unfilledSlots = computed(() => {
    const data = activeRoster.value
    if (!data) return 0
    let empty = 0
    for (const event of data.events || []) {
      for (const assignment of event.assignments || []) {
        if (!assignment.person_id) empty++
      }
    }
    return empty
  })

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

  /** Colour a summary chip by what kind of slot it is, matching the sections above. */
  function slotColor (kind) {
    if (kind === 'leadership') return 'primary'
    if (kind === 'special') return 'warning'
    return 'secondary'
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

  // --- Per-roster ordering ------------------------------------------------
  // The saved order from /roles is what a roster is generated in. Dragging here
  // overrides it for this roster only: the PDF renders the payload in the order
  // given, so rearranging the rows rearranges the export. Reordering is an edit,
  // so it's offered in edit mode only and lands in `editableRoster`.

  // Which row is being dragged, as {event index, assignment index}. Rows carry
  // both because a drop is only legal within the event it started in — moving a
  // role between events would change who is serving where, not just the layout.
  const dragSource = ref(null)
  const dragTarget = ref(null)

  function onRowDragStart (eIdx, aIdx, event) {
    dragSource.value = { eIdx, aIdx }
    event.dataTransfer.effectAllowed = 'move'
    // Firefox refuses to start a drag unless some data is attached.
    event.dataTransfer.setData('text/plain', `${eIdx}:${aIdx}`)
  }

  function onRowDragOver (eIdx, aIdx, event) {
    if (!dragSource.value || dragSource.value.eIdx !== eIdx) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    dragTarget.value = { eIdx, aIdx }
  }

  function onRowDrop (eIdx, aIdx, event) {
    const source = dragSource.value
    dragSource.value = null
    dragTarget.value = null
    if (!source || source.eIdx !== eIdx || source.aIdx === aIdx) return
    event.preventDefault()
    moveItem(editableRoster.value.events[eIdx].assignments, source.aIdx, aIdx)
  }

  function onRowDragEnd () {
    dragSource.value = null
    dragTarget.value = null
  }

  function isDragging (eIdx, aIdx) {
    return dragSource.value?.eIdx === eIdx && dragSource.value?.aIdx === aIdx
  }

  function isDragTarget (eIdx, aIdx) {
    return dragTarget.value?.eIdx === eIdx
      && dragTarget.value?.aIdx === aIdx
      && !isDragging(eIdx, aIdx)
  }

  // Special-role cards reorder as a group. `special_roles` is a plain object, and
  // JS preserves string-key insertion order, so rebuilding it in the new sequence
  // is enough for both the screen and the PDF.
  const specialDragIndex = ref(null)

  function onSpecialDragStart (index, event) {
    specialDragIndex.value = index
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  function onSpecialDrop (index, event) {
    const from = specialDragIndex.value
    specialDragIndex.value = null
    if (from === null || from === index) return
    event.preventDefault()
    const entries = Object.entries(editableRoster.value.special_roles)
    moveItem(entries, from, index)
    editableRoster.value.special_roles = Object.fromEntries(entries)
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
      rosterDate.value = payload.date
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
      // Saving files it under the selected date, so that is now the roster's date.
      rosterDate.value = formatDate(selectedDate.value)
      savedRosterAvailable.value = false
      toast.success('Roster saved. You can now preview or download the PDF.')
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

  /** Feeds `usualWeekday`; the shortcuts fall back to plain days if this fails. */
  async function fetchRosteredDates () {
    try {
      const res = await api.get('/api/rosters/dates/')
      rosteredDates.value = res.data
    } catch {
      rosteredDates.value = []
    }
  }

  /**
   * Fetch and display the roster saved for `date`.
   *
   * Loading is what makes the saved row arrangement durable: the payload comes
   * back in its stored `display_order`, so reopening a date reproduces the layout
   * that was approved — and therefore the same PDF.
   */
  async function loadSavedRoster (date, { silent = false } = {}) {
    loadingSaved.value = true
    const result = await rostersStore.fetchSavedRoster(date)
    loadingSaved.value = false

    if (!result.success) {
      savedRosterAvailable.value = false
      if (!result.notFound && !silent) toast.error(result.error)
      return false
    }

    roster.value = result.data
    rosterDate.value = date
    editableRoster.value = null
    editMode.value = false
    // It came from the database, so PDF export is legitimately unlocked.
    rosterSaved.value = true
    savedRosterAvailable.value = false
    error.value = null
    if (!silent) toast.success(`Loaded the roster saved for ${formatDisplayDate(date)}.`)
    return true
  }

  // Changing the date reopens whatever was saved for it. Unsaved work is never
  // silently discarded: if there is any, the saved copy is offered as a button
  // instead of replacing what's on screen.
  watch(selectedDate, async date => {
    savedRosterAvailable.value = false
    if (!date) return

    const hasUnsavedWork = roster.value && !rosterSaved.value

    if (hasUnsavedWork) {
      const result = await rostersStore.fetchSavedRoster(date)
      savedRosterAvailable.value = result.success
      return
    }

    const loaded = await loadSavedRoster(date, { silent: true })
    if (!loaded) {
      // Nothing saved for this date — clear the previous date's roster so the page
      // doesn't show one date's roster under another date's heading.
      roster.value = null
      rosterDate.value = null
      editableRoster.value = null
      editMode.value = false
      rosterSaved.value = false
    }
  })

  // --- PDF preview ---------------------------------------------------------

  /**
   * Render the roster to PDF and show it inline.
   *
   * Uses the same endpoint as the download, so what's previewed is byte-for-byte
   * the file that would be saved — not a separate approximation that could drift.
   */
  async function openPreview () {
    previewLoading.value = true
    showPreviewDialog.value = true
    const result = await rostersStore.downloadRosterPDF({
      roster_data: roster.value,
      date: formatDate(selectedDate.value),
    })
    previewLoading.value = false

    if (!result.success) {
      showPreviewDialog.value = false
      toast.error('Could not render the preview.')
      return
    }
    revokePreview()
    previewUrl.value = URL.createObjectURL(new Blob([result.data], { type: 'application/pdf' }))
  }

  function revokePreview () {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
  }

  function closePreview () {
    showPreviewDialog.value = false
    revokePreview()
  }

  // Blob URLs live until revoked, so drop the last one when the page goes away.
  onBeforeUnmount(revokePreview)

  onMounted(fetchEvents)
  onMounted(fetchMember)
  onMounted(fetchRosteredDates)
</script>

<style scoped>
/* Generator toolbar */
.generator-toolbar {
  background: rgb(var(--v-theme-surface)) !important;
}
.date-block {
  min-width: 220px;
}
.date-field {
  max-width: 240px;
}
.date-field :deep(.v-field) {
  background: rgb(var(--v-theme-surface-variant)) !important;
}
/* The action bar sits on a tinted band so it reads as a footer to the card
   rather than a second row of the form above it. */
.action-bar {
  background: rgb(var(--v-theme-surface-variant));
}

/* Drag affordances, shared by assignment rows and special-role cards. */
.drag-handle {
  cursor: grab;
  opacity: .45;
}
.assignment-row {
  transition: background-color .15s ease, opacity .15s ease;
}
.assignment-row--dragging {
  opacity: .4;
}
.assignment-row--over {
  background: rgba(var(--v-theme-primary), 0.10) !important;
  box-shadow: inset 0 2px 0 0 rgb(var(--v-theme-primary));
}
.special-card {
  transition: opacity .15s ease;
}
.special-card--dragging {
  opacity: .4;
}

/* Summary metrics table — one grid shared by the header and every row. */
.metric-row {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) 70px minmax(0, 2fr);
  align-items: center;
  gap: 12px;
}
.metric-row--head {
  background: rgb(var(--v-theme-surface-variant));
}
/* Anyone carrying more than one slot gets a quiet flag, so over-commitment is
   visible without reading the numbers. */
.metric-row--heavy {
  background: rgba(var(--v-theme-warning), 0.06);
}
.metric-avatar {
  background: rgb(var(--v-theme-surface-variant)) !important;
  color: rgb(var(--v-theme-primary));
  border: 1px solid rgba(var(--v-theme-primary), 0.20);
}
.min-w-0 {
  min-width: 0;
}

@media (max-width: 700px) {
  .metric-row {
    grid-template-columns: minmax(0, 1fr) 56px;
  }
  .metric-row > :last-child {
    grid-column: 1 / -1;
  }
  .metric-row--head {
    display: none;
  }
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

/* PDF preview */
.preview-header {
  background: rgb(var(--v-theme-surface-variant));
}
.preview-body {
  background: rgba(var(--v-theme-on-surface), 0.06);
  min-height: 0;
}
.preview-frame {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
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
