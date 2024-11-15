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
                <ion-select-option value="deleteAll">Izbriši vse...</ion-select-option>
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
      <!-- Loading Spinner -->
      <ion-loading
        :is-open="isLoading"
        :message="loadingMessage"
        spinner="circles"
      ></ion-loading>

      <!-- Progress Bar -->
      <ion-progress-bar
        v-if="isLoading"
        :value="progress"
        color="danger"
        type="determinate"
        style="margin-top: 20px;"
      ></ion-progress-bar>
    </ion-content>
  </ion-page>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { IonButtons, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonBadge, IonGrid, IonSelect, IonSelectOption, } from '@ionic/vue';
import PunchInModal from '../components/PunchInModal.vue';
import PunchOutModal from '../components/PunchOutModal.vue';
import { modalController } from '@ionic/vue';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const items = ref([]);

const isLoading = ref(false);
const progress = ref(0);
const loadingMessage = ref('Deleting data...');

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

  modal.onDidDismiss().then(async (data) => {
    if (data.data) {
      items.value.push(data.data);
      console.log('Punchout Data:', data.data);

      // Save the data to Firebase
      try {
        await addDoc(collection(db, 'punches'), data.data);
        console.log('Data saved to Firebase:', data.data);

        // Remove punchinData from local storage
        localStorage.removeItem('punchinData');
        isPunchoutDisabled.value = true;
        isPunchinDisabled.value = false;
      } catch (error) {
        console.error('Error saving data to Firebase:', error);
      }
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

const punchOut = async () => {
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

  try {
    // Save the new item to Firebase 
    await addDoc(collection(db, 'punches'), newItem);
    console.log('Punchout Data saved to Firebase:', newItem);
  }
  catch (error) { console.error('Error saving punchout data to Firebase:', error); }

  items.value.push(newItem);
  localStorage.removeItem('punchinData');
  isPunchinDisabled.value = false;
  console.log('Punchout Data:', newItem);
  checkPunchinData();

};

const loadDescriptions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'descriptions'));
    const descriptions = [];
    querySnapshot.forEach((doc) => {
      descriptions.push(doc.data().description);
    });

    const filteredDescriptions = descriptions.filter(desc => desc !== null && desc !== undefined);
    allDescriptions.value = filteredDescriptions.sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('Error loading descriptions from Firebase:', error);
    allDescriptions.value = [];
  }
};

const deleteAllDescriptions = async () => {
  isLoading.value = true; // Show the loading spinner
  progress.value = 0; // Reset progress
  loadingMessage.value = 'Brisanje vnosov...';

  try {
    const querySnapshot = await getDocs(collection(db, 'descriptions'));
    const totalDocs = querySnapshot.size;
    let deletedCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(doc(db, 'descriptions', docSnapshot.id));
      deletedCount++;
      progress.value = deletedCount / totalDocs; // Update progress
    }

    console.log('All descriptions deleted from Firebase');
    allDescriptions.value = [];
  } catch (error) {
    console.error('Error deleting all descriptions from Firebase:', error);
  }

  isLoading.value = false; // Hide the loading spinner
};

const saveDescription = async (newDescription) => {
  try {
    await addDoc(collection(db, 'descriptions'), { description: newDescription });
    loadDescriptions();
  } catch (error) {
    console.error('Error saving description to Firebase:', error);
  }
};

const handleDescriptionChange = async (e) => {
  const selectedValue = e.detail.value;
  if (selectedValue === 'new') {
    const newDescription = prompt('Vnesi nov vpis:');
    if (newDescription) {
      await saveDescription(newDescription);
      description.value = newDescription;
    }
  } else if (selectedValue === 'deleteAll') {
    const confirmDelete = confirm('Ali ste prepričani, da želite izbrisati vse opise? Tega dejanja ni mogoče razveljaviti.');
    if (confirmDelete) {
      await deleteAllDescriptions();
    }
  } else {
    description.value = selectedValue;
  }
};
onMounted(() => {

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
