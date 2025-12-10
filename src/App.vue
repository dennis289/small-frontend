<template>
  <v-app>
    <v-layout>
      <navbar v-if="showNavbar"/>
    <v-main>
      <router-view />
    </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
import { computed} from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showNavbar = computed(() => {
  const publicPages = ['/login', '/signup'];
  return !publicPages.includes(router.currentRoute.value.path);
})
import navbar from './components/navbar.vue';
</script>
