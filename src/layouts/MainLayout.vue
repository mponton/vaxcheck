<template>

  <q-dialog v-model="about" full-width full-height>
    <q-layout view="Lhh lpR fff" container class="bg-white">
      <q-header class="bg-primary">
        <q-toolbar>
          <q-toolbar-title>VaxCheck {{ version }}</q-toolbar-title>
          <q-btn flat v-close-popup round dense icon="close" />
        </q-toolbar>
      </q-header>
      <q-page-container>
        <q-page padding>
          <q-markdown no-line-numbers no-heading-anchor-links :src="aboutMarkdown"> </q-markdown>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>

  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn dense color="blue" label="About" @click="about = true" />
        <q-toolbar-title class="text-center"> Vax Check </q-toolbar-title>
        <q-btn dense color="orange-8" label="Clear" :class="clearButtonClass" @click="clear" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref , onMounted } from "vue";
import { useQuasar } from "quasar";

import { EventBus } from 'boot/global-event-bus';
import pkg from '../../package.json';
import AboutMarkdown from "assets/about.markdown";

export default defineComponent({
  name: "MainLayout",

  setup() {
    const $q = useQuasar();

    const version = pkg.version;
    const about = ref(false);
    const aboutMarkdown = ref(AboutMarkdown);
    const clearButtonClass = ref("invisible");

    let qrDataProp = ref(null);

    onMounted((x) => {
      console.log("MainLayout mounted.");
      EventBus.$on("qrDataChanged", (qrData) => {
        console.log("qrDataChanged: qrData = ", qrData);
        if (qrData.value) {
          clearButtonClass.value = "";
        } else {
          clearButtonClass.value = "invisible";
        }
        qrDataProp = qrData;
      });
    })

    return {
      version,
      about,
      aboutMarkdown,
      clearButtonClass,
      clear() {
        qrDataProp.value = null;
        clearButtonClass.value = "invisible";
      }
    };
  },
});
</script>
