<template>
  <v-card
  :width="drawerWidth"
  height="100vh"
  class="d-flex flex-column pa-2"
  >
    <v-layout>
      <v-navigation-drawer
        floating
        permanent
        :width="drawerWidth"
        height="100vh"
      >
        <v-list
          density="compact"
          nav
        >
          <v-list-item prepend-icon="mdi-view-dashboard" title="Home" value="home"></v-list-item>
          <v-list-item prepend-icon="mdi-forum" title="About" value="about"></v-list-item>
        </v-list>
      </v-navigation-drawer>
      <v-main style="height: 250px"></v-main>
    </v-layout>
  </v-card>
</template>
<script setup>
import { ref } from 'vue';
const drawerWidth = ref(150);
</script>