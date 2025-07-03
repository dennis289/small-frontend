<template>
  <v-card>
    <v-toolbar flat>
      <v-toolbar-title> Roles
         </v-toolbar-title>
         <v-btn
          v-if="!home"
          prepend-icon="mdi-account-multiple"
          class="ml-2"
          variant="tonal"
          color="blue-accent-2"
          text="Home"
          @click="home =! home"
          to="home"
         >Home</v-btn> 
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        label="Search roles"
        single-line
        hide-details
        density="compact"
        style="max-width: 250px ;"
      ></v-text-field>
      <v-btn color="blue-accent-2" 
        class="ml-4"
        @click="dialog = true"
      >Add Role</v-btn>
    </v-toolbar>
    <v-data-table
      :headers="headers"
      :items="roles"
      class="elevation-1"
      :search="search"
    >
     <template
     #item.actions="{item}"
     >
     <v-btn icon="mdi-pencil" size="small" @click="editRole(item)"></v-btn>
     <v-btn icon="mdi-delete" size="small" @click="deleteRole(item)"></v-btn>
    </template>

  </v-data-table>
  
     <v-dialog 
     v-model="dialog" 
     max-width="600">
      <v-card title="Add Role">
        <v-card-text>
          <v-row dense>
            <v-col 
            cols="12" md="4" sm="6">
              <v-text-field 
              label="Role Name*" 
              required 
              v-model="name"
              ></v-text-field>
            </v-col>
            <v-col 
            cols="12" md="4" sm="6">
              <v-text-field 
              label="Description" 
              v-model="description"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-checkbox 
              label="Is Special Role" 
              v-model="isSpecialRole" 
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
          text="cancel" 
          class="ml-2" 
          @click="dialog=false"
          ></v-btn>
          <v-btn 
          text="Add" 
          variant="tonal" 
          color="green-accent-2" 
          @click="addRole"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
  import axios from 'axios';
  import { ref, shallowRef } from 'vue';
  import { onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  const router = useRouter();
    onMounted(fetchRoles);

  const dialog  = shallowRef(false);
  const search = ref('');
  const isSpecialRole = ref(false);
  const name = ref('');
  const description = ref('');
  const headers = [
  { title: 'Role ID', value: 'id', sortable: true },
  { title: 'Role Name', value: 'name' },
  { title: 'Description', value: 'description' },
  { title: 'Is Special Role', value: 'is_special_role', sortable: false },
  { title: 'Actions', value: 'actions', sortable: false }
];

async function fetchRoles(){
    try {
        const response = await axios.get('http://localhost:8000/api/roles/');
        roles.value = response.data;
    } catch (error) {
        console.error('Error fetching roles:', error);
    }
}
const roles = ref([]);
async function addRole(){
    try {
        const response = await axios.post('http://localhost:8000/api/roles/', {
            name: name.value,
            description: description.value,
            is_special_role: isSpecialRole.value
        });
        roles.value.push(response.data);
        dialog.value = false;
        console.log('Role added successfully:', response.data);
    } catch (error) {
        console.error('Error adding role:', error);
    }
}

function editRole(item) {
    name.value = item.name;
    description.value = item.description;
    isSpecialRole.value = item.is_special_role;
    dialog.value = true;
}
function deleteRole(item) {
    if (confirm(`Are you sure you want to delete the role: ${item.name}?`)) {
        axios.delete(`http://localhost:8000/api/roles/${item.id}/`)
            .then(() => {
                roles.value = roles.value.filter(role => role.id !== item.id);
                console.log('Role deleted successfully');
            })
            .catch(error => {
                console.error('Error deleting role:', error);
            });
    }
}


</script>
