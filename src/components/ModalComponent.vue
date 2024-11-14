<!-- ModalComponent.vue -->
<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>{{ isEditing ? 'Uredi vnos' : 'Ustvari vnos' }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismissModal">Zapri</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @submit.prevent="saveItem">
      <ion-item>
        <ion-label position="stacked">Datum prihoda</ion-label>
        <ion-input
          type="date"
          :value="formattedStartDate"
          @ionChange="e => startDate = e.detail.value"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Ura prihoda</ion-label>
        <ion-input
          type="time"
          :value="formattedStartTime"
          @ionChange="e => startTime = e.detail.value"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Datum odhoda</ion-label>
        <ion-input
          type="date"
          :value="formattedEndDate"
          @ionChange="e => endDate = e.detail.value"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Ura odhoda</ion-label>
        <ion-input
          type="time"
          :value="formattedEndTime"
          @ionChange="e => endTime = e.detail.value"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Opis dela</ion-label>
        <ion-input
          :value="description"
          @ionChange="e => description = e.detail.value"
        ></ion-input>
      </ion-item>
      <ion-button
        expand="full"
        type="submit"
      >{{ isEditing ? 'Shrani' : 'Ustvari' }}</ion-button>
    </form>
  </ion-content>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { modalController } from '@ionic/vue';


const props = defineProps({
  item: Object,
  isEditing: Boolean,
});

const startDate = ref(props.item?.startTime ? new Date(props.item.startTime).toISOString().slice(0, 10) : '');
const startTime = ref(props.item?.startTime ? new Date(props.item.startTime).toISOString().slice(11, 16) : '');
const endDate = ref(props.item?.endTime ? new Date(props.item.endTime).toISOString().slice(0, 10) : '');
const endTime = ref(props.item?.endTime ? new Date(props.item.endTime).toISOString().slice(11, 16) : '');
const description = ref(props.item?.description || '');

const formattedStartDate = computed(() => startDate.value);
const formattedStartTime = computed(() => startTime.value);
const formattedEndDate = computed(() => endDate.value);
const formattedEndTime = computed(() => endTime.value);

watch(() => props.item, (newItem) => {
  startDate.value = newItem?.startTime ? new Date(newItem.startTime).toISOString().slice(0, 10) : '';
  startTime.value = newItem?.startTime ? new Date(newItem.startTime).toISOString().slice(11, 16) : '';
  endDate.value = newItem?.endTime ? new Date(newItem.endTime).toISOString().slice(0, 10) : '';
  endTime.value = newItem?.endTime ? new Date(newItem.endTime).toISOString().slice(11, 16) : '';
  description.value = newItem?.description || '';
});

const dismissModal = () => {
  modalController.dismiss();
};

const saveItem = () => {
  try {
    const newItem = {
      description: description.value,
      endTime: new Date(`${endDate.value}T${endTime.value}`).toISOString(),
      startTime: new Date(`${startDate.value}T${startTime.value}`).toISOString(),
    };

    modalController.dismiss(newItem);
  } catch (error) {

    alert('Vnesi pravilno uro in datum.');
  }
};
</script>
