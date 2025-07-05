<template>
  <div>
    <v-row>
      <v-col cols="12" md="6">
        <v-menu>
          <template #activator="{ props }">
            <v-text-field
              v-model="newRosterDate"
              label="Select Date"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="props"
            ></v-text-field>
          </template>
          <v-date-picker v-model="newRosterDate"></v-date-picker>
        </v-menu>
      </v-col>
      <v-col cols="12" md="6">
        <v-btn color="primary" @click="createRoster" :disabled="!newRosterDate">
          Create Roster
        </v-btn>
      </v-col>
    </v-row>
    
    <v-data-table
      :headers="headers"
      :items="rosters"
      class="elevation-1"
      density="compact"
    >
      <template #item.status="{ item }">
        <v-chip :color="item.assignments.length ? 'success' : 'warning'">
          {{ item.assignments.length ? 'Generated' : 'Pending' }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn 
          color="primary" 
          @click="goToRoster(item.id)"
          size="small"
        >
          <v-icon>mdi-open-in-new</v-icon> Open
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const rosters = ref([]);
const newRosterDate = ref(null);

const headers = [
  { title: 'Date', value: 'date' },
  { title: 'Producer', value: 'producer_name' },
  { title: 'Status', value: 'status', sortable: false },
  { title: 'Actions', value: 'actions', sortable: false }
];

const BASE_URL = 'http://localhost:8000/api/rosters/';

async function loadRosters() {
  try {
    const res = await axios.get(BASE_URL);
    rosters.value = res.data;
  } catch (error) {
    console.error('Error loading rosters:', error);
  }
}

onMounted(loadRosters);

async function createRoster() {
  try {
    const res = await axios.post(BASE_URL, { date: newRosterDate.value });
    rosters.value.push(res.data);
    newRosterDate.value = null;
  } catch (error) {
    console.error('Error creating roster:', error);
  }
}

function goToRoster(id) {
  router.push(`/roster/${id}`);
}
</script>