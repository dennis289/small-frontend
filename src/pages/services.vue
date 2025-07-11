<template>
  <v-card>
    <v-toolbar flat>
      <v-toolbar-title>Services</v-toolbar-title>
      <v-btn
        prepend-icon="mdi-home"
        class="ml-2"
        variant="tonal"
        color="blue-accent-2"
        text="Home"
        to="/home"
      >Home</v-btn> 
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        label="Search services"
        single-line
        hide-details
        density="compact"
        style="max-width: 250px;"
      ></v-text-field>
      <v-btn
        color="blue-accent-2"
        @click="openEditor(null)"
        class="ml-4"
      >
        Add Service
      </v-btn>
    </v-toolbar>
    <v-dialog 
    v-model="editorDialog" 
    max-width="600">
      <v-card>
        <v-toolbar flat>
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
              v-model="form.description"
              label="Description"
              type="text"
              :rules="[v => !!v || 'Description is required']"
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
          Are you sure you want to delete this service?
          <v-spacer></v-spacer>
          <strong>{{ serviceToDelete?.name }}</strong>?
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
            @click="deleteService"
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
import { de } from 'vuetify/locale';

const BASE_URL = 'http://localhost:8000/api/services';

const services = ref([]);
const editorDialog = ref(false);
const editedService = ref(null);
const deleteDialog = ref(false);
const serviceToDelete = ref(null);
const search = ref('');

const form = ref({
  name: '',
  description: ''
});

const headers = [
  { title: 'Name', value: 'name' },
  { title: 'Description', value: 'description' },
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
      order: service.description
    };
  } else {
    form.value = {
      name: '',
      description: ''
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

function confirmDelete(service) {
  serviceToDelete.value = service;
  deleteDialog.value = true;
}

async function deleteService() {
  try {
    await axios.delete(BASE_URL + '/', { data: { id: serviceToDelete.value.id } });
    services.value = services.value.filter(s => s.id !== serviceToDelete.value.id);
    deleteDialog.value = false;
    serviceToDelete.value = null;
  } catch (error) {
    console.error('Error deleting service:', error);
  }
}
</script>