<template>
  <v-container class="pa-6 pa-md-8" fluid>
    <PageHeader
      eyebrow="Setup"
      subtitle="The recurring and one-off events on your team's calendar."
      title="Events"
    >
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-calendar-plus-outline" variant="flat" @click="openEditor(null)">Add event</v-btn>
      </template>
    </PageHeader>

    <StatTiles :tiles="statTiles" />

    <v-card class="overflow-hidden" rounded="lg" variant="outlined">
      <div class="table-toolbar pa-4">
        <v-text-field
          v-model="search"
          class="table-search"
          clearable
          density="comfortable"
          hide-details
          placeholder="Search events..."
          prepend-inner-icon="mdi-magnify"
        />
        <v-spacer />
        <span class="text-caption text-medium-emphasis">
          {{ events.length }} {{ events.length === 1 ? 'event' : 'events' }}
        </span>
      </div>

      <v-data-table
        density="comfortable"
        :headers="headers"
        hover
        :items="events"
        :search="search"
      >
        <template #item.role_names="{ item }">
          <div v-if="item.role_names?.length" class="d-flex flex-wrap ga-1 py-1">
            <v-chip
              v-for="rn in item.role_names"
              :key="rn"
              color="secondary"
              size="x-small"
              variant="tonal"
            >{{ rn }}</v-chip>
          </div>
          <span v-else class="text-caption text-medium-emphasis font-italic">No roles set</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="openEditor(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            color="error"
            icon
            size="small"
            variant="text"
            @click="confirmDelete(item)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Event Dialog -->
    <v-dialog v-model="editorDialog" max-width="600">
      <v-card>
        <v-toolbar flat>
          <v-toolbar-title>
            {{ editedEvent ? 'Edit Event' : 'Add New Event' }}
          </v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="editorDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text>
          <v-form ref="eventForm" @submit.prevent="saveEvent">
            <v-text-field
              v-model="form.name"
              label="Event name*"
              rounded="lg"
              :rules="[rules.required('a name for this event')]"
            />
            <v-row>
              <v-col>
                <v-text-field
                  v-model="form.start_time"
                  append-inner-icon="mdi-clock-time-four-outline"
                  label="Start time*"
                  readonly
                  rounded="lg"
                  :rules="[rules.chooseOne('a start time')]"
                >
                  <v-dialog v-model="startTimeDialog" activator="parent" width="auto">
                    <v-time-picker
                      v-model="form.start_time"
                      :landscape="$vuetify.display.smAndUp"
                    />
                  </v-dialog>
                </v-text-field>
              </v-col>
              <v-col>
                <v-text-field
                  v-model="form.end_time"
                  append-inner-icon="mdi-clock-time-four-outline"
                  label="End time*"
                  readonly
                  rounded="lg"
                  :rules="[
                    rules.chooseOne('an end time'),
                    rules.endAfterStart(() => form.start_time),
                  ]"
                >
                  <v-dialog v-model="endTimeDialog" activator="parent" width="auto">
                    <v-time-picker
                      v-model="form.end_time"
                      :landscape="$vuetify.display.smAndUp"
                    />
                  </v-dialog>
                </v-text-field>
              </v-col>
            </v-row>
            <v-text-field
              v-model="form.description"
              label="Description"
              rounded="lg"
              type="text"
            />
            <v-autocomplete
              v-model="form.roles"
              chips
              clearable
              closable-chips
              hint="Only these roles will be filled when a roster is generated for this event"
              item-title="name"
              item-value="id"
              :items="rolesList"
              label="Roles for this event"
              :loading="loadingRoles"
              multiple
              persistent-hint
              rounded="lg"
            />
            <v-card-actions class="d-flex justify-space-between px-0 mt-2">
              <v-btn variant="text" @click="editorDialog = false">Cancel</v-btn>
              <v-btn color="primary" type="submit" variant="flat">Save</v-btn>
            </v-card-actions>
            <small class="text-caption text-medium-emphasis">Fields marked * are required</small>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Delete Event Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this event?
          <br>
          <strong>{{ eventToDelete?.name }}</strong>
          <br>
          This action cannot be undone.
        </v-card-text>
        <v-card-actions class="justify-end px-4 py-3">
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="deleteEvent">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  /**
   * Events page — CRUD for the recurring slots that get staffed.
   *
   * The roles bound to an event are exactly what the generator fills for it, so an
   * event with no roles produces an empty card on the roster. Deactivating an event
   * (`is_active`) removes it from all future generations; excluding it for a single
   * date is done from the generate dialog instead.
   */
  import { storeToRefs } from 'pinia'
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { toast } from 'vue-sonner'
  import { useEventsStore } from '@/stores/events'
  import { useRolesStore } from '@/stores/roles'
  import * as rules from '@/validation'
  import { validateForm } from '@/validation'

  const eventsStore = useEventsStore()
  const rolesStore = useRolesStore()
  const { events } = storeToRefs(eventsStore)

  const editorDialog = ref(false)
  const eventForm = ref(null)
  const editedEvent = ref(null)
  const deleteDialog = ref(false)
  const startTimeDialog = ref(false)
  const endTimeDialog = ref(false)
  const eventToDelete = ref(null)
  const search = ref('')
  const rolesList = ref([])
  const loadingRoles = ref(false)
  const form = ref({
    name: '',
    start_time: '',
    end_time: '',
    description: '',
    roles: [],
  })

  const headers = [
    { title: 'Name', value: 'name' },
    { title: 'Start time', value: 'start_time' },
    { title: 'End time', value: 'end_time' },
    { title: 'Roles', value: 'role_names', sortable: false },
    { title: '', value: 'actions', sortable: false, align: 'end' },
  ]

  const statTiles = computed(() => {
    const all = events.value || []
    const active = all.filter(e => e.is_active !== false)
    // An event with no roles bound produces no assignments, so it is worth
    // surfacing rather than leaving to be discovered at generation time.
    const unstaffed = all.filter(e => !e.role_names || e.role_names.length === 0)
    return [
      { label: 'Total events', value: all.length, icon: 'mdi-calendar-star-outline' },
      { label: 'Active', value: active.length, icon: 'mdi-calendar-check-outline' },
      { label: 'No roles set', value: unstaffed.length, icon: 'mdi-calendar-alert-outline' },
    ]
  })

  async function loadData () {
    const result = await eventsStore.fetchEvents()
    if (result.success) {
      toast.success('Events loaded successfully!')
    } else {
      toast.error(result.error || 'Failed to load events.')
    }
  }

  async function loadRoles () {
    loadingRoles.value = true
    const result = await rolesStore.fetchRoles()
    if (result.success) {
      rolesList.value = rolesStore.roles
    }
    loadingRoles.value = false
  }

  onMounted(() => {
    loadData()
    loadRoles()
  })

  function openEditor (event) {
    editedEvent.value = event
    form.value = event
      ? {
        name: event.name,
        start_time: event.start_time,
        end_time: event.end_time,
        description: event.description,
        roles: event.roles ? [...event.roles] : [],
      }
      : {
        name: '',
        start_time: '',
        end_time: '',
        description: '',
        roles: [],
      }
    editorDialog.value = true
    nextTick(() => eventForm.value?.resetValidation())
  }

  async function saveEvent () {
    if (!await validateForm(eventForm)) {
      return
    }
    let result
    if (editedEvent.value) {
      const payload = { ...form.value, id: editedEvent.value.id }
      result = await eventsStore.updateEvent(editedEvent.value.id, payload)
    } else {
      result = await eventsStore.createEvent(form.value)
    }
    if (result.success) {
      await loadData()
      editorDialog.value = false
      eventForm.value?.resetValidation()
    } else {
      toast.error(result.error || 'Failed to save event.')
    }
  }

  function confirmDelete (event) {
    eventToDelete.value = event
    deleteDialog.value = true
  }

  async function deleteEvent () {
    const result = await eventsStore.deleteEvent(eventToDelete.value.id)
    if (result.success) {
      events.value = events.value.filter(s => s.id !== eventToDelete.value.id)
      deleteDialog.value = false
      eventToDelete.value = null
      toast.success('Event deleted successfully.')
    } else {
      console.error('Error deleting event:', result.error)
      toast.error(result.error || 'Failed to delete event.')
    }
  }
</script>

<style scoped>
.toolbar-search {
  max-width: 480px;
  flex: 1 1 280px;
}
.toolbar-search :deep(.v-field) {
  background: rgb(var(--v-theme-surface)) !important;
  border-radius: 12px;
}
.toolbar-search :deep(.v-field__prepend-inner .v-icon) {
  color: rgb(var(--v-theme-primary));
  opacity: .7;
}
</style>
