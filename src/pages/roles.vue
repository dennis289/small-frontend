<template>
  <v-card>
    <v-card>
    <v-card-title>
      Role
    </v-card-title>
    <v-card-text>
      <div class="text-right">
          <v-btn
            color="blue-accent-2"
            variant="tonal"
            prepend-icon="mdi-account-plus"
            @click="openDialog"
          >
            Add Role
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
      :items="roles"
      class="elevation-1"
      :search="search"
    >
      <template #item.is_special_role="{ item }">
        <v-chip
          :color="item.is_special_role ? 'green' : 'grey'"
          size="small"
          variant="flat"
        >
          {{ item.is_special_role ? 'Yes' : 'No' }}
        </v-chip>
      </template>
      
      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" size="small" @click="editRole(item)"></v-btn>
        <v-btn icon="mdi-delete" size="small" @click="confirmDelete(item)"></v-btn>
      </template>
    </v-data-table>
  
    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card
        prepend-icon="mdi-account-group"
        :title="editingId ? 'Edit Role' : 'Add Role'"
      >
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="4" sm="6">
              <v-text-field 
                label="Role Name*" 
                required 
                v-model="form.name"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-text-field 
                label="Description" 
                v-model="form.description"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-checkbox 
                label="Is Special Role" 
                v-model="form.is_special_role" 
                color="blue-accent-2"
              ></v-checkbox>
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
            @click="saveRole"
          >
            {{ editingId ? 'Update' : 'Add' }} Role
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
          Are you sure you want to delete this role?
          <v-spacer></v-spacer>
          <strong>{{ roleToDelete?.name }}</strong>?
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
            @click="deleteRole"
            text="Delete"
          ></v-btn>
        </v-card-actions> 
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import axios from 'axios';
import { ref } from 'vue';
import { onMounted } from 'vue';

// Reactive variables
const dialog = ref(false);
const deleteDialog = ref(false);
const search = ref('');
const editingId = ref(null);
const roleToDelete = ref(null);
const roles = ref([]);

// Form data
const form = ref({
  name: '',
  description: '',
  is_special_role: false
});

// Table headers
const headers = [
  { title: 'Role ID', value: 'id', sortable: true },
  { title: 'Role Name', value: 'name' },
  { title: 'Description', value: 'description' },
  { title: 'Is Special Role', value: 'is_special_role', sortable: false },
  { title: 'Actions', value: 'actions', sortable: false }
];

// Functions
async function fetchRoles() {
  try {
    const response = await axios.get('http://localhost:8000/api/roles/');
    console.log('Roles fetched:', response.data); // Debug log
    roles.value = response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
  }
}

function openDialog() {
  editingId.value = null;
  form.value = {
    name: '',
    description: '',
    is_special_role: false
  };
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  editingId.value = null;
  // Reset form
  form.value = {
    name: '',
    description: '',
    is_special_role: false
  };
}

function editRole(item) {
  form.value = {
    name: item.name,
    description: item.description,
    is_special_role: item.is_special_role
  };
  editingId.value = item.id;
  dialog.value = true;
}

async function saveRole() {
  try {
    if (editingId.value) {
      // Edit mode
      const dataWithId = { ...form.value, id: editingId.value };
      await axios.put('http://localhost:8000/api/roles/', dataWithId);
    } else {
      // Add mode
      await axios.post('http://localhost:8000/api/roles/', form.value);
    }
    await fetchRoles(); // Refresh the table
    closeDialog();
    console.log('Role saved successfully');
  } catch (error) {
    console.error('Error saving role:', error);
  }
}

function confirmDelete(item) {
  roleToDelete.value = item;
  deleteDialog.value = true;
}

async function deleteRole() {
  try {
    await axios.delete('http://localhost:8000/api/roles/', {
      data: { id: roleToDelete.value.id }
    });
    roles.value = roles.value.filter(role => role.id !== roleToDelete.value.id);
    console.log('Role deleted successfully');
    deleteDialog.value = false;
    roleToDelete.value = null;
  } catch (error) {
    console.error('Error deleting role:', error);
  }
}

// Initialize
onMounted(fetchRoles);
</script>