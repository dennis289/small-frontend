<template>
  <v-app>
    <v-app-bar color="primary" dark app>
      <v-toolbar-title>My Dashboard</v-toolbar-title>
    </v-app-bar>
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="dashboard-card" @click="goTo('/people')">
              <v-card-title>
                <v-icon icon="mdi-account-group" class="mr-2"></v-icon>
                People
              </v-card-title>
              <v-card-text>
                Manage and view all people.
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="dashboard-card" @click="goTo('/roles')">
              <v-card-title>
                <v-icon icon="mdi-account-cog" class="mr-2"></v-icon>
                Roles
              </v-card-title>
              <v-card-text>
                Manage user roles and permissions.
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="dashboard-card" @click="goTo('/services')">
              <v-card-title>
                <v-icon icon="mdi-clock" class="mr-2"></v-icon>
                Services
              </v-card-title>
              <v-card-text>
                Manage available services.
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="dashboard-card" @click="goTo('/rosters')">
              <v-card-title>
                <v-icon icon="mdi-calendar" class="mr-2"></v-icon>
                Rosters
              </v-card-title>
              <v-card-text>
                Generate and view rosters.
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

function goTo(path) {
  router.push(path);
}
</script>

<style scoped>
.dashboard-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.dashboard-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
</style>