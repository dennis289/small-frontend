<template>
  <v-container class="pa-6 pa-md-8" fluid>
    <PageHeader
      eyebrow="Configuration"
      italic="roles"
      subtitle="Define the roles your members can be assigned to during a service."
      title="Roster"
    >
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-shape-plus-outline" variant="flat" @click="openDialog">Add role</v-btn>
      </template>
    </PageHeader>

    <div class="toolbar-row mb-4 d-flex align-center flex-wrap" style="gap: 12px;">
      <v-text-field
        v-model="search"
        class="toolbar-search"
        clearable
        density="comfortable"
        hide-details
        placeholder="Search by role name"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
      />
      <v-spacer />
      <span class="text-caption text-medium-emphasis">{{ roles.length }} {{ roles.length === 1 ? 'role' : 'roles' }}</span>
    </div>

    <v-card class="overflow-hidden" rounded="lg" variant="outlined">
      <v-data-table
        density="comfortable"
        :headers="headers"
        hover
        :items="roles"
        :search="search"
      >
        <template #item.is_special_role="{ item }">
          <v-chip
            :color="item.is_special_role ? 'success' : 'default'"
            size="small"
            variant="tonal"
          >
            {{ item.is_special_role ? 'Yes' : 'No' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" @click="editRole(item)" />
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="confirmDelete(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card
        prepend-icon="mdi-briefcase-outline"
        :title="editingId ? 'Edit Role' : 'Add Role'"
      >
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                v-model="form.name"
                label="Role Name*"
                required
                :rules="[v => !!v || 'Role name is required']"
              />
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                v-model="form.description"
                label="Description"
              />
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-checkbox
                v-model="form.is_special_role"
                color="primary"
                label="Is Special Role"
              />
            </v-col>
            <v-col v-if="form.is_special_role" cols="12" md="4" sm="6">
              <v-text-field
                v-model.number="form.max_assignments"
                label="Max Assignments"
                min="1"
                type="number"
              />
            </v-col>
          </v-row>
          <small class="text-caption text-medium-emphasis">* indicates required fields</small>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-space-between px-4 py-3">
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveRole">
            {{ editingId ? 'Update' : 'Add' }} Role
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this role?
          <br>
          <strong>{{ roleToDelete?.name }}</strong>
          <br>
          This action cannot be undone.
        </v-card-text>
        <v-card-actions class="justify-end px-4 py-3">
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="deleteRole">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { onMounted, ref } from 'vue'
  import { toast } from 'vue-sonner'
  import { useRolesStore } from '@/stores/roles'

  const rolesStore = useRolesStore()

  // Reactive variables
  const dialog = ref(false)
  const deleteDialog = ref(false)
  const search = ref('')
  const editingId = ref(null)
  const roleToDelete = ref(null)
  const { roles } = storeToRefs(rolesStore)

  // Form data
  const form = ref({
    name: '',
    description: '',
    is_special_role: false,
    max_assignments: '1',
  })

  // Table headers
  const headers = [
    { title: 'Role Name', value: 'name' },
    { title: 'Description', value: 'description' },
    { title: 'Is Special Role', value: 'is_special_role', sortable: false },
    { title: 'Max Assignments', value: 'max_assignments' },
    { title: 'Actions', value: 'actions', sortable: false },
  ]

  // Functions
  async function fetchRoles () {
    const result = await rolesStore.fetchRoles()
    if (result.success) {
      toast.success('Roles fetched successfully')
    } else {
      toast.error(result.error || 'Failed to fetch roles')
    }
  }

  function openDialog () {
    editingId.value = null
    form.value = {
      name: '',
      description: '',
      is_special_role: false,
      max_assignments: '1',
    }
    dialog.value = true
  }

  function closeDialog () {
    dialog.value = false
    editingId.value = null
    form.value = {
      name: '',
      description: '',
      is_special_role: false,
      max_assignments: 1,
    }
  }

  function editRole (item) {
    form.value = {
      name: item.name,
      description: item.description,
      is_special_role: item.is_special_role,
      max_assignments: item.max_assignments || 1,
    }
    editingId.value = item.id
    dialog.value = true
  }

  async function saveRole () {
    let result
    if (editingId.value) {
      result = await rolesStore.updateRole(editingId.value, form.value)
      if (result.success) {
        toast.success('Role updated successfully!')
      } else {
        toast.error(result.error || 'Failed to save role.')
        return
      }
    } else {
      result = await rolesStore.createRole(form.value)
      if (result.success) {
        toast.success('Role added successfully!')
      } else {
        toast.error(result.error || 'Failed to save role.')
        return
      }
    }
    await fetchRoles()
    closeDialog()
  }

  function confirmDelete (item) {
    roleToDelete.value = item
    deleteDialog.value = true
  }

  async function deleteRole () {
    const result = await rolesStore.deleteRole(roleToDelete.value.id)
    if (result.success) {
      roles.value = roles.value.filter(role => role.id !== roleToDelete.value.id)
      toast.success('Role deleted successfully')
      deleteDialog.value = false
      roleToDelete.value = null
    } else {
      toast.error(result.error || 'Failed to delete role.')
    }
  }

  // Initialize
  onMounted(fetchRoles)
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
