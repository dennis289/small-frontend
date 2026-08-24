<template>
  <v-container class="pa-6 pa-md-8" fluid>

    <PageHeader
      eyebrow="Platform"
      subtitle="Create and manage the organisations using this platform. Each client's data is fully separated."
      title="Clients"
    />

    <!-- Toolbar -->
    <div class="d-flex align-center flex-wrap ga-3 mb-5">
      <v-chip color="primary" size="small" variant="tonal">{{ clients.length }} {{ clients.length === 1 ? 'client' : 'clients' }}</v-chip>
      <v-chip v-if="activeCount !== clients.length" color="secondary" size="small" variant="tonal">{{ activeCount }} active</v-chip>
      <v-spacer />
      <v-btn
        :loading="loading"
        prepend-icon="mdi-refresh"
        size="small"
        variant="text"
        @click="fetchClients"
      >Refresh</v-btn>
      <v-btn
        color="primary"
        prepend-icon="mdi-domain-plus"
        variant="flat"
        @click="openCreate"
      >New client</v-btn>
    </div>

    <v-card class="overflow-hidden" rounded="lg" variant="outlined">
      <v-data-table
        density="comfortable"
        :headers="headers"
        :items="clients"
        :loading="loading"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-3">
            <v-avatar color="primary" rounded="lg" size="34">
              <span class="text-caption font-weight-bold text-white">{{ initials(item.name) }}</span>
            </v-avatar>
            <div>
              <p class="text-body-2 font-weight-semibold mb-0">{{ item.name }}</p>
              <p class="text-caption text-medium-emphasis">/{{ item.slug }}</p>
            </div>
          </div>
        </template>

        <template #item.person_count="{ item }">
          <span class="font-weight-medium">{{ item.person_count }}</span>
          <span class="text-caption text-medium-emphasis"> members</span>
        </template>

        <template #item.user_count="{ item }">
          <span class="font-weight-medium">{{ item.user_count }}</span>
          <span class="text-caption text-medium-emphasis"> logins</span>
        </template>

        <template #item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'error'" size="x-small" variant="tonal">
            {{ item.is_active ? 'Active' : 'Suspended' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end ga-1">
            <v-btn icon="mdi-account-key-outline" size="small" variant="text" @click="openUsers(item)" />
            <v-btn icon="mdi-pencil-outline" size="small" variant="text" @click="openEdit(item)" />
            <v-btn
              color="error"
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              @click="openDelete(item)"
            />
          </div>
        </template>

        <template #no-data>
          <div class="pa-8 text-center text-medium-emphasis">
            No clients yet. Create your first one with “New client”.
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create client dialog -->
    <v-dialog v-model="createDialog" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="font-serif">New client</v-card-title>
        <v-card-text>
          <v-form ref="createForm" @submit.prevent="createClient">
            <v-text-field
              v-model="form.name"
              class="mb-2"
              label="Organisation name*"
              :rules="[rules.required('the organisation name')]"
              variant="outlined"
            />
            <v-text-field
              v-model="form.slug"
              class="mb-4"
              hint="Optional — auto-generated from the name if left blank"
              label="Slug"
              persistent-hint
              variant="outlined"
            />

            <v-divider class="mb-4" />
            <p class="text-caption text-uppercase text-medium-emphasis mb-3" style="letter-spacing:.1em;">
              First admin login (optional)
            </p>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.admin.username"
                  label="Username"
                  :rules="[rules.requiredIf(() => !!form.admin.password, 'a username to go with this password')]"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.admin.password"
                  label="Password"
                  :rules="[
                    rules.requiredIf(() => !!form.admin.username, 'a password for this login'),
                    rules.minLength(8, 'The password'),
                  ]"
                  type="password"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="form.admin.email"
                  label="Email"
                  :rules="[rules.email()]"
                  variant="outlined"
                />
              </v-col>
            </v-row>
            <p class="text-caption text-medium-emphasis">
              Leave all three blank to create the client on its own — you can add or
              change logins later from the client's “Manage logins”.
            </p>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn :disabled="saving" variant="text" @click="createDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" variant="flat" @click="createClient">Create client</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit client dialog -->
    <v-dialog v-model="editDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="font-serif">Edit client</v-card-title>
        <v-card-text>
          <v-text-field v-model="editForm.name" class="mb-3" label="Organisation name" variant="outlined" />
          <v-text-field v-model="editForm.slug" class="mb-3" label="Slug" variant="outlined" />
          <v-switch
            v-model="editForm.is_active"
            color="success"
            hide-details
            inset
            :label="editForm.is_active ? 'Active' : 'Suspended'"
          />
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn :disabled="saving" variant="text" @click="editDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" variant="flat" @click="saveEdit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Manage logins dialog -->
    <v-dialog v-model="usersDialog" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="font-serif">Logins — {{ activeClient?.name }}</v-card-title>
        <v-card-text>
          <v-list v-if="clientUsers.length > 0" class="mb-3" density="compact">
            <v-list-item v-for="u in clientUsers" :key="u.id" :subtitle="u.email || '—'" :title="u.username">
              <template #prepend>
                <v-avatar color="secondary" size="32">
                  <span class="text-caption font-weight-bold text-white">{{ initials(u.username) }}</span>
                </v-avatar>
              </template>
            </v-list-item>
          </v-list>
          <p v-else class="text-caption text-medium-emphasis mb-3">No logins yet for this client.</p>

          <v-divider class="mb-3" />
          <p class="text-caption text-uppercase text-medium-emphasis mb-2" style="letter-spacing:.1em;">Add a login</p>
          <v-form ref="newUserForm" @submit.prevent="addUser">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newUser.username"
                  density="compact"
                  label="Username*"
                  :rules="[rules.required('a username')]"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="newUser.password"
                  density="compact"
                  label="Password*"
                  :rules="[rules.required('a password'), rules.minLength(8, 'The password')]"
                  type="password"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="newUser.email"
                  density="compact"
                  label="Email"
                  :rules="[rules.email()]"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="usersDialog = false">Close</v-btn>
          <v-btn color="primary" :loading="saving" variant="flat" @click="addUser">Add login</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card rounded="lg">
        <v-card-title class="font-serif">Delete client?</v-card-title>
        <v-card-text>
          <p class="text-body-2">
            This permanently deletes <strong>{{ activeClient?.name }}</strong> and
            <strong>all its data</strong> — members, rosters, feedback, awards and logins.
            This cannot be undone.
          </p>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn :disabled="saving" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="saving" variant="flat" @click="deleteClient">Delete permanently</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
  /**
   * Clients console — platform superadmin only (guarded by `meta.platformAdmin`).
   *
   * Creates and manages tenants and their login accounts. Superadmins have
   * `client=None` and therefore see no roster data anywhere else in the app; this is
   * their only page.
   *
   * Deleting a client cascades to every row that tenant owns and is irreversible.
   */
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { toast } from 'vue-sonner'
  import * as rules from '@/validation'
  import { readApiError, validateForm } from '@/validation'
  import api from '../api'

  const clients = ref([])
  const loading = ref(false)
  const saving = ref(false)

  const headers = [
    { title: 'Client', key: 'name', sortable: true },
    { title: 'Members', key: 'person_count', sortable: true },
    { title: 'Logins', key: 'user_count', sortable: true },
    { title: 'Status', key: 'is_active', sortable: true },
    { title: '', key: 'actions', sortable: false, align: 'end' },
  ]

  const activeCount = computed(() => clients.value.filter(c => c.is_active).length)

  const createDialog = ref(false)
  const editDialog = ref(false)
  const usersDialog = ref(false)
  const deleteDialog = ref(false)
  const activeClient = ref(null)

  const form = ref({ name: '', slug: '', admin: { username: '', password: '', email: '' } })
  const editForm = ref({ name: '', slug: '', is_active: true })
  const clientUsers = ref([])
  const newUser = ref({ username: '', password: '', email: '' })
  const createForm = ref(null)
  const newUserForm = ref(null)

  function initials (s) {
    return (s || '').split(/[\s_]+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
  }

  onMounted(fetchClients)

  async function fetchClients () {
    loading.value = true
    try {
      const res = await api.get('/api/admin/clients/')
      clients.value = res.data
    } catch (error) {
      toast.error(readApiError(error, 'Failed to load clients'))
    } finally {
      loading.value = false
    }
  }

  function openCreate () {
    form.value = { name: '', slug: '', admin: { username: '', password: '', email: '' } }
    createDialog.value = true
    nextTick(() => createForm.value?.resetValidation())
  }

  async function createClient () {
    if (!await validateForm(createForm)) {
      return
    }
    const payload = { name: form.value.name.trim(), slug: form.value.slug.trim() }
    if (form.value.admin.username.trim()) {
      payload.admin = { ...form.value.admin, username: form.value.admin.username.trim() }
    }
    saving.value = true
    try {
      await api.post('/api/admin/clients/', payload)
      toast.success('Client created')
      createDialog.value = false
      await fetchClients()
    } catch (error) {
      toast.error(readApiError(error, 'Failed to create client'))
    } finally {
      saving.value = false
    }
  }

  function openEdit (client) {
    activeClient.value = client
    editForm.value = { name: client.name, slug: client.slug, is_active: client.is_active }
    editDialog.value = true
  }

  async function saveEdit () {
    saving.value = true
    try {
      await api.patch(`/api/admin/clients/${activeClient.value.id}/`, editForm.value)
      toast.success('Client updated')
      editDialog.value = false
      await fetchClients()
    } catch (error) {
      toast.error(readApiError(error, 'Failed to update client'))
    } finally {
      saving.value = false
    }
  }

  async function openUsers (client) {
    activeClient.value = client
    clientUsers.value = []
    newUser.value = { username: '', password: '', email: '' }
    usersDialog.value = true
    nextTick(() => newUserForm.value?.resetValidation())
    try {
      const res = await api.get(`/api/admin/clients/${client.id}/users/`)
      clientUsers.value = res.data
    } catch {
      toast.error('Failed to load logins')
    }
  }

  async function addUser () {
    if (!await validateForm(newUserForm)) {
      return
    }
    saving.value = true
    try {
      await api.post(`/api/admin/clients/${activeClient.value.id}/users/`, {
        ...newUser.value,
        username: newUser.value.username.trim(),
      })
      toast.success('Login added')
      newUser.value = { username: '', password: '', email: '' }
      nextTick(() => newUserForm.value?.resetValidation())
      const res = await api.get(`/api/admin/clients/${activeClient.value.id}/users/`)
      clientUsers.value = res.data
      await fetchClients()
    } catch (error) {
      toast.error(readApiError(error, 'Failed to add login'))
    } finally {
      saving.value = false
    }
  }

  function openDelete (client) {
    activeClient.value = client
    deleteDialog.value = true
  }

  async function deleteClient () {
    saving.value = true
    try {
      await api.delete(`/api/admin/clients/${activeClient.value.id}/`)
      toast.success('Client deleted')
      deleteDialog.value = false
      await fetchClients()
    } catch (error) {
      toast.error(readApiError(error, 'Failed to delete client'))
    } finally {
      saving.value = false
    }
  }
</script>
