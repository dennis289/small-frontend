<template>
  <v-card>
   <v-card>
    <v-card-title>
      People
    </v-card-title>
    <v-card-text>
      <div class="text-right">
          <v-btn
            color="blue-accent-2"
            variant="tonal"
            prepend-icon="mdi-account-plus"
            @click="openDialog"
          >
            Add Person
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

    <v-data-table-server
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      class="elevation-1"
      :search="search"
      @update:options="loadItems"
    >
      <template #item.is_producer="{ item }">
        <v-chip
          :color="item.is_producer ? 'green' : 'grey'"
          size="small"
          variant="flat"
        >
          {{ item.is_producer ? 'Yes' : 'No' }}
        </v-chip>
      </template>

      <template #item.role_names="{ item }">
        <span v-if="item.role_names && item.role_names.length">
          {{ item.role_names.join(', ') }}
        </span>
        <span v-else>-</span>
      </template>

      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" size="small" @click="editUser(item)"></v-btn>
        <v-btn icon="mdi-delete" size="small" @click="confirmDelete(item)"></v-btn>
      </template>
    </v-data-table-server>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card
        prepend-icon="mdi-account-plus"
        :title="editingId ? 'Edit User' : 'Add User'"
      >
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                label="First Name*"
                v-model="form.first_name"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                label="Last Name*"
                v-model="form.last_name"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                label="Email*"
                v-model="form.email"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                label="Phone*"
                v-model="form.phone_number"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                label="Area of residence*"
                v-model="form.area_of_residence"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-checkbox
                label="Is Producer"
                v-model="form.is_producer"
                color="blue-accent-2"
              ></v-checkbox>
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                :items="rolesList"
                item-title="name"
                item-value="id"
                label="Roles"
                v-model="form.roles"
                multiple
                clearable
              ></v-autocomplete>
            </v-col>
          </v-row>
          <small class="text-caption text-medium-emphasis">* indicates required fields</small>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn
            variant="plain"
            color="red-accent-2"
            text="Cancel"
            class="ml-2"
            @click="closeDialog"
          ></v-btn>       
          <v-btn
            variant="tonal"
            color="green-accent-2"
            @click="saveUser"
          >
            {{ editingId ? 'Update' : 'Add' }} User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          Confirm Delete
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this person?
          <v-spacer></v-spacer>
          <strong>{{ userToDelete?.first_name }} {{ userToDelete?.last_name }}</strong>?
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
            @click="deleteUser"
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

// Reactive variables
const dialog = ref(false);
const deleteDialog = ref(false);
const search = ref('');
const editingId = ref(null);
const userToDelete = ref(null);
const serverItems = ref([]);
const loading = ref(true);
const totalItems = ref(0);
const rolesList = ref([]);

// Form data
const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  area_of_residence: '',
  is_producer: false,
  roles: [],
});

// Table headers
const headers = [
  { title: 'First Name', value: 'first_name' },
  { title: 'Last Name', value: 'last_name' },
  { title: 'Email', value: 'email' },
  { title: 'Phone', value: 'phone_number' },
  { title: 'Area of Residence', value: 'area_of_residence' },
  { title: 'Is Producer', value: 'is_producer', sortable: false }, 
  { title: 'Roles', value: 'role_names' },
  { title: 'Actions', value: 'actions', sortable: false }
];

// Functions
async function fetchRoles() {
  try {
    const response = await axios.get('http://localhost:8000/api/roles/');
    rolesList.value = response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
  }
}

async function loadItems({ page, itemsPerPage, sortBy }) {
  try {
    loading.value = true;
    const response = await axios.get('http://localhost:8000/api/persons/', {
      params: {
        page,
        itemsPerPage
      }
    });
    serverItems.value = response.data.results || response.data;
    totalItems.value = response.data.count || response.data.total || serverItems.value.length;
  } catch (error) {
    console.error('Error loading items:', error);
  } finally {
    loading.value = false;
  }
}

function openDialog() {
  editingId.value = null;
  form.value = {
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    area_of_residence: '',
    is_producer: false,
    roles: [],
  };
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  editingId.value = null;
}

function editUser(item) {
  form.value = {
    first_name: item.first_name,
    last_name: item.last_name,
    email: item.email,
    phone_number: item.phone_number,
    area_of_residence: item.area_of_residence,
    is_producer: item.is_producer,
    roles: item.roles || []
  };
  editingId.value = item.id;
  dialog.value = true;
}

async function saveUser() {
  try {
    if (editingId.value) {
      // Edit mode
      const dataWithId = { ...form.value, id: editingId.value };
      await axios.put('http://localhost:8000/api/persons/', dataWithId);
    } else {
      // Add mode
      await axios.post('http://localhost:8000/api/persons/', form.value);
    }
    closeDialog();
    await loadItems({ page: 1, itemsPerPage: 10 }); // Refresh table
    console.log('User saved successfully');
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

function confirmDelete(item) {
  userToDelete.value = item;
  deleteDialog.value = true;
}

async function deleteUser() {
  try {
    await axios.delete('http://localhost:8000/api/persons/', {
      data: { id: userToDelete.value.id }
    });
    serverItems.value = serverItems.value.filter(person => person.id !== userToDelete.value.id);
    console.log('User deleted successfully');
    deleteDialog.value = false;
    userToDelete.value = null;
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

// Initialize
onMounted(fetchRoles);
</script>