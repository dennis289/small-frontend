<template>
  <v-container class="pa-6 pa-md-8" fluid>

    <!-- ─── Editorial header ─────────────────────────────────────────────── -->
    <section class="streaks-hero mb-8">
      <div class="d-flex align-center gap-2 mb-3">
        <span class="eyebrow-rule" />
        <span class="text-caption text-uppercase font-weight-medium text-medium-emphasis" style="letter-spacing:.25em;">
          Recognition
        </span>
      </div>
      <div class="d-flex align-end justify-space-between flex-wrap gap-4">
        <div>
          <h1 class="hero-title font-serif">
            Attendance<span class="hero-italic">streaks</span>
          </h1>
          <p class="hero-sub text-medium-emphasis mt-2">
            Consecutive service appearances. Give an award to celebrate — and reset — a streak.
          </p>
        </div>
        <v-btn
          :loading="loading"
          prepend-icon="mdi-refresh"
          rounded="lg"
          variant="outlined"
          @click="fetchStreaks"
        >Refresh</v-btn>
      </div>
    </section>

    <!-- ─── Summary metrics strip ────────────────────────────────────────── -->
    <section class="mb-8">
      <v-row dense>
        <v-col v-for="m in summary" :key="m.label" cols="6" md="3">
          <v-card class="metric-card pa-5" rounded="lg" variant="outlined">
            <div class="text-caption text-uppercase text-medium-emphasis mb-2" style="letter-spacing:.18em;">
              {{ m.label }}
            </div>
            <div class="metric-value font-serif">
              {{ m.value }}<span v-if="m.suffix" class="metric-suffix">{{ m.suffix }}</span>
            </div>
            <div v-if="m.sub" class="text-caption text-medium-emphasis mt-2">{{ m.sub }}</div>
          </v-card>
        </v-col>
      </v-row>
    </section>

    <!-- ─── Podium ───────────────────────────────────────────────────────── -->
    <section v-if="top3.length > 0" class="mb-10">
      <div class="section-label d-flex align-center gap-3 mb-6">
        <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Leaders</span>
        <v-divider class="flex-grow-1" />
      </div>

      <div class="podium-stage">
        <!-- 2nd place -->
        <div v-if="top3[1]" class="podium-slot podium-second">
          <div class="podium-card">
            <div class="podium-rank">02</div>
            <v-avatar class="podium-avatar mb-3" size="56">
              <span class="text-h6 font-weight-bold">{{ initials(top3[1].name) }}</span>
            </v-avatar>
            <div class="podium-name">{{ top3[1].name }}</div>
            <div class="podium-streak mt-1">
              <v-icon class="streak-flame" size="14">mdi-fire</v-icon>
              <span class="font-serif">{{ top3[1].current_streak }}</span>
              <span class="text-caption text-medium-emphasis ml-1">weeks</span>
            </div>
          </div>
          <div class="podium-plinth podium-plinth-2">
            <span class="plinth-number font-serif">2</span>
          </div>
        </div>

        <!-- 1st place -->
        <div v-if="top3[0]" class="podium-slot podium-first">
          <v-icon class="podium-crown mb-1" size="22">mdi-crown-outline</v-icon>
          <div class="podium-card podium-card-first">
            <div class="podium-rank">01</div>
            <v-avatar class="podium-avatar podium-avatar-first mb-3" size="68">
              <span class="text-h5 font-weight-bold">{{ initials(top3[0].name) }}</span>
            </v-avatar>
            <div class="podium-name podium-name-first">{{ top3[0].name }}</div>
            <div class="podium-streak mt-1">
              <v-icon class="streak-flame" size="16">mdi-fire</v-icon>
              <span class="font-serif">{{ top3[0].current_streak }}</span>
              <span class="text-caption text-medium-emphasis ml-1">weeks</span>
            </div>
          </div>
          <div class="podium-plinth podium-plinth-1">
            <span class="plinth-number font-serif">1</span>
          </div>
        </div>

        <!-- 3rd place -->
        <div v-if="top3[2]" class="podium-slot podium-third">
          <div class="podium-card">
            <div class="podium-rank">03</div>
            <v-avatar class="podium-avatar mb-3" size="52">
              <span class="text-h6 font-weight-bold">{{ initials(top3[2].name) }}</span>
            </v-avatar>
            <div class="podium-name">{{ top3[2].name }}</div>
            <div class="podium-streak mt-1">
              <v-icon class="streak-flame" size="14">mdi-fire</v-icon>
              <span class="font-serif">{{ top3[2].current_streak }}</span>
              <span class="text-caption text-medium-emphasis ml-1">weeks</span>
            </div>
          </div>
          <div class="podium-plinth podium-plinth-3">
            <span class="plinth-number font-serif">3</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Full leaderboard ─────────────────────────────────────────────── -->
    <section>
      <div class="section-label d-flex align-center gap-3 mb-4">
        <span class="text-overline font-weight-bold" style="letter-spacing:.2em;">Full leaderboard</span>
        <v-divider class="flex-grow-1" />
        <span class="text-caption text-medium-emphasis">{{ filteredStreaks.length }} of {{ streaks.length }}</span>
      </div>

      <div class="leaderboard-search mb-4">
        <v-text-field
          v-model="search"
          clearable
          density="comfortable"
          hide-details
          placeholder="Search by name"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
        />
      </div>

      <v-card class="overflow-hidden" rounded="lg" variant="outlined">
        <v-data-table
          density="comfortable"
          :headers="headers"
          hover
          :items="filteredStreaks"
          :loading="loading"
        >
          <template #item.rank="{ index }">
            <div class="rank-cell text-caption font-weight-bold">
              {{ String(index + 1).padStart(2, '0') }}
            </div>
          </template>

          <template #item.name="{ item }">
            <div class="d-flex align-center gap-3">
              <v-avatar class="leader-avatar" size="34">
                <span class="text-caption font-weight-bold">{{ initials(item.name) }}</span>
              </v-avatar>
              <span class="font-weight-medium">{{ item.name }}</span>
            </div>
          </template>

          <template #item.current_streak="{ item }">
            <div class="d-flex align-center gap-2">
              <v-icon
                :class="['streak-flame', { dim: item.current_streak === 0 }]"
                size="15"
              >mdi-fire</v-icon>
              <span class="font-serif streak-num">{{ item.current_streak }}</span>
              <span
                v-if="item.current_streak >= 10"
                class="streak-tag streak-tag-hot"
              >On fire</span>
              <span
                v-else-if="item.current_streak >= 5"
                class="streak-tag streak-tag-warm"
              >Hot</span>
            </div>
          </template>

          <template #item.longest_streak="{ item }">
            <span class="font-serif text-body-1">{{ item.longest_streak }}</span>
          </template>

          <template #item.actions="{ item }">
            <v-btn
              v-if="item.current_streak > 0"
              color="primary"
              prepend-icon="mdi-gift-outline"
              size="small"
              variant="tonal"
              @click="goToAward(item)"
            >Award</v-btn>
            <span v-else class="text-caption text-medium-emphasis">—</span>
          </template>
        </v-data-table>
      </v-card>
    </section>

  </v-container>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { toast } from 'vue-sonner'
  import { usePeopleStore } from '@/stores/people'

  const router = useRouter()
  const peopleStore = usePeopleStore()

  const streaks = ref([])
  const loading = ref(false)
  const search = ref('')

  const headers = [
    { title: '#', key: 'rank', sortable: false, width: '60px' },
    { title: 'Member', key: 'name', sortable: true },
    { title: 'Current', key: 'current_streak', sortable: true },
    { title: 'Best', key: 'longest_streak', sortable: true },
    { title: '', key: 'actions', sortable: false, align: 'end' },
  ]

  const top3 = computed(() => streaks.value.slice(0, 3).filter(s => s.current_streak > 0))

  const filteredStreaks = computed(() => {
    if (!search.value) return streaks.value
    const q = search.value.toLowerCase()
    return streaks.value.filter(s => s.name.toLowerCase().includes(q))
  })

  const summary = computed(() => {
    const active = streaks.value.filter(s => s.current_streak > 0)
    const total = streaks.value.length
    const avg = active.length > 0
      ? (active.reduce((s, m) => s + m.current_streak, 0) / active.length)
      : 0
    const longest = streaks.value.reduce((max, m) => Math.max(max, m.longest_streak || 0), 0)
    const topNow = streaks.value.reduce((max, m) => Math.max(max, m.current_streak || 0), 0)
    return [
      { label: 'Members', value: total, sub: 'on the leaderboard' },
      { label: 'Active streaks', value: active.length, sub: total ? `${Math.round((active.length / total) * 100)}% of members` : '' },
      { label: 'Average', value: avg.toFixed(1), suffix: '', sub: 'weeks per active member' },
      { label: 'Best ever', value: longest, sub: `Current top: ${topNow}` },
    ]
  })

  function initials (name) {
    const parts = (name || '').trim().split(' ')
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
  }

  function goToAward (item) {
    router.push({ path: '/awards', query: { person: item.person_id } })
  }

  async function fetchStreaks () {
    loading.value = true
    const result = await peopleStore.fetchStreaks()
    if (result.success) {
      streaks.value = result.data
    } else {
      toast.error(result.error || 'Failed to load streaks')
    }
    loading.value = false
  }

  onMounted(fetchStreaks)
</script>

<style scoped>
/* Metric numbers (summary cards, podium, leaderboard) use the readable Inter
   sans instead of the display serif — only the page hero keeps the serif. */
.font-serif:not(.hero-title) {
  font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
  letter-spacing: -0.01em;
}

/* ── Hero ──────────────────────────────────────────────────────────────────── */
.streaks-hero .eyebrow-rule {
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
.hero-italic {
  font-style: italic;
  font-weight: 500;
  font-size: 1em;
  margin-inline-start: .12em;
  color: rgb(var(--v-theme-primary-darken-1));
}
.v-theme--dark .hero-italic {
  color: rgb(var(--v-theme-primary-lighten-1));
}
.hero-sub {
  font-size: 1rem;
  max-width: 60ch;
}

/* ── Metric cards ─────────────────────────────────────────────────────────── */
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
.metric-suffix {
  font-size: 1rem;
  font-style: italic;
  opacity: .6;
  margin-left: 2px;
}

/* ── Podium ───────────────────────────────────────────────────────────────── */
.podium-stage {
  display: grid;
  grid-template-columns: 1fr 1.15fr 1fr;
  align-items: end;
  gap: 24px;
  max-width: 760px;
  margin: 0 auto;
}

.podium-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.podium-first  { grid-column: 2; order: 2; }
.podium-second { grid-column: 1; order: 1; }
.podium-third  { grid-column: 3; order: 3; }

.podium-crown {
  color: rgb(var(--v-theme-primary));
  opacity: .8;
}

.podium-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 12px 14px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-primary), 0.10);
  width: 100%;
  position: relative;
}
.v-theme--dark .podium-card {
  border-color: rgba(var(--v-theme-primary), 0.12);
}
.podium-card-first {
  border-color: rgba(var(--v-theme-primary), 0.25);
  background: linear-gradient(180deg, rgba(var(--v-theme-primary), 0.06), rgb(var(--v-theme-surface)) 80%);
  box-shadow: 0 6px 24px -6px rgba(var(--v-theme-primary), 0.20);
}
.v-theme--dark .podium-card-first {
  border-color: rgba(var(--v-theme-primary), 0.28);
  background: linear-gradient(180deg, rgba(var(--v-theme-primary), 0.10), rgb(var(--v-theme-surface)) 80%);
  box-shadow: 0 6px 24px -6px rgba(var(--v-theme-primary), 0.25);
}

.podium-rank {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: .12em;
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: .5;
}

.podium-avatar {
  background: rgb(var(--v-theme-surface-variant)) !important;
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
}
.v-theme--dark .podium-avatar {
  border-color: rgba(var(--v-theme-primary), 0.22);
}
.podium-avatar-first {
  border-color: rgba(var(--v-theme-primary), 0.40);
  box-shadow: 0 4px 16px -3px rgba(var(--v-theme-primary), 0.30);
}
.v-theme--dark .podium-avatar-first {
  border-color: rgba(var(--v-theme-primary), 0.45);
  box-shadow: 0 4px 16px -3px rgba(var(--v-theme-primary), 0.32);
}

.podium-name {
  font-size: 0.95rem;
  font-weight: 600;
}
.podium-name-first {
  font-size: 1.05rem;
}
.podium-streak {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: -.01em;
  color: rgb(var(--v-theme-on-surface));
}

.podium-plinth {
  width: 100%;
  margin-top: 12px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 12px;
  background: rgb(var(--v-theme-surface-variant));
  border-top: 2px solid rgba(var(--v-theme-primary), 0.18);
  border-radius: 6px 6px 0 0;
}
.v-theme--dark .podium-plinth {
  border-top-color: rgba(var(--v-theme-primary), 0.22);
}
.podium-plinth-1 {
  height: 88px;
  border-top-color: rgb(var(--v-theme-primary));
  background: linear-gradient(180deg, rgba(var(--v-theme-primary), 0.08), rgb(var(--v-theme-surface-variant)));
}
.v-theme--dark .podium-plinth-1 {
  background: linear-gradient(180deg, rgba(var(--v-theme-primary), 0.12), rgb(var(--v-theme-surface-variant)));
}
.podium-plinth-2 { height: 60px; }
.podium-plinth-3 { height: 42px; }

.plinth-number {
  font-size: 1.6rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  opacity: .35;
  font-style: italic;
}

/* ── Streak flame & tags ──────────────────────────────────────────────────── */
.streak-flame {
  color: rgb(var(--v-theme-primary));
  opacity: .85;
}
.streak-flame.dim {
  opacity: .25;
}
.streak-num {
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: -.01em;
  font-feature-settings: 'tnum';
  min-width: 22px;
  display: inline-block;
}

.streak-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.streak-tag-warm {
  background: rgba(var(--v-theme-warning), 0.12);
  color: #8A5A35;
}
.v-theme--dark .streak-tag-warm {
  background: rgba(var(--v-theme-warning), 0.14);
  color: #E8C2A0;
}
.streak-tag-hot {
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary-darken-1));
}
.v-theme--dark .streak-tag-hot {
  background: rgba(var(--v-theme-primary), 0.18);
  color: rgb(var(--v-theme-primary-lighten-1));
}

/* ── Leader avatar (table & dialog) ───────────────────────────────────────── */
.leader-avatar {
  background: rgb(var(--v-theme-surface-variant)) !important;
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgba(var(--v-theme-primary), 0.16);
}
.v-theme--dark .leader-avatar {
  border-color: rgba(var(--v-theme-primary), 0.20);
}

.rank-cell {
  font-feature-settings: 'tnum';
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: .6;
  letter-spacing: .1em;
}

/* ── Leaderboard search ───────────────────────────────────────────────────── */
.leaderboard-search {
  max-width: 480px;
}
.leaderboard-search :deep(.v-field) {
  background: rgb(var(--v-theme-surface)) !important;
  border-radius: 12px;
}
.leaderboard-search :deep(.v-field__prepend-inner .v-icon) {
  color: rgb(var(--v-theme-primary));
  opacity: .7;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .podium-stage {
    grid-template-columns: 1fr;
    gap: 16px;
    max-width: 320px;
  }
  .podium-first, .podium-second, .podium-third {
    grid-column: 1;
  }
  .podium-first  { order: 1; }
  .podium-second { order: 2; }
  .podium-third  { order: 3; }
  .podium-plinth { display: none; }
}
</style>
