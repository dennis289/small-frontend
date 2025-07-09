<template>
  <v-app>
    <v-layout>
      <navbar/>
    <v-main>
      <router-view />
    </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
import navbar from './components/navbar.vue';
</script>
