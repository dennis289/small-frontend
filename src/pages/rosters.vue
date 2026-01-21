<template>
  <v-container>
    <v-card class="pa-4">
      <v-toolbar flat>
        <v-toolbar-title class="text-h5 text-center" color="grey darken-4">Generate Roster</v-toolbar-title>
        <v-spacer />
      </v-toolbar>

      <v-row class="mt-4">
        <v-col cols="4">
          <v-text-field
          type="date"
          v-model="selectedDate"
          variant="outlined"
          prepend-icon="mdi-calendar"
          density="compact"
          label="Select Date"
          >

          </v-text-field>
        </v-col>
        <v-col>
          <v-row>
            <v-col class="d-flex justify-end align-center ma-2">
              <v-btn size="small" class="ma-2" variant="outlined" @click="showGenerateDialog = true" :disabled="!selectedDate">Generate Roster</v-btn>
              <v-btn size="small" variant="outlined" class="ma-2" @click="saveRoster" v-if="roster">Save Roster</v-btn>
              <v-btn size="small" variant="outlined" class="ma-2" prepend-icon="mdi-file-pdf-box" @click="downloadRosterPDF" v-if="roster">Download PDF</v-btn>
              <v-btn size="small" variant="outlined" icon="mdi-printer" class="ma-2" @click="printRoster" v-if="roster" title="Print Roster"></v-btn>
            </v-col>

          </v-row>
          
        </v-col>
      </v-row>

      <div v-if="roster" ref="rosterRef">
        <!-- Debug info (can be hidden in production) -->
        <v-alert type="info" density="compact" class="mb-4" v-if="roster.metadata">
          Generated: {{ new Date(roster.metadata.generated_at).toLocaleString() }} | 
          Total Available: {{ roster.metadata.total_people_available }} | 
          Total Assignments: {{ roster.metadata.total_assignments }}
        </v-alert>

        <!-- Leadership -->
        <h3 class="mt-6">Producer: 
          <v-edit-dialog v-model="roster.leadership.producer.name" v-if="roster.leadership">
            {{ roster.leadership.producer?.name }}
          </v-edit-dialog>
          <span v-else>{{ roster.producer?.name }}</span>
        </h3>
        <h4>Assistant Producer: 
          <v-edit-dialog v-model="roster.leadership.assistant_producer.name" v-if="roster.leadership">
            {{ roster.leadership.assistant_producer?.name }}
          </v-edit-dialog>
          <span v-else>{{ roster.assistant_producer?.name }}</span>
        </h4>

        <!-- Services -->
        <div v-for="event in roster.events" :key="event.event_id" class="mt-6">
          <h4>{{ event.event_name }} 
            <v-chip size="x-small" v-if="event.assignment_count">{{ event.assignment_count }} roles</v-chip>
          </h4>
          <v-table dense>
            <thead>
              <tr><th>Role</th><th>Person</th></tr>
            </thead>
            <tbody>
              <tr v-for="assignment in event.assignments" :key="assignment.role">
                <td>{{ assignment.role }}</td>
                <td>
                  <v-edit-dialog v-model="assignment.name">
                    {{ assignment.name }}
                  </v-edit-dialog>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <!-- Special Roles -->
        <div v-if="roster.special_roles || roster.hospitality" class="mt-6">
          <h4>Hospitality</h4>
          <v-chip-group>
            <!-- New structure -->
            <v-chip
              v-for="person in roster.special_roles?.hospitality || []"
              :key="person.person_id"
              class="me-2"
            >
              <v-edit-dialog v-model="person.name">
                {{ person.name }}
              </v-edit-dialog>
            </v-chip>
            <!-- Fallback for old structure -->
            <v-chip
              v-for="(name, index) in roster.hospitality || []"
              :key="index"
              class="me-2"
              v-if="!roster.special_roles"
            >
              <v-edit-dialog v-model="roster.hospitality[index]">
                {{ name }}
              </v-edit-dialog>
            </v-chip>
          </v-chip-group>
        </div>

        <div v-if="roster.special_roles || roster.social_media" class="mt-4">
          <h4>Social Media</h4>
          <v-chip-group>
            <!-- New structure -->
            <v-chip
              v-for="person in roster.special_roles?.social_media || []"
              :key="person.person_id"
              class="me-2"
            >
              <v-edit-dialog v-model="person.name">
                {{ person.name }}
              </v-edit-dialog>
            </v-chip>
            <!-- Fallback for old structure -->
            <v-chip
              v-for="(name, index) in roster.social_media || []"
              :key="index"
              class="me-2"
              v-if="!roster.special_roles"
            >
              <v-edit-dialog v-model="roster.social_media[index]">
                {{ name }}
              </v-edit-dialog>
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Summary (optional, can be hidden) -->
        <div v-if="roster.summary" class="mt-6">
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon>mdi-information</v-icon>
                Roster Summary
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <p><strong>People Assigned:</strong> {{ roster.summary.people_assigned?.length || 0 }}</p>
                <p><strong>People Not Assigned:</strong> {{ roster.summary.people_not_assigned?.length || 0 }}</p>
                <div v-if="roster.summary.people_not_assigned?.length > 0">
                  <h6>Not Assigned:</h6>
                  <v-chip
                    v-for="person in roster.summary.people_not_assigned"
                    :key="person.person_id"
                    size="small"
                    class="me-1 mb-1"
                    color="warning"
                  >
                    {{ person.name }}
                  </v-chip>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </div>

      <v-alert v-else-if="error" type="error" class="mt-6">{{ error }}</v-alert>
    </v-card>

    <v-dialog v-model="showGenerateDialog" content-class="align-dialog" width="500">
      <v-card>
        <v-card-title>
          Generate Roster
          <v-btn icon="mdi-close" class="float-right" @click="showGenerateDialog = false"></v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="selectedMember"
            label="Select Members Absent"
            :items="members"
            item-title="fullname"
            item-value="id"
            multiple
            :loading="loadingMembers"
            variant="outlined"
            density="compact"
            clearable
            :no-data-text="loadingMembers ? 'Loading...' : 'No members found'"
            ></v-autocomplete>

            <v-autocomplete
            v-model="selectedEvent"
            label="Select Events Absent"
            :items="events"
            item-title="name"
            item-value="id"
            multiple
            :loading="loadingEvents"
            variant="outlined"
            density="compact"
            clearable
            :no-data-text="loadingEvents ? 'Loading...' : 'No events found'"
            ></v-autocomplete>
            
        </v-card-text>
        <v-card-actions>
          <v-btn size="small" variant="outlined" @click="showGenerateDialog = false">Cancel</v-btn>
          <v-spacer /> <v-spacer />
          <v-btn size="small" variant="flat" @click="generateRoster">Generate</v-btn>

        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
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
const BASE_URL = ('http://localhost:8000/api/')

function formatDate(date) {
  if (date instanceof Date) return date.toISOString().split('T')[0]
  if (typeof date === 'string' && date.includes('T')) return date.split('T')[0]
  return date
}

async function generateRoster() {
  error.value = null
  roster.value = null
  const payload = {
    date: formatDate(selectedDate.value),
    members: selectedMember.value,
    events: selectedEvent.value,
    is_present: false,
    is_active: false,
  }
  
  try {
    const res = await axios.post(BASE_URL + 'rosters/', payload)
    roster.value = res.data
    showGenerateDialog.value = false // Close dialog on successful generation
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to generate roster.'
    // Keep dialog open on error so user can see the error and try again
  }
}

function printRoster() {
  const printContents = rosterRef.value.innerHTML
  const printWindow = window.open('', '', 'height=600,width=800')
  printWindow.document.open()
  printWindow.document.title = 'Roster'
  const body = printWindow.document.body
  body.innerHTML = printContents
  printWindow.document.close()
  printWindow.print()
}

async function downloadRosterPDF() {
  if (!roster.value) {
    alert('No roster to download. Please generate a roster first.');
    return;
  }

  try {
    const response = await axios.post(BASE_URL + 'generate-roster/', {
      roster_data: roster.value,
      date: formatDate(selectedDate.value)
    }, {
      responseType: 'blob' // Important for PDF download
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Create filename with date
    const dateStr = formatDate(selectedDate.value) || new Date().toISOString().split('T')[0];
    link.setAttribute('download', `roster_${dateStr}.pdf`);
    
    // Append to html link element page
    document.body.appendChild(link);
    
    // Start download
    link.click();
    
    // Clean up and remove the link
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading PDF:', error);
    alert('Failed to download PDF. Please try again.');
  }
}

async function saveRoster() {
  try {
    const res = await axios.post( BASE_URL+'rosters/save/', {
      date: formatDate(selectedDate.value),
      data: roster.value,
    })
    alert('Roster saved successfully.')
  } catch (err) {
    alert('Failed to save roster.')
  }
}
async function fetchMember() {
  loadingMembers.value = true;
  try {
    const res = await axios.get(BASE_URL + 'persons/');
    
    members.value = res.data.map(m => ({
      id: m.id,
      fullname: `${m.first_name} ${m.last_name}`.trim()
    }));
    
  } catch (error) {
    console.error('Error fetching Members:', error);
    
    // Show user-friendly error
    if (error.response?.status === 404) {
      console.error('API endpoint not found');
    } else if (error.response?.status >= 500) {
      console.error('Server error');
    } else {
      console.error('Network or other error');
    }
  } finally {
    loadingMembers.value = false;
  }
}
async function fetchEvents() {
  loadingEvents.value = true;
  try {
    const res = await axios.get(BASE_URL + 'events/');
    events.value = res.data;
  } catch (error) {
    console.error('Error fetching Events:', error);
  } finally {
    loadingEvents.value = false;
  }
}
onMounted(fetchEvents);
onMounted(fetchMember);
</script>
