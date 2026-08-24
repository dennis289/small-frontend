<template>
  <v-container class="pa-6 pa-md-8" fluid>
    <PageHeader
      eyebrow="Setup"
      subtitle="Define the roles your members can be assigned to, and the order they appear in on the roster."
      title="Roles"
    >
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-shape-plus-outline" variant="flat" @click="openDialog">Add role</v-btn>
      </template>
    </PageHeader>

    <StatTiles :tiles="statTiles" />

    <!-- Ordering is only meaningful against the full, unfiltered list: dropping a
         row between two filtered neighbours would land it somewhere the admin
         can't see. So search disables dragging rather than reordering blindly. -->
    <v-alert
      v-if="search"
      class="mb-4"
      density="compact"
      icon="mdi-information-outline"
      rounded="lg"
      type="info"
      variant="tonal"
    >
      Clear the search to drag roles into a new order.
    </v-alert>

    <v-card class="overflow-hidden" rounded="lg" variant="outlined">
      <div class="table-toolbar pa-4">
        <v-text-field
          v-model="search"
          class="table-search"
          clearable
          density="comfortable"
          hide-details
          placeholder="Search roles..."
          prepend-inner-icon="mdi-magnify"
        />
      </div>

      <!-- Column headings, mirrored by the grid in each row below. -->
      <div class="role-row role-row--head px-4 py-3">
        <span />
        <span class="role-head-cell">Role</span>
        <span class="role-head-cell">Type</span>
        <span class="role-head-cell text-center">Max</span>
        <span class="role-head-cell text-center">Active</span>
        <span />
      </div>

      <v-divider />

      <div v-if="filteredRoles.length === 0" class="pa-10 text-center">
        <v-icon class="mb-3" color="primary" size="40" style="opacity:.4;">mdi-shape-outline</v-icon>
        <p class="text-body-2 text-medium-emphasis">
          {{ search ? 'No roles match that search.' : 'No roles yet — add one to get started.' }}
        </p>
      </div>

      <template v-for="(role, index) in filteredRoles" v-else :key="role.id">
        <v-divider v-if="index" />
        <div
          class="role-row px-4 py-3"
          :class="{ 'role-row--inactive': !role.is_active }"
          v-bind="drag.rowProps(index)"
        >
          <v-icon
            class="drag-handle"
            :class="{ 'drag-handle--off': !!search }"
            size="18"
            :title="search ? 'Clear the search to reorder' : 'Drag to reorder'"
          >mdi-drag-horizontal-variant</v-icon>

          <div class="min-w-0">
            <div class="text-body-2 font-weight-medium text-truncate">{{ role.name }}</div>
            <div v-if="role.description" class="text-caption text-medium-emphasis text-truncate">
              {{ role.description }}
            </div>
          </div>

          <div>
            <v-chip
              :color="role.is_special_role ? 'warning' : 'primary'"
              size="small"
              variant="tonal"
            >{{ role.is_special_role ? 'Special' : 'Standard' }}</v-chip>
          </div>

          <div class="text-center text-body-2 text-medium-emphasis">
            {{ role.is_special_role ? role.max_assignments : '—' }}
          </div>

          <div class="text-center">
            <v-switch
              color="success"
              density="compact"
              hide-details
              :model-value="role.is_active"
              :title="role.is_active ? 'Included when generating rosters' : 'Skipped when generating rosters'"
              @update:model-value="value => toggleActive(role, value)"
            />
          </div>

          <div class="text-right text-no-wrap">
            <v-btn icon="mdi-pencil" size="small" variant="text" @click="editRole(role)" />
            <v-btn
              color="error"
              icon="mdi-delete"
              size="small"
              variant="text"
              @click="confirmDelete(role)"
            />
          </div>
        </div>
      </template>
    </v-card>

    <p class="text-caption text-medium-emphasis mt-3">
      <v-icon size="14">mdi-information-outline</v-icon>
      This order is what new rosters and their PDFs come out in. Inactive roles are
      skipped when generating, but stay on rosters already saved.
    </p>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600" persistent>
      <v-card
        prepend-icon="mdi-briefcase-outline"
        :title="editingId ? 'Edit Role' : 'Add Role'"
      >
        <v-card-text>
          <v-form ref="roleForm" @submit.prevent="saveRole">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.name"
                  label="Role name*"
                  :rules="[rules.required('a role name')]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.description"
                  label="Description"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-checkbox
                  v-model="form.is_special_role"
                  color="primary"
                  hide-details
                  label="Is Special Role"
                />
              </v-col>
              <v-col v-if="form.is_special_role" cols="12" sm="6">
                <v-text-field
                  v-model.number="form.max_assignments"
                  hint="How many people this role can take on one date"
                  label="Most people at once*"
                  min="1"
                  :rules="[
                    rules.required('how many people this role can take'),
                    rules.wholeNumberAtLeast(1, 'This'),
                  ]"
                  type="number"
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="form.is_active"
                  color="success"
                  density="compact"
                  hide-details
                  :label="form.is_active
                    ? 'Active — included when generating rosters'
                    : 'Inactive — skipped when generating rosters'"
                />
              </v-col>
            </v-row>
            <small class="text-caption text-medium-emphasis">Fields marked * are required</small>
          </v-form>
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
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
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
  /**
   * Roles page — CRUD for the jobs people can be assigned to, plus the two
   * properties that decide how a role behaves on a roster.
   *
   * `is_special_role` decides how the generator fills the role: normal roles once per
   * event, special roles once per day across all events. `max_assignments` only
   * applies to special roles.
   *
   * `is_active` takes a role out of future generation runs. Rosters already saved
   * keep it, so old PDFs still reproduce.
   *
   * Row order *is* the data: dragging writes `display_order` back to the server,
   * and that ordering is what rosters and their exported PDFs come out in. The
   * list renders straight from the store rather than a v-data-table, because a
   * sortable table would let the visible order disagree with the stored one.
   *
   * Deleting a role removes every historical assignment that used it, which also
   * erases that role's rotation history.
   */
  import { storeToRefs } from 'pinia'
  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { toast } from 'vue-sonner'
  import { moveItem, useDragOrder } from '@/composables/useDragOrder'
  import { useRolesStore } from '@/stores/roles'
  import * as rules from '@/validation'
  import { validateForm } from '@/validation'

  const rolesStore = useRolesStore()

  // Reactive variables
  const dialog = ref(false)
  const roleForm = ref(null)
  const deleteDialog = ref(false)
  const search = ref('')
  const editingId = ref(null)
  const roleToDelete = ref(null)
  const { roles } = storeToRefs(rolesStore)

  function blankForm () {
    return {
      name: '',
      description: '',
      is_special_role: false,
      max_assignments: 1,
      is_active: true,
    }
  }

  const form = ref(blankForm())

  const filteredRoles = computed(() => {
    const term = (search.value || '').trim().toLowerCase()
    if (!term) return roles.value
    return roles.value.filter(r =>
      `${r.name} ${r.description || ''}`.toLowerCase().includes(term),
    )
  })

  const inactiveCount = computed(() => roles.value.filter(r => !r.is_active).length)

  const statTiles = computed(() => [
    { label: 'Total roles', value: roles.value.length, icon: 'mdi-briefcase-outline' },
    { label: 'Standard', value: roles.value.filter(r => !r.is_special_role).length, icon: 'mdi-account-outline' },
    { label: 'Special', value: roles.value.filter(r => r.is_special_role).length, icon: 'mdi-star-outline' },
    { label: 'Inactive', value: inactiveCount.value, icon: 'mdi-eye-off-outline' },
  ])

  // Dragging is only offered on the unfiltered list — see the alert in the template.
  const drag = useDragOrder(async (from, to) => {
    moveItem(roles.value, from, to)
    const result = await rolesStore.reorderRoles(roles.value.map(r => r.id))
    if (result.success) {
      toast.success('Role order saved.')
    } else {
      toast.error(result.error)
      // The server rejected it, so re-read rather than leaving the page showing an
      // order that was never stored.
      await rolesStore.fetchRoles()
    }
  })

  watch(search, term => {
    drag.enabled.value = !term
    drag.reset()
  })

  // Functions
  async function fetchRoles () {
    const result = await rolesStore.fetchRoles()
    if (!result.success) {
      toast.error(result.error || 'Failed to fetch roles')
    }
  }

  function openDialog () {
    editingId.value = null
    form.value = blankForm()
    dialog.value = true
    nextTick(() => roleForm.value?.resetValidation())
  }

  function closeDialog () {
    dialog.value = false
    editingId.value = null
    form.value = blankForm()
    roleForm.value?.resetValidation()
  }

  function editRole (item) {
    form.value = {
      name: item.name,
      description: item.description,
      is_special_role: item.is_special_role,
      max_assignments: item.max_assignments || 1,
      is_active: item.is_active,
    }
    editingId.value = item.id
    dialog.value = true
    nextTick(() => roleForm.value?.resetValidation())
  }

  /** Flip the active flag straight from the row, without opening the dialog. */
  async function toggleActive (role, value) {
    const previous = role.is_active
    role.is_active = value
    const result = await rolesStore.updateRole(role.id, { ...role, is_active: value })
    if (result.success) {
      toast.success(`${role.name} ${value ? 'will be included in' : 'will be skipped when generating'} new rosters.`)
    } else {
      role.is_active = previous
      toast.error(result.error || 'Failed to update role.')
    }
  }

  async function saveRole () {
    if (!await validateForm(roleForm)) {
      return
    }
    const result = editingId.value
      ? await rolesStore.updateRole(editingId.value, form.value)
      : await rolesStore.createRole(form.value)

    if (!result.success) {
      toast.error(result.error || 'Failed to save role.')
      return
    }
    toast.success(editingId.value ? 'Role updated successfully!' : 'Role added successfully!')
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

/* One grid definition shared by the header and every row, so the columns line up
   without a table element. */
.role-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 120px 70px 90px 100px;
  align-items: center;
  gap: 12px;
  transition: background-color .15s ease;
}
.role-row--head {
  background: rgb(var(--v-theme-surface-variant));
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}
/* Matches the sentence-case grey headers the data tables use, so this
   hand-built list reads as the same component as the rest. */
.role-head-cell {
  font-size: .8125rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
}
.role-row:not(.role-row--head):hover {
  background: rgba(var(--v-theme-primary), 0.04);
}
.role-row--inactive {
  opacity: .55;
}
.min-w-0 {
  min-width: 0;
}

.drag-handle {
  cursor: grab;
  opacity: .45;
}
.drag-handle--off {
  cursor: not-allowed;
  opacity: .18;
}

/* Drag feedback, driven by the classes useDragOrder puts on each row. */
.drag-row--dragging {
  opacity: .4;
}
.drag-row--over {
  background: rgba(var(--v-theme-primary), 0.10) !important;
  box-shadow: inset 0 2px 0 0 rgb(var(--v-theme-primary));
}

/* Stack into a readable single column on small screens, where a 6-column grid
   would squeeze the name to nothing. */
@media (max-width: 700px) {
  .role-row {
    grid-template-columns: 28px minmax(0, 1fr) auto;
  }
  .role-row--head {
    display: none;
  }
}
</style>
