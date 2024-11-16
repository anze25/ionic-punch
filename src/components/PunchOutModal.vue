<!-- PunchOutModal.vue -->
<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Add Punchout</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismissModal">Close</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @submit.prevent="confirmPunchout">
      <ion-item>
        <ion-label position="stacked">Datum odhoda</ion-label>
        <ion-input
          type="date"
          :value="endDate"
          @ionChange="e => endDate = e.detail.value"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Ura odhoda</ion-label>
        <ion-input
          type="time"
          :value="endTime"
          @ionChange="e => endTime = e.detail.value"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Opis dela</ion-label>
        <ion-input
          :value="description"
          @ionChange="e => description = e.detail.value"
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
import { db } from '../firebaseConfig';

const auth = getAuth();
const user = auth.currentUser;

const endDate = ref('');
const endTime = ref('');
const description = ref('');

const dismissModal = () => {
  modalController.dismiss();
};

const confirmPunchout = async () => {
  const punchinData = JSON.parse(localStorage.getItem('punchinData'));
  if (!punchinData) {
    alert('No punchin data found.');
    return;
  }
  if (!user) {
    alert('No user is logged in.');
    return;
  }
  const newItem = {
    description: description.value,
    endTime: new Date(`${endDate.value}T${endTime.value}`).toISOString(),
    startTime: new Date(`${punchinData.startDate}T${punchinData.startTime}`).toISOString(),
    userId: user.uid,
  };

  try {
    // Save the new item to Firestore

    const docRef = await addDoc(collection(db, 'punches'), newItem);
    console.log('Document written with ID: ', docRef.id);

    // update Localstorage
    const items = JSON.parse(localStorage.getItem('items')) || [];
    items.push({ id: docRef.id, ...newItem });
    localStorage.setItem('items', JSON.stringify(items));

    modalController.dismiss(newItem);
  } catch (error) {
    console.error('Error adding document: ', error);
    alert('Error saving data to Firebase.');
  }
};
</script>
