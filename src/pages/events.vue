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
              label="Event Name*"
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
              label="Start Time*"
              variant="outlined"
              rounded="lg"
              :rules="[v => !!v || 'Start time is required']"
              required

              readonly
            >
            <v-dialog v-model="startTimeDialog" activator="parent" width="auto">
            <v-time-picker 
            v-model="form.start_time"
            :landscape="$vuetify.display.smAndUp"
            ></v-time-picker>
          </v-dialog>
          </v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              v-model="form.end_time"
              append-inner-icon="mdi-clock-time-four-outline"
              label="End Time*"
              variant="outlined"
              rounded="lg"
              :rules="[v => !!v || 'End time is required']"
              required
              readonly
               >
              <v-dialog v-model="endTimeDialog" activator="parent" width="auto">
                <v-time-picker v-model="form.end_time"
                :landscape="$vuetify.display.smAndUp"
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
            ></v-text-field>
            <v-card-actions class="d-flex justify-space-between">
              <v-spacer></v-spacer>
              <v-btn color="grey lighten-1" 
              class="mr-2"
              variant="outlined"
              @click="editorDialog = false"
              >Cancel</v-btn>
              <v-btn color="grey brighten-1" 
              variant="outlined"
              class="ml-2" 
              type="submit"
              >Save</v-btn>
            </v-card-actions>
            
          </v-form>
          <small class="text-caption text-medium-emphasis">* indicates required fields</small>
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
        <v-btn icon size="small" @click="openAwardDialog(item)">
          <v-icon color="amber-darken-2">mdi-trophy</v-icon>
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
        <v-card-actions class="justify space-between">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-accent-2"
            variant="text"
            @click="deleteDialog = false"
            text="Cancel"
            density="comfortable"
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

    <!-- Award Dialog -->
    <v-dialog v-model="awardDialog" max-width="600">
      <v-card>
        <v-toolbar flat color="amber-darken-2">
          <v-toolbar-title class="text-white">
            <v-icon class="mr-2">mdi-trophy</v-icon>
            {{ existingAward ? 'Edit Award' : 'Give Award' }} — {{ awardEvent?.name }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="awardDialog = false">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <!-- Show existing award -->
          <v-alert
            v-if="existingAward && !editingAward"
            type="success"
            variant="tonal"
            class="mb-4"
          >
            <div class="d-flex align-center justify-space-between">
              <div>
                <strong>{{ existingAward.award_type_name }}</strong> awarded to
                <strong>{{ existingAward.person_name }}</strong>
                <div v-if="existingAward.feedback" class="mt-1 text-body-2">
                  Feedback: {{ existingAward.feedback }}
                </div>
              </div>
              <div>
                <v-btn size="small" variant="text" @click="startEditAward">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn size="small" variant="text" color="error" @click="confirmDeleteAward">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
          </v-alert>

          <!-- Award form -->
          <v-form
            v-if="!existingAward || editingAward"
            @submit.prevent="saveAward"
          >
            <v-autocomplete
              v-model="awardForm.person"
              :items="persons"
              item-title="name"
              item-value="id"
              label="Award Recipient*"
              variant="outlined"
              rounded="lg"
              :rules="[v => !!v || 'Recipient is required']"
              required
              class="mb-2"
            ></v-autocomplete>
            <v-select
              v-model="awardForm.award_type"
              :items="awardTypesList"
              item-title="name"
              item-value="id"
              label="Award Type*"
              variant="outlined"
              rounded="lg"
              :rules="[v => !!v || 'Award type is required']"
              required
              class="mb-2"
            ></v-select>
            <v-textarea
              v-model="awardForm.feedback"
              label="Feedback / Remarks"
              variant="outlined"
              rounded="lg"
              rows="3"
              class="mb-2"
            ></v-textarea>
            <v-card-actions class="d-flex justify-space-between px-0">
              <v-spacer></v-spacer>
              <v-btn
                color="grey lighten-1"
                class="mr-2"
                variant="outlined"
                @click="cancelAwardEdit"
              >Cancel</v-btn>
              <v-btn
                color="amber-darken-2"
                variant="outlined"
                class="ml-2"
                type="submit"
              >{{ existingAward ? 'Update Award' : 'Give Award' }}</v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Delete Award Confirmation -->
    <v-dialog v-model="deleteAwardDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Remove Award</v-card-title>
        <v-card-text>
          Are you sure you want to remove this award? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteAwardDialog = false">Cancel</v-btn>
          <v-btn color="red-accent-2" variant="text" @click="deleteAward">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Awards Summary -->
    <v-divider class="mt-4"></v-divider>
    <v-card class="mt-4" variant="outlined">
      <v-card-title class="text-h6 d-flex align-center">
        <v-icon color="amber-darken-2" class="mr-2">mdi-trophy-outline</v-icon>
        Awards Summary
      </v-card-title>
      <v-data-table
        :headers="awardHeaders"
        :items="allAwards"
        class="elevation-0"
        density="compact"
        no-data-text="No awards have been given yet."
      >
        <template #item.award_type_name="{ item }">
          <v-chip color="amber-darken-2" variant="tonal" size="small">
            {{ item.award_type_name }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
  </v-card>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { toast } from 'vue-sonner';

const BASE_URL = 'http://localhost:8000/api/events';
const AWARDS_URL = 'http://localhost:8000/api/awards';
const AWARD_TYPES_URL = 'http://localhost:8000/api/award-types';
const PERSONS_URL = 'http://localhost:8000/api/persons';

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

// Award state
const awardDialog = ref(false);
const awardEvent = ref(null);
const existingAward = ref(null);
const editingAward = ref(false);
const deleteAwardDialog = ref(false);
const awardTypesList = ref([]);
const persons = ref([]);
const allAwards = ref([]);
const awardForm = ref({
  person: null,
  award_type: null,
  feedback: ''
});

const headers = [
  { title: 'Name', value: 'name' },
  {title: 'Start time', value: 'start_time' },
  { title: 'End time', value: 'end_time' },
  { title: 'Description', value: 'description' },
  { title: 'Actions', value: 'actions', sortable: false }
];

const awardHeaders = [
  { title: 'Event', value: 'event_name' },
  { title: 'Recipient', value: 'person_name' },
  { title: 'Award Type', value: 'award_type_name' },
  { title: 'Feedback', value: 'feedback' },
];

async function loadData() {
  try {
    const res = await axios.get(BASE_URL + '/');
    events.value = res.data;
    toast.success('Events loaded successfully!');
  } catch (error) {
    toast.error('Failed to load events.');
  }
}

async function loadPersons() {
  try {
    const res = await axios.get(PERSONS_URL + '/');
    persons.value = res.data;
  } catch (error) {
    console.error('Failed to load persons:', error);
  }
}

async function loadAwardTypes() {
  try {
    const res = await axios.get(AWARD_TYPES_URL + '/');
    awardTypesList.value = res.data;
  } catch (error) {
    console.error('Failed to load award types:', error);
  }
}

async function loadAllAwards() {
  try {
    const res = await axios.get(AWARDS_URL + '/');
    allAwards.value = res.data;
  } catch (error) {
    console.error('Failed to load awards:', error);
  }
}

onMounted(() => {
  loadData();
  loadPersons();
  loadAwardTypes();
  loadAllAwards();
});

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
}

async function saveEvent() {
  try {
    console.log('Form data:', form.value);
    console.log('Edited event:', editedEvent.value);
    
    if (editedEvent.value) {
      const payload = { ...form.value, id: editedEvent.value.id };
      console.log('PUT payload:', payload);
      await axios.put(BASE_URL + '/modify/' + editedEvent.value.id + '/', payload);
    } else {
      console.log('POST payload:', form.value);
      await axios.post(BASE_URL + '/', form.value);
    }
    await loadData();
    editorDialog.value = false;
  } catch (error) {
    toast.error('Failed to save event.');
  }
}

function confirmDelete(event) {
  eventToDelete.value = event;
  deleteDialog.value = true;
}

async function deleteEvent() {
  try {
    await axios.delete(BASE_URL + '/modify/' + eventToDelete.value.id + '/', { data: { id: eventToDelete.value.id } });
    events.value = events.value.filter(s => s.id !== eventToDelete.value.id);
    deleteDialog.value = false;
    eventToDelete.value = null;
    toast.success('Event deleted successfully.');
  } catch (error) {
    console.error('Error deleting event:', error);
    toast.error('Failed to delete event.');
  }
}

// ── Award functions ──────────────────────────────
async function openAwardDialog(event) {
  awardEvent.value = event;
  editingAward.value = false;
  awardForm.value = { person: null, award_type: null, feedback: '' };

  try {
    const res = await axios.get(AWARDS_URL + '/event/' + event.id + '/');
    existingAward.value = res.data || null;
  } catch {
    existingAward.value = null;
  }

  awardDialog.value = true;
}

function startEditAward() {
  editingAward.value = true;
  awardForm.value = {
    person: existingAward.value.person,
    award_type: existingAward.value.award_type,
    feedback: existingAward.value.feedback || ''
  };
}

function cancelAwardEdit() {
  if (existingAward.value) {
    editingAward.value = false;
  } else {
    awardDialog.value = false;
  }
}

async function saveAward() {
  if (!awardForm.value.person || !awardForm.value.award_type) {
    toast.error('Please select a recipient and award type.');
    return;
  }

  const payload = {
    event: awardEvent.value.id,
    person: awardForm.value.person,
    award_type: awardForm.value.award_type,
    feedback: awardForm.value.feedback
  };

  try {
    if (existingAward.value && editingAward.value) {
      await axios.put(AWARDS_URL + '/' + existingAward.value.id + '/', payload);
      toast.success('Award updated successfully!');
    } else {
      await axios.post(AWARDS_URL + '/', payload);
      toast.success('Award given successfully!');
    }
    awardDialog.value = false;
    await loadAllAwards();
  } catch (error) {
    const msg =
      error.response?.data?.event?.[0] ||
      error.response?.data?.detail ||
      'Failed to save award.';
    toast.error(msg);
  }
}

function confirmDeleteAward() {
  deleteAwardDialog.value = true;
}

async function deleteAward() {
  try {
    await axios.delete(AWARDS_URL + '/' + existingAward.value.id + '/');
    toast.success('Award removed.');
    deleteAwardDialog.value = false;
    existingAward.value = null;
    editingAward.value = false;
    await loadAllAwards();
  } catch {
    toast.error('Failed to delete award.');
  }
}
</script>