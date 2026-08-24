<template>
  <section class="page-header-block mb-6">
    <!-- Breadcrumb: home > section > page, matching the reference layout. It
         orients you without the sidebar having to carry the whole burden. -->
    <nav v-if="crumbs.length > 0" class="d-flex align-center flex-wrap mb-4 crumbs">
      <v-icon class="crumb-home" size="16">mdi-home-outline</v-icon>
      <template v-for="(crumb, index) in crumbs" :key="index">
        <v-icon class="crumb-sep" size="14">mdi-chevron-right</v-icon>
        <span :class="index === crumbs.length - 1 ? 'crumb-current' : 'crumb-link'">
          {{ crumb }}
        </span>
      </template>
    </nav>

    <div class="d-flex align-start justify-space-between flex-wrap header-row">
      <div class="header-title-wrap">
        <h1 class="page-title">{{ fullTitle }}</h1>
        <p v-if="subtitle" class="page-sub mt-1">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="header-actions d-flex align-center flex-wrap">
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>

<script setup>
  /**
   * Page heading: breadcrumb, title, subtitle, and an actions slot.
   *
   * `eyebrow` and `italic` are kept for compatibility with pages written against
   * the previous editorial header — `eyebrow` now seeds the breadcrumb trail and
   * `italic` is appended to the title as ordinary text rather than a serif accent.
   */
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'

  const props = defineProps({
    eyebrow: { type: String, default: '' },
    title: { type: String, required: true },
    italic: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    // Pass an explicit trail to override the one derived from eyebrow + route.
    breadcrumbs: { type: Array, default: () => [] },
  })

  const route = useRoute()

  // Pages written against the old header split their heading across `title` and
  // `italic` ("Roster" + "generator"). Join them here rather than in the template,
  // where Vue's whitespace handling swallowed the separating space.
  const fullTitle = computed(() =>
    props.italic ? `${props.title} ${props.italic}` : props.title,
  )

  const crumbs = computed(() => {
    if (props.breadcrumbs.length > 0) return props.breadcrumbs
    // The route's name is the page; the eyebrow, where a page sets one, is the
    // section it belongs to.
    const page = route.name || props.title
    return props.eyebrow ? [props.eyebrow, page] : [page]
  })
</script>

<style scoped>
.crumbs {
  gap: 6px;
  color: rgb(var(--v-theme-on-surface-variant));
}
.crumb-home { opacity: .75; }
.crumb-sep { opacity: .5; }
.crumb-link,
.crumb-current {
  font-size: .875rem;
}
.crumb-current {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
}

.header-row { gap: 16px; }

.page-title {
  font-size: clamp(1.5rem, 2.4vw, 1.9rem);
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.page-sub {
  font-size: 1rem;
  max-width: 60ch;
  color: rgb(var(--v-theme-on-surface-variant));
}

.header-actions { gap: 8px; }
</style>
