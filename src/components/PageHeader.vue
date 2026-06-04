<template>
  <section class="page-header-block mb-8">
    <div v-if="eyebrow" class="d-flex align-center gap-2 mb-3">
      <span class="eyebrow-rule" />
      <span class="text-caption text-uppercase font-weight-medium text-medium-emphasis eyebrow-text">
        {{ eyebrow }}
      </span>
    </div>
    <div class="d-flex align-end justify-space-between flex-wrap header-row">
      <div class="header-title-wrap">
        <h1 class="page-title font-serif">
          {{ title }}<template v-if="italic">
            <span class="page-title-italic">{{ italic }}</span>
          </template>
        </h1>
        <p v-if="subtitle" class="page-sub text-medium-emphasis mt-2">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="header-actions d-flex align-center flex-wrap">
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>

<script setup>
  defineProps({
    eyebrow: { type: String, default: '' },
    title: { type: String, required: true },
    italic: { type: String, default: '' },
    subtitle: { type: String, default: '' },
  })
</script>

<style scoped>
.page-header-block {
  padding-top: 4px;
}

.eyebrow-rule {
  display: inline-block;
  width: 28px;
  height: 1px;
  background: currentColor;
  opacity: .5;
}
.eyebrow-text {
  letter-spacing: .25em;
}

.header-row {
  gap: 16px;
}

.page-title {
  font-size: clamp(1.9rem, 3.8vw, 2.8rem);
  line-height: 1.05;
  font-weight: 500;
  margin: 0;
  letter-spacing: -.01em;
}

.page-title-italic {
  font-style: italic;
  font-weight: 500;
  font-size: 1em;
  margin-inline-start: .12em;
  color: rgb(var(--v-theme-primary-darken-1));
}
.v-theme--dark .page-title-italic {
  color: rgb(var(--v-theme-primary-lighten-1));
}

.page-sub {
  font-size: 1rem;
  max-width: 60ch;
}

.header-actions {
  gap: 8px;
}
</style>
