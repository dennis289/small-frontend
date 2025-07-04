<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="h-100">
          <v-toolbar color="primary">
            <v-toolbar-title>
              <v-icon icon="mdi-account-group" class="mr-2"></v-icon>
              People
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <PeopleManager />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="h-100">
          <v-toolbar color="primary">
            <v-toolbar-title>
              <v-icon icon="mdi-account-cog" class="mr-2"></v-icon>
              Roles
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <RoleManager />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="h-100">
          <v-toolbar color="primary">
            <v-toolbar-title>
              <v-icon icon="mdi-clock" class="mr-2"></v-icon>
              Services
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <ServiceManager />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-toolbar color="primary">
            <v-toolbar-title>
              <v-icon icon="mdi-calendar" class="mr-2"></v-icon>
              Rosters
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <RosterGenerator />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<!-- No <script setup> needed for auto-imported components -->

<style scoped>
.h-100 {
  height: 100%;
}
</style>