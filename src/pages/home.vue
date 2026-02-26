<template>
  <v-app>
    
      <v-container class="d-flex justify-center" >
          <v-img
            src="@/assets/logo.png"
            alt="Logo"
            contain
            height="280px"
            width="280px"
          ></v-img>
      </v-container>
    <v-divider></v-divider>
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="dashboard-card" @click="goTo('/people')" style="background-color: #01579B;">
              <v-card-title class="text-center">
                <v-icon icon="mdi-account-group" class="mr-2"></v-icon>
                People
              </v-card-title>
              <v-card-text class="text-center">
                Manage and view all people.
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="dashboard-card" @click="goTo('/roles')" style="background-color: #00BCD4;">
              <v-card-title class="text-center">
                <v-icon icon="mdi-account-cog" class="mr-2"></v-icon>
                Roles
              </v-card-title>
              <v-card-text class="text-center">
                Manage user roles and permissions.
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="dashboard-card" @click="goTo('/events')" style="background-color: #8BC34A;">
              <v-card-title class="text-center">
                <v-icon icon="mdi-clock" class="mr-2"></v-icon>
                Events
              </v-card-title>
              <v-card-text class="text-center">
                Manage available events.
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="dashboard-card" @click="goTo('/rosters')" style="background-color: #FFA726;">
              <v-card-title class="text-center">
                <v-icon icon="mdi-calendar" class="mr-2"></v-icon>
                Rosters
              </v-card-title>
              <v-card-text class="text-center">
                Generate and view rosters.
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-spacer></v-spacer>
        <v-divider></v-divider>
        <v-row class="mt-8">
          <v-col cols="12" class="text-center">
            <strong class="text-h5"> Quick Actions. </strong>
          </v-col>
          <v-col cols="12" md="4">
            <v-card
            @click="memberDialog = true"
            >
              <v-card-title class="text-center">
                <v-row align="center" justify="center" class="mt-2">
                <v-icon icon="mdi-account-plus" size="30"></v-icon>
                </v-row>
                <v-spacer class="mt-4"></v-spacer>
                Add a new member
              </v-card-title>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card
            @click="roleDialog = true"
            >
              <v-card-title class="text-center">
                <v-row align="center" justify="center" class="mt-2">
                <v-icon icon="mdi-account-cog" size="30"></v-icon>
                </v-row>
                <v-spacer class="mt-4"></v-spacer>
                Add a new role
              </v-card-title>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card 
            @click="eventDialog = true"
            >
              <v-card-title class="text-center">
                <v-row align="center" justify="center" class="mt-2">
                <v-icon icon="mdi-calendar-plus" size="30"></v-icon>
                </v-row>
                <v-spacer class="mt-4"></v-spacer>
                Add an event
              </v-card-title> 
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <template v-slot:footer>
      <v-footer app padless>
        <v-col class="text-center" cols="12">
          &copy; {{ new Date().getFullYear() }} My Application
        </v-col>
      </v-footer>
    </template>
    <!-- member dialog -->
    <template>
      <v-dialog v-model="memberDialog" max-width="600">
        <v-card>
          <v-card-title>Add a member</v-card-title>
          <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                label="First Name*"
                rounded="lg"
                variant="outlined"
                v-model="form.first_name"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Last Name*"
                rounded="lg"
                variant="outlined"
                v-model="form.last_name"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Email*"
                rounded="lg"
                variant="outlined"
                v-model="form.email"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Phone*"
                rounded="lg"
                variant="outlined"
                v-model="form.phone_number"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Area of residence*"
                rounded="lg"
                variant="outlined"
                v-model="form.area_of_residence"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-checkbox
                label="Is Producer"
                v-model="form.is_producer"
                color="blue-accent-2"
              ></v-checkbox>
              <v-checkbox
                label="Is Assistant Producer"
                v-model="form.is_assistant_producer"
                color="blue-accent-2"
              ></v-checkbox>

            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                :items="rolesList"
                item-title="name"
                variant="outlined"
                rounded="lg"
                item-value="id"
                label="Roles"
                v-model="form.roles"
                closable-chips
                multiple
                clearable
              >
              <template v-slot:selection="{item, index}">
                <v-chip v-if="index < 3" :text="item.title" :key="index" small>
                
                </v-chip>
                <span v-else-if="index === 3" class="grey--text text--darken-1"
                  >+{{ form.roles.length - 3 }} more</span>
              </template>
            </v-autocomplete>
            </v-col>
          </v-row>
          <small class="text-caption text-medium-emphasis">* indicates required fields</small>
        </v-card-text>
          <v-divider></v-divider>
        <v-card-actions class="justify-space-between">
          <v-btn
            variant="tonal"
            color="red-accent-2"
            text="Cancel"
            @click="closeDialog"
          ></v-btn>       
          <v-btn
            variant="tonal"
            color="green-accent-2"
            @click="addUser"
          >
          Add Member
          </v-btn>
        </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
    <!-- role dialog -->
     <template>
      <v-dialog v-model="roleDialog" max-width="600">
        <v-card>
          <v-card-title>Add a role</v-card-title>
          <v-card-text>
          <v-row dense>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                label="Role Name*"
                rounded="lg"
                variant="outlined"
                v-model="form.name"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                label="Description"
                rounded="lg"
                variant="outlined"
                v-model="form.description"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-checkbox
                label="Is Special Role"
                v-model="form.is_special_role"
                color="#2196F3"
              ></v-checkbox>
            </v-col>
          </v-row>
          <small class="text-caption text-medium-emphasis">* indicates required fields</small>
        </v-card-text>
          <v-divider></v-divider>
        <v-card-actions class="justify space-between">
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
            @click="addRole"
          >
          Add Role
          </v-btn>
        </v-card-actions>
        </v-card>

      </v-dialog>
     </template>
     <!-- event dialog -->
      <template>
        <v-dialog v-model="eventDialog" max-width="600">
        <v-card>
          <v-card-title>Add an event</v-card-title>
          <v-card-text>
            <!-- Event form fields go here -->
            <v-text-field
              label="Event Name"
              rounded="lg"
              variant="outlined"
              required
              :rules="[v => !!v || 'Event name is required']"
            ></v-text-field>
            <v-row>
              <v-col>
            <v-text-field
              v-model="form.start_time"
              append-inner-icon="mdi-clock-time-four-outline"
              label="Start Time"
              rounded="lg"
              variant="outlined"
              :rules="[v => !!v || 'Start time is required']"
              required
              readonly
            >
            <v-dialog v-model="startTimeDialog" activator="parent" width="auto">
            <v-time-picker 
            v-model="form.start_time"
            ></v-time-picker>
          </v-dialog>
          </v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              v-model="form.end_time"
              append-inner-icon="mdi-clock-time-four-outline"
              label="End Time"
              rounded="lg"
              variant="outlined"
              :rules="[v => !!v || 'End time is required']"
              required
              readonly
               >
              <v-dialog v-model="endTimeDialog" activator="parent" width="auto">
                <v-time-picker v-model="form.end_time"
                ></v-time-picker>
              </v-dialog>
            </v-text-field>
          </v-col>
            </v-row>
            <v-text-field
              v-model="form.description"
              label="Description"
              rounded="lg"
              variant="outlined"
              type="text"
            ></v-text-field>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions class="justify-space-between">
            <v-btn
              variant="tonal"
              color="red-accent-2"
              text="Cancel"
              density="comfortable"
              class="ml-2"
              @click="closeDialog"
            ></v-btn>       
            <v-btn
              variant="tonal"
              density="comfortable"
              rounded="lg"
              color="green-accent-2"
              @click="addEvent"
            >
            Add Event
            </v-btn>
          </v-card-actions>
        </v-card>
        </v-dialog>
      </template>
  </v-app>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import axios from 'axios';
import { toast } from 'vue-sonner';


const router = useRouter();
const memberDialog = ref(false);
const roleDialog = ref(false);
const rolesList = ref([]);
const eventDialog = ref(false);
const startTimeDialog = ref(false);
const endTimeDialog = ref(false);



const form = ref({
  first_name: '',
  last_name :'',
  email: '',
  phone_number: '',
  area_of_residence: '',
  is_producer: false,
  is_assistant_producer: false,
  roles: []
})
const roleForm = ref({
  name: '',
  description: '',
  is_special_role: false
});
function closeDialog() {
  memberDialog.value = false;
  eventDialog.value = false;
  roleDialog.value = false;
}
async function addRole(){
  try {
    const response = await axios.post('http://localhost:8000/api/roles/', roleForm.value);
    toast.success('Role added successfully!');
    closeDialog();
  } catch (error) {
    toast.error('Failed to add role.');
  }
}

async function fetchRoles() {
  try {
    const response = await axios.get('http://localhost:8000/api/roles/');
    rolesList.value = response.data;
  } catch (error) {
    toast.error('Failed to fetch roles.');
  }
}


async function addUser(){
 try {
    const response = await axios.post('http://localhost:8000/api/people/', form.value);
    toast.success('User added successfully!');
    closeDialog();
  } catch (error) {
    toast.error('Failed to add user.');
  }
}
async function addEvent() {
  try{
    const response = await axios.post('http://localhost:8000/api/events/', form.value);
    toast.success('Event added successfully!');
    closeDialog();
  } catch (error) {
    toast.error('Failed to add event.');
  }
}

function goTo(path) {
  router.push(path);
}
onMounted(fetchRoles);

</script>

<style scoped>
.dashboard-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.dashboard-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
</style>