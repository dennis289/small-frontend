<template>
  <v-container class="pa-6 pa-md-8" fluid>

    <PageHeader
      eyebrow="Setup"
      subtitle="Who can sign in, and what they're allowed to do."
      title="Users"
    >
      <template #actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus-outline"
          variant="flat"
          @click="openCreate"
        >Add user</v-btn>
      </template>
    </PageHeader>

    <StatTiles :tiles="statTiles" />

    <v-card class="overflow-hidden" rounded="lg" variant="outlined">
      <div class="table-toolbar pa-4">
        <v-text-field
          v-model="search"
          class="table-search"
          clearable
          density="comfortable"
          hide-details
          placeholder="Search users..."
          prepend-inner-icon="mdi-magnify"
        />
      </div>

      <v-data-table
        :headers="headers"
        :items="filteredUsers"
        :loading="loading"
        no-data-text="No users yet."
      >
        <template #item.username="{ item }">
          <div class="d-flex align-center py-1">
            <v-avatar class="row-avatar mr-3" size="38">
              <span class="text-caption font-weight-bold">{{ initials(item) }}</span>
            </v-avatar>

            <div class="min-w-0">
              <div class="row-title text-truncate">{{ fullName(item) || item.username }}</div>
              <div class="row-sub text-truncate">{{ item.email || item.username }}</div>
            </div>
          </div>
        </template>

        <template #item.role="{ item }">
          <v-chip :color="roleColor(item.role)" size="small" variant="tonal">
            {{ roleLabel(item.role) }}
          </v-chip>
        </template>

        <template #item.person_id="{ item }">
          <span v-if="item.person_id" class="text-body-2">{{ personName(item.person_id) }}</span>
          <span v-else class="text-caption text-medium-emphasis font-italic">Not linked</span>
        </template>

        <template #item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'warning'" size="x-small" variant="tonal">
            {{ item.is_active ? 'Active' : 'Disabled' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-pencil-outline"
            size="small"
            title="Edit"
            variant="text"
            @click="openEdit(item)"
          />

          <v-btn
            color="error"
            :disabled="item.id === currentUserId"
            icon="mdi-delete-outline"
            size="small"
            :title="item.id === currentUserId ? 'You cannot delete your own account' : 'Delete'"
            variant="text"
            @click="confirmDelete(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / edit dialog -->
    <v-dialog v-model="dialog" width="560">
      <v-card rounded="lg">
        <v-card-title class="pa-5">
          {{ editing ? 'Edit user' : 'Add user' }}
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-form ref="userForm" @submit.prevent="save">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model="form.username"
                  :disabled="editing"
                  :hint="editing ? 'Usernames cannot be changed here.' : ''"
                  :label="editing ? 'Username' : 'Username*'"
                  persistent-hint
                  :rules="editing ? [] : [rules.required('a username')]"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field v-model="form.first_name" label="First name" />
              </v-col>

              <v-col cols="6">
                <v-text-field v-model="form.last_name" label="Last name" />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="form.email"
                  label="Email"
                  :rules="[rules.email()]"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="form.password"
                  :hint="editing ? 'Leave blank to keep the current password.' : ''"
                  :label="editing ? 'Password' : 'Password*'"
                  persistent-hint
                  :rules="editing
                    ? [rules.minLength(8, 'The password')]
                    : [rules.required('a password'), rules.minLength(8, 'The password')]"
                  type="password"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="form.role"
                  item-title="label"
                  item-value="value"
                  :items="roleOptions"
                  label="Role*"
                  :rules="[rules.chooseOne('what this person may do')]"
                />

                <p class="text-caption text-medium-emphasis mt-1">{{ roleHint }}</p>
              </v-col>

              <v-col cols="12">
                <v-autocomplete
                  v-model="form.person_id"
                  clearable
                  hint="Links this login to a team member so their own assignments are highlighted on the schedule."
                  item-title="name"
                  item-value="id"
                  :items="linkablePeople"
                  label="Team member (optional)"
                  persistent-hint
                />
              </v-col>

              <v-col v-if="editing" cols="12">
                <v-switch
                  v-model="form.is_active"
                  color="primary"
                  :disabled="editingSelf"
                  hide-details
                  :label="form.is_active ? 'Active' : 'Disabled'"
                />

                <p v-if="editingSelf" class="text-caption text-medium-emphasis">
                  You cannot disable your own account.
                </p>
              </v-col>
            </v-row>
            <small class="text-caption text-medium-emphasis">Fields marked * are required</small>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="justify-space-between px-6 py-4">
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>

          <v-btn color="primary" :loading="saving" variant="flat" @click="save">
            {{ editing ? 'Save changes' : 'Create user' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation -->
    <v-dialog v-model="deleteDialog" width="440">
      <v-card rounded="lg">
        <v-card-title class="pa-5">Delete user</v-card-title>
        <v-divider />

        <v-card-text class="pa-6">
          Delete <strong>{{ deleteTarget?.username }}</strong>? They will no longer be able
          to sign in. Any team member record stays, only the login is removed.
        </v-card-text>

        <v-divider />

        <v-card-actions class="justify-space-between px-6 py-4">
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" variant="flat" @click="doDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
  /**
   * User management for a client admin — the tenant-level counterpart to the
   * platform admin's clients console.
   *
   * Talks to /api/users/, which is admin-gated and scoped to the caller's own
   * client. The backend refuses anything that would leave the client without an
   * active admin, so the 409s it returns are surfaced as toasts rather than being
   * pre-empted here — one source of truth for that rule, on the server.
   *
   * The optional team-member link is what makes a member's own rows highlight on
   * the schedule page; a person already linked to someone else isn't offered.
   */
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { toast } from 'vue-sonner'
  import api from '@/api'
  import { getStoredUser } from '@/session'
  import * as rules from '@/validation'
  import { readApiError, validateForm } from '@/validation'

  const users = ref([])
  const people = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const search = ref('')
  const dialog = ref(false)
  const userForm = ref(null)
  const deleteDialog = ref(false)
  const deleteTarget = ref(null)
  const editing = ref(null)

  const currentUserId = computed(() => getStoredUser()?.id ?? null)
  const editingSelf = computed(() => editing.value?.id === currentUserId.value)

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'scheduler', label: 'Scheduler' },
    { value: 'member', label: 'Member' },
  ]

  const ROLE_HINTS = {
    admin: 'Full access, including managing people, awards and these user accounts.',
    scheduler: 'Builds rosters and records attendance. Cannot change people, roles, events or awards.',
    member: 'Read-only. Sees the published schedule and nothing else.',
  }

  // Email moved into the identity cell under the name, which frees the width the
  // role and team-member columns actually need.
  const headers = [
    { title: 'User', key: 'username' },
    { title: 'Role', key: 'role' },
    { title: 'Team member', key: 'person_id', sortable: false },
    { title: 'Status', key: 'is_active' },
    { title: '', key: 'actions', sortable: false, align: 'end' },
  ]

  const statTiles = computed(() => {
    const all = users.value || []
    return [
      { label: 'Total accounts', value: all.length, icon: 'mdi-account-key-outline' },
      { label: 'Admins', value: all.filter(u => u.role === 'admin').length, icon: 'mdi-shield-account-outline' },
      { label: 'Schedulers', value: all.filter(u => u.role === 'scheduler').length, icon: 'mdi-calendar-edit-outline' },
      { label: 'Disabled', value: all.filter(u => !u.is_active).length, icon: 'mdi-account-off-outline' },
    ]
  })

  const form = ref(blankForm())

  function blankForm () {
    return {
      username: '', first_name: '', last_name: '', email: '',
      password: '', role: 'member', person_id: null, is_active: true,
    }
  }

  const roleHint = computed(() => ROLE_HINTS[form.value.role] || '')

  const filteredUsers = computed(() => {
    const term = (search.value || '').trim().toLowerCase()
    if (!term) {
      return users.value
    }
    return users.value.filter(u =>
      [u.username, u.email, u.first_name, u.last_name, u.role]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(term)),
    )
  })

  /** People without a login, plus the one already attached to the user being edited. */
  const linkablePeople = computed(() =>
    people.value.filter(p =>
      !p.linked_user_id || (editing.value && p.linked_user_id === editing.value.id),
    ),
  )

  function fullName (u) {
    return `${u.first_name || ''} ${u.last_name || ''}`.trim()
  }

  function initials (u) {
    return ((u.first_name?.[0] || u.username?.[0] || '?') + (u.last_name?.[0] || '')).toUpperCase()
  }

  function roleLabel (role) {
    return roleOptions.find(r => r.value === role)?.label || role
  }

  function roleColor (role) {
    return { admin: 'primary', scheduler: 'info', member: 'secondary' }[role] || 'secondary'
  }

  function personName (id) {
    const p = people.value.find(x => x.id === id)
    return p ? p.name : `#${id}`
  }

  async function fetchUsers () {
    loading.value = true
    try {
      const res = await api.get('/api/users/')
      users.value = res.data
    } catch (error) {
      toast.error(readApiError(error, 'Could not load users.'))
    } finally {
      loading.value = false
    }
  }

  async function fetchPeople () {
    try {
      const res = await api.get('/api/persons/active/')
      people.value = res.data
    } catch {
      // Not fatal — the link picker just stays empty.
      people.value = []
    }
  }

  function openCreate () {
    editing.value = null
    form.value = blankForm()
    dialog.value = true
    nextTick(() => userForm.value?.resetValidation())
  }

  function openEdit (user) {
    editing.value = user
    form.value = {
      username: user.username,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      password: '',
      role: user.role,
      person_id: user.person_id,
      is_active: user.is_active,
    }
    dialog.value = true
    nextTick(() => userForm.value?.resetValidation())
  }

  async function save () {
    if (!await validateForm(userForm)) {
      return
    }
    saving.value = true
    try {
      const payload = {
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        email: form.value.email,
        role: form.value.role,
        person_id: form.value.person_id ?? null,
      }
      if (form.value.password) {
        payload.password = form.value.password
      }

      if (editing.value) {
        payload.is_active = form.value.is_active
        await api.patch(`/api/users/${editing.value.id}/`, payload)
        toast.success('User updated.')
      } else {
        payload.username = form.value.username
        await api.post('/api/users/', payload)
        toast.success('User created.')
      }
      dialog.value = false
      await Promise.all([fetchUsers(), fetchPeople()])
    } catch (error) {
      toast.error(readApiError(error, 'Could not save the user.'))
    } finally {
      saving.value = false
    }
  }

  function confirmDelete (user) {
    deleteTarget.value = user
    deleteDialog.value = true
  }

  async function doDelete () {
    deleting.value = true
    try {
      await api.delete(`/api/users/${deleteTarget.value.id}/`)
      toast.success('User deleted.')
      deleteDialog.value = false
      await Promise.all([fetchUsers(), fetchPeople()])
    } catch (error) {
      toast.error(readApiError(error, 'Could not delete the user.'))
    } finally {
      deleting.value = false
    }
  }

  onMounted(() => {
    fetchUsers()
    fetchPeople()
  })
</script>
