<template>
  <v-navigation-drawer v-model="drawer" color="surface" permanent :rail="rail">
    <!-- User header -->
    <v-list-item
      class="py-4"
      :subtitle="!rail ? userData.email : undefined"
      :title="!rail ? fullName : undefined"
    >
      <template #prepend>
        <v-avatar color="primary" size="36">
          <span class="text-caption font-weight-bold">{{ initials }}</span>
        </v-avatar>
      </template>
      <template #append>
        <v-btn
          :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
          size="small"
          variant="text"
          @click="rail = !rail"
        />
      </template>
    </v-list-item>

    <v-divider />

    <v-list class="mt-2" density="compact" nav>
      <v-list-item
        v-for="item in navItems"
        :key="item.path"
        :active="route.path === item.path"
        base-color="primary"
        class="mb-1"
        :prepend-icon="item.icon"
        rounded="lg"
        :title="item.label"
        :value="item.path"
        @click="router.push(item.path)"
      />
    </v-list>

    <template #append>
      <v-divider />
      <v-list class="mb-2" density="compact" nav>
        <v-list-item
          prepend-icon="mdi-cog-outline"
          rounded="lg"
          title="Settings"
          value="settings"
          @click="openSettings"
        />
        <v-list-item
          prepend-icon="mdi-logout"
          rounded="lg"
          title="Logout"
          value="logout"
          @click="logout"
        />
      </v-list>
    </template>
  </v-navigation-drawer>

  <!-- Settings dialog -->
  <v-dialog v-model="settingsDialog" max-width="500">
    <v-card prepend-icon="mdi-cog-outline" title="Account Settings">
      <v-card-text>
        <v-row dense>
          <v-col cols="6">
            <v-text-field v-model="form.first_name" label="First Name" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.last_name" label="Last Name" />
          </v-col>
          <v-col cols="12">
            <v-text-field v-model="form.username" label="Username" />
          </v-col>
          <!-- <v-col cols="12">
            <v-text-field v-model="form.email" label="Email" />
          </v-col> -->
        </v-row>
        <v-divider class="my-3" />
        <p class="text-subtitle-2 mb-3">Theme</p>
        <v-btn-toggle
          v-model="themeStore.current"
          density="comfortable"
          class="ga-2"
          mandatory
          variant="outlined"
          @update:model-value="themeStore.setTheme($event)"
        >
          <v-btn prepend-icon="mdi-weather-sunny" text="Light" value="light" />
          <v-btn prepend-icon="mdi-weather-night" text="Dark" value="dark" />
        </v-btn-toggle>
        <v-divider class="my-3" />
        <p class="text-caption text-medium-emphasis mb-3">Change Password — leave blank to keep current</p>
        <v-row dense>
          <v-col cols="12">
            <v-text-field v-model="form.current_password" label="Current Password" type="password" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.new_password" label="New Password" type="password"  />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="form.confirm_password"
              :error-messages="passwordMismatch ? ['Passwords do not match'] : []"
              label="Confirm Password"
              type="password"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions class="justify-space-between px-4 py-3">
        <v-btn variant="text" @click="settingsDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          :disabled="passwordMismatch"
          :loading="saving"
          variant="flat"
          @click="saveSettings"
        >Save Changes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { toast } from 'vue-sonner'
  import { useThemeStore } from '@/stores/theme'
  import { useUserStore } from '@/stores/user'

  const userStore = useUserStore()
  const themeStore = useThemeStore()
  const router = useRouter()
  const route = useRoute()
  const drawer = ref(true)
  const rail = ref(true)
  const settingsDialog = ref(false)
  const saving = ref(false)

  const navItems = [
    { path: '/home', icon: 'mdi-home-outline', label: 'Home' },
    { path: '/people', icon: 'mdi-account-group-outline', label: 'People' },
    { path: '/roles', icon: 'mdi-briefcase-outline', label: 'Roles' },
    { path: '/events', icon: 'mdi-calendar-star-outline', label: 'Events' },
    { path: '/rosters', icon: 'mdi-sun-clock-outline', label: 'Rosters' },
    { path: '/feedback', icon: 'mdi-clipboard-check-outline', label: 'Feedback' },
    { path: '/streaks', icon: 'mdi-fire', label: 'Streaks' },
  ]

  const form = ref({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const userData = computed(() => userStore.profile || {})

  const initials = computed(() => {
    const u = userData.value
    return ((u.first_name?.[0] || u.username?.[0] || '?') + (u.last_name?.[0] || '')).toUpperCase()
  })

  const fullName = computed(() => {
    const u = userData.value
    return (u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.username || ''
  })

  const passwordMismatch = computed(() =>
    !!form.value.new_password && form.value.new_password !== form.value.confirm_password,
  )

  function openSettings () {
    const u = userData.value
    form.value = {
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      username: u.username || '',
      email: u.email || '',
      current_password: '',
      new_password: '',
      confirm_password: '',
    }
    settingsDialog.value = true
  }

  async function saveSettings () {
    const payload = {
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      username: form.value.username,
      email: form.value.email,
    }
    if (form.value.new_password) {
      payload.current_password = form.value.current_password
      payload.new_password = form.value.new_password
    }
    saving.value = true
    const result = await userStore.updateProfile(payload)
    saving.value = false
    if (result.success) {
      toast.success('Profile updated')
      settingsDialog.value = false
    } else {
      toast.error(result.error || 'Failed to update profile')
    }
  }

  function logout () {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_refresh')
    localStorage.removeItem('user')
    router.push('/login')
  }

  onMounted(() => userStore.fetchProfile())
</script>
