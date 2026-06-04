<template>
  <v-container class="pa-6 pa-md-8" fluid>
    <PageHeader
      eyebrow="Directory"
      italic="members"
      subtitle="Manage the people on your roster — roles, contact details, and access."
      title="Team"
    >
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-account-plus" variant="flat" @click="openDialog">Add person</v-btn>
        <v-btn prepend-icon="mdi-upload" variant="outlined" @click="bulkUploadDialog = true">Bulk upload</v-btn>
      </template>
    </PageHeader>

    <div class="toolbar-row mb-4 d-flex align-center flex-wrap" style="gap: 12px;">
      <v-text-field
        v-model="search"
        class="toolbar-search"
        clearable
        density="comfortable"
        hide-details
        placeholder="Search by name, email or phone"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        @input="onSearch"
      />
      <v-spacer />
      <span class="text-caption text-medium-emphasis">{{ totalItems }} {{ totalItems === 1 ? 'member' : 'members' }}</span>
    </div>

    <v-card class="overflow-hidden" rounded="lg" variant="outlined">
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        density="comfortable"
        :headers="headers"
        hover
        :items="serverItems"
        :items-length="totalItems"
        :loading="loading"
        @update:options="loadItems"
      >
        <template #item.is_active="{ item }">
          <v-chip
            :color="item.is_active ? 'success' : 'default'"
            size="small"
            variant="tonal"
          >
            {{ item.is_active ? 'Yes' : 'No' }}
          </v-chip>
        </template>

        <template #item.is_producer="{ item }">
          <v-chip
            :color="item.is_producer ? 'primary' : 'default'"
            size="small"
            variant="tonal"
          >
            {{ item.is_producer ? 'Yes' : 'No' }}
          </v-chip>
        </template>

        <template #item.role_names="{ item }">
          <span v-if="item.role_names && item.role_names.length > 0">
            {{ item.role_names.join(', ') }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" @click="editUser(item)" />
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="confirmDelete(item)"
          />
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card
        prepend-icon="mdi-account-plus"
        :title="editingId ? 'Edit User' : 'Add User'"
      >
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.first_name"
                label="First Name*"
                required
                :rules="[v => !!v || 'First name is required']"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.last_name"
                label="Last Name*"
                required
                :rules="[v => !!v || 'Last name is required']"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.email"
                label="Email*"
                required
                :rules="[v => !!v || 'Email is required']"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.phone_number"
                label="Phone*"
                required
                :rules="[v => !!v || 'Phone number is required']"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.area_of_residence"
                label="Area of residence"
              />
              <v-checkbox
                v-model="form.is_active"
                color="primary"
                label="Is Active"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-checkbox
                v-model="form.is_producer"
                color="primary"
                label="Is Producer"
              />
              <v-checkbox
                v-model="form.is_assistant_producer"
                color="primary"
                label="Is Assistant Producer"
              />
            </v-col>
            <v-col cols="12">
              <v-autocomplete
                v-model="form.roles"
                clearable
                closable-chips
                item-title="name"
                item-value="id"
                :items="rolesList"
                label="Roles"
                multiple
                :rules="[v => v.length > 0 || 'At least one role is required']"
              >
                <template #selection="{item, index}">
                  <v-chip v-if="index < 3" :key="index" small :text="item.title" />
                  <span v-else-if="index === 3" class="grey--text text--darken-1">+{{ form.roles.length - 3 }} more</span>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>
          <small class="text-caption text-medium-emphasis">* indicates required fields</small>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-space-between px-4 py-3">
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveUser">
            {{ editingId ? 'Update' : 'Add' }} User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ userToDelete?.first_name }} {{ userToDelete?.last_name }}</strong>?
          <br>
          This action cannot be undone. Please type
          <v-chip color="error" variant="tonal">DELETE</v-chip> to confirm.
          <v-text-field
            v-model="deleteConfirmation"
            class="mt-3"
            label="Type DELETE to confirm"
            required
            :rules="[v => v === 'DELETE' || 'You must type DELETE to confirm']"
          />
        </v-card-text>
        <v-card-actions class="justify-end px-4 py-3">
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="deleteUser">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Upload Dialog -->
    <v-dialog v-model="bulkUploadDialog" max-width="800">
      <v-card>
        <v-card-title class="text-h6">Bulk Upload Members</v-card-title>
        <v-card-text>
          <v-file-input
            v-model="csvFile"
            accept=".csv"
            density="comfortable"
            label="Upload CSV File"
            prepend-icon="mdi-file-upload"
          />
          <small class="text-caption text-medium-emphasis">
            Please ensure the CSV file follows the required format.
          </small>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-space-between px-4 py-3">
          <v-btn variant="text" @click="closeDialog()">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="submitBulkUpload">Upload</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  import Papa from 'papaparse'
  import { onMounted, ref } from 'vue'
  import { toast } from 'vue-sonner'
  import { usePeopleStore } from '@/stores/people'
  import { useRolesStore } from '@/stores/roles'

  const peopleStore = usePeopleStore()
  const rolesStore = useRolesStore()

  // Reactive variables
  const dialog = ref(false)
  const deleteDialog = ref(false)
  const search = ref('')
  const editingId = ref(null)
  const userToDelete = ref(null)
  const serverItems = ref([])
  const loading = ref(false)
  const totalItems = ref(0)
  const page = ref(1)
  const itemsPerPage = ref(10)
  const rolesList = ref([])
  const bulkUploadDialog = ref(false)
  const csvFile = ref(null)
  const deleteConfirmation = ref('')
  let searchTimer = null

  // Form data
  const form = ref({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    area_of_residence: '',
    is_active: true,
    is_producer: false,
    is_assistant_producer: false,
    roles: [],
  })

  // Table headers
  const headers = [
    { title: 'First Name', value: 'first_name' },
    { title: 'Last Name', value: 'last_name' },
    { title: 'Email', value: 'email' },
    { title: 'Phone', value: 'phone_number' },
    { title: 'Active', value: 'is_active', sortable: false },
    { title: 'Is Producer', value: 'is_producer', sortable: false },
    { title: 'Roles', value: 'role_names' },
    { title: 'Actions', value: 'actions', sortable: false },
  ]

  // Functions
  async function fetchRoles () {
    const result = await rolesStore.fetchRoles()
    if (result.success) {
      rolesList.value = rolesStore.roles
    } else {
      toast.error(result.error || 'Failed to fetch roles')
    }
  }

  function loadItems ({ page: p, itemsPerPage: ipp }) {
    page.value = p
    itemsPerPage.value = ipp
    fetchData()
  }

  function onSearch () {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      page.value = 1
      fetchData()
    }, 350)
  }

  async function fetchData () {
    loading.value = true
    const result = await peopleStore.fetchPersons({
      page: page.value,
      pageSize: itemsPerPage.value,
      search: search.value,
    })
    if (result.success) {
      serverItems.value = peopleStore.persons
      totalItems.value = peopleStore.totalPersons
    } else {
      toast.error('Failed to load members')
    }
    loading.value = false
  }

  function openDialog () {
    editingId.value = null
    form.value = {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      area_of_residence: '',
      is_active: true,
      is_producer: false,
      is_assistant_producer: false,
      roles: [],
    }
    dialog.value = true
  }

  function closeDialog () {
    dialog.value = false
    editingId.value = null
    bulkUploadDialog.value = false
    csvFile.value = null
  }

  function editUser (item) {
    form.value = {
      first_name: item.first_name,
      last_name: item.last_name,
      email: item.email,
      phone_number: item.phone_number,
      area_of_residence: item.area_of_residence,
      is_active: item.is_active !== false,
      is_producer: item.is_producer,
      is_assistant_producer: item.is_assistant_producer,
      roles: item.roles || [],
    }
    editingId.value = item.id
    dialog.value = true
  }

  async function saveUser () {
    let result
    if (editingId.value) {
      result = await peopleStore.updatePerson(editingId.value, form.value)
      if (result.success) {
        toast.success(result.data?.message || 'User updated successfully!')
      } else {
        toast.error(result.error || 'Failed to save user.')
        return
      }
    } else {
      result = await peopleStore.createPerson(form.value)
      if (result.success) {
        toast.success(result.data?.message || 'User added successfully!')
      } else {
        toast.error(result.error || 'Failed to save user.')
        return
      }
    }
    closeDialog()
    await fetchData()
  }

  async function submitBulkUpload () {
    if (!csvFile.value) {
      console.error('No CSV file selected')
      toast.error('Please select a CSV file to upload.')
      return
    }

    Papa.parse(csvFile.value, {
      header: true,
      complete: async results => {
        const result = await peopleStore.bulkUpload(results.data)
        if (result.success) {
          console.log('Bulk upload successful:', result.data)
          toast.success(result.data?.message || 'Bulk upload successful!')
          closeDialog()
          await fetchData()
        } else {
          toast.error(result.error || 'Failed to upload CSV file.')
          console.error('Error during bulk upload:', result.error)
        }
        closeDialog()
      },
      error: error => {
        console.error('Error parsing CSV file:', error)
        toast.error('Failed to parse CSV file.')
      },
    })
  }

  function confirmDelete (item) {
    userToDelete.value = item
    deleteConfirmation.value = ''
    deleteDialog.value = true
  }

  if (deleteDialog.value) {
    deleteConfirmation.value = ''
    toast.warning('Please confirm deletion by typing DELETE')
  }

  async function deleteUser () {
    if (deleteConfirmation.value !== 'DELETE') {
      toast.error('You must type DELETE to confirm.')
      return
    }

    const result = await peopleStore.deletePerson(userToDelete.value.id)
    if (result.success) {
      toast.success('User deleted successfully!')
      deleteDialog.value = false
      userToDelete.value = null
      await fetchData()
    } else {
      toast.error(result.error || 'Failed to delete user.')
    }
  }

  // Initialize
  onMounted(() => {
    fetchRoles()
    fetchData()
  })
</script>

<style scoped>
.toolbar-search {
  max-width: 480px;
  flex: 1 1 280px;
}
.toolbar-search :deep(.v-field) {
  background: rgb(var(--v-theme-surface)) !important;
  border-radius: 12px;
}
.toolbar-search :deep(.v-field__prepend-inner .v-icon) {
  color: rgb(var(--v-theme-primary));
  opacity: .7;
}
</style>
