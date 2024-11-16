<!-- PunchInModal.vue -->
<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Add Punchin</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismissModal">Close</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @submit.prevent="confirmPunchin">
      <ion-item>
        <ion-label position="stacked">Datum prihoda</ion-label>
        <ion-input
          type="date"
          :value="startDate"
          @ionChange="e => startDate = e.detail.value"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Ura prihoda</ion-label>
        <ion-input
          type="time"
          :value="startTime"
          @ionChange="e => startTime = e.detail.value"
        ></ion-input>
      </ion-item>
      <ion-button
        expand="full"
        type="submit"
      >Confirm</ion-button>
    </form>
  </ion-content>
</template>

<script setup>
import { ref } from 'vue';
import { modalController } from '@ionic/vue';
import { getAuth } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust the import according to your project structure

const auth = getAuth();
const user = auth.currentUser;

const startDate = ref('');
const startTime = ref('');

const dismissModal = () => {
  modalController.dismiss();
};

const confirmPunchin = async () => {
  const punchinData = {
    loggedIn: true,
    startDate: startDate.value,
    startTime: startTime.value,
    userId: user.uid
  };
  try {
    // Save the punchinData to Firestore
    const docRef = await addDoc(collection(db, 'logsIn'), punchinData);
    console.log('Document written with ID: ', docRef.id);

    // Optionally, you can update the localStorage with the new punchinData
    localStorage.setItem('punchinData', JSON.stringify(punchinData));

    modalController.dismiss(punchinData);
  } catch (error) {
    console.error('Error adding document: ', error);
    alert('Error saving data to Firebase.');
  }
};
</script>
