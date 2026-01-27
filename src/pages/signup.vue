<template>

    <v-card class="mx-auto px-8 py-12 mt-8" max-width="700" elevation="2" style="border: 1px solid #e0e0e0;" outlined>
        <v-card-title class="text-h5 text-center mb-4 " color="grey darken-4">Register</v-card-title>
        <v-divider></v-divider>
        <v-card-text class="mt-4" color="grey darken-2" text-color="white">
            <p class="text-center">Please enter your credentials to register.</p>
        </v-card-text>
        <v-form v-model="form" @submit.prevent="onSubmit">
            <v-text-field color="grey darken-2" v-model="fullname" :readonly="loading" :rules="[required]" class="mb-4"
                label="Full Name" density="compact" variant="outlined" clearable></v-text-field>

            <v-text-field color="grey darken-2" v-model="email" :readonly="loading" :rules="[required]" class="mb-4"
                label="Email" density="compact" variant="outlined" clearable></v-text-field>

             <v-text-field
            color="grey darken-2"
            v-model="password"
            :rules="[required, matchPassword]"
            :type="showPassword ? 'text' : 'password'"
            class="mb-4"
            label="Password"
            density="compact"
            variant="outlined"
            clearable
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="showPassword = !showPassword"
        ></v-text-field>

            <v-text-field color="grey darken-2" v-model="confirmPassword" :rules="[required, matchPassword]"
                :type="showPassword ? 'text' : 'password'" class="mb-4" label="Confirm Password" density="compact"
                variant="outlined" clearable></v-text-field>

        <v-spacer></v-spacer>
            <v-btn
            :disabled="!form"
            :loading="loading"
            color="success"
            size="large"
            type="submit"
            variant="elevated"
            density="compact"
            block
            to ="/login"
            >Register</v-btn> 
            <br/>
            <div>
                <span>Already registered?</span>
                <v-btn variant="text" to="/login" class="ml-2" color="primary">
                    Click here to sign in
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
const fullname = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const email = ref('');
const confirmPassword = ref('');
const matchPassword = (value) => {
    return value === password.value || 'Passwords do not match';
};


async function onSubmit() {
    if (!form.value)
        return
    loading.value = true;
    try {
        const response = await axios.post('http://localhost:8000/api/signup/', {
            username: email.value,
            fullname: fullname.value,
            email: email.value,
            password: password.value,
            confirmPassword: confirmPassword.value
        });
        
        fullname.value = '';
        email.value = '';
        password.value = '';
        confirmPassword.value = '';
        console.log('Sign up successful:', response.data);

        router.push('/login');

    }
    catch (error) {
        console.error('Sign up failed:', error);
    }
    finally {
        loading.value = false;
    }
}
function required(value) {
    return !!value || 'Field is required'
}
</script>
