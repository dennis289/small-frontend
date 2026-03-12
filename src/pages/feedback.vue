<template>
  <navbar />
  <v-container>
    <v-row>
      <v-col cols="12">
        <h2 class="text-h5 mb-4">Roster Feedback</h2>

        <!-- Step 1: Select a roster -->
        <v-card class="mb-4 pa-4" elevation="2">
          <v-card-title class="text-subtitle-1 pa-0 mb-2">Select Roster</v-card-title>
          <v-select
            v-model="selectedRosterId"
            :items="rosters"
            item-title="label"
            item-value="id"
            label="Choose a roster"
            variant="outlined"
            density="comfortable"
            @update:model-value="loadPersons"
          />
        </v-card>

        <!-- Step 2: Mark attendance + feedback -->
        <v-card v-if="persons.length" class="pa-4" elevation="2">
          <v-card-title class="text-subtitle-1 pa-0 mb-2">
            Members ({{ presentCount }}/{{ persons.length }} present)
          </v-card-title>

          <v-table density="comfortable">
            <thead>
              <tr>
                <th>Member</th>
                <th class="text-center" style="width: 100px">Present</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in persons" :key="p.person_id">
                <td>{{ p.person_name }}</td>
                <td class="text-center">
                  <v-checkbox
                    v-model="p.is_present"
                    hide-details
                    density="compact"
                    color="success"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model="p.feedback"
                    placeholder="Optional feedback..."
                    variant="plain"
                    density="compact"
                    hide-details
                  />
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-card-actions class="mt-3 px-0">
            <v-spacer />
            <v-btn
              color="primary"
              variant="flat"
              :loading="saving"
              @click="saveFeedback"
            >
              Save Feedback
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Empty state -->
        <v-alert
          v-else-if="selectedRosterId && !loading"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          No active members found.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { toast } from 'vue-sonner'
import navbar from '@/components/navbar.vue'

const BASE_URL = 'http://localhost:8000/api/'

const rosters = ref([])
const selectedRosterId = ref(null)
const persons = ref([])
const loading = ref(false)
const saving = ref(false)

const presentCount = computed(() => persons.value.filter(p => p.is_present).length)

onMounted(async () => {
  await fetchRosters()
})

async function fetchRosters() {
  try {
    const token = localStorage.getItem('auth_token')
    const res = await axios.get(BASE_URL + 'rosters/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    rosters.value = res.data.map(r => ({
      id: r.id,
      label: `${r.event_name} — ${r.date}`,
    }))
  } catch (e) {
    toast.error('Failed to load rosters')
  }
}

async function loadPersons() {
  if (!selectedRosterId.value) return
  loading.value = true
  try {
    const token = localStorage.getItem('auth_token')
    const res = await axios.get(BASE_URL + `rosters/${selectedRosterId.value}/persons/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    persons.value = res.data
  } catch (e) {
    toast.error('Failed to load members')
    persons.value = []
  } finally {
    loading.value = false
  }
}

async function saveFeedback() {
  if (!selectedRosterId.value) return
  saving.value = true
  try {
    const token = localStorage.getItem('auth_token')
    const payload = {
      feedback: persons.value.map(p => ({
        person_id: p.person_id,
        is_present: p.is_present,
        feedback: p.feedback || '',
      }))
    }
    await axios.post(BASE_URL + `rosters/${selectedRosterId.value}/feedback/`, payload, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    toast.success('Feedback saved successfully')
  } catch (e) {
    toast.error('Failed to save feedback')
  } finally {
    saving.value = false
  }
}
</script>
