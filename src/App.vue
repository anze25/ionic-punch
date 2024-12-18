<template>
  <ion-app>
    <ion-split-pane content-id="main-content">
      <ion-menu
        content-id="main-content"
        type="overlay"
      >
        <ion-content>
          <ion-list id="inbox-list">
            <ion-list-header>Punchit</ion-list-header>
            <ion-note>Evidenca delovnega časa</ion-note>

            <ion-menu-toggle
              :auto-hide="false"
              v-for="(p, i) in appPages"
              :key="i"
            >
              <ion-item
                @click="selectedIndex = i"
                router-direction="root"
                :router-link="p.url"
                lines="none"
                :detail="false"
                class="hydrated"
                :class="{ selected: selectedIndex === i }"
              >
                <ion-icon
                  aria-hidden="true"
                  slot="start"
                  :ios="p.iosIcon"
                  :md="p.mdIcon"
                ></ion-icon>
                <ion-label>{{ p.title }}</ion-label>
              </ion-item>
            </ion-menu-toggle>

            <!-- Logout Button -->
            <ion-item
              @click="logout"
              lines="none"
              :detail="false"
              class="hydrated"
            >
              <ion-icon
                aria-hidden="true"
                slot="start"
                :ios="logOutOutline"
                :md="logOutSharp"
              ></ion-icon>
              <ion-label>Izhod</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-menu>
      <ion-router-outlet id="main-content"></ion-router-outlet>
    </ion-split-pane>
  </ion-app>
</template>


<script setup>
import {
  IonApp,
  IonContent,
  IonIcon,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
  IonRouterOutlet,
  IonSplitPane,
} from '@ionic/vue';
import { ref } from 'vue';
import {
  statsChartSharp,
  mailOutline,
  homeSharp,
  cloudUploadSharp,
  listSharp,
  logOutOutline,
  logOutSharp,
  settingsSharp
} from 'ionicons/icons';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'vue-router';

const punchinData = ref(null);
const isPunchinDisabled = ref(false);


const selectedIndex = ref(0);
const appPages = [
  {
    title: 'Domov',
    url: '/folder/Index',
    iosIcon: mailOutline,
    mdIcon: homeSharp,
  },
  {
    title: 'Pregled',
    url: '/folder/List',
    mdIcon: listSharp,
  },
  {
    title: 'Uvoz',
    url: '/folder/Import',
    mdIcon: cloudUploadSharp,
  },
  {
    title: 'Report',
    url: '/folder/Report',
    mdIcon: statsChartSharp,
  },
  {
    title: 'Settings',
    url: '/folder/Settings',
    mdIcon: settingsSharp,
  },
];

const path = window.location.pathname.split('folder/')[1];
if (path !== undefined) {
  selectedIndex.value = appPages.findIndex((page) => page.title.toLowerCase() === path.toLowerCase());
}

const auth = getAuth();
const router = useRouter();

const logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('items');
    localStorage.removeItem('allDescriptions');
    punchinData.value = null;
    isPunchinDisabled.value = false;
    console.log('User logged out');
    router.push('/folder/Auth'); // Redirect to AuthPage after logout
  } catch (error) {
    console.error('Error logging out:', error);
  }
};


</script>


<style>
ion-menu ion-content {
  --background: var(--ion-item-background, var(--ion-background-color, #fff));
}

ion-menu.md ion-content {
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 20px;
  --padding-bottom: 20px;
}

ion-menu.md ion-list {
  padding: 20px 0;
}

ion-menu.md ion-note {
  margin-bottom: 30px;
}

ion-menu.md ion-list-header,
ion-menu.md ion-note {
  padding-left: 10px;
}

ion-menu.md ion-list#inbox-list {
  border-bottom: 1px solid var(--ion-background-color-step-150, #d7d8da);
}

ion-menu.md ion-list#inbox-list ion-list-header {
  font-size: 22px;
  font-weight: 600;

  min-height: 20px;
}

ion-menu.md ion-list#labels-list ion-list-header {
  font-size: 16px;

  margin-bottom: 18px;

  color: #757575;

  min-height: 26px;
}

ion-menu.md ion-item {
  --padding-start: 10px;
  --padding-end: 10px;
  border-radius: 4px;
}

ion-menu.md ion-item.selected {
  --background: rgba(var(--ion-color-primary-rgb), 0.14);
}

ion-menu.md ion-item.selected ion-icon {
  color: var(--ion-color-primary);
}

ion-menu.md ion-item ion-icon {
  color: #616e7e;
}

ion-menu.md ion-item ion-label {
  font-weight: 500;
}

ion-menu.ios ion-content {
  --padding-bottom: 20px;
}

ion-menu.ios ion-list {
  padding: 20px 0 0 0;
}

ion-menu.ios ion-note {
  line-height: 24px;
  margin-bottom: 20px;
}

ion-menu.ios ion-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --min-height: 50px;
}

ion-menu.ios ion-item.selected ion-icon {
  color: var(--ion-color-primary);
}

ion-menu.ios ion-item ion-icon {
  font-size: 24px;
  color: #73849a;
}

ion-menu.ios ion-list#labels-list ion-list-header {
  margin-bottom: 8px;
}

ion-menu.ios ion-list-header,
ion-menu.ios ion-note {
  padding-left: 16px;
  padding-right: 16px;
}

ion-menu.ios ion-note {
  margin-bottom: 8px;
}

ion-note {
  display: inline-block;
  font-size: 16px;

  color: var(--ion-color-medium-shade);
}

ion-item.selected {
  --color: var(--ion-color-primary);
}

ion-toolbar {
  display: flex;
  justify-content: center;
}

ion-title {
  text-align: center;
  text-transform: uppercase;
  flex: 1;
}

#container {
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
  /* top: 50%; */
  transform: translateY(-50%);
  margin-top: 150px;
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  color: #8c8c8c;
  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>
