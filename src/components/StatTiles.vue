<template>
  <div class="stat-row mb-6">
    <v-card
      v-for="tile in tiles"
      :key="tile.label"
      class="stat-tile pa-4 d-flex align-center"
      rounded="lg"
      variant="outlined"
    >
      <div class="stat-icon d-flex align-center justify-center mr-4">
        <v-icon size="20">{{ tile.icon }}</v-icon>
      </div>
      <div class="min-w-0">
        <p class="stat-label mb-1">{{ tile.label }}</p>
        <p class="stat-value">{{ tile.value }}</p>
      </div>
    </v-card>
  </div>
</template>

<script setup>
  /**
   * The row of summary tiles above a table — icon tile, label, big number.
   *
   * Scrolls sideways rather than wrapping or shrinking, so the numbers stay
   * legible on narrow screens instead of collapsing into a cramped grid.
   */
  defineProps({
    // [{ label, value, icon }]
    tiles: { type: Array, required: true },
  })
</script>

<style scoped>
.stat-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.stat-tile {
  flex: 1 1 0;
  min-width: 220px;
}
.stat-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface));
}
.stat-label {
  font-size: .875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: nowrap;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.min-w-0 { min-width: 0; }
</style>
