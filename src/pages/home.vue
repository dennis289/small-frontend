<template>
  <v-card>
    <v-toolbar flat>
      <v-toolbar-title> Home
         </v-toolbar-title>
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
    <v-data-table
      :headers="headers"
      :items="filteredUsers"
      class="elevation-1"
      :search="search"
    >
     <template
     #item.actions="{item}"
     >
     <v-btn icon="mdi-pencil" size="small" @click="editUser(item)"></v-btn>
     <v-btn icon="mdi-delete" size="small" @click="deleteUser(item)"></v-btn>
    </template>

  </v-data-table>
  <template>
    <div class="pa-4 text-center">
      <v-dialog
      v-model="dialog"
      max-width="600"
      >
      <template v-slot:activator="{ props: activatorProps }">
        <v-btn
        class="text-none font-weight-regular"
        prepend-icon="mdi-account-plus"
        text="Add user"
        variant="tonal"
        v-bind="activatorProps"
        ></v-btn>
      </template>
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
          v-model="isProducer"
          color="blue-accent-2"
          ></v-checkbox>
        </v-col>
        <v-col
          cols="12"
          md="4"
          sm="6"
          >
          <v-text-field
          label="Phone*"
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
          required
          ></v-text-field>
        </v-col>
         <v-col
              cols="12"
              sm="6"
            >
              <v-autocomplete
                :items="['Videography', 'Photography', 'Projecting', 'Streaming', 'Media desk', 'Time keeping']"
                label="Roles"
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
          @click="dialog=false"
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
  const dialog  = shallowRef(false);
  const search = ref('');
  const isProducer = ref(false);
  const headers = [
    { text: 'First Name', value: 'first_name' },
    { text: 'Last Name', value: 'last_name' },
    { text: 'Phone', value: 'phone' },
    { text: 'Area of Residence', value: 'area_of_residence' },
    { text: 'Roles', value: 'roles' },
    { text: 'Actions', value: 'actions', sortable: false }
  ];
  const users = ref([
    { first_name: 'John', last_name: 'Doe', phone: '1234567890', area_of_residence: 'Nairobi', roles: ['Videography'] },
    { first_name: 'Jane', last_name: 'Smith', phone: '0987654321', area_of_residence: 'Mombasa', roles: ['Photography'] },
    { first_name: 'Alice', last_name: 'Johnson', phone: '5555555555', area_of_residence: 'Kisumu', roles: ['Streaming'] },
]);
</script>
