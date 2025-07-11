<template>
  <v-card>
    <v-card>
    <v-card-title>
      Rosters
    </v-card-title>
    <v-card-text>
      <div class="text-right">
          <v-btn
            color="blue-accent-2"
            variant="tonal"
            prepend-icon="mdi-account-plus"
            @click="openDialog"
          >
            Add Roster
          </v-btn>
        </div>
        
          <v-text-field
            v-model="search"
            class="flex-grow-1 float-right"
            label="Search"
            width="350px"
            prepend-icon="mdi-magnify"
            clearable
            @input="loadItems({ page: 1, itemsPerPage: 10 })"
          ></v-text-field>
        
    
    </v-card-text>
   </v-card>

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
  </v-card>
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
    const formattedDate = newRosterDate.value.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
    const res = await axios.post(BASE_URL, { date: formattedDate });
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