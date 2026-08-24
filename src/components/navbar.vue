<template>
  <v-navigation-drawer v-model="drawer" permanent :rail="rail" width="272">
    <!-- User block: avatar, name, email, and the menu that used to be a row of
         icons at the bottom of the drawer. -->
    <div :class="['user-block', rail ? 'py-2 px-1' : 'pa-3']">
      <!-- The menu used to be `:disabled="rail"`, which left the avatar looking
           clickable but doing nothing once collapsed. It opens in both states now;
           in rail it anchors to the right so it clears the narrow drawer. -->
      <v-menu :location="rail ? 'right' : 'bottom end'" :offset="rail ? 8 : 0">
        <template #activator="{ props: menuProps }">
          <div
            v-bind="menuProps"
            :class="['user-row d-flex align-center', rail ? 'justify-center pa-1' : 'pa-2']"
            role="button"
            :title="rail ? fullName : undefined"
          >
            <v-avatar class="user-avatar" :size="rail ? 36 : 40">
              <span class="text-body-2 font-weight-bold">{{ initials }}</span>
            </v-avatar>
            <div v-if="!rail" class="ml-3 min-w-0 flex-grow-1">
              <p class="user-name text-truncate">{{ fullName }}</p>
              <p class="user-email text-truncate">{{ roleLabel || userData.email }}</p>
            </div>
            <v-icon v-if="!rail" class="user-chevron" size="18">mdi-chevron-down</v-icon>
          </div>
        </template>

        <v-list density="compact" nav>
          <v-list-item prepend-icon="mdi-cog-outline" title="Settings" @click="openSettings" />
          <v-list-item prepend-icon="mdi-logout" title="Log out" @click="logout" />
        </v-list>
      </v-menu>
    </div>

    <!-- Grouped nav. Sections give the eye somewhere to rest in a ten-item list,
         and match how the app is actually organised: daily work, then the setup
         data behind it. -->
    <div :class="['nav-scroll pb-3', rail ? 'px-1' : 'px-3']">
      <template v-for="group in navGroups" :key="group.label">
        <p v-if="group.items.length > 0" class="nav-group-label">
          {{ rail ? '' : group.label }}
        </p>
        <v-list class="pa-0" density="comfortable" nav>
          <v-list-item
            v-for="item in group.items"
            :key="item.path"
            :active="route.path === item.path"
            class="nav-item mb-1"
            :class="{ 'nav-item--rail': rail }"
            :prepend-icon="item.icon"
            rounded="lg"
            :title="rail ? undefined : item.label"
            :value="item.path"
            @click="router.push(item.path)"
          >
            <!-- In rail the label is gone, so the icon is the only affordance —
                 a tooltip keeps it identifiable. -->
            <v-tooltip v-if="rail" activator="parent" location="right">{{ item.label }}</v-tooltip>
          </v-list-item>
        </v-list>
      </template>
    </div>

    <template #append>
      <div :class="rail ? 'pa-2' : 'pa-3'">
        <v-btn
          v-if="rail"
          class="mx-auto d-block"
          icon="mdi-chevron-right"
          size="small"
          title="Expand"
          variant="outlined"
          @click="rail = false"
        />
        <v-btn
          v-else
          block
          prepend-icon="mdi-chevron-left"
          size="small"
          variant="outlined"
          @click="rail = true"
        >Collapse</v-btn>
      </div>
    </template>
  </v-navigation-drawer>

  <!-- Settings dialog -->
  <v-dialog v-model="settingsDialog" max-width="500">
    <v-card prepend-icon="mdi-cog-outline" title="Account Settings">
      <v-card-text>
        <v-form ref="settingsForm" @submit.prevent="saveSettings">
          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model="form.first_name"
                label="First name*"
                :rules="[rules.required('your first name')]"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.last_name"
                label="Last name*"
                :rules="[rules.required('your last name')]"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.username"
                label="Username*"
                :rules="[rules.required('a username')]"
              />
            </v-col>
          <!-- <v-col cols="12">
            <v-text-field v-model="form.email" label="Email" />
          </v-col> -->
          </v-row>
          <v-divider class="my-3" />
          <p class="text-subtitle-2 mb-3">Theme</p>
          <v-btn-toggle
            v-model="themeStore.current"
            class="ga-2"
            density="comfortable"
            mandatory
            variant="outlined"
            @update:model-value="themeStore.setTheme($event)"
          >
            <v-btn prepend-icon="mdi-weather-sunny" text="Light" value="light" />
            <v-btn prepend-icon="mdi-weather-night" text="Dark" value="dark" />
          </v-btn-toggle>
          <v-divider class="my-3" />
          <p class="text-caption text-medium-emphasis mb-3">
            Change password — leave these three blank to keep your current one
          </p>
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="form.current_password"
                label="Current password"
                :rules="[rules.requiredIf(() => !!form.new_password, 'your current password to confirm the change')]"
                type="password"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.new_password"
                label="New password"
                :rules="[rules.minLength(8, 'The new password')]"
                type="password"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.confirm_password"
                label="Confirm new password"
                :rules="[
                  rules.requiredIf(() => !!form.new_password, 'the new password again'),
                  rules.matches(() => form.new_password, 'This does not match the new password'),
                ]"
                type="password"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-divider />
      <v-card-actions class="justify-space-between px-4 py-3">
        <v-btn variant="text" @click="settingsDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          :loading="saving"
          variant="flat"
          @click="saveSettings"
        >Save Changes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { toast } from 'vue-sonner'
  import { clearSession, getStoredUser } from '@/session'
  import { useThemeStore } from '@/stores/theme'
  import { useUserStore } from '@/stores/user'
  import * as rules from '@/validation'
  import { validateForm } from '@/validation'

  const userStore = useUserStore()
  const themeStore = useThemeStore()
  const router = useRouter()
  const route = useRoute()
  const drawer = ref(true)
  const rail = ref(false)
  const settingsDialog = ref(false)
  const settingsForm = ref(null)
  const saving = ref(false)

  const storedUser = getStoredUser() || {}

  const isPlatformAdmin = computed(() =>
    userData.value.is_platform_admin ?? storedUser.is_platform_admin ?? false,
  )

  // Prefer the freshly fetched profile, falling back to what login cached.
  const role = computed(() => userData.value.role ?? storedUser.role ?? null)

  // Each item lists the roles allowed to see it, mirroring `meta.roles` in the
  // router. This only tidies the menu — the router still guards the routes and the
  // API still guards the data.
  const tenantNav = [
    { path: '/home', icon: 'mdi-view-grid-outline', label: 'Dashboard', group: 'Menu', roles: ['admin'] },
    { path: '/schedule', icon: 'mdi-calendar-check-outline', label: 'Schedule', group: 'Menu', roles: ['admin', 'scheduler', 'member'] },
    { path: '/rosters', icon: 'mdi-sun-clock-outline', label: 'Rosters', group: 'Menu', roles: ['admin', 'scheduler'] },
    { path: '/feedback', icon: 'mdi-clipboard-check-outline', label: 'Feedback', group: 'Menu', roles: ['admin', 'scheduler'] },
    { path: '/streaks', icon: 'mdi-fire', label: 'Streaks', group: 'Menu', roles: ['admin', 'scheduler'] },
    { path: '/people', icon: 'mdi-account-group-outline', label: 'People', group: 'Setup', roles: ['admin'] },
    { path: '/roles', icon: 'mdi-briefcase-outline', label: 'Roles', group: 'Setup', roles: ['admin'] },
    { path: '/events', icon: 'mdi-calendar-star-outline', label: 'Events', group: 'Setup', roles: ['admin'] },
    { path: '/awards', icon: 'mdi-trophy-outline', label: 'Awards', group: 'Setup', roles: ['admin'] },
    { path: '/users', icon: 'mdi-account-key-outline', label: 'Users', group: 'Setup', roles: ['admin'] },
  ]

  // Platform admins manage tenants, not roster data — give them the clients console.
  const navItems = computed(() =>
    isPlatformAdmin.value
      ? [{ path: '/admin/clients', icon: 'mdi-domain', label: 'Clients', group: 'Menu' }]
      : tenantNav.filter(item => item.roles.includes(role.value)),
  )

  // Section order is fixed; empty sections are dropped by the template, so a
  // scheduler simply never sees the Setup heading.
  const NAV_GROUPS = ['Menu', 'Setup']

  const navGroups = computed(() =>
    NAV_GROUPS.map(label => ({
      label,
      items: navItems.value.filter(item => item.group === label),
    })).filter(group => group.items.length > 0),
  )

  const ROLE_LABELS = {
    admin: 'Admin',
    scheduler: 'Scheduler',
    member: 'Member',
  }

  /** Shown under the user's name so it's obvious which hat they're wearing. */
  const roleLabel = computed(() =>
    isPlatformAdmin.value ? 'Platform admin' : (ROLE_LABELS[role.value] || ''),
  )

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
    nextTick(() => settingsForm.value?.resetValidation())
  }

  async function saveSettings () {
    if (!await validateForm(settingsForm)) {
      return
    }
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
    // No `?redirect=` — an intentional logout shouldn't bounce back to the page
    // they left, unlike an expired session.
    clearSession()
    router.push('/login')
  }

  onMounted(() => userStore.fetchProfile())
</script>

<style scoped>
/* User block ─────────────────────────────────────────────────────────────── */
.user-block {
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}
.user-row {
  border-radius: 12px;
  cursor: pointer;
  transition: background-color .15s ease;
}
.user-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
}
.user-avatar {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface));
  flex: 0 0 auto;
}
.user-name {
  font-size: .9375rem;
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
}
.user-email {
  font-size: .8125rem;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.3;
  margin: 0;
}
.user-chevron {
  color: rgb(var(--v-theme-on-surface-variant));
}
.min-w-0 { min-width: 0; }

/* Nav ────────────────────────────────────────────────────────────────────── */
.nav-scroll {
  overflow-y: auto;
}
.nav-group-label {
  font-size: .75rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  /* Reserves the row's height in rail mode, so collapsing doesn't make the
     groups jump together. */
  min-height: 18px;
  margin: 16px 0 6px 12px;
}
.nav-item {
  min-height: 44px;
  font-weight: 500;
}
.nav-item :deep(.v-list-item-title) {
  font-size: .9375rem;
}

/* Rail alignment.
 *
 * A nav list-item is a `prepend content append` grid with 16px of its own
 * inline padding, sitting inside `.v-list--nav`'s 8px and the drawer's own
 * padding. Stacked up that put the icon's left edge 36px into a 56px rail — the
 * icon then ran from 36px to 60px and was clipped by the rail's right edge,
 * which is what made the collapsed icons look shoved over to the right.
 *
 * In rail the item is reduced to its prepend track and centred: the content
 * column (and the spacer that reserves room for the title) has nothing to show
 * once the label is dropped, so neither should take up space. */
.nav-item--rail {
  padding-inline: 0 !important;
  grid-template-areas: "prepend";
  grid-template-columns: 1fr;
  justify-items: center;
}
.nav-item--rail :deep(.v-list-item__spacer),
.nav-item--rail :deep(.v-list-item__content),
.nav-item--rail :deep(.v-list-item__append) {
  display: none;
}
</style>
