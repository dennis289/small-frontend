<template>
  <v-card>
    <v-layout>
      <v-navigation-drawer
        v-model="drawer"
        :rail="rail"
        permanent
        @click="rail = false"
      >
        <v-list>
          <v-list-item
            prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg"
            title="John Leider"
          >
            <template v-slot:append>
              <v-btn
                icon="mdi-chevron-left"
                variant="text"
                @click.stop="rail = !rail"
              ></v-btn>
            </template>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-home-city"
            title="Home"
            value="home"
            @click="router.push('/home')"
          ></v-list-item>
      
          <v-list-item
            prepend-icon="mdi-account-group-outline"
            title="People"
            value="people"
            @click="router.push('/people')"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-briefcase"
            title="Roles"
            value="roles"
            @click="router.push('/roles')"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-clock-outline"
            title="Services"
            value="services"
            @click="router.push('/services')"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-sun-clock"
            title="Rosters"
            value="rosters"
            @click="router.push('/rosters')"
          ></v-list-item>


        </v-list>
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
</script>