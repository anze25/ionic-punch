<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Pregled vnosov</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-fab
        vertical="bottom"
        horizontal="center"
        slot="fixed"
      >
        <div style="display: flex; justify-content: center; gap: 20px;">
          <ion-fab-button @click="openNewModal">
            <ion-icon :icon="add"></ion-icon>
          </ion-fab-button>
          <ion-fab-button
            color="danger"
            @click="confirmDeleteAll"
          >
            <ion-icon :icon="trash"></ion-icon>
          </ion-fab-button>
        </div>
      </ion-fab>

      <div>
        <ion-list>
          <ion-item
            v-for="(item, index) in items"
            :key="item.startTime"
          >
            <ion-card class="full-width">
              <ion-card-content>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong>Datum: </strong>{{ formatDate(item.startTime) }}<br>
                    <strong>Prihod: </strong>{{ formatTime(item.startTime) }} <strong>Odhod: </strong>{{
                      formatTime(item.endTime) }}<br>
                    <strong>Opis: </strong>{{ item.description }}<br>
                    <strong>Trajanje: </strong>{{ calculateDuration(item.startTime, item.endTime) }} <strong>Nadure:
                    </strong>{{ calculateOvertime(item.startTime, item.endTime) }}
                  </div>
                  <div>
                    <ion-button @click="openNewModal(item, true)">Edit</ion-button>
                    <ion-button
                      color="danger"
                      @click="handleDelete(index)"
                    >Delete</ion-button>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-item>
        </ion-list>


        <ion-modal :keep-contents-mounted="true">
          <ion-datetime
            id="start-datetime"
            presentation="date-time"
            v-model="editedItem.startTimef"
          ></ion-datetime>
        </ion-modal>

        <ion-modal :keep-contents-mounted="true">
          <ion-datetime
            id="end-datetime"
            presentation="date-time"
            v-model="editedItem.endTime"
          ></ion-datetime>
        </ion-modal>

        <ion-infinite-scroll
          threshold="100px"
          @ionInfinite="loadMoreData"
        >
          <ion-infinite-scroll-content
            loadingSpinner="bubbles"
            loadingText="Loading more data..."
          >
          </ion-infinite-scroll-content>
        </ion-infinite-scroll>

      </div>
      <ion-loading
        :is-open="isLoading"
        :message="loadingMessage"
        spinner="circles"
      ></ion-loading>

      <!-- Progress Bar -->
      <div
        v-if="isDeleting"
        class="progress-bar-container"
      > <ion-progress-bar
          :value="progress"
          type="determinate"
          color="danger"
        ></ion-progress-bar> </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { modalController } from '@ionic/vue';
import { IonButtons, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonModal, IonFab, IonFabButton, IonIcon, IonList, IonCard, IonCardContent, IonDatetime, IonInfiniteScroll, IonInfiniteScrollContent, } from '@ionic/vue';
import { add, trash } from 'ionicons/icons';
import ModalComponent from '../components/ModalComponent.vue';

import { collection, getDocs, deleteDoc, doc, } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const items = ref([]);

const isLoading = ref(false);
const isDeleting = ref(false);
const progress = ref(0);
const loadingMessage = ref('Deleting data...');

const editedItem = ref({
  startTime: '2024-08-03T04:05:00.000Z', // Example initial value
  endTime: '2023-11-02T01:22:00', // Example initial value
});

const confirmDeleteAll = async () => {
  const confirmed = window.confirm('Ali ste prepričani, da želite izbrisati vse vnose? Tega dejanja ni mogoče razveljaviti.');
  if (confirmed) {
    isLoading.value = true; // Show the loading spinner
    isDeleting.value = true; // Show the progress bar
    progress.value = 0; // Reset progress
    loadingMessage.value = 'Brisanje vnosov...';

    try {
      const querySnapshot = await getDocs(collection(db, 'punches'));
      const totalDocs = querySnapshot.size;
      let deletedCount = 0;

      for (const document of querySnapshot.docs) {
        await deleteDoc(doc(db, 'punches', document.id));
        deletedCount++;
        progress.value = deletedCount / totalDocs; // Update progress
      }

      loadItemsFromFirebase();
      console.log('All punches deleted from Firebase');
    } catch (error) {
      console.error('Error deleting punches from Firebase:', error);
    }

    isLoading.value = false; // Hide the loading spinner
    isDeleting.value = false; // Hide the progress bar

  }
};

const loadItemsFromFirebase = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'punches'));
    items.value = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => item.startTime) // Filter out items where startTime is null or empty 
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // Sort items by startTime 

  } catch (error) {
    console.error('Error fetching items from Firebase:', error);
  }
};

const loadMoreData = (event) => {
  console.log('Current items length:', items.value.length);

  // Assuming you have a totalItems array that contains all the items you want to load
  const totalItems = items.value.length; // Replace this with the actual total number of items you have

  if (items.value.length >= totalItems) {
    console.log('Disabling infinite scroll');
    event.target.disabled = true;
    event.target.complete();
    return;
  }

  setTimeout(() => {
    const remainingItems = totalItems - items.value.length;
    const itemsToAdd = remainingItems > 20 ? 20 : remainingItems;
    const newItems = Array.from({ length: itemsToAdd }, (_, i) => ({ id: items.value.length + i, name: `Item ${items.value.length + i + 1}` }));
    items.value = [...items.value, ...newItems];
    event.target.complete();

    console.log('New items length:', items.value.length);

    // Disable infinite scroll if all data is loaded
    if (items.value.length >= totalItems) {
      console.log('Disabling infinite scroll after loading more data');
      event.target.disabled = true;
    }
  }, 500);
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('sl-SI'); // Adjust locale as needed
};
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });
};

const calculateDuration = (startTime, endTime) => {
  const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60); // Convert milliseconds to hours
  const hours = Math.floor(duration);
  const minutes = Math.round((duration - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const calculateOvertime = (startTime, endTime) => {
  const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
  const startDate = new Date(startTime);
  const dayOfWeek = startDate.getDay();

  let overtime;
  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
    overtime = duration - 28800000; // 8 hours in milliseconds
  } else { // Saturday and Sunday
    overtime = duration;
  }
  // If overtime is negative, set it to 00:00 
  if (overtime < 0) {
    overtime = 0;
  }

  const hours = Math.floor(overtime / (1000 * 60 * 60));
  const minutes = Math.floor((overtime % (1000 * 60 * 60)) / (1000 * 60));

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const openNewModal = async (item = null, isEditing = false) => {
  const modal = await modalController.create({
    component: ModalComponent,
    componentProps: {
      item,
      isEditing
    },
  });

  modal.onDidDismiss().then((data) => {
    if (data.data) {
      if (isEditing) {
        const index = items.value.findIndex((i) => i === item);
        if (index !== -1) {
          items.value[index] = data.data;
        }
      } else {
        items.value.push(data.data);
      }
    }
    saveItemsToLocalStorage(items.value);
  });


  return await modal.present();
};


const saveItemsToLocalStorage = (newItems) => {
  localStorage.setItem('items', JSON.stringify(newItems));
};


const deleteItem = async (itemId) => {
  try {
    // Delete the item from Firebase
    await deleteDoc(doc(db, 'punches', itemId));
    console.log('Item deleted from Firebase:', itemId);

    // Update local state
    items.value = items.value.filter(item => item.id !== itemId);
  } catch (error) {
    console.error('Error deleting item from Firebase:', error);
  }
};

const handleDelete = (index) => {
  const itemToDelete = items.value[index];
  if (itemToDelete) {
    deleteItem(itemToDelete.id);
  } else {
    console.error('Item not found at index:', index);
  }
};




onMounted(() => {
  loadItemsFromFirebase();
});
</script>

<style scoped>
.full-width {
  width: 100%;
}

.custom-input {
  padding: 8px 16px;
  margin-left: 5px;
  font-size: 16px;
  border: 1px solid var(--ion-border-color, #ccc);
  border-radius: 4px;
  background-color: var(--ion-background-color, #fff);
  color: var(--ion-text-color, #000);
  box-shadow: var(--ion-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
  transition: border-color 0.3s, box-shadow 0.3s;
}

.custom-input:focus {
  border-color: var(--ion-color-primary, #3880ff);
  box-shadow: 0 0 0 2px var(--ion-color-primary, #3880ff);
  outline: none;
}

.progress-bar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 10px;
  background-color: white;
  z-index: 1000;
}
</style>
