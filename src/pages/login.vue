<template>
   
        <v-card class="mx-auto px-8 py-12 mt-8" 
        max-width="500" elevation="2"  
        style="border: 1px solid #e0e0e0;"
        outlined
         >
            <v-card-title class="text-h5 text-center mb-4 " color="grey darken-4">Log In</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="mt-4" color="grey darken-2" text-color="white">
                <p class="text-center">Please enter your credentials to register.</p>
            </v-card-text>
           <v-form 
           ref="form"
           @submit.prevent="onSubmit"
           class="d-flex flex-column gap-2"
            >
            <v-text-field
            v-model="email"
            color="grey darken-2"
            :readonly="loading"
            :rules="[required]"
            class="mb-4"
            label="Username or Email"
            density="compact"
            variant="outlined"
            clearable
            ></v-text-field>

            <v-text-field
            color="grey darken-2"
            v-model="password"
            
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            class="mb-4"
            density="compact"
            variant="outlined"
            clearable
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="showPassword = !showPassword"
            @keyup.enter="onSubmit"
        ></v-text-field>
        <v-spacer></v-spacer>
            <v-btn
            :disabled="!form"
            :loading="loading"
            color="success"
            size="large"
            type="submit"
            variant="elevated"
            density="compact"
            class="w-30"
            block
            
            >Sign in</v-btn> 
            <br/>
            <div>
        <span>Not signed up?</span>
        <v-btn variant="text" to="/signup" class="ml-2" color="primary">
          Click here to sign up
          </v-btn>
        </div>
        </v-form>
        </v-card>
    
</template>
<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const form = ref(null);
const loading = ref(false);
const showPassword = ref(false);
const password = ref('');
const email = ref('');

async function onSubmit() {
    const { valid } = await form.value.validate();
    if (!valid) return;
    loading.value = true;
    try {
        const response = await axios.post('http://localhost:8000/api/login/', {
            email: email.value,
            password: password.value
        });
        // store the token 
        if (response.data.token || response.data.access) {
            localStorage.setItem('auth_token', response.data.token || response.data.access);
        }

        email.value = '';
        loading.value = false;
        password.value = '';
        console.log('Login successful:', response.data);
        router.push('/home');
    } catch (error) {
        loading.value = false;
        console.error('Login failed:', error);
    } finally {
        loading.value = false;
    }
}

function required(value){
    return !!value || 'Field is required'
}

</script>
