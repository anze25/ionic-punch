<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Nastavitve</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div style="max-width: 400px;">
        <h4>Uredi prikazno ime</h4>
        <ion-row>
          <ion-col>
            <ion-input
              :value="displayName"
              @ionChange="e => displayName = e.detail.value"
              type="text"
              placeholder="Prikazno ime"
            ></ion-input>
          </ion-col>
          <ion-col>
            <ion-button @click="updateDisplayName">Posodobi</ion-button>
          </ion-col>
        </ion-row>
      </div>
      <div style="max-width: 400px;">
        <h4>Zmanjšaj število nadur za: </h4>
        <ion-row>
          <ion-col>
            <ion-input
              :value="subtractValue"
              @ionChange="e => subtractValue = e.detail.value"
              type="number"
              placeholder="Vrednost za odštevanje"
            ></ion-input>
          </ion-col>
          <ion-col>
            <ion-button @click="updateSubtractValue">Posodobi</ion-button>
          </ion-col>
        </ion-row>
      </div>
      <div style="max-width: 400px;">
        <h4>Seznam opisov</h4>
        <ion-list v-if="allDescriptions.length > 0">
          <ion-item
            v-for="desc in allDescriptions"
            :key="desc"
          >
            <ion-label>{{ desc }}</ion-label>
            <ion-button
              style="max-width: 30px;"
              color="danger"
              @click="confirmDeleteDescription(desc)"
              slot="end"
            >
              <ion-icon :icon="trash"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
        <p v-else>Trenutno v bazi ni opisov.</p>
      </div>
    </ion-content>

  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { IonButtons, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { getAuth, updateProfile } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust the import according to your project structure
import { trash } from 'ionicons/icons';

const auth = getAuth();
const displayName = ref('');
const subtractValue = parseInt(localStorage.getItem('subtractValue')) || 1;
const allDescriptions = ref([]);

onMounted(async () => {
  const user = auth.currentUser;
  if (user) {
    await user.reload(); // Reload the user profile to get the latest displayName
    displayName.value = user.displayName || '';
  } else {
    console.error('No user is logged in.');
  }
  loadDescriptions();
});

const updateDisplayName = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      await updateProfile(user, { displayName: displayName.value });
      console.log('Display name updated:', displayName.value);
      await user.reload(); // Reload the user profile
      displayName.value = user.displayName; // Update the reactive property
      alert('Uspešno posodobljeno!');
    } catch (error) {
      console.error('Error updating display name:', error);
      alert('Error updating display name.');
    }
  } else {
    console.error('No user is logged in.');
    alert('No user is logged in.');
  }
};

const updateSubtractValue = () => {
  localStorage.setItem('subtractValue', subtractValue.value);
};

const loadDescriptions = async () => {
  try {
    // Check if descriptions are already in localStorage
    const cachedDescriptions = localStorage.getItem('allDescriptions');
    if (cachedDescriptions) {
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
  } catch (error) {
    console.error('Error loading descriptions from Firebase:', error);
    allDescriptions.value = [];
  }
};

const confirmDeleteDescription = (desc) => {
  const confirmed = window.confirm(`Ali ste prepričani, da želite izbrisati opis "${desc}"? Tega dejanja ni mogoče razveljaviti.`);
  if (confirmed) {
    deleteDescription(desc);
  }
};

const deleteDescription = async (desc) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.error('No user is logged in.');
      return;
    }

    // Fetch the document ID for the description to be deleted
    const q = query(collection(db, 'descriptions'), where('userId', '==', user.uid), where('description', '==', desc));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id;
      await deleteDoc(doc(db, 'descriptions', docId));
      console.log('Description deleted from Firebase:', docId);

      // Remove the description from the local list
      allDescriptions.value = allDescriptions.value.filter(d => d !== desc);

      // Update localStorage
      localStorage.setItem('allDescriptions', JSON.stringify(allDescriptions.value));
    }
  } catch (error) {
    console.error('Error deleting description from Firebase:', error);
  }
};


</script>

<style scoped>
#container {
  padding: 16px;
}

ion-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
}

h2 {
  text-align: center;
}

ion-input {
  margin: 10px 0;
}

ion-button {
  width: 60%;

}
</style>