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
      <div>
        <h2>Uredi prikazno ime</h2>
        <ion-input
          :value="displayName"
          @ionChange="e => displayName = e.detail.value"
          type="text"
          placeholder="Prikazno ime"
        ></ion-input>
        <ion-button @click="updateDisplayName">Posodobi</ion-button>
      </div>
    </ion-content>

  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { IonButtons, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { getAuth, updateProfile } from 'firebase/auth';

const auth = getAuth();
const displayName = ref('');


onMounted(async () => {
  const user = auth.currentUser;
  if (user) {
    await user.reload(); // Reload the user profile to get the latest displayName
    displayName.value = user.displayName || '';
  } else {
    console.error('No user is logged in.');
  }
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
  width: 100%;
}
</style>