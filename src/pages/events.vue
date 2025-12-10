<template>
  <v-card>
    <v-card>
      <v-card-title class="text-h5 text-center mb-4 " color="grey darken-1">
        Event Management
      </v-card-title>
      <v-spacer></v-spacer>
      <v-card-text>
        <div class="text-right">
          <v-btn
            color="#FFD54F"
            rounded="lg"
            variant="tonal"
            prepend-icon="mdi-plus-box"
            @click="openEditor(null)"
          >
            Add Event
          </v-btn>
        </div>
        <v-text-field
            v-model="search"
            rounded="lg"
            class="flex-grow-1 float-right mt-4 mb-4"
            label="Search Events"
            variant="outlined"
            width="350px"
            append-inner-icon="mdi-magnify"
            clearable
            @input="loadItems({ page: 1, itemsPerPage: 10 })"
          ></v-text-field>
      </v-card-text>
      </v-card>
    <v-divider></v-divider>
      <v-dialog 
      v-model="editorDialog" 
      max-width="600">
      <v-card>
        <v-toolbar flat>
          <v-toolbar-title>
            {{ editedEvent ? 'Edit Event' : 'Add New Event' }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="editorDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text>
          <v-form @submit.prevent="saveEvent">
            <v-text-field
              v-model="form.name"
              label="Event Name"
              rounded="lg"
              variant="outlined"
              :rules="[v => !!v || 'Name is required']"
              required
            ></v-text-field>
            <v-row>
              <v-col>
            <v-text-field
              v-model="form.start_time"
              append-inner-icon="mdi-clock-time-four-outline"
              label="Start Time"
              variant="outlined"
              rounded="lg"
              :rules="[v => !!v || 'Start time is required']"
              required

              readonly
            >
            <v-dialog v-model="startTimeDialog" activator="parent" width="auto">
            <v-time-picker 
            v-model="form.start_time"
            ></v-time-picker>
          </v-dialog>
          </v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              v-model="form.end_time"
              append-inner-icon="mdi-clock-time-four-outline"
              label="End Time"
              variant="outlined"
              rounded="lg"
              :rules="[v => !!v || 'End time is required']"
              required
              readonly
               >
              <v-dialog v-model="endTimeDialog" activator="parent" width="auto">
                <v-time-picker v-model="form.end_time"
                ></v-time-picker>
              </v-dialog>
            </v-text-field>
          </v-col>
            </v-row>
            <v-text-field
              v-model="form.description"
              label="Description"
              rounded="lg"
              variant="outlined"
              type="text"
              :rules="[v => !!v || 'Description is required']"
              required
            ></v-text-field>
            <v-card-actions 
              class="justify-space-between">
              <v-spacer></v-spacer>
              <v-btn color="secondary" 
              @click="editorDialog = false"
              >Cancel</v-btn>
              <v-btn color="primary" 
              type="submit"
              >Save</v-btn>
            </v-card-actions>
            
          </v-form>
        </v-card-text>
        </v-card>
      </v-dialog>

      <v-data-table
        :headers="headers"
        :items="events"
        class="elevation-1"
        density="compact"
      >
      <template #item.actions="{ item }">
        <v-btn icon size="small" @click="openEditor(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon size="small"  @click="confirmDelete(item)">
          <v-icon color="error">mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          Confirm Delete
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this event?
          <v-spacer></v-spacer>
          <strong>{{ eventToDelete?.name }}</strong>?
          <br/>
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-accent-2"
            variant="text"
            @click="deleteDialog = false"
            text="Cancel"
          ></v-btn>
          <v-btn
            color="red-accent-2"
            variant="text"
            @click="deleteEvent"
            text="Delete"
          ></v-btn>
        </v-card-actions> 
      </v-card>
    </v-dialog>
  </v-card>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/events';

const events = ref([]);
const editorDialog = ref(false);
const editedEvent = ref(null);
const deleteDialog = ref(false);
const startTimeDialog = ref(false);
const endTimeDialog = ref(false);
const eventToDelete = ref(null);
const search = ref('');
const form = ref({
  name: '',
  start_time: '',
  end_time: '',
  description: ''
});

const headers = [
  { title: 'Name', value: 'name' },
  {title: 'Start time', value: 'start_time' },
  { title: 'End time', value: 'end_time' },
  { title: 'Description', value: 'description' },
  { title: 'Actions', value: 'actions', sortable: false }
];

async function loadData() {
  try {
    const res = await axios.get(BASE_URL + '/');
    events.value = res.data;
    console.log('Api response:', res.data);
  } catch (error) {
    console.error('Error loading events:', error);
  }
}
 

onMounted(loadData);

function openEditor(event) {
  editedEvent.value = event;
  if (event) {
    form.value = {
      name: event.name,
      start_time: event.start_time,
      end_time: event.end_time,
      description: event.description
    };
  } else {
    form.value = {
      name: '',
      start_time: '',
      end_time: '',
      description: ''
    };
  }
  editorDialog.value = true;
  console.log('Opening editor for event:', event);
}

async function saveEvent() {
  try {
    console.log('Form data:', form.value);
    console.log('Edited event:', editedEvent.value);
    
    if (editedEvent.value) {
      const payload = { ...form.value, id: editedEvent.value.id };
      console.log('PUT payload:', payload);
      await axios.put(BASE_URL + '/', payload);
    } else {
      console.log('POST payload:', form.value);
      await axios.post(BASE_URL + '/', form.value);
    }
    await loadData();
    editorDialog.value = false;
  } catch (error) {
    console.error('Error saving event:', error);
    console.error('Error response:', error.response?.data);
  }
}

function confirmDelete(event) {
  eventToDelete.value = event;
  deleteDialog.value = true;
}

async function deleteEvent() {
  try {
    await axios.delete(BASE_URL + '/', { data: { id: eventToDelete.value.id } });
    events.value = events.value.filter(s => s.id !== eventToDelete.value.id);
    deleteDialog.value = false;
    eventToDelete.value = null;
  } catch (error) {
    console.error('Error deleting event:', error);
  }
}
</script>