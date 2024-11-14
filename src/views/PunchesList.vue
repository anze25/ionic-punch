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
        <ion-fab-button @click="openNewModal">
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
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
                      @click="deleteItem(index)"
                    >Delete</ion-button>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-item>
        </ion-list>
        <ion-modal ref="modal">
          <ion-header>
            <ion-toolbar>
              <ion-buttons slot="start">
                <ion-button @click="cancel()">Cancel</ion-button>
              </ion-buttons>
              <ion-title>Uredi vnos</ion-title>
              <ion-buttons slot="end">
                <ion-button
                  :strong="true"
                  @click="confirm()"
                >Potrdi</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <ion-item>
              <h5>Prihod: </h5>
              <input
                class="custom-input"
                :value="formattedStartTime"
                @input="updateStartTime($event.target.value)"
                type="text"
              />
            </ion-item>
            <ion-item>
              <h5>Odhod: </h5>
              <input
                class="custom-input"
                :value="formattedEndTime"
                @input="updateEndTime($event.target.value)"
                type="text"
              />
            </ion-item>
            <ion-item>
              <h5>Opis dela: </h5>
              <input
                class="custom-input"
                v-model="editedItem.description"
                type="text"
              />
            </ion-item>

          </ion-content>
        </ion-modal>


        <ion-modal :keep-contents-mounted="true">
          <ion-datetime
            id="start-datetime"
            presentation="date-time"
            v-model="editedItem.startTime"
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
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { modalController } from '@ionic/vue';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonModal, IonFab, IonFabButton, IonIcon, IonList, IonCard, IonCardContent, IonDatetime, IonInfiniteScroll, IonInfiniteScrollContent, } from '@ionic/vue';
import { add } from 'ionicons/icons';
import ModalComponent from '../components/ModalComponent.vue';

const items = ref([]);
const editedItem = ref({
  startTime: '2024-08-03T04:05:00.000Z', // Example initial value
  endTime: '2023-11-02T01:22:00', // Example initial value
});
const editedIndex = ref(null);

const formattedStartTime = computed(() => {
  const date = new Date(editedItem.value.startTime);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
});

const formattedEndTime = computed(() => {
  const date = new Date(editedItem.value.endTime);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
});

const updateStartTime = (value) => {
  const [datePart, timePart] = value.split(' ');
  const [day, month, year] = datePart.split('.');
  const [hours, minutes] = timePart.split(':');
  editedItem.value.startTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`).toISOString();
};
const updateEndTime = (value) => {
  const [datePart, timePart] = value.split(' ');
  const [day, month, year] = datePart.split('.');
  const [hours, minutes] = timePart.split(':');
  editedItem.value.endTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`).toISOString();
};

const loadItemsFromLocalStorage = () => {
  const storedItems = localStorage.getItem('items');
  if (storedItems) {
    items.value = JSON.parse(storedItems)
      .filter(item => item.startTime) // Filter out items where startTime is null or empty
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // Sort items by startTime
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

  const hours = Math.floor(overtime / (1000 * 60 * 60));
  const minutes = Math.floor((overtime % (1000 * 60 * 60)) / (1000 * 60));

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const openNewModal = async (item = null, isEditing = false) => {
  const modal = await modalController.create({
    component: ModalComponent,
    componentProps: {
      item,

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

const confirm = async () => {
  items.value[editedIndex.value] = { ...editedItem.value }; // Update the item
  saveItemsToLocalStorage(items.value); // Save the items to local storage
  const modal = document.querySelector('ion-modal');
  if (modal) {
    await modal.dismiss({
      'dismissed': true,
      'role': 'confirm'
    });
    console.log(modal.dismiss.role);

    console.log('Confirm clicked and modal dismissed'); // Log when confirm is clicked and modal is dismissed

  } else {
    console.log('Modal not found'); // Log if modal is not found
  }
};

const cancel = async () => {
  const modal = document.querySelector('ion-modal');
  if (modal) {
    await modal.dismiss();
    console.log('Cancel clicked and modal dismissed'); // Log when cancel is clicked and modal is dismissed
  } else {
    console.log('Modal not found'); // Log if modal is not found
  }
};


const saveItemsToLocalStorage = (newItems) => {
  localStorage.setItem('items', JSON.stringify(newItems));
};


const deleteItem = (index) => {
  items.value.splice(index, 1);
  saveItemsToLocalStorage(items.value);
};

onMounted(() => {
  loadItemsFromLocalStorage();
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
</style>
