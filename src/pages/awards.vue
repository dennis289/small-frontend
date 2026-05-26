<template>
  <v-container class="pa-6 pa-md-8" fluid>

    <!-- Hero -->
    <section class="awards-hero mb-8">
      <div class="d-flex align-center gap-2 mb-3">
        <span class="eyebrow-rule" />
        <span class="text-caption text-uppercase font-weight-medium text-medium-emphasis" style="letter-spacing:.25em;">
          Recognition
        </span>
      </div>
      <div class="d-flex align-end justify-space-between flex-wrap gap-4">
        <div>
          <h1 class="hero-title font-serif">
            Member <span class="hero-italic">awards</span>
          </h1>
          <p class="hero-sub text-medium-emphasis mt-2">
            A full record of recognition given. Each award ends a streak — and starts the next.
          </p>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-trophy-outline"
          rounded="lg"
          variant="flat"
          @click="openGiveDialog()"
        >Give award</v-btn>
      </div>
    </section>

    <!-- Summary strip -->
    <section class="mb-8">
      <v-row dense>
        <v-col v-for="m in summaryCards" :key="m.label" cols="6" md="3">
          <v-card class="metric-card pa-5" rounded="lg" variant="outlined">
            <div class="text-caption text-uppercase text-medium-emphasis mb-2" style="letter-spacing:.18em;">
              {{ m.label }}
            </div>
            <div class="metric-value font-serif">{{ m.value }}</div>
            <div v-if="m.sub" class="text-caption text-medium-emphasis mt-2">{{ m.sub }}</div>
          </v-card>
        </v-col>
      </v-row>
    </section>

    <!-- Filters -->
    <v-card class="filter-bar pa-4 mb-6" rounded="lg" variant="outlined">
      <v-row align="center" dense>
        <v-col cols="12" md="3">
          <v-autocomplete
            v-model="filters.person"
            clearable
            density="comfortable"
            hide-details
            item-title="name"
            item-value="id"
            :items="personItems"
            label="Recipient"
            prepend-inner-icon="mdi-account-outline"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.type"
            clearable
            density="comfortable"
            hide-details
            item-title="name"
            item-value="id"
            :items="awardTypes"
            label="Award type"
            prepend-inner-icon="mdi-medal-outline"
          />
        </v-col>
        <v-col cols="6" md="2">
          <v-text-field
            v-model="filters.from"
            clearable
            density="comfortable"
            hide-details
            label="From"
            type="date"
          />
        </v-col>
        <v-col cols="6" md="2">
          <v-text-field
            v-model="filters.to"
            clearable
            density="comfortable"
            hide-details
            label="To"
            type="date"
          />
        </v-col>
        <v-col class="text-md-right" cols="12" md="2">
          <v-btn prepend-icon="mdi-refresh" size="small" variant="text" @click="resetFilters">Reset</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Awards table -->
    <div class="section-label d-flex align-center gap-3 mb-4">
      <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Award history</span>
      <v-divider class="flex-grow-1" />
      <span class="text-caption text-medium-emphasis">{{ totalAwards }} {{ totalAwards === 1 ? 'award' : 'awards' }}</span>
    </div>

    <v-card class="overflow-hidden" rounded="lg" variant="outlined">
      <v-data-table
        density="comfortable"
        :headers="headers"
        hover
        :items="awards"
        :loading="loading"
        no-data-text="No awards match these filters."
      >
        <template #item.given_at="{ item }">
          <span class="font-serif">{{ formatDate(item.given_at) }}</span>
        </template>
        <template #item.person_name="{ item }">
          <div class="d-flex align-center gap-3">
            <v-avatar class="recipient-avatar" size="32">
              <span class="text-caption font-weight-bold">{{ initials(item.person_name) }}</span>
            </v-avatar>
            <span class="font-weight-medium">{{ item.person_name }}</span>
          </div>
        </template>
        <template #item.award_type_name="{ item }">
          <v-chip color="primary" size="small" variant="tonal">{{ item.award_type_name }}</v-chip>
        </template>
        <template #item.streak_at_award="{ item }">
          <div class="d-flex align-center gap-1">
            <v-icon :class="['streak-flame', { dim: !item.streak_at_award }]" size="14">mdi-fire</v-icon>
            <span class="font-serif">{{ item.streak_at_award || 0 }}</span>
          </div>
        </template>
        <template #item.given_by_name="{ item }">
          <span class="text-caption text-medium-emphasis">{{ item.given_by_name || '—' }}</span>
        </template>
        <template #item.feedback="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.feedback || '—' }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            color="error"
            icon
            size="small"
            variant="text"
            @click="confirmDelete(item)"
          >
            <v-icon size="18">mdi-delete-outline</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Give-award dialog -->
    <v-dialog v-model="giveDialog" width="520">
      <v-card class="overflow-hidden" rounded="lg">
        <div class="give-header pa-5 d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-3">
            <v-avatar class="give-avatar" size="42">
              <v-icon size="22">mdi-trophy-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline font-weight-bold" style="letter-spacing:.18em; opacity:.8;">
                Recognition
              </div>
              <h3 class="text-h6 font-weight-medium font-serif">Give award</h3>
            </div>
          </div>
          <v-btn icon="mdi-close" size="small" variant="text" @click="giveDialog = false" />
        </div>

        <v-card-text class="pa-6">
          <v-autocomplete
            v-model="form.person"
            class="mb-3"
            density="comfortable"
            item-title="nameWithStreak"
            item-value="id"
            :items="personItems"
            label="Recipient *"
            prepend-inner-icon="mdi-account-outline"
          />

          <v-alert
            v-if="selectedPersonStreak > 0"
            class="mb-4"
            density="compact"
            type="info"
            variant="tonal"
          >
            Giving this award will reset
            <strong>{{ selectedPersonName }}</strong>'s streak from
            <strong>{{ selectedPersonStreak }}</strong> back to zero.
          </v-alert>

          <v-select
            v-model="form.award_type"
            class="mb-3"
            density="comfortable"
            item-title="name"
            item-value="id"
            :items="awardTypes"
            label="Award type *"
            prepend-inner-icon="mdi-medal-outline"
          />

          <v-text-field
            v-model="form.given_at"
            class="mb-3"
            density="comfortable"
            label="Date"
            prepend-inner-icon="mdi-calendar-outline"
            type="date"
          />

          <v-textarea
            v-model="form.feedback"
            density="comfortable"
            hide-details
            label="Notes"
            rows="3"
          />
        </v-card-text>

        <v-divider />
        <v-card-actions class="justify-space-between px-6 py-4">
          <v-btn variant="text" @click="giveDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!form.person || !form.award_type"
            :loading="giving"
            prepend-icon="mdi-trophy-outline"
            variant="flat"
            @click="submitAward"
          >Give award</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog v-model="deleteDialog" width="420">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Remove award</v-card-title>
        <v-card-text>
          Remove the <strong>{{ awardToDelete?.award_type_name }}</strong> award given to
          <strong>{{ awardToDelete?.person_name }}</strong>?
          This will not restore their streak.
        </v-card-text>
        <v-card-actions class="justify-end px-4 py-3">
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="doDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { toast } from 'vue-sonner'
  import { useAwardsStore } from '@/stores/awards'
  import { usePeopleStore } from '@/stores/people'

  const route = useRoute()
  const router = useRouter()
  const awardsStore = useAwardsStore()
  const peopleStore = usePeopleStore()

  const awards = ref([])
  const totalAwards = ref(0)
  const stats = ref(null)
  const awardTypes = ref([])
  const loading = ref(false)
  const streakMap = ref({}) // person_id -> current_streak

  const filters = ref({ person: null, type: null, from: null, to: null })

  const giveDialog = ref(false)
  const giving = ref(false)
  const form = ref({ person: null, award_type: null, given_at: todayStr(), feedback: '' })

  const deleteDialog = ref(false)
  const awardToDelete = ref(null)

  const personItems = ref([])

  const headers = [
    { title: 'Date', key: 'given_at', sortable: true },
    { title: 'Recipient', key: 'person_name', sortable: true },
    { title: 'Type', key: 'award_type_name', sortable: true },
    { title: 'Streak earned', key: 'streak_at_award', sortable: true, align: 'center' },
    { title: 'Issued by', key: 'given_by_name', sortable: false },
    { title: 'Notes', key: 'feedback', sortable: false },
    { title: '', key: 'actions', sortable: false, align: 'end', width: '56px' },
  ]

  const summaryCards = computed(() => {
    const s = stats.value
    return [
      { label: 'Total awards', value: s?.total ?? 0, sub: 'all-time' },
      { label: 'This month', value: s?.this_month ?? 0, sub: 'awards given' },
      { label: 'Recipients', value: s?.unique_recipients ?? 0, sub: 'unique members' },
      { label: 'Award types', value: s?.unique_types ?? 0, sub: 'in use' },
    ]
  })

  const selectedPersonStreak = computed(() => streakMap.value[form.value.person] || 0)
  const selectedPersonName = computed(() => {
    const p = personItems.value.find(x => x.id === form.value.person)
    return p ? p.name : ''
  })

  function todayStr () {
    return new Date().toISOString().split('T')[0]
  }

  function formatDate (d) {
    if (!d) return ''
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  function initials (name) {
    const parts = (name || '').trim().split(' ')
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
  }

  function resetFilters () {
    filters.value = { person: null, type: null, from: null, to: null }
  }

  async function loadAwards () {
    loading.value = true
    const result = await awardsStore.fetchAwards({
      person: filters.value.person,
      type: filters.value.type,
      from: filters.value.from,
      to: filters.value.to,
    })
    loading.value = false
    if (result.success) {
      awards.value = awardsStore.awards
      totalAwards.value = awardsStore.totalAwards
    } else {
      toast.error(result.error || 'Failed to load awards')
    }
  }

  async function loadStats () {
    const result = await awardsStore.fetchStats()
    if (result.success) stats.value = result.data
  }

  async function loadAwardTypes () {
    const result = await awardsStore.fetchAwardTypes()
    if (result.success) awardTypes.value = result.data
  }

  async function loadPersonsAndStreaks () {
    const [personsRes, streaksRes] = await Promise.all([
      peopleStore.fetchActivePersons(),
      peopleStore.fetchStreaks(),
    ])
    if (personsRes.success) {
      const streakLookup = {}
      if (streaksRes.success) {
        for (const s of streaksRes.data) streakLookup[s.person_id] = s.current_streak
      }
      streakMap.value = streakLookup
      personItems.value = personsRes.data.map(p => {
        const fullName = `${p.first_name} ${p.last_name}`.trim()
        const streak = streakLookup[p.id] || 0
        return {
          id: p.id,
          name: fullName,
          nameWithStreak: streak > 0 ? `${fullName}  •  🔥 ${streak}` : fullName,
        }
      })
      // Sort by streak descending so top streakers surface first in the autocomplete
      personItems.value.sort((a, b) => (streakLookup[b.id] || 0) - (streakLookup[a.id] || 0))
    }
  }

  function openGiveDialog (prefillPersonId = null) {
    form.value = {
      person: prefillPersonId,
      award_type: null,
      given_at: todayStr(),
      feedback: '',
    }
    giveDialog.value = true
  }

  async function submitAward () {
    giving.value = true
    const result = await awardsStore.giveAward({
      person: form.value.person,
      award_type: form.value.award_type,
      given_at: form.value.given_at || null,
      feedback: form.value.feedback,
    })
    giving.value = false
    if (result.success) {
      toast.success('Award given. Streak reset.')
      giveDialog.value = false
      await Promise.all([loadAwards(), loadStats(), loadPersonsAndStreaks()])
    } else {
      toast.error(result.error)
    }
  }

  function confirmDelete (item) {
    awardToDelete.value = item
    deleteDialog.value = true
  }

  async function doDelete () {
    const result = await awardsStore.deleteAward(awardToDelete.value.id)
    deleteDialog.value = false
    if (result.success) {
      toast.success('Award removed.')
      await Promise.all([loadAwards(), loadStats()])
    } else {
      toast.error(result.error || 'Failed to delete')
    }
  }

  watch(filters, loadAwards, { deep: true })

  onMounted(async () => {
    await Promise.all([loadStats(), loadAwardTypes(), loadPersonsAndStreaks()])
    await loadAwards()
    // Deep-link: /awards?person=ID opens the dialog pre-filled
    const prefill = route.query.person
    if (prefill) {
      openGiveDialog(Number(prefill))
      router.replace({ query: {} })
    }
  })
</script>

<style scoped>
.awards-hero .eyebrow-rule {
  display: inline-block;
  width: 28px;
  height: 1px;
  background: currentColor;
  opacity: .5;
}
.hero-title {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.05;
  font-weight: 500;
  margin: 0;
}
.hero-italic {
  font-style: italic;
  font-weight: 600;
  color: rgb(var(--v-theme-primary-darken-1));
}
.v-theme--dark .hero-italic {
  color: rgb(var(--v-theme-primary-lighten-1));
}
.hero-sub {
  font-size: 1rem;
  max-width: 60ch;
}

.metric-card {
  background: rgb(var(--v-theme-surface)) !important;
  height: 100%;
}
.metric-value {
  font-size: clamp(1.9rem, 3vw, 2.4rem);
  line-height: 1;
  font-weight: 500;
  letter-spacing: -.02em;
  color: rgb(var(--v-theme-on-surface));
}

.filter-bar {
  background: rgb(var(--v-theme-surface)) !important;
}

.recipient-avatar {
  background: rgb(var(--v-theme-surface-variant)) !important;
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgba(160, 101, 74, 0.16);
}
.v-theme--dark .recipient-avatar {
  border-color: rgba(197, 138, 110, 0.20);
}

.streak-flame {
  color: rgb(var(--v-theme-primary));
  opacity: .85;
}
.streak-flame.dim {
  opacity: .25;
}

.give-header {
  background: linear-gradient(135deg, rgba(160, 101, 74, 0.06), rgba(160, 101, 74, 0.02));
  border-bottom: 1px solid rgba(160, 101, 74, 0.10);
}
.v-theme--dark .give-header {
  background: linear-gradient(135deg, rgba(197, 138, 110, 0.10), rgba(197, 138, 110, 0.03));
  border-bottom-color: rgba(197, 138, 110, 0.12);
}
.give-avatar {
  background: rgb(var(--v-theme-surface-variant)) !important;
  color: rgb(var(--v-theme-primary));
  border: 1px solid rgba(160, 101, 74, 0.20);
}
.v-theme--dark .give-avatar {
  border-color: rgba(197, 138, 110, 0.22);
}
</style>
