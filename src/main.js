import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import print from 'vue3-print-nb';
import {
  IonicVue,
  IonContent,
  IonItem,
  IonLabel,
  IonButton,
  IonRow,
  IonCol,
  IonGrid,
  IonLoading,
  IonProgressBar,
} from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
const app = createApp(App);
const pinia = createPinia();

// Register multiple components globally
app.component('IonContent', IonContent);
app.component('IonItem', IonItem);
app.component('IonLabel', IonLabel);
app.component('IonButton', IonButton);
app.component('IonRow', IonRow);
app.component('IonCol', IonCol);
app.component('IonGrid', IonGrid);
app.component('IonLoading', IonLoading);
app.component('IonProgressBar', IonProgressBar);

app.use(IonicVue).use(pinia).use(router).use(print);

router.isReady().then(() => {
  app.mount('#app');
});
