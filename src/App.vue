<template>
  <v-app>
    <v-layout>
      <navbar v-if="showNavbar"/>
    <v-main>
      <router-view />
      <Toaster position="bottom-left" theme="system"/>
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
import { Toaster } from 'vue-sonner';
import 'vue-sonner/style.css';
</script>
