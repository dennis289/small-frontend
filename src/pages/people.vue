<template>
  <v-container class="pa-6 pa-md-8" fluid>
    <PageHeader
      eyebrow="Setup"
      subtitle="Manage the people on your roster — roles, contact details, and access."
      title="People"
    >
      <template #actions>
        <v-btn prepend-icon="mdi-upload" variant="outlined" @click="bulkUploadDialog = true">Bulk upload</v-btn>
        <v-btn color="primary" prepend-icon="mdi-account-plus" variant="flat" @click="openDialog">Add person</v-btn>
      </template>
    </PageHeader>

    <StatTiles :tiles="statTiles" />

    <!-- Status tabs filter the rows currently loaded, so their counts deliberately
         describe this page. The tiles above carry the whole-directory numbers. -->
    <div class="filter-tabs d-flex align-center flex-wrap mb-4">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ 'filter-tab--active': statusFilter === tab.value }"
        type="button"
        @click="statusFilter = tab.value"
      >
        <span>{{ tab.label }}</span>
        <span class="filter-tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <v-card class="overflow-hidden" rounded="lg" variant="outlined">
      <div class="table-toolbar pa-4">
        <v-text-field
          v-model="search"
          class="table-search"
          clearable
          density="comfortable"
          hide-details
          placeholder="Search people..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @input="onSearch"
        />
      </div>

      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        density="comfortable"
        :headers="headers"
        hover
        :items="visibleItems"
        :items-length="totalItems"
        :loading="loading"
        @update:options="loadItems"
      >
        <!-- Identity cell: avatar, name, and the email beneath it, so the row
             leads with who the person is rather than a column of raw fields. -->
        <template #item.person="{ item }">
          <div class="d-flex align-center py-1">
            <v-avatar class="row-avatar mr-3" size="38">
              <span class="text-caption font-weight-bold">{{ initialsFor(item) }}</span>
            </v-avatar>
            <div class="min-w-0">
              <div class="row-title text-truncate">{{ item.first_name }} {{ item.last_name }}</div>
              <div class="row-sub text-truncate">{{ item.email || '—' }}</div>
            </div>
          </div>
        </template>

        <template #item.phone_number="{ item }">
          <span :class="{ 'text-medium-emphasis': !item.phone_number }">
            {{ item.phone_number || '—' }}
          </span>
        </template>

        <template #item.role_names="{ item }">
          <div v-if="item.role_names && item.role_names.length > 0" class="d-flex flex-wrap" style="gap: 4px;">
            <v-chip
              v-for="roleName in item.role_names.slice(0, 2)"
              :key="roleName"
              size="x-small"
              variant="tonal"
            >{{ roleName }}</v-chip>
            <v-chip
              v-if="item.role_names.length > 2"
              size="x-small"
              :title="item.role_names.join(', ')"
              variant="tonal"
            >+{{ item.role_names.length - 2 }}</v-chip>
          </div>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="statusFor(item).color" size="small" variant="tonal">
            {{ statusFor(item).label }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="text-right text-no-wrap">
            <v-btn icon="mdi-pencil" size="small" variant="text" @click="editUser(item)" />
            <v-btn
              color="error"
              icon="mdi-delete"
              size="small"
              variant="text"
              @click="confirmDelete(item)"
            />
          </div>
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
          <v-form ref="personForm" @submit.prevent="saveUser">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.first_name"
                  label="First name*"
                  :rules="[rules.required('a first name')]"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.last_name"
                  label="Last name*"
                  :rules="[rules.required('a last name')]"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.email"
                  label="Email*"
                  :rules="[rules.required('an email address'), rules.email()]"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.phone_number"
                  label="Phone*"
                  :rules="[rules.required('a phone number'), rules.phone()]"
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
                  label="Roles*"
                  multiple
                  :rules="[rules.atLeastOne('role')]"
                >
                  <template #selection="{item, index}">
                    <v-chip v-if="index < 3" :key="index" small :text="item.title" />
                    <span v-else-if="index === 3" class="grey--text text--darken-1">+{{ form.roles.length - 3 }} more</span>
                  </template>
                </v-autocomplete>
              </v-col>
            </v-row>
            <small class="text-caption text-medium-emphasis">Fields marked * are required</small>
          </v-form>
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
          <v-form ref="deleteForm" @submit.prevent="deleteUser">
            <v-text-field
              v-model="deleteConfirmation"
              class="mt-3"
              label="Type DELETE to confirm"
              :rules="[rules.mustType('DELETE')]"
            />
          </v-form>
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
          <v-form ref="bulkForm" @submit.prevent="submitBulkUpload">
            <v-file-input
              v-model="csvFile"
              accept=".csv"
              density="comfortable"
              label="CSV file*"
              prepend-icon="mdi-file-upload"
              :rules="[rules.fileChosen('a CSV file to upload')]"
            />
          </v-form>
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
  /**
   * People page — the member roster (CRUD + CSV import).
   *
   * Paginated, searchable table backed by the people store. Each member carries the
   * flags the generator reads: `roles` (what they can do), `is_producer` /
   * `is_assistant_producer` (leadership eligibility), `is_active` (still on the team)
   * and `is_present` (available to be scheduled).
   *
   * CSV import is parsed client-side with PapaParse and posted as JSON; unknown role
   * names in the file are auto-created on the backend.
   */
  import Papa from 'papaparse'
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { toast } from 'vue-sonner'
  import { usePeopleStore } from '@/stores/people'
  import { useRolesStore } from '@/stores/roles'
  import * as rules from '@/validation'
  import { validateForm } from '@/validation'

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
  // Form refs, so each dialog can be validated before it submits and cleared of
  // stale errors when it reopens.
  const personForm = ref(null)
  const bulkForm = ref(null)
  const deleteForm = ref(null)
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

  // Table headers. Name and email are one identity cell rather than two columns,
  // which is what buys the room for roles and status to be readable.
  const headers = [
    { title: 'Name', value: 'person', sortable: false },
    { title: 'Phone', value: 'phone_number' },
    { title: 'Roles', value: 'role_names', sortable: false },
    { title: 'Status', value: 'status', sortable: false },
    { title: '', value: 'actions', sortable: false, align: 'end' },
  ]

  // Which slice of the loaded page is on screen. Filtering is client-side and so
  // applies to the current page only; the tab counts are page counts to match, and
  // the whole-directory numbers live in the tiles above.
  const statusFilter = ref('all')

  const visibleItems = computed(() => {
    if (statusFilter.value === 'all') return serverItems.value
    return serverItems.value.filter(person => statusKey(person) === statusFilter.value)
  })

  /**
   * Which tab a person belongs under, in precedence order. This is a grouping for
   * the filter strip only — it deliberately mixes standing (`is_active`) with
   * seniority (`is_producer` / `is_assistant_producer`), because that is the cut
   * the tabs offer. The Status column uses `statusFor` instead, which reports
   * standing alone.
   */
  function statusKey (person) {
    if (!person.is_active) return 'inactive'
    if (person.is_producer) return 'producer'
    if (person.is_assistant_producer) return 'assistant'
    return 'member'
  }

  /**
   * The Status column answers one question — is this person still on the team? A
   * producer who has left is Inactive, and an ordinary member who hasn't is
   * Active; seniority is already shown by the Roles column and the tabs above.
   */
  const STATUS_STYLES = {
    active: { label: 'Active', color: 'success' },
    inactive: { label: 'Inactive', color: 'error' },
  }

  function statusFor (person) {
    return person.is_active ? STATUS_STYLES.active : STATUS_STYLES.inactive
  }

  function countBy (key) {
    return serverItems.value.filter(person => statusKey(person) === key).length
  }

  const statusTabs = computed(() => [
    { value: 'all', label: 'All', count: serverItems.value.length },
    { value: 'producer', label: 'Producers', count: countBy('producer') },
    { value: 'assistant', label: 'Assistants', count: countBy('assistant') },
    { value: 'member', label: 'Members', count: countBy('member') },
    { value: 'inactive', label: 'Inactive', count: countBy('inactive') },
  ])

  // Tallies for the whole (filtered) directory, from the server. The page in front
  // of you can't produce these honestly — ten rows say nothing about thirty-nine.
  const directoryCounts = computed(() => peopleStore.personCounts || {})

  const statTiles = computed(() => [
    { label: 'Total people', value: directoryCounts.value.total ?? totalItems.value, icon: 'mdi-account-group-outline' },
    { label: 'Producers', value: directoryCounts.value.producers ?? '—', icon: 'mdi-account-star-outline' },
    { label: 'Assistants', value: directoryCounts.value.assistants ?? '—', icon: 'mdi-account-tie-outline' },
    { label: 'Inactive', value: directoryCounts.value.inactive ?? '—', icon: 'mdi-account-off-outline' },
  ])

  function initialsFor (person) {
    return ((person.first_name?.[0] || '?') + (person.last_name?.[0] || '')).toUpperCase()
  }

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
    // A reopened dialog still holds the errors from last time it was cancelled;
    // clearing after the fields render means a blank form looks blank.
    nextTick(() => personForm.value?.resetValidation())
  }

  function closeDialog () {
    dialog.value = false
    editingId.value = null
    bulkUploadDialog.value = false
    csvFile.value = null
    personForm.value?.resetValidation()
    bulkForm.value?.resetValidation()
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
    nextTick(() => personForm.value?.resetValidation())
  }

  async function saveUser () {
    // Without this the rules only ever fire on blur, so pressing Add on an
    // untouched form posted an empty person and surfaced whatever the server
    // said about it.
    if (!await validateForm(personForm)) {
      return
    }
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
    if (!await validateForm(bulkForm)) {
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
    nextTick(() => deleteForm.value?.resetValidation())
  }

  async function deleteUser () {
    // The rule on the field says what's wrong and where, so there's no toast here.
    if (!await validateForm(deleteForm)) {
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
