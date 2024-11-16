<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Potrdilo o nadurah</ion-title>
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
      <ion-grid>
        <ion-row class="centered-row">
          <ion-col size="2">
            <ion-item>
              <ion-label position="stacked">Mesec</ion-label>
              <ion-select
                :value="month"
                @ionChange="e => month = e.detail.value"
                interface="popover"
              >
                <ion-select-option
                  v-for="(monthName, index) in monthNames"
                  :key="index"
                  :value="index + 1"
                >
                  {{ monthName }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-col>
          <ion-col size="2">
            <ion-item>
              <ion-label position="stacked">Leto</ion-label>
              <ion-select
                :value="year"
                @ionChange="e => year = e.detail.value"
                interface="popover"
              >
                <ion-select-option
                  v-for="yearOption in yearOptions"
                  :key="yearOption"
                  :value="yearOption"
                >
                  {{ yearOption }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-col>
          <ion-col
            size="1"
            class="centered-col"
          >
            <ion-button
              expand="block"
              @click="createReport"
            >Ustvari</ion-button>
          </ion-col>
        </ion-row>

      </ion-grid>
      <div id="container">
        <div
          id="printable"
          v-if="showTable"
        >
          <div class="potrdilo">
            <h2 style="text-align: left">POTRDILO O OPRAVLJENH URAH</h2>
            <p>
              <span style="width: 100%; text-align: left; padding-left: 1em;">delavec (-ka) </span>
              <span id="user">{{ displayName }}</span>
              <span style="padding-left: 3em;">mesec: <span
                  style="text-transform: uppercase; text-decoration: underline"
                >{{ monthName }}</span></span>
            </p>
            <table class="ui-table table-bordered ">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Datum</th>
                  <th>Prihod</th>
                  <th>Odhod</th>
                  <th>Opis</th>
                  <th>Nadure</th>
                  <th>Opombe</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in filteredItems"
                  :key="index"
                >
                  <td>{{ index + 1 }}</td>
                  <td>{{ formatDate(item.startTime) }}</td>
                  <td>{{ formatTime(item.startTime) }}</td>
                  <td>{{ formatTime(item.endTime) }}</td>
                  <td>{{ item.description || 'Furs opomini Kern' }}</td>
                  <td>{{ calculateOvertime(item.startTime, item.endTime) }}</td>
                  <td>{{ item.notes || '' }}</td>
                </tr>
                <tr
                  v-for="n in (19 - filteredItems.length)"
                  :key="n"
                >
                  <td
                    v-for="n in 6"
                    :key="n"
                  >&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colspan="5"
                    style="text-align: right"
                  >skupaj ur</td>
                  <td
                    colspan="2"
                    style="text-align: left; padding-left: 3em; font-weight: bold"
                  >{{ getTotal() }}</td>
                </tr>
              </tfoot>
            </table>
            <div class="podpis">
              <span id="signiture">
                <br>
                <p><span id="podpis">podpis: </span></p>
                <span id="signitureLine"></span>
              </span>
            </div>
          </div>
        </div>
        <ion-button
          id="printBtn"
          v-if="showTable"
          @click="printDiv('printable')"
        >Natisni</ion-button>
      </div>

    </ion-content>

  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { IonButtons, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonSelect, IonSelectOption } from '@ionic/vue';
import { getAuth } from 'firebase/auth';

const displayName = ref('');
const auth = getAuth();
const getUserDisplayName = async () => {

  const user = auth.currentUser;

  if (user) {
    await user.reload(); // Reload the user profile
    return user.displayName;
  } else {
    console.error('No user is logged in.');
    return null;
  }


};
const fetchDisplayName = async () => {
  const displayName = await getUserDisplayName();

  console.log('Logged-in user display name:', displayName);
};
fetchDisplayName();

const items = ref([]);

const month = ref('');
const year = ref('');
const yearOptions = Array.from({ length: 31 }, (_, i) => 2020 + i);

const monthName = ref('');
const monthNames = [
  'Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
  'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December'
];
const holidays = [
  '01-01', // 1. January
  '02-01', // 2. January
  '08-02', // 8. February
  '01-05', // 1. May
  '02-05', // 2. May

  // Add more holidays as needed
];
const showTable = ref(false); // Boolean flag to control table visibility

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const calculateOvertime = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = (end - start); // Duration in milliseconds
  const dayOfWeek = start.getDay();
  let overtime;

  if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
    overtime = duration;
  } else { // Monday to Friday
    overtime = duration - 28800000; // 8 hours in milliseconds
  }

  const overtimeHours = overtime / (1000 * 60 * 60); // Convert milliseconds to hours
  return overtimeHours > 0 ? `${Math.floor(overtimeHours)}:${String(Math.round((overtimeHours % 1) * 60)).padStart(2, '0')}` : '00:00';
};


const getTotal = () => {
  const totalOvertime = filteredItems.value.reduce((total, item) => {
    const overtime = calculateOvertime(item.startTime, item.endTime);
    const [hours, minutes] = overtime.split(':').map(Number);
    const overtimeInHours = hours + minutes / 60;
    return total + overtimeInHours;
  }, 0);
  const roundedHours = Math.floor(totalOvertime) - 1;
  return roundedHours > 0 ? roundedHours : 0;
};


const printDiv = (divId) => {
  const divToPrint = document.getElementById(divId);
  const newWin = window.open('', 'Print-Window');
  newWin.document.open();
  newWin.document.write(`
    <html>
      <head>
        <style>
          /* Add your styles here */
          body {
    text-align: center;
    font-family: Calibri;
}
          #user {

  display: inline-block;
  border-bottom: solid 1px black;
  width: 97mm;
}

#signiture {
  display: inline-block;
  float: right;
  padding-right: 15%;
}

#signitureLine {
  display: inline-block;
  width: 50mm;
  border-bottom: solid 1px black;
}

#prihod {
  color: green;
  display: block;
}

#odhod {
  color: red;
  display: block;
}

th,
td {
  line-height: 1.5em;
  height: 20px;
  border: 1px solid black;
  text-align: center;
  padding: .4em .5em;
  vertical-align: center;
  font-family: Calibri;

}

.ui-table {
  border: 0;
  border-collapse: collapse;
  padding: 0;
  width: 100%;
}
          /* Add more styles as needed */
        </style>
      </head>
      <body onload="window.print()">
        ${divToPrint.innerHTML}
      </body>
    </html>
  `);
  newWin.document.close();
  setTimeout(() => newWin.close(), 10);
};

const getMillisecondsFromOvertime = (overtime) => {
  const [hours, minutes] = overtime.split(':').map(Number);
  return (hours * 3600000) + (minutes * 60000);
};

const createReport = () => {
  monthName.value = monthNames[month.value - 1];
  showTable.value = true;
};
const filterItems = (items, startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return items.filter(item => {
    const itemDate = new Date(item.startTime).getTime();
    const dayOfWeek = new Date(item.startTime).getDay();
    const overtime = calculateOvertime(item.startTime, item.endTime);
    const milliseconds = getMillisecondsFromOvertime(overtime);

    return itemDate >= start && itemDate < end && (milliseconds > 1800000 || dayOfWeek === 0 || dayOfWeek === 6); // 0 represents Sunday, 6 represents Saturday
  })
    .map(item => {
      const itemDate = new Date(item.startTime);
      const formattedDate = `${String(itemDate.getDate()).padStart(2, '0')}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
      const dayOfWeek = itemDate.getDay();
      let overtime = 0;
      const duration = new Date(item.endTime).getTime() - new Date(item.startTime).getTime();

      if (dayOfWeek === 0 || dayOfWeek === 6) { // Monday to Friday
        overtime = duration
      } else {
        overtime = duration - 28800000; // 8 hours in milliseconds
      }

      if (dayOfWeek === 0 || holidays.includes(formattedDate)) { // 0 represents Sunday
        item.notes = item.notes ? item.notes : '';
        if (!item.notes.includes('NEDELJA')) {
          item.notes = item.notes ? `${item.notes}, NEDELJA` : 'NEDELJA';
        }
      }

      return {
        ...item,
        overtime
      };
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
};


const filteredItems = computed(() => {
  const startDate = `${year.value}-${String(month.value).padStart(2, '0')}-01`;
  const endDate = `${year.value}-${String(month.value).padStart(2, '0')}-01`;
  const end = new Date(endDate);
  end.setMonth(end.getMonth() + 1);
  return filterItems(items.value, startDate, end.toISOString().split('T')[0]);
});

const loadItemsFromFirebase = async () => {
  try {

    // Check if items are already in localStorage
    const cachedItems = localStorage.getItem('items');
    if (cachedItems) {
      items.value = JSON.parse(cachedItems);
      return;
    }
    const querySnapshot = await getDocs(collection(db, 'punches'));
    items.value = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => item.startTime) // Filter out items where startTime is null or empty 
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // Sort items by startTime 

    // Store items in localStorage
    localStorage.setItem('items', JSON.stringify(items.value));
  } catch (error) {
    console.error('Error fetching items from Firebase:', error);
  }
};


onMounted(async () => {
  loadItemsFromFirebase();
  const user = auth.currentUser; if (user) {
    await user.reload(); // Reload the user profile to get the latest displayName 
    displayName.value = user.displayName || '';
  } else {
    console.error('No user is logged in.');
  }
});
</script>

<style scoped>
.full-width {
  width: 100%;
}

#container {
  top: 50%;

}

#user {
  text-transform: uppercase;
  display: inline-block;
  border-bottom: solid 1px black;
  width: 97mm;
}

#signiture {
  display: inline-block;
  float: right;
  padding-right: 15%;
}

#signitureLine {
  display: inline-block;
  width: 50mm;
  border-bottom: solid 1px black;
}

#prihod {
  color: green;
  display: block;
}

#odhod {
  color: red;
  display: block;
}

th,
td {
  line-height: 1.5em;
  height: 20px;
  border: 1px solid black;
  text-align: center;
  padding: .4em .5em;
  vertical-align: center;
  font-family: Calibri;

}

.ui-table {
  border: 0;
  border-collapse: collapse;
  padding: 0;
  width: 100%;
  font-family: Calibri;
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

.centered-row {
  display: flex;
  align-items: center;
  /* Vertically center the items */
}

.centered-col {
  display: flex;
  align-items: center;
  /* Vertically center the button */
  justify-content: center;
  /* Horizontally center the button */
}

#printBtn {
  padding-top: 10px
}
</style>
