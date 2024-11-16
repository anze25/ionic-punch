<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>{{ isEditing ? 'Uredi vnos' : 'Ustvari vnos' }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismissModal">Zapri</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content style="max-width: 300px;">
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
import { collection, addDoc, deleteDoc, doc, getDoc, getDocs, where, query } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ensure you have your Firebase configuration set up
import { IonButtons, IonHeader, IonTitle, IonToolbar, IonInput } from '@ionic/vue';
import { getAuth } from 'firebase/auth';

const isLoading = ref(false);

const props = defineProps({
  item: Object,
  isEditing: Boolean,


});


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
const auth = getAuth();
const user = auth.currentUser;
const loadingMessage = ref('Deleting data...');
const items = ref([]);
const allDescriptions = ref([]);

const loadItemsFromFirebase = async () => {
  isLoading.value = true;
  loadingMessage.value = 'Nalagam vpise...';

  try {
    if (!user) {
      console.error('No user is logged in.');
      return;
    }

    // Check if items are already in localStorage
    const cachedItems = localStorage.getItem('items');
    if (cachedItems) {
      items.value = JSON.parse(cachedItems);
      isLoading.value = false;
      return;
    }

    // Fetch items from Firebase
    const querySnapshot = await getDocs(collection(db, 'punches'));
    items.value = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => item.startTime && item.userId === user.uid) // Filter out items where startTime is null or empty and items not belonging to the logged-in user
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // Sort items by startTime

    // Store items in localStorage
    localStorage.setItem('items', JSON.stringify(items.value));

  } catch (error) {
    console.error('Error fetching items from Firebase:', error);
  }

  isLoading.value = false;
};

const loadDescriptions = async () => {
  allDescriptions.value = [];
  try {

    // Check if descriptions are already in localStorage
    const cachedDescriptions = localStorage.getItem('allDescriptions');
    if (cachedDescriptions) {
      console.log('Loaded descriptions from localStorage:', cachedDescriptions); // Debugging log
      allDescriptions.value = JSON.parse(cachedDescriptions);
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.error('No user is logged in.');
      allDescriptions.value = [];
      return;
    }

    // Fetch descriptions from Firebase for the logged-in user
    const q = query(collection(db, 'descriptions'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const descriptions = [];
    querySnapshot.forEach((doc) => {
      descriptions.push(doc.data().description);
    });

    const filteredDescriptions = descriptions.filter(desc => desc !== null && desc !== undefined);
    allDescriptions.value = filteredDescriptions.sort((a, b) => a.localeCompare(b));

    // Store descriptions in localStorage
    localStorage.setItem('allDescriptions', JSON.stringify(allDescriptions.value));
    console.log('Fetched and stored descriptions:', allDescriptions.value); // Debugging log
  } catch (error) {
    console.error('Error loading descriptions from Firebase:', error);
    allDescriptions.value = [];
  }
};

const saveDescription = async (newDescription) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.error('No user is logged in.');
      return;
    }

    await addDoc(collection(db, 'descriptions'), { description: newDescription, userId: user.uid });

    // Clear the localStorage cache
    localStorage.removeItem('allDescriptions');

    // Fetch the latest descriptions from Firebase
    loadDescriptions();
  } catch (error) {
    console.error('Error saving description to Firebase:', error);
  }
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
      // Fetch the correct document ID from Firebase
      const q = query(collection(db, 'punches'), where('userId', '==', user.uid), where('startTime', '==', props.item.startTime), where('endTime', '==', props.item.endTime));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const itemDoc = querySnapshot.docs[0].ref;
        await deleteDoc(itemDoc);
        console.log('Item deleted from Firebase:', itemDoc.id);

        // Add new item to Firebase
        await addDoc(collection(db, 'punches'), newItem);
        await saveDescription(newItem.description);
        console.log('New item added to Firebase:', newItem);

        // Update the items state
        items.value = items.value.map(item => item.id === props.item.id ? { ...newItem, id: itemDoc.id } : item);
      } else {
        console.error('Item not found for deletion:', props.item.id);
      }
    } else {
      // Add new item to Firebase
      const docRef = await addDoc(collection(db, 'punches'), newItem);
      await saveDescription(newItem.description);
      console.log('New item added to Firebase:', newItem);

      // Add the new item to the items state
      items.value.push({ ...newItem, id: docRef.id });
    }

    // Clear the localStorage cache
    localStorage.removeItem('items');

    // Fetch the latest items from Firebase
    await loadItemsFromFirebase();

    modalController.dismiss(newItem);
  } catch (error) {
    console.error('Error saving item to Firebase:', error);
    alert('Vnesi pravilno uro in datum.');
  }
};


</script>
