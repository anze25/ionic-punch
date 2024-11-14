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

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ $route.params.id }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <ion-item class="custom-item">
          <ion-label position="stacked">Import WorkClock csv</ion-label>
          <input
            type="file"
            accept=".csv"
            @change="handleFileUpload"
            class="custom-input"
          />
        </ion-item>

        <ion-item class="custom-item">
          <ion-label position="stacked">Import Jantar csv</ion-label>
          <input
            type="file"
            accept=".csv"
            @change="handleSecondFileUpload"
            class="custom-input"
          />
        </ion-item>
      </div>


    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue';
// import { useItemsStore } from '../store.js';
import Papa from 'papaparse';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonInput } from '@ionic/vue';

const items = ref([]);
const allDescriptions = ref([]);

const saveItemsToLocalStorage = (newItems) => {
  localStorage.setItem('items', JSON.stringify(newItems));
};

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


const processData = (data) => {
  const processedItems = data.slice(1).map(row => ({
    startTime: new Date(row[0]),
    endTime: new Date(row[1]),
    description: row[6]
  }));
  const processedDescriptions = data.slice(1).map(row => row[6]).filter(description => description !== null && description !== '');

  items.value = processedItems;
  allDescriptions.value = processedDescriptions;
  localStorage.setItem('allDescriptions', JSON.stringify(processedDescriptions));
  saveItemsToLocalStorage(processedItems);
};
const processSecondData = (data) => {

  const roundToNearest5Minutes = (dateString) => {
    const date = new Date(dateString); const ms = 1000 * 60 * 5; // 5 minutes in milliseconds 
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

  const processedItems = data
    .filter(row => row.length > 1 && /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(row[1]) && /^\d{2}:\d{2}$/.test(row[2]) && /^\d{2}:\d{2}$/.test(row[4]))
    .map(row => {
      const dateParts = row[1].split('.');
      const day = dateParts[0].padStart(2, '0');
      const month = dateParts[1].padStart(2, '0');
      const year = dateParts[2];
      const startTimeString = `${year}-${month}-${day} ${row[2]}`;
      const endTimeString = `${year}-${month}-${day} ${row[4]}`;
      return {
        startTime: formatDate(roundToNearest5Minutes(startTimeString)), endTime: formatDate(roundToNearest5Minutes(endTimeString))
      };
    });

  const updateLocalStorage = (newItems) => { const storedItems = JSON.parse(localStorage.getItem('items')) || []; const updatedItems = storedItems.map(item => { const newItem = newItems.find(newItem => new Date(newItem.startTime).toDateString() === new Date(item.startTime).toDateString()); if (newItem) { return { ...item, startTime: newItem.startTime, endTime: newItem.endTime }; } return item; }); newItems.forEach(newItem => { if (!updatedItems.some(item => new Date(item.startTime).toDateString() === new Date(newItem.startTime).toDateString())) { updatedItems.push({ ...newItem, description: '' }); } }); localStorage.setItem('items', JSON.stringify(updatedItems)); };

  updateLocalStorage(processedItems);

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
