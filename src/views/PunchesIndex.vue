<template>

  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Registracija delovnega časa</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">


      <div id="container">
        <ion-grid>
          <ion-row>
            <ion-col size="6">
              <ion-button
                shape="round"
                size="large"
                :disabled="isPunchinDisabled"
                expand="block"
                @click="openPunchInModal"
              >Vnesi prihod</ion-button>
            </ion-col>
            <ion-col size="6">
              <ion-button
                shape="round"
                size="large"
                :disabled="!isPunchinDisabled"
                expand="block"
                @click="openPunchOutModal"
              >Vnesi odhod</ion-button>
            </ion-col>
          </ion-row>
          <ion-row>
            <ion-col size="6">
              <ion-button
                shape="round"
                size="large"
                :disabled="isPunchinDisabled"
                expand="block"
                @click="punchIn"
              >Prihod</ion-button>
            </ion-col>
            <ion-col size="6">
              <ion-button
                shape="round"
                size="large"
                :disabled="!isPunchinDisabled"
                expand="block"
                @click="punchOut"
              >Odhod</ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>

        <ion-grid v-if="isPunchinDisabled">
          <ion-row>
            Začetek dela: <ion-badge>{{ punchinData.startTime }}</ion-badge>
          </ion-row>
          <ion-row>Trajanje: <ion-badge>{{ timeElapsed }}</ion-badge></ion-row>
          <ion-row>
            <ion-item>
              <ion-label position="stacked">Opis dela:</ion-label>
              <ion-select
                :value="description"
                @ionChange="handleDescriptionChange"
                interface="popover"
              >
                <ion-select-option value="new">Dodaj novo...</ion-select-option>
                <ion-select-option
                  v-for="desc in allDescriptions"
                  :key="desc"
                  :value="desc"
                >
                  {{ desc }}
                </ion-select-option>

              </ion-select>
            </ion-item>

            <ion-col></ion-col>
          </ion-row>
        </ion-grid>

      </div>
    </ion-content>
  </ion-page>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonBadge, IonGrid, IonSelect, IonSelectOption } from '@ionic/vue';
import PunchInModal from '../components/PunchInModal.vue';
import PunchOutModal from '../components/PunchOutModal.vue';
import { modalController } from '@ionic/vue';

const items = ref([]);

const isPunchinDisabled = ref(false);
const isPunchoutDisabled = ref(true);

const punchinData = ref(null);
const description = ref('');
const allDescriptions = ref([]);

const checkPunchinData = () => {
  const data = localStorage.getItem('punchinData');
  if (data) {
    punchinData.value = JSON.parse(data);
    isPunchinDisabled.value = true;
  } else {
    punchinData.value = null;
    isPunchinDisabled.value = false;
  }


};

const timeElapsed = computed(() => {
  if (!punchinData.value) return '';
  const startTime = new Date(`${punchinData.value.startDate}T${punchinData.value.startTime}`);
  const now = new Date();
  const diff = now - startTime;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
});

const saveItemsToLocalStorage = (newItems) => {
  localStorage.setItem('items', JSON.stringify(newItems));
};
const loadItemsFromLocalStorage = () => {
  const storedItems = localStorage.getItem('items');
  if (storedItems) {
    items.value = JSON.parse(storedItems);
  }
};

const openPunchInModal = async () => {
  const modal = await modalController.create({
    component: PunchInModal,
  });

  modal.onDidDismiss().then((data) => {
    if (data.data) {
      console.log('Punchin Data:', data.data);
      isPunchinDisabled.value = true;
      isPunchoutDisabled.value = false;
    }
    checkPunchinData();
  });

  return await modal.present();
};

const openPunchOutModal = async () => {
  const modal = await modalController.create({
    component: PunchOutModal,
  });

  modal.onDidDismiss().then((data) => {
    if (data.data) {
      items.value.push(data.data);
      console.log('Punchout Data:', data.data);
      saveItemsToLocalStorage(items.value);
      localStorage.removeItem('punchinData');
      isPunchoutDisabled.value = true;
      isPunchinDisabled.value = false;
    }
    checkPunchinData();
  });

  return await modal.present();
};

const punchIn = () => {
  const now = new Date();
  const startDate = now.toLocaleDateString('en-CA'); // Format as YYYY-MM-DD
  const startTime = now.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' }); // Format as HH:mm



  const punchinData = {
    loggedIn: true,
    startDate,
    startTime,
  };

  localStorage.setItem('punchinData', JSON.stringify(punchinData));
  isPunchinDisabled.value = true;
  console.log('Punchin Data:', punchinData);

  checkPunchinData();
};

const punchOut = () => {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const endTime = now.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' }); // Format as HH:mm

  const punchinData = JSON.parse(localStorage.getItem('punchinData'));
  if (!punchinData) {
    alert('No punchin data found.');
    return;
  }

  const newItem = {
    description: description.value,
    endTime: new Date(`${endDate}T${endTime}`).toISOString(),
    startTime: new Date(`${punchinData.startDate}T${punchinData.startTime}`).toISOString(),
  };

  items.value.push(newItem);
  saveItemsToLocalStorage(items.value);
  localStorage.removeItem('punchinData');
  isPunchinDisabled.value = false;
  console.log('Punchout Data:', newItem);
  checkPunchinData();

};

const loadDescriptions = () => {
  const storedDescriptions = localStorage.getItem('allDescriptions');
  if (storedDescriptions) {
    try {
      const parsedDescriptions = JSON.parse(storedDescriptions);
      console.log('Parsed Descriptions:', parsedDescriptions);
      const filteredDescriptions = parsedDescriptions.filter(desc => desc !== null && desc !== undefined);
      allDescriptions.value = filteredDescriptions.sort((a, b) => a.localeCompare(b));
      console.log('All Descriptions:', allDescriptions.value);
    } catch (error) {
      console.error('Error parsing descriptions:', error);
    }
  } else {
    console.log('No descriptions found in local storage.');
    allDescriptions.value = [];
  }
};


const saveDescription = (newDescription) => {
  allDescriptions.value.push(newDescription);
  localStorage.setItem('allDescriptions', JSON.stringify(allDescriptions.value));
  loadDescriptions();
};
const handleDescriptionChange = (e) => {
  const selectedValue = e.detail.value; if (selectedValue === 'new') {
    const newDescription = prompt('Enter new description:');
    if (newDescription) { saveDescription(newDescription); description.value = newDescription; }
  } else { description.value = selectedValue; }
};

onMounted(() => {
  loadItemsFromLocalStorage();
  checkPunchinData();
  loadDescriptions();
});
</script>

<style scoped>
ion-badge {
  --background: white;
  --color: green;
  --padding-end: 20px;
  --padding-start: 20px;
  font-size: 18px;
}
</style>
