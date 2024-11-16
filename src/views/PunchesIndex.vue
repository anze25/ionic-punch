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

    <ion-content
      :fullscreen="true"
      class="ion-padding"
    >


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
            <ion-spinner
              v-if="isLoadingPunchin"
              name="crescent"
            ></ion-spinner>
            Začetek dela: <ion-badge>{{ startTime }}</ion-badge>
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
        :is-open="isLoadingPunchin"
        :message="loadingMessage"
        spinner="circles"
      ></ion-loading>

      <!-- Progress Bar -->
      <ion-progress-bar
        v-if="isLoadingPunchin"
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
import { IonButtons, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonBadge, IonGrid, IonSelect, IonSelectOption, IonSpinner } from '@ionic/vue';
import PunchInModal from '../components/PunchInModal.vue';
import PunchOutModal from '../components/PunchOutModal.vue';
import { modalController } from '@ionic/vue';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';


const auth = getAuth();
const user = auth.currentUser;

const items = ref([]);

const isLoadingPunchin = ref(true);
const isLoading = ref(false);
const progress = ref(0);
const loadingMessage = ref('Deleting data...');

const isPunchinDisabled = ref(false);
const isPunchoutDisabled = ref(true);

const punchinData = ref(null);
const description = ref('');
const allDescriptions = ref([]);

const startTime = computed(() => punchinData.value ? punchinData.value.startTime : '');

const checkPunchinData = async (user) => {
  if (!user) {

    punchinData.value = null;
    isPunchinDisabled.value = false;
    isLoadingPunchin.value = false;
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
  } finally {
    isLoadingPunchin.value = false; // Hide the spinner
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


const punchIn = async () => {
  const now = new Date();
  const startDate = now.toLocaleDateString('en-CA'); // Format as YYYY-MM-DD
  const startTime = now.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' }); // Format as HH:mm


  const punchinData = {
    loggedIn: true,
    startDate,
    startTime,
    userId: user.uid
  };

  try {
    // Save the punchinData to Firestore
    const docRef = await addDoc(collection(db, 'logsIn'), punchinData);
    console.log('Document written with ID: ', docRef.id);

    // Optionally, you can update the localStorage with the new punchinData
    localStorage.setItem('punchinData', JSON.stringify(punchinData));
    isPunchinDisabled.value = true;
    modalController.dismiss(punchinData);
  } catch (error) {
    console.error('Error adding document: ', error);
    alert('Error saving data to Firebase.');
  }

  checkPunchinData();
};

const punchOut = async () => {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const endTime = now.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' }); // Format as HH:mm

  if (!punchinData.value) {
    alert('No punchin data found.');
    return;
  }

  if (!user) {
    alert('No user is logged in.');
    return;
  }

  const newItem = {
    description: description.value,
    endTime: new Date(`${endDate}T${endTime}`).toISOString(),
    startTime: new Date(`${punchinData.value.startDate}T${punchinData.value.startTime}`).toISOString(),
    userId: user.uid,
  };

  try {
    // Save the new item to Firestore
    const docRef = await addDoc(collection(db, 'punches'), newItem);
    console.log('Document written with ID: ', docRef.id);

    // Optionally, you can update the localStorage with the new item
    const items = JSON.parse(localStorage.getItem('items')) || [];
    items.push({ id: docRef.id, ...newItem });
    localStorage.setItem('items', JSON.stringify(items));

    // Delete punchinData from Firebase
    const q = query(collection(db, 'logsIn'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const punchinDocId = querySnapshot.docs[0].id;
      await deleteDoc(doc(db, 'logsIn', punchinDocId));
      console.log('Punchin data deleted from Firebase:', punchinDocId);
    }
  }
  catch (error) {
    console.error('Error saving punchout data to Firebase:', error);
  }

  items.value.push(newItem);
  localStorage.removeItem('punchinData');
  isPunchinDisabled.value = false;
  console.log('Punchout Data:', newItem);
  checkPunchinData();

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
    localStorage.removeItem('allDescriptions')
    console.log('All descriptions deleted from Firebase');
    allDescriptions.value = [];
  } catch (error) {
    console.error('Error deleting all descriptions from Firebase:', error);
  }

  isLoading.value = false; // Hide the loading spinner
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
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await checkPunchinData(user);
      loadDescriptions();
    } else {
      isLoadingPunchin.value = false; // Hide the spinner if no user is logged in
    }
  });

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
