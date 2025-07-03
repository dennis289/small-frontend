<template>
  <v-card>
    <v-toolbar flat>
      <v-toolbar-title> Home
         </v-toolbar-title>
         <v-btn
          v-if="!roles"
          prepend-icon="mdi-account-multiple"
          class="ml-2"
          @click="roles = !roles"
          variant="tonal"
          color="blue-accent-2"
          text="Roles"
          to="roles"
         ></v-btn> 
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        label="Search users"
        single-line
        hide-details
        density="compact"
        style="max-width: 250px ;"
      ></v-text-field>
      <v-btn color="blue-accent-2" 
        class="ml-4"
        @click="dialog = true"
      >Add User</v-btn>
    </v-toolbar>
    <v-data-table-server
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      class="elevation-1"
      :search="search"
      @update:options="loadItems"
    >
     <template
     #item.actions="{item}"
     >
     <v-btn icon="mdi-pencil" size="small" @click="editUser(item)"></v-btn>
     <v-btn icon="mdi-delete" size="small" @click="deleteUser(item)"></v-btn>
    </template>
   <template #item.role_names="{ item }">
     <span v-if="item.role_names && item.role_names.length">
       {{ item.role_names.join(', ') }}
     </span>
     <span v-else>-</span>
   </template>

    </v-data-table-server>
  <template>
    <div class="pa-4 text-center">
      <v-dialog
      v-model="dialog"
      max-width="600"
      >
      
        <v-btn
        class="text-none font-weight-regular"
        prepend-icon="mdi-account-plus"
        text="Add user"
        @click="openDialog"
        variant="tonal"
        v-bind="activatorProps"
        ></v-btn>
      <v-card
      prepend-icon="mdi-account-plus"
      title="Add User"
      >
      <v-card-text>
        <v-row dense>
          <v-col
          cols="12"
          md="4"
          sm="6"
          >
          <v-text-field
          label="First Name*"
          v-model="form.first_name"
          required
          ></v-text-field>
        </v-col>
        <v-col
          cols="12"
          md="4"
          sm="6"
          >
          <v-text-field
          label="Last Name*"
          v-model="form.last_name"
          required
          ></v-text-field>
        </v-col>
        <v-col
          cols="12"
          md="4"
          sm="6"
          >
          <v-text-field
          label="Email*"
          v-model="form.email"
          required
          ></v-text-field>
        </v-col>
        <v-col
          cols="12"
          md="4"
          sm="6"
          >
          <v-text-field
          label="Phone*"
          v-model="form.phone_number"
          required
          ></v-text-field>
        </v-col>
        <v-col
          cols="12"
          md="4"
          sm="6"
          >
          <v-text-field
          label="Area of residence*"
          v-model="form.area_of_residence"
          required
          ></v-text-field>
        </v-col>
        <v-col
          cols="12"
          md="4"
          sm="6"
          >
          <v-checkbox
          label="Is Producer"
          v-model="form.is_producer"
          color="blue-accent-2"
          ></v-checkbox>
        </v-col>
         <v-col
              cols="12"
              sm="6"
            >
              <v-autocomplete
                :items="users"
                item-title="name"
                item-value="id"
                label="Roles"
                v-model="form.roles"
                auto-select-first
                multiple
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
          text="cancel"
          class="ml-2"
          @click="closeDialog"
        ></v-btn>


      <v-btn
      text="Add"
      variant="tonal"
      color="green-accent-2"
      @click="addUser"
      ></v-btn>
      </v-card-actions>
    </v-card>
    </v-dialog>
    </div>
  </template>
  </v-card>
</template>

<script setup>
  import { ref, shallowRef } from 'vue';
  import { onMounted } from 'vue';
  import axios from 'axios';
  const dialog  = ref(false);
  const search = ref('');
  const isProducer = ref(false);
  const persons = ref([]);
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
  const users = ref([]);
async function fetchRoles(){
  try {
    const response = await axios.get('http://localhost:8000/api/roles')
    users.value = response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
  }
}
 const serverItems = ref([])
  const loading = ref(true)
  const totalItems = ref(0)
  
  // const FakeAPI = {
  //   async fetch ({ page, itemsPerPage, sortBy, search }) {
  //     return new Promise(resolve => {
  //       setTimeout(() => {
  //         const start = (page - 1) * itemsPerPage
  //         const end = start + itemsPerPage
  //         const items = desserts.slice().filter(item => {
  //           if (search.name && !item.name.toLowerCase().includes(search.name.toLowerCase())) {
  //             return false
  //           }
  //           // eslint-disable-next-line sonarjs/prefer-single-boolean-return
  //           if (search.calories && !(item.calories >= Number(search.calories))) {
  //             return false
  //           }
  //           return true
  //         })
  //         if (sortBy.length) {
  //           const sortKey = sortBy[0].key
  //           const sortOrder = sortBy[0].order
  //           items.sort((a, b) => {
  //             const aValue = a[sortKey]
  //             const bValue = b[sortKey]
  //             return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
  //           })
  //         }
  //         const paginated = items.slice(start, end === -1 ? undefined : end)
  //         resolve({ items: paginated, total: items.length })
  //       }, 500)
  //     })
  //   },
  // }
async function loadItems ({ page, itemsPerPage, sortBy }) {
    loading.value = true
   const response = await axios.get('http://localhost:8000/api/persons/', {
      params: {
       page,
       itemsPerPage
      }
    })
    serverItems.value = response.data.results || response.data
    totalItems.value = response.data.count || response.data.total || serverItems.value.length
    loading.value = false
  }
async function addUser() {
  try {
    const formdata = {
      ...form.value,
    }
    const response = await axios.post('http://localhost:8000/api/persons/', formdata);
    users.value.push(response.data);
    dialog.value = false;
  } catch (error) {
    console.error('Error adding user:', error);
  }
}
function openDialog() {
  dialog.value = true;
  fetchUsers();
}
function closeDialog() {
  dialog.value = false;
}
onMounted(fetchRoles);

let form= ref({
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  area_of_residence: '',
  is_producer: false,
  roles: [],
});
</script>
