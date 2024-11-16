<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Prijava / Registracija</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div
        v-if="isLogin"
        id="auth"
      >
        <h2>Vpis</h2>
        <ion-input
          v-model="loginEmail"
          type="email"
          placeholder="Email"
        ></ion-input>
        <ion-input
          v-model="loginPassword"
          type="password"
          placeholder="Geslo"
        ></ion-input>
        <ion-button @click="login">Vpiši se</ion-button>
        <p>Še nisi registriran? <ion-button
            fill="outline"
            @click="toggleForm"
          >Registriraj se<ion-icon
              slot="end"
              :icon="logInOutline"
            ></ion-icon></ion-button></p>
      </div>
      <div
        v-else
        id="auth"
      >
        <h2>Registracija</h2>
        <ion-input
          v-model="registerFirstName"
          type="text"
          placeholder="Ime"
        ></ion-input>
        <ion-input
          v-model="registerLastName"
          type="text"
          placeholder="Priimek"
        ></ion-input>
        <ion-input
          v-model="registerEmail"
          type="email"
          placeholder="Email"
        ></ion-input>
        <ion-input
          v-model="registerPassword"
          type="password"
          placeholder="Geslo"
        ></ion-input>
        <ion-button @click="register">Registriraj se</ion-button>
        <p>Si že registriran? <ion-button
            fill="outline"
            @click="toggleForm"
          >Vpiši se<ion-icon
              slot="end"
              :icon="logInOutline"
            ></ion-icon></ion-button></p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue';
import { IonButtons, IonMenuButton, IonPage, IonHeader, IonToolbar, IonTitle, IonInput, IonIcon } from '@ionic/vue';
import { logInOutline } from 'ionicons/icons';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebaseConfig'; // Ensure you have your Firebase configuration set up
import { useRouter } from 'vue-router';
import { collection, getDocs, query, where, } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const router = useRouter();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const user = auth.currentUser;

const punchinData = ref(null);
const isPunchinDisabled = ref(false);

const isLogin = ref(true);
const loginEmail = ref('');
const loginPassword = ref('');
const registerFirstName = ref('');
const registerLastName = ref('');
const registerEmail = ref('');
const registerPassword = ref('');

const toggleForm = () => {
  isLogin.value = !isLogin.value;
};

const login = async () => {
  try {
    punchinData.value = null;
    const userCredential = await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
    console.log('Logged in:', userCredential.user);
    // Fetch punchinData for the new user 
    await checkPunchinData();
    router.push('/'); // Navigate to home page after successful login
  } catch (error) {
    console.error('Error logging in:', error);
    alert(error.message);
  }
};

const register = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, registerEmail.value, registerPassword.value);
    console.log('Registered:', userCredential.user);
    // Update user profile with first and last name
    await updateProfile(userCredential.user, {
      displayName: `${registerFirstName.value} ${registerLastName.value}`
    });
    // Automatically log in the user after successful registration
    await loginAfterRegister(registerEmail.value, registerPassword.value);
  } catch (error) {
    console.error('Error registering:', error);
    alert(error.message);
  }
};
const loginAfterRegister = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Logged in after registration:', userCredential.user);
    router.push('/'); // Navigate to home page after successful login
  } catch (error) {
    console.error('Error logging in after registration:', error);
    alert(error.message);
  }
};

const checkPunchinData = async () => {

  if (!user) {
    console.error('No user is logged in.');
    punchinData.value = null;
    isPunchinDisabled.value = false;
    return;
  }

  try {
    // Fetch punchinData from Firebase for the logged-in user
    const q = query(collection(db, 'logsIn'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      console.log('Fetched data:', data); // Debugging log
      punchinData.value = data;
      isPunchinDisabled.value = true;

      // Check if startTime exists
      if (!punchinData.value.startTime) {
        console.error('startTime is undefined:', punchinData.value);
      }
    } else {
      punchinData.value = null;
      isPunchinDisabled.value = false;
    }
  } catch (error) {
    console.error('Error fetching punchinData from Firebase:', error);
    punchinData.value = null;
    isPunchinDisabled.value = false;
  }
};
</script>

<style scoped>
#auth {
  margin: 50px;
}
</style>
