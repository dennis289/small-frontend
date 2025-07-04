<template>
  <v-card>
    <v-dialog v-model="editorDialog" max-width="600">
      <v-card>
        <v-toolbar color="primary">
          <v-toolbar-title>
            {{ editedService ? 'Edit Service' : 'Add New Service' }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="editorDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text>
          <v-form @submit.prevent="saveService">
            <v-text-field
              v-model="form.name"
              label="Service Name"
              :rules="[v => !!v || 'Name is required']"
              required
            ></v-text-field>
            <v-text-field
              v-model="form.order"
              label="Order"
              type="number"
              min="1"
              :rules="[v => !!v || 'Order is required']"
              required
            ></v-text-field>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="secondary" @click="editorDialog = false">Cancel</v-btn>
              <v-btn color="primary" type="submit">Save</v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-data-table
      :headers="headers"
      :items="services"
      class="elevation-1"
      density="compact"
    >
      <template #item.actions="{ item }">
        <v-btn icon size="small" @click="openEditor(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon size="small" @click="deleteService(item.id)">
          <v-icon color="error">mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <v-btn color="primary" @click="openEditor(null)" class="mt-4">
      <v-icon>mdi-plus</v-icon> Add Service
    </v-btn>
  </v-card>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/services';

const services = ref([]);
const editorDialog = ref(false);
const editedService = ref(null);
const form = ref({
  name: '',
  order: ''
});

const headers = [
  { title: 'Name', value: 'name' },
  { title: 'Order', value: 'order' },
  { title: 'Actions', value: 'actions', sortable: false }
];

async function loadData() {
  try {
    const res = await axios.get(BASE_URL + '/');
    services.value = res.data;
  } catch (error) {
    console.error('Error loading services:', error);
  }
}

onMounted(loadData);

function openEditor(service) {
  editedService.value = service;
  if (service) {
    form.value = {
      id: service.id,
      name: service.name,
      order: service.order
    };
  } else {
    form.value = {
      name: '',
      order: ''
    };
  }
  editorDialog.value = true;
}

async function saveService() {
  try {
    if (editedService.value) {
      await axios.put(BASE_URL + '/', { ...form.value, id: editedService.value.id });
    } else {
      await axios.post(BASE_URL + '/', form.value);
    }
    await loadData();
    editorDialog.value = false;
  } catch (error) {
    console.error('Error saving service:', error);
  }
}

async function deleteService(id) {
  if (confirm('Are you sure you want to delete this service?')) {
    try {
      await axios.delete(BASE_URL + '/', { data: { id } });
      services.value = services.value.filter(s => s.id !== id);
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  }
}
</script>