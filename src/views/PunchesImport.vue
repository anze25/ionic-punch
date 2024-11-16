<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Uvoz CSV datotek</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content
      :fullscreen="true"
      class="ion-padding"
    >
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ $route.params.id }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div>
        <ion-item class="custom-item">
          <ion-label position="stacked">Uvoz WorkClock csv</ion-label>
          <input
            type="file"
            accept=".csv"
            @change="handleFileUpload"
            class="custom-input"
          />
        </ion-item>

        <ion-item class="custom-item">
          <ion-label position="stacked">Uvoz Jantar csv</ion-label>
          <input
            type="file"
            accept=".csv"
            @change="handleSecondFileUpload"
            class="custom-input"
          />
        </ion-item>
      </div>

      <ion-loading
        :is-open="isLoading"
        :message="loadingMessage"
        spinner="circles"
      ></ion-loading>

      <!-- Progress Bar -->
      <ion-progress-bar
        v-if="isLoading"
        :value="progress"
        type="determinate"
        style="margin-top: 20px;"
      ></ion-progress-bar>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue';

import Papa from 'papaparse';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

const items = ref([]);
const allDescriptions = ref([]);
const isLoading = ref(false);
const progress = ref(0);
const loadingMessage = ref('Uvažam vnose...');
const auth = getAuth();
const user = auth.currentUser;

// Workclock csv
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, {
      complete: (results) => {

        if (results && results.data && results.data.length > 0) {
          processData(results.data);
        } else {
          console.error('Parsed data is empty or invalid');
        }
      },
      error: (error) => {
        console.error('Error parsing CSV file:', error);
      }
    });
  }
};
const processData = async (data) => {
  isLoading.value = true; // Show the loading spinner
  progress.value = 0; // Reset progress


  if (!user) {
    alert('No user is logged in.');
    return;
  }

  const processedItems = data.slice(1).map(row => {
    const startTime = new Date(row[0]);
    const endTime = new Date(row[1]);
    // Check if the date values are valid
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.error('Invalid date value:', row[0], row[1]);
      return null;
    }
    return {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      description: row[6],
      userId: user.uid,
    };
  }).filter(item => item !== null); // Filter out invalid items

  const processedDescriptions = data.slice(1).map(row => row[6])
    .filter(description => description !== null && description !== '');

  // Remove duplicates from processedDescriptions
  const uniqueDescriptions = [...new Set(processedDescriptions)];

  items.value = processedItems;
  loadingMessage.value = `Uvažam vnose... ${processedItems.length}`;

  try {
    // Load existing items from Firebase
    const querySnapshot = await getDocs(collection(db, 'punches'));
    const existingItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Save or update items in Firebase
    for (let i = 0; i < processedItems.length; i++) {
      const existingItem = existingItems.find(item => new Date(item.startTime).toISOString() === processedItems[i].startTime);
      if (existingItem) {
        // Update existing item
        await updateDoc(doc(db, 'punches', existingItem.id), processedItems[i]);
      } else {
        // Add new item
        await addDoc(collection(db, 'punches'), processedItems[i]);
      }
      progress.value = (i + 1) / processedItems.length; // Update progress
    }
    localStorage.removeItem('items'); // Remove items for loading all from Firebase
    await loadItemsFromFirebase(user, items, isLoading, loadingMessage);
    console.log('Items saved or updated in Firebase');
  } catch (error) {
    console.error('Error saving or updating data in Firebase:', error);
  }

  try {
    // Load existing descriptions from Firebase
    const existingDescriptions = await loadDescriptions();
    const newDescriptions = uniqueDescriptions.filter(desc => !existingDescriptions.includes(desc));

    // Save new descriptions to Firebase
    for (let i = 0; i < newDescriptions.length; i++) {
      await saveDescription(newDescriptions[i]);
      progress.value = (i + 1) / newDescriptions.length; // Update progress
    }
    localStorage.removeItem('allDescriptions');
    console.log('Descriptions saved to Firebase');
  } catch (error) {
    console.error('Error saving descriptions to Firebase:', error);
  }
  isLoading.value = false; // Hide the loading spinner
};

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
  try {

    if (!user) {
      console.error('No user is logged in.');
      return [];
    }

    const querySnapshot = await getDocs(collection(db, 'descriptions'));
    const descriptions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId === user.uid) {
        descriptions.push(data.description);
      }
    });

    const filteredDescriptions = descriptions.filter(desc => desc !== null && desc !== undefined);
    allDescriptions.value = filteredDescriptions.sort((a, b) => a.localeCompare(b));
    return filteredDescriptions;
  } catch (error) {
    console.error('Error loading descriptions from Firebase:', error);
    allDescriptions.value = [];
    return [];
  }
};

const saveDescription = async (newDescription) => {
  try {
    await addDoc(collection(db, 'descriptions'), { description: newDescription, userId: user.uid, });
    await loadDescriptions();
  } catch (error) {
    console.error('Error saving description to Firebase:', error);
  }
};

// Jantar csv
const handleSecondFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, {
      complete: (results) => {
        console.log('Parsing complete:', results); // Log the results of the parsing process

        if (results && results.data && results.data.length > 0) {
          processSecondData(results.data);
        } else {
          console.error('Parsed data is empty or invalid');
        }
      },
      error: (error) => {
        console.error('Error parsing CSV file:', error);
      }
    });
  }
};

const processSecondData = async (data) => {
  isLoading.value = true; // Show the loading spinner
  progress.value = 0; // Reset progress

  if (!user) {
    alert('No user is logged in.');
    return;
  }

  const roundToNearest5Minutes = (dateString) => {
    const date = new Date(dateString);
    const ms = 1000 * 60 * 5; // 5 minutes in milliseconds
    return new Date(Math.round(date.getTime() / ms) * ms);
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:00.000`;
  };

  const processedItems = data.filter(row => row.length > 1 && /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(row[1]) && /^\d{2}:\d{2}$/.test(row[2]) && /^\d{2}:\d{2}$/.test(row[4]))
    .map(row => {
      const dateParts = row[1].split('.');
      const day = dateParts[0].padStart(2, '0');
      const month = dateParts[1].padStart(2, '0');
      const year = dateParts[2];
      const startTimeString = `${year}-${month}-${day} ${row[2]}`;
      const endTimeString = `${year}-${month}-${day} ${row[4]}`;
      return {
        startTime: formatDate(roundToNearest5Minutes(startTimeString)),
        endTime: formatDate(roundToNearest5Minutes(endTimeString)),
        userId: user.uid,
      };
    });

  loadingMessage.value = `Uvažam vnose... ${processedItems.length}`;

  const updateFirebase = async (newItems) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'punches'));
      const existingItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const updatedItems = existingItems.map(item => {
        const newItem = newItems.find(newItem => new Date(newItem.startTime).toDateString() === new Date(item.startTime).toDateString());
        if (newItem) {
          return {
            ...item,
            startTime: newItem.startTime,
            endTime: newItem.endTime,
          };
        }
        return item;
      });

      for (let i = 0; i < newItems.length; i++) {
        const newItem = newItems[i];
        if (!updatedItems.some(item => new Date(item.startTime).toDateString() === new Date(newItem.startTime).toDateString())) {
          await addDoc(collection(db, 'punches'), { ...newItem, description: '' });
        } else {
          const existingItem = updatedItems.find(item => new Date(item.startTime).toDateString() === new Date(newItem.startTime).toDateString());
          if (existingItem) {
            await updateDoc(doc(db, 'punches', existingItem.id), {
              startTime: newItem.startTime,
              endTime: newItem.endTime
            });
          }
        }
        progress.value = (i + 1) / newItems.length; // Update progress
      }
      localStorage.removeItem('items'); // Remove items for loading all from Firebase
      await loadItemsFromFirebase(user, items, isLoading, loadingMessage);
      console.log('Data updated in Firebase');
    } catch (error) {
      console.error('Error updating data in Firebase:', error);
    }
  };

  await updateFirebase(processedItems);

  isLoading.value = false; // Hide the loading spinner
};

</script>

<style scoped>
#container {
  padding: 16px;
}

.custom-item {
  margin-bottom: 16px;
  /* Add margin between items */
}

.custom-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-top: 8px;
  /* Add margin between label and input */
}
</style>
