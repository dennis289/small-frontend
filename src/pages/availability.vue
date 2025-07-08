<template>
    <v-toolbar>
        <v-toolbar-title>Availability</v-toolbar-title>
        <v-toolbar-text>
             <v-btn
                prepend-icon="mdi-home"
                class="ml-2"
                variant="tonal"
                color="blue-accent-2"
                text="Home"
                to="/home"
             >Home</v-btn> 
        </v-toolbar-text>
    </v-toolbar>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <v-menu>
          <template #activator="{ props }">
            <v-text-field
              v-model="selectedDate"
              label="Select Date"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="props"
            ></v-text-field>
          </template>
          <v-date-picker v-model="selectedDate"></v-date-picker>
        </v-menu>
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          v-model="selectedService"
          :items="services"
          item-text="name"
          item-value="id"
          label="Select Service"
          prepend-icon="mdi-briefcase"
        ></v-select>
      </v-col>
    </v-row>

    <v-data-table
      :headers="headers"
      :items="persons"
      item-value="id"
      class="elevation-1"
      density="compact"
    >
      <template #item.status="{ item }">
        <v-select
          v-model="availability[item.id]"
          :items="statuses"
          label="Status"
          dense
        ></v-select>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          color="primary"
          @click="saveAvailability(item.id)"
          size="small"
        >
          <v-icon>mdi-content-save</v-icon> Save
        </v-btn>
      </template>
    </v-data-table>

    <v-btn
      color="success"
      @click="generateRoster"
      :disabled="!selectedDate || !selectedService"
      class="mt-4"
    >
      Generate Roster
    </v-btn>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const persons = ref([]);
const services = ref([]);
const availability = ref({});
const selectedDate = ref(null);
const selectedService = ref(null);

const statuses = ['available', 'preferred', 'unavailable'];

const headers = [
  { text: 'Name', value: 'name' },
  { text: 'Email', value: 'email' },
  { text: 'Status', value: 'status', sortable: false },
  { text: 'Actions', value: 'actions', sortable: false },
];

// Fetch persons and services
onMounted(async () => {
  try {
    const personsRes = await axios.get('http://localhost:8000/api/persons/');
    persons.value = personsRes.data;

    const servicesRes = await axios.get('http://localhost:8000/api/services/');
    services.value = servicesRes.data;

    // Initialize availability map
    persons.value.forEach((person) => {
      availability.value[person.id] = 'available'; // Default status
    });
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

// Save availability for a person
async function saveAvailability(personId) {
  try {
    if (!selectedDate.value || !selectedService.value) {
      console.error('Date or service not selected');
      return;
    }
    let formattedDate = selectedDate.value;
    // If it's a Date object, convert to string
    if (formattedDate instanceof Date) {
      formattedDate = formattedDate.toISOString().split('T')[0];
    }
    // If it's an ISO string, extract the date part
    if (typeof formattedDate === 'string' && formattedDate.includes('T')) {
      formattedDate = formattedDate.split('T')[0];
    }
    const payload = {
      person: personId,
      service_time: selectedService.value,
      date: formattedDate,
      status: availability.value[personId],
    };
    await axios.post('http://localhost:8000/api/availability/', payload);
    console.log('Availability saved:', payload);
  } catch (error) {
    console.error('Error saving availability:', error);
  }
}

async function generateRoster() {
  try {
    let formattedDate = selectedDate.value;
    if (formattedDate instanceof Date) {
      formattedDate = formattedDate.toISOString().split('T')[0];
    }
    if (typeof formattedDate === 'string' && formattedDate.includes('T')) {
      formattedDate = formattedDate.split('T')[0];
    }
    const payload = { date: formattedDate };
    const res = await axios.post('http://localhost:8000/api/rosters/', payload);
    console.log('Roster generated:', res.data);
  } catch (error) {
    console.error('Error generating roster:', error);
  }
}
</script>