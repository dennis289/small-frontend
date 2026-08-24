<template>
  <v-container class="pa-6 pa-md-8" fluid>

    <!-- ─── Hero greeting ─────────────────────────────────────────────────── -->
    <section class="home-hero mb-10">
      <div class="hero-eyebrow d-flex align-center ga-2 mb-3">
        <span class="eyebrow-rule" />
        <span class="text-caption text-uppercase font-weight-medium text-medium-emphasis" style="letter-spacing:.25em;">
          {{ todayLabel }}
        </span>
      </div>
      <h1 class="hero-title font-serif">
        {{ greeting }}<span class="hero-comma">,</span>
        <span class="hero-name">{{ firstName }}</span>
      </h1>
      <p class="hero-sub text-medium-emphasis mt-2">
        Here's what's happening across your team today.
      </p>
    </section>

    <!-- ─── At-a-glance stats ─────────────────────────────────────────────── -->
    <section class="mb-10">
      <div class="section-label d-flex align-center ga-3 mb-4">
        <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">At a glance</span>
        <v-divider class="flex-grow-1" />
      </div>

      <v-row dense>
        <v-col v-for="stat in stats" :key="stat.label" cols="6" md="3">
          <v-card
            class="stat-card pa-5"
            rounded="lg"
            style="cursor:pointer; height:100%;"
            variant="outlined"
            @click="goTo(stat.route)"
          >
            <div class="d-flex align-center justify-space-between mb-3">
              <v-icon class="stat-icon" :icon="stat.icon" size="22" />
              <v-icon class="stat-arrow" icon="mdi-arrow-top-right" size="16" />
            </div>
            <div class="stat-number font-serif">{{ stat.count }}</div>
            <div class="stat-label text-caption text-uppercase text-medium-emphasis mt-1">
              {{ stat.label }}
            </div>
          </v-card>
        </v-col>
      </v-row>
    </section>

    <!-- ─── Quick actions + Top streaks split ─────────────────────────────── -->
    <v-row>
      <!-- Quick actions -->
      <v-col cols="12" md="7">
        <div class="section-label d-flex align-center ga-3 mb-4">
          <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Quick actions</span>
          <v-divider class="flex-grow-1" />
        </div>

        <v-row dense>
          <v-col v-for="action in actions" :key="action.label" cols="12" sm="4">
            <v-card
              class="action-card pa-5"
              rounded="lg"
              style="cursor:pointer; height:100%;"
              variant="outlined"
              @click="action.handler()"
            >
              <v-icon class="action-icon mb-4" :icon="action.icon" size="26" />
              <div class="text-subtitle-1 font-weight-medium">{{ action.label }}</div>
              <div class="text-caption text-medium-emphasis mt-1">{{ action.sub }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- Top streaks preview -->
      <v-col cols="12" md="5">
        <div class="section-label d-flex align-center ga-3 mb-4">
          <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Top streaks</span>
          <v-divider class="flex-grow-1" />
          <v-btn
            append-icon="mdi-arrow-right"
            class="text-medium-emphasis"
            size="x-small"
            variant="text"
            @click="goTo('/streaks')"
          >All</v-btn>
        </div>

        <v-card class="streaks-preview pa-2" rounded="lg" variant="outlined">
          <div v-if="topStreaks.length === 0 && !loadingStreaks" class="pa-5 text-center text-medium-emphasis text-body-2">
            No active streaks yet.
          </div>
          <div v-else-if="loadingStreaks" class="pa-5 d-flex justify-center">
            <v-progress-circular indeterminate size="22" width="2" />
          </div>
          <div v-else>
            <div
              v-for="(member, i) in topStreaks"
              :key="member.person_id"
              class="streak-row d-flex align-center px-3 py-3"
            >
              <div class="streak-rank text-caption font-weight-bold mr-3">
                {{ String(i + 1).padStart(2, '0') }}
              </div>
              <v-avatar class="mr-3" color="surface-variant" size="34">
                <span class="text-caption font-weight-bold">{{ initials(member.name) }}</span>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-body-2 font-weight-medium">{{ member.name }}</div>
                <div class="text-caption text-medium-emphasis">
                  Best: {{ member.longest_streak }}
                </div>
              </div>
              <div class="d-flex align-center ga-1">
                <v-icon color="primary" size="14">mdi-fire</v-icon>
                <span class="text-body-1 font-weight-bold">{{ member.current_streak }}</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ─── Member dialog ──────────────────────────────────────────────────── -->
    <v-dialog v-model="memberDialog" max-width="600">
      <v-card>
        <v-card-title>Add a member</v-card-title>
        <v-card-text>
          <v-form ref="memberFormRef" @submit.prevent="addUser">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="memberData.first_name"
                  label="First name*"
                  :rules="[rules.required('a first name')]"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="memberData.last_name"
                  label="Last name*"
                  :rules="[rules.required('a last name')]"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="memberData.email"
                  label="Email*"
                  :rules="[rules.required('an email address'), rules.email()]"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="memberData.phone_number"
                  label="Phone*"
                  :rules="[rules.required('a phone number'), rules.phone()]"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="memberData.area_of_residence" label="Area of residence" />
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox v-model="memberData.is_producer" color="primary" label="Is Producer" />
                <v-checkbox v-model="memberData.is_assistant_producer" color="primary" label="Is Assistant Producer" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-autocomplete
                  v-model="memberData.roles"
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
                    <span v-else-if="index === 3" class="grey--text text--darken-1">+{{ memberData.roles.length - 3 }} more</span>
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
          <v-btn color="primary" variant="flat" @click="addUser">Add Member</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Role dialog ────────────────────────────────────────────────────── -->
    <v-dialog v-model="roleDialog" max-width="600">
      <v-card>
        <v-card-title>Add a role</v-card-title>
        <v-card-text>
          <v-form ref="roleFormRef" @submit.prevent="addRole">
            <v-row dense>
              <v-col cols="12" md="4" sm="6">
                <v-text-field
                  v-model="roleData.name"
                  label="Role name*"
                  :rules="[rules.required('a role name')]"
                />
              </v-col>
              <v-col cols="12" md="4" sm="6">
                <v-text-field v-model="roleData.description" label="Description" />
              </v-col>
              <v-col cols="12" md="4" sm="6">
                <v-checkbox v-model="roleData.is_special_role" color="primary" label="Is Special Role" />
              </v-col>
            </v-row>
            <small class="text-caption text-medium-emphasis">Fields marked * are required</small>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-space-between px-4 py-3">
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="addRole">Add Role</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Event dialog ───────────────────────────────────────────────────── -->
    <v-dialog v-model="eventDialog" max-width="600">
      <v-card>
        <v-card-title>Add an event</v-card-title>
        <v-card-text>
          <v-form ref="eventFormRef" @submit.prevent="addEvent">
            <v-text-field
              v-model="eventData.name"
              label="Event name*"
              :rules="[rules.required('a name for this event')]"
            />
            <v-row>
              <v-col>
                <v-text-field
                  v-model="eventData.start_time"
                  append-inner-icon="mdi-clock-time-four-outline"
                  label="Start time*"
                  readonly
                  :rules="[rules.chooseOne('a start time')]"
                >
                  <v-dialog v-model="startTimeDialog" activator="parent" width="auto">
                    <v-time-picker v-model="eventData.start_time" />
                  </v-dialog>
                </v-text-field>
              </v-col>
              <v-col>
                <v-text-field
                  v-model="eventData.end_time"
                  append-inner-icon="mdi-clock-time-four-outline"
                  label="End time*"
                  readonly
                  :rules="[
                    rules.chooseOne('an end time'),
                    rules.endAfterStart(() => eventData.start_time),
                  ]"
                >
                  <v-dialog v-model="endTimeDialog" activator="parent" width="auto">
                    <v-time-picker v-model="eventData.end_time" />
                  </v-dialog>
                </v-text-field>
              </v-col>
            </v-row>
            <v-text-field v-model="eventData.description" label="Description" type="text" />
            <small class="text-caption text-medium-emphasis">Fields marked * are required</small>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-space-between px-4 py-3">
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="addEvent">Add Event</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  /**
   * Dashboard / landing page for tenant users.
   *
   * Summarises counts across people, roles, events and rosters, shows the top
   * attendance streaks, and offers quick-add dialogs for a member, role or event so
   * a new client can populate the basics without visiting each page.
   */
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { toast } from 'vue-sonner'
  import { useAuthStore } from '@/stores/auth'
  import { useEventsStore } from '@/stores/events'
  import { usePeopleStore } from '@/stores/people'
  import { useRolesStore } from '@/stores/roles'
  import { useRostersStore } from '@/stores/rosters'
  import * as rules from '@/validation'
  import { validateForm } from '@/validation'

  const rolesStore = useRolesStore()
  const peopleStore = usePeopleStore()
  const eventsStore = useEventsStore()
  const rostersStore = useRostersStore()
  const authStore = useAuthStore()

  const router = useRouter()
  const memberDialog = ref(false)
  const roleDialog = ref(false)
  const rolesList = ref([])
  const eventDialog = ref(false)
  const startTimeDialog = ref(false)
  const endTimeDialog = ref(false)

  const topStreaks = ref([])
  const loadingStreaks = ref(false)

  // One object per dialog.
  //
  // These three shortcuts used to share a single `form` ref, which is why two of
  // them didn't work: the role dialog wrote into `form` while `addRole` posted a
  // separate, never-written `roleForm`, so it always sent a blank role; and the
  // event dialog's name field had no `v-model` at all while `addEvent` posted the
  // *member* object. Validation can't help a form whose values are never sent, so
  // each dialog now owns its own state.
  const blankMember = () => ({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    area_of_residence: '',
    is_producer: false,
    is_assistant_producer: false,
    roles: [],
  })
  const blankRole = () => ({
    name: '',
    description: '',
    is_special_role: false,
  })
  const blankEvent = () => ({
    name: '',
    start_time: '',
    end_time: '',
    description: '',
  })

  const memberData = ref(blankMember())
  const roleData = ref(blankRole())
  const eventData = ref(blankEvent())

  const memberFormRef = ref(null)
  const roleFormRef = ref(null)
  const eventFormRef = ref(null)

  function closeDialog () {
    memberDialog.value = false
    eventDialog.value = false
    roleDialog.value = false
    memberData.value = blankMember()
    roleData.value = blankRole()
    eventData.value = blankEvent()
    memberFormRef.value?.resetValidation()
    roleFormRef.value?.resetValidation()
    eventFormRef.value?.resetValidation()
  }

  async function addRole () {
    if (!await validateForm(roleFormRef)) {
      return
    }
    const result = await rolesStore.createRole(roleData.value)
    if (result.success) {
      toast.success('Role added successfully!')
      closeDialog()
    } else {
      toast.error(result.error || 'Failed to add role.')
    }
  }

  async function fetchRoles () {
    const result = await rolesStore.fetchRoles()
    if (result.success) {
      rolesList.value = rolesStore.roles
    } else {
      toast.error(result.error || 'Failed to fetch roles.')
    }
  }

  async function addUser () {
    if (!await validateForm(memberFormRef)) {
      return
    }
    const result = await peopleStore.createPerson(memberData.value)
    if (result.success) {
      toast.success('User added successfully!')
      closeDialog()
    } else {
      toast.error(result.error || 'Failed to add user.')
    }
  }

  async function addEvent () {
    if (!await validateForm(eventFormRef)) {
      return
    }
    const result = await eventsStore.createEvent(eventData.value)
    if (result.success) {
      toast.success('Event added successfully!')
      closeDialog()
    } else {
      toast.error(result.error || 'Failed to add event.')
    }
  }

  async function fetchTopStreaks () {
    loadingStreaks.value = true
    const result = await peopleStore.fetchStreaks()
    if (result.success) {
      topStreaks.value = (result.data || [])
        .filter(s => s.current_streak > 0)
        .slice(0, 5)
    }
    loadingStreaks.value = false
  }

  function goTo (path) {
    router.push(path)
  }

  function initials (name) {
    const parts = (name || '').trim().split(' ')
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
  }

  const firstName = computed(() => {
    const u = authStore.userInfo
    return u?.first_name || u?.username || 'there'
  })

  const greeting = computed(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })

  const todayLabel = computed(() =>
    new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
  )

  const stats = computed(() => [
    { label: 'People', count: peopleStore.totalPersons || Math.max(peopleStore.persons.length, 0), icon: 'mdi-account-multiple-outline', route: '/people' },
    { label: 'Roles', count: rolesStore.roles.length, icon: 'mdi-shape-outline', route: '/roles' },
    { label: 'Events', count: eventsStore.events.length, icon: 'mdi-calendar-outline', route: '/events' },
    { label: 'Rosters', count: rostersStore.rosters.length, icon: 'mdi-clipboard-text-outline', route: '/rosters' },
  ])

  const actions = [
    { label: 'Add member', sub: 'Register a teammate', icon: 'mdi-account-plus-outline', handler: () => memberDialog.value = true },
    { label: 'Add role', sub: 'Create a roster role', icon: 'mdi-shape-plus-outline', handler: () => roleDialog.value = true },
    { label: 'Add event', sub: 'Schedule an event', icon: 'mdi-calendar-plus-outline', handler: () => eventDialog.value = true },
  ]

  onMounted(async () => {
    fetchRoles()
    fetchTopStreaks()
    await Promise.all([
      peopleStore.fetchPersons({ page: 1, pageSize: 1 }),
      rolesStore.fetchRoles(),
      eventsStore.fetchEvents(),
      rostersStore.fetchRosters(),
    ])
  })
</script>

<style scoped>
/* Home page uses the readable Inter sans everywhere — override the global
   display serif (.font-serif) on the hero greeting and stat numbers. */
.home-hero .font-serif,
.stat-number.font-serif {
  font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
  letter-spacing: -0.01em;
}

/* ── Hero ──────────────────────────────────────────────────────────────────── */
.home-hero {
  padding: 8px 0 0;
}

.hero-eyebrow .eyebrow-rule {
  display: inline-block;
  width: 28px;
  height: 1px;
  background: currentColor;
  opacity: .5;
}

.hero-title {
  font-size: clamp(1.9rem, 3.8vw, 2.8rem);
  line-height: 1.05;
  font-weight: 500;
  margin: 0;
}
.hero-comma {
  font-style: italic;
  opacity: .55;
}
.hero-name {
  display: inline-block;
  margin-left: .25em;
  color: rgb(var(--v-theme-primary-darken-1));
  font-style: italic;
  font-weight: 500;
  font-size: 1em; /* match the greeting text exactly — no size difference */
}
.v-theme--dark .hero-name {
  color: rgb(var(--v-theme-primary-lighten-1));
}

.hero-sub {
  font-size: 1rem;
  max-width: 56ch;
}

/* ── Section labels ───────────────────────────────────────────────────────── */
.section-label .v-divider {
  opacity: .6;
}

/* ── Stat cards ───────────────────────────────────────────────────────────── */
.stat-card {
  background: rgb(var(--v-theme-surface)) !important;
  position: relative;
  overflow: hidden;
}
.stat-card .stat-icon {
  color: rgb(var(--v-theme-primary));
  opacity: .8;
}
.stat-card .stat-arrow {
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: .35;
  transition: transform .2s ease, opacity .2s ease;
}
.stat-card:hover .stat-arrow {
  opacity: .9;
  transform: translate(2px, -2px);
}
.stat-number {
  font-size: clamp(2rem, 3vw, 2.6rem);
  line-height: 1;
  font-weight: 500;
  letter-spacing: -.02em;
}
.stat-label {
  letter-spacing: .14em !important;
  font-size: 0.7rem !important;
}

/* ── Action cards ─────────────────────────────────────────────────────────── */
.action-card {
  background: rgb(var(--v-theme-surface)) !important;
  position: relative;
  overflow: hidden;
}
.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)), transparent 80%);
  opacity: 0;
  transition: opacity .25s ease;
}
.action-card:hover::before {
  opacity: 1;
}
.action-card .action-icon {
  color: rgb(var(--v-theme-primary));
  opacity: .85;
}

/* ── Top streaks preview ──────────────────────────────────────────────────── */
.streak-row + .streak-row {
  border-top: 1px solid rgba(var(--v-theme-primary), 0.07);
}
.v-theme--dark .streak-row + .streak-row {
  border-top-color: rgba(var(--v-theme-primary), 0.08);
}
.streak-rank {
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: .55;
  font-feature-settings: 'tnum';
  min-width: 22px;
}
</style>
