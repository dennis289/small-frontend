<template>
  <v-container class="pa-6 pa-md-8" fluid>
    <PageHeader
      eyebrow="Schedule"
      italic="events"
      subtitle="The recurring services and special events on your team's calendar."
      title="Service"
    >
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-calendar-plus-outline" variant="flat" @click="openEditor(null)">Add event</v-btn>
      </template>
    </PageHeader>

    <div class="toolbar-row mb-4 d-flex align-center flex-wrap" style="gap: 12px;">
      <v-text-field
        v-model="search"
        class="toolbar-search"
        clearable
        density="comfortable"
        hide-details
        placeholder="Search by event name"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
      />
      <v-spacer />
      <span class="text-caption text-medium-emphasis">{{ events.length }} {{ events.length === 1 ? 'event' : 'events' }}</span>
    </div>

    <v-card class="overflow-hidden" rounded="lg" variant="outlined">
      <v-data-table
        density="comfortable"
        :headers="headers"
        :items="events"
        :search="search"
      >
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
          <v-form @submit.prevent="saveEvent">
            <v-text-field
              v-model="form.name"
              label="Event Name*"
              required
              rounded="lg"
              :rules="[v => !!v || 'Name is required']"
            />
            <v-row>
              <v-col>
                <v-text-field
                  v-model="form.start_time"
                  append-inner-icon="mdi-clock-time-four-outline"
                  label="Start Time*"
                  readonly
                  required
                  rounded="lg"
                  :rules="[v => !!v || 'Start time is required']"
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
                  label="End Time*"
                  readonly
                  required
                  rounded="lg"
                  :rules="[v => !!v || 'End time is required']"
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
            <v-card-actions class="d-flex justify-space-between px-0">
              <v-btn variant="text" @click="editorDialog = false">Cancel</v-btn>
              <v-btn color="primary" type="submit" variant="flat">Save</v-btn>
            </v-card-actions>
            <small class="text-caption text-medium-emphasis">* indicates required fields</small>
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
  import { storeToRefs } from 'pinia'
  import { onMounted, ref } from 'vue'
  import { toast } from 'vue-sonner'
  import { useEventsStore } from '@/stores/events'

  const eventsStore = useEventsStore()
  const { events } = storeToRefs(eventsStore)

  const editorDialog = ref(false)
  const editedEvent = ref(null)
  const deleteDialog = ref(false)
  const startTimeDialog = ref(false)
  const endTimeDialog = ref(false)
  const eventToDelete = ref(null)
  const search = ref('')
  const form = ref({
    name: '',
    start_time: '',
    end_time: '',
    description: '',
  })

  const headers = [
    { title: 'Name', value: 'name' },
    { title: 'Start time', value: 'start_time' },
    { title: 'End time', value: 'end_time' },
    { title: 'Description', value: 'description' },
    { title: 'Actions', value: 'actions', sortable: false },
  ]

  async function loadData () {
    const result = await eventsStore.fetchEvents()
    if (result.success) {
      toast.success('Events loaded successfully!')
    } else {
      toast.error(result.error || 'Failed to load events.')
    }
  }

  onMounted(loadData)

  function openEditor (event) {
    editedEvent.value = event
    form.value = event
      ? {
        name: event.name,
        start_time: event.start_time,
        end_time: event.end_time,
        description: event.description,
      }
      : {
        name: '',
        start_time: '',
        end_time: '',
        description: '',
      }
    editorDialog.value = true
  }

  async function saveEvent () {
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
