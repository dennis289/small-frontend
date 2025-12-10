<template>
  <v-card>
    <v-layout>
      <v-navigation-drawer
        v-model="drawer"
        :rail="rail"
        permanent
      >
        <v-list dense nav class="flex-grow-1">
          <v-tooltip text="Account">
            <template #activator="{props}">
             <v-list-item
             prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg">
              <v-btn
                icon="mdi-chevron-left"
                variant="text"
                v-bind="props"
              ></v-btn>
          </v-list-item>
            </template>
          </v-tooltip>
        </v-list>

        <v-divider></v-divider>

        <v-list density="compact" nav>


          <v-tooltip text="Home" >
          <template #activator="{props}">
            <v-list-item
            prepend-icon="mdi-home-city"
            value="home"
            v-bind="props"
            @click="router.push('/home')"
          ></v-list-item>
          </template>
          </v-tooltip>
      
          <v-divider></v-divider>
          <v-tooltip text="People" >
          <template #activator="{props}">
            <v-list-item
            prepend-icon="mdi-account-group-outline"
            value="people"
            v-bind="props"
            @click="router.push('/people')"
          ></v-list-item>
          </template>
          </v-tooltip>
          
           <v-divider></v-divider>
          <v-tooltip text="Roles" >
          <template #activator="{props}">
            <v-list-item
            prepend-icon="mdi-briefcase"
            value="roles"
            v-bind="props"
            @click="router.push('/roles')"
          ></v-list-item>
          </template>
          </v-tooltip>

          <v-divider></v-divider>
          <v-tooltip text="Event" >
          <template #activator="{props}">
            <v-list-item
            prepend-icon="mdi-calendar-star"
            value="services"
            v-bind="props"
            @click="router.push('/services')"
          ></v-list-item>
          </template>
          </v-tooltip>

          <v-divider></v-divider>
          <v-tooltip text="Rosters" >
          <template #activator="{props}">
            <v-list-item
            prepend-icon="mdi-sun-clock"
            value="rosters"
            v-bind="props"
            @click="router.push('/rosters')"
          ></v-list-item>
          </template>
          </v-tooltip>
      
        </v-list>

        <div class="mt-auto"></div>
          <v-divider></v-divider>
          <v-tooltip text="Logout" >
          <template #activator="{props}">
            <v-list-item
            prepend-icon="mdi-logout"
            value="logout"
            v-bind="props"
            @click="logout"
          ></v-list-item>
          </template>
          </v-tooltip>

       
      </v-navigation-drawer>
      <v-main style="height: 100vh"></v-main>
    </v-layout>
  </v-card>
</template>
<script setup>
  import { ref } from 'vue'
import { useRouter } from 'vue-router'
  const drawer = ref(true)
  const router = useRouter()
  const rail = ref(true)

  function logout() {
    localStorage.removeItem('auth_token')
    router.push('/login')
  }
</script>