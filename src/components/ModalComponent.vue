<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>{{ isEditing ? 'Uredi vnos' : 'Ustvari vnos' }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismissModal">Zapri</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @submit.prevent="saveItem">
      <ion-item>
        <ion-label position="stacked">Datum prihoda</ion-label>
        <ion-input
          type="date"
          :value="formattedStartDate"
          @ionChange="e => startDate = e.detail.value"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Ura prihoda</ion-label>
        <ion-input
          type="time"
          :value="formattedStartTime"
          @ionChange="e => startTime = e.detail.value"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Datum odhoda</ion-label>
        <ion-input
          type="date"
          :value="formattedEndDate"
          @ionChange="e => endDate = e.detail.value"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Ura odhoda</ion-label>
        <ion-input
          type="time"
          :value="formattedEndTime"
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
      >{{ isEditing ? 'Shrani' : 'Ustvari' }}</ion-button>
    </form>
  </ion-content>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { modalController } from '@ionic/vue';
import { collection, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ensure you have your Firebase configuration set up
import { IonButtons, IonHeader, IonTitle, IonToolbar } from '@ionic/vue';
import { getAuth } from 'firebase/auth';


const props = defineProps({
  item: Object,
  isEditing: Boolean,
});
console.log(props.item.startTime);

const startDate = ref(props.item?.startTime ? new Date(props.item.startTime).toISOString().split('T')[0] : '');
const startTime = ref(props.item?.startTime ? new Date(props.item.startTime).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false }) : '');
const endDate = ref(props.item?.endTime ? new Date(props.item.endTime).toISOString().split('T')[0] : '');
const endTime = ref(props.item?.endTime ? new Date(props.item.endTime).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false }) : '');
const description = ref(props.item?.description || '');


const formattedStartDate = computed(() => startDate.value);
const formattedStartTime = computed(() => startTime.value);
const formattedEndDate = computed(() => endDate.value);
const formattedEndTime = computed(() => endTime.value);

watch(() => props.item, (newItem) => {
  startDate.value = newItem?.startTime ? new Date(newItem.startTime).toLocaleDateString("en-US", { timeZone: "Europe/Ljubljana" }) : '';
  startTime.value = newItem?.startTime ? new Date(newItem.startTime).toLocaleTimeString("en-US", { timeZone: "Europe/Ljubljana", hour: '2-digit', minute: '2-digit', hour12: false }) : '';
  endDate.value = newItem?.endTime ? new Date(newItem.endTime).toLocaleDateString("en-US", { timeZone: "Europe/Ljubljana" }) : '';
  endTime.value = newItem?.endTime ? new Date(newItem.endTime).toLocaleTimeString("en-US", { timeZone: "Europe/Ljubljana", hour: '2-digit', minute: '2-digit', hour12: false }) : '';
  description.value = newItem?.description || '';
});

const dismissModal = () => {
  modalController.dismiss();
};

const saveItem = async () => {

  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      alert('No user is logged in.');
      return;
    }

    const newItem = {
      description: description.value,
      endTime: new Date(`${endDate.value}T${endTime.value}`).toISOString(),
      startTime: new Date(`${startDate.value}T${startTime.value}`).toISOString(),
      userId: user.uid,
    };

    if (props.isEditing && props.item) {
      // Delete existing item in Firebase
      const itemDoc = doc(db, 'punches', props.item.id);
      const itemSnapshot = await getDoc(itemDoc);

      if (itemSnapshot.exists()) {
        await deleteDoc(itemDoc);
        console.log('Item deleted from Firebase:', props.item.id);

        // Add new item to Firebase
        await addDoc(collection(db, 'punches'), newItem);
        console.log('New item added to Firebase:', newItem);
      } else {
        console.error('Item not found for deletion:', props.item.id);
      }
    } else {
      // Add new item to Firebase
      await addDoc(collection(db, 'punches'), newItem);
      console.log('New item added to Firebase:', newItem);
    }

    modalController.dismiss(newItem);
  } catch (error) {
    console.error('Error saving item to Firebase:', error);
    alert('Vnesi pravilno uro in datum.');
  }


};
</script>
