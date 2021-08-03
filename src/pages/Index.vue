<template>
  <q-page class="flex column">
    <div id="camview" v-show="cameraScanInProgress">
      <video
        ref="camera"
        playsinline
        autoplay
      />
      <div id="camhelp" style="text-align: center">
        <h4 style="margin-block-start: 0px; margin-block-end: 0.5em"><b>Camera Scan</b></h4>
        <p>Point the camera on your QR code and ensure there is enough light and that focus is good.
        The camera will stop and close as soon as a QR code is read. If needed, use the
        <b><span class="text-red-10">red</span></b> button below to manually stop the camera.</p>
      </div>
    <!-- FIXME: Add basic instructions here -->
    </div>
    <canvas v-show="false" />
    <q-file
      ref="filePicker"
      v-show="false"
      v-model="selectedImages"
      @input="scanFromImage"
      accept="image/*"
    />

    <!-- Cleared background -->
    <div
      v-if="!qrData && !cameraScanInProgress"
      class="q-px-sm"
      style="overflow-x: auto; max-width: 100vw"
    >
      <q-markdown no-line-numbers no-heading-anchor-links id="main-markdown" :src="mainMarkdown"> </q-markdown>
      <div style="min-height: 100px" />
    </div>

    <!-- Health Card Info -->
    <div v-if="qrData">
      <!-- Status -->
      <q-banner
        :class="
          qrData ? qrData.statusBannerClass : sampleQrData.statusBannerClass
        "
      >
        <template v-slot:avatar>
          <q-icon
            :name="
              qrData ? qrData.statusBannerIcon : sampleQrData.statusBannerIcon
            "
            color="white"
            size="xl"
          />
        </template>
        {{
          qrData ? qrData.statusBannerMessage : sampleQrData.statusBannerMessage
        }}
        <template v-slot:action>
          <q-btn outline color="white" label="More Info" @click="showStatusInfo" />
        </template>
      </q-banner>

      <!-- Raw dump area -->
      <div
        v-if="qrData && qrData.cardDump"
        style="overflow-x: auto; max-width: 100vw"
      >
        <q-markdown no-line-numbers no-heading-anchor-links show-copy>
        <!-- This content needs to be flush with column 0 for QMarkdown to display it correctly. -->
```{{ qrData.cardDumpFormat }}
{{ qrData.cardDump }}
```
        </q-markdown>
      </div>

      <!-- Formatted output area -->
      <div v-if="qrData && !qrData.cardDump">
        <!-- Patient -->
        <q-card flat>
          <q-item>
            <q-item-section avatar>
              <q-icon name="fas fa-user-alt" color="primary" size="md" />
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{
                  qrData
                    ? qrData.patient.fullName
                    : sampleQrData.patient.fullName
                }}
              </q-item-label>
              <q-item-label
                caption
                v-if="
                  qrData ? qrData.patient.gender : sampleQrData.patient.gender
                "
              >
                {{
                  qrData.patient.gender
                    ? qrData.patient.gender
                    : sampleQrData.patient.gender
                }}
                born on
                {{
                  qrData
                    ? qrData.patient.birthDate
                    : sampleQrData.patient.birthDate
                }}
              </q-item-label>
              <q-item-label caption v-else>
                Birthdate
                {{
                  qrData
                    ? qrData.patient.birthDate
                    : sampleQrData.patient.birthDate
                }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />
        </q-card>

        <!-- TODO: Refactor this with a v-for and move this to a component file I guess... -->

        <!-- Immunization Records -->
        <q-card
          flat
          v-for="record in qrData
            ? qrData.immunizations
            : sampleQrData.immunizations"
          :key="record.occurrenceDateTime"
        >
          <q-item>
            <q-item-section avatar>
              <q-icon name="fas fa-syringe" color="accent" size="sm" />
            </q-item-section>

            <q-list>
              <q-item-label>DATE</q-item-label>
              <q-item-label caption>
                {{ record.occurrenceDateTime }}
              </q-item-label>

              <q-item-label v-if="record.doseNumber"
                >DOSE NUMBER</q-item-label
              >
              <q-item-label v-if="record.doseNumber" caption>
                {{ record.doseNumber }}
              </q-item-label>

              <q-item-label v-if="record.location">LOCATION</q-item-label>
              <q-item-label v-if="record.location" caption>
                {{ record.location }}
              </q-item-label>

              <q-item-label v-if="record.vaccineCode">VACCINE CODE</q-item-label>
              <q-item-label v-if="record.vaccineCode" caption>
                {{ record.vaccineCode.code }} ({{ record.vaccineCode.display }})
              </q-item-label>

              <q-item-label v-if="record.targetDisease"
                >TARGET DISEASE</q-item-label
              >
              <q-item-label v-if="record.targetDisease" caption>
                {{ record.targetDisease.code }} ({{
                  record.targetDisease.display
                }})
              </q-item-label>

              <q-item-label v-if="record.note">NOTE</q-item-label>
              <q-item-label v-if="record.note" caption>
                {{ record.note }}
              </q-item-label>
            </q-list>
          </q-item>
          <q-separator />
        </q-card>

        <!-- Issuer Info -->
        <q-card flat>
          <q-item>
            <q-item-section avatar>
              <q-icon name="fas fa-key" color="yellow-8" size="sm" />
            </q-item-section>

            <q-list>
              <q-item-label>ISSUED ON</q-item-label>
              <q-item-label caption>
                {{ qrData ? qrData.issuedAt : sampleQrData.issuedAt }}
              </q-item-label>

              <q-item-label
                v-show="
                  qrData ? qrData.expirationDate : sampleQrData.expirationDate
                "
                >EXPIRES ON</q-item-label
              >
              <q-item-label
                v-show="
                  qrData ? qrData.expirationDate : sampleQrData.expirationDate
                "
                caption
              >
                {{
                  qrData ? qrData.expirationDate : sampleQrData.expirationDate
                }}
              </q-item-label>

              <q-item-label>ISSUED BY</q-item-label>
              <q-item-label
                v-if="
                  qrData
                    ? qrData.issuerInfo.issuerUrl
                    : sampleQrData.issuerInfo.issuerUrl
                "
                caption
              >
                <a
                  :href="
                    qrData
                      ? qrData.issuerInfo.issuerUrl
                      : sampleQrData.issuerInfo.issuerUrl
                  "
                  target="_blank"
                  >{{
                    qrData
                      ? qrData.issuerInfo.name
                      : sampleQrData.issuerInfo.name
                  }}</a
                >
              </q-item-label>
              <q-item-label v-else caption>
                {{
                  qrData ? qrData.issuerInfo.name : sampleQrData.issuerInfo.name
                }}
              </q-item-label>

              <q-item-label>URL</q-item-label>
              <q-item-label caption>
                <a
                  :href="
                    qrData
                      ? qrData.issuerInfo.proofUrl
                      : sampleQrData.issuerInfo.proofUrl
                  "
                  target="_blank"
                  >{{
                    qrData
                      ? qrData.issuerInfo.proofUrl
                      : sampleQrData.issuerInfo.proofUrl
                  }}</a
                >
              </q-item-label>
            </q-list>
          </q-item>
          <q-separator />
        </q-card>
      </div>
      <div style="min-height: 100px" />
    </div>

    <q-page-sticky position="bottom-left" :offset="[64, 24]">
      <q-btn
        v-show="!qrData && !cameraScanInProgress"
        round
        color="primary"
        size="lg"
        icon="camera_alt"
        @click="scanUsingCamera"
      />
      <q-btn
        v-show="!qrData && cameraScanInProgress"
        round
        color="red-10"
        size="lg"
        icon="cancel"
        @click="cancelCamera"
      />
    </q-page-sticky>
    <q-page-sticky position="bottom-right" :offset="[64, 24]">
      <q-btn
        v-show="!qrData && !cameraScanInProgress"
        round
        color="primary"
        size="lg"
        icon="photo_library"
        @click="showImagePicker"
      />
    </q-page-sticky>
  </q-page>

  <q-dialog v-model="camHelpDialog" full-width full-height>
    <q-layout view="Lhh lpR fff" container class="bg-white">
      <q-header class="bg-primary">
        <q-toolbar>
          <q-toolbar-title>Camera Permissions</q-toolbar-title>
          <q-btn flat v-close-popup round dense icon="close" />
        </q-toolbar>
      </q-header>
      <q-page-container>
        <q-page padding>
          <q-markdown no-line-numbers no-heading-anchor-links :src="camPermsMarkdown"> </q-markdown>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>

  <q-dialog v-model="statusInfoDialog">
    <q-layout view="Lhh lpR fff" container class="bg-white">
      <q-header class="bg-primary">
        <q-toolbar>
          <q-toolbar-title>Card/Pass Validity</q-toolbar-title>
          <q-btn flat v-close-popup round dense icon="close" />
        </q-toolbar>
      </q-header>
      <q-page-container>
        <q-page padding>
          <q-markdown no-line-numbers no-heading-anchor-links no-linkify>
## How does Validation Work?

Health Cards/Passes (aka vaccination proofs in COVID-19 times) use a cryptographic signature for validation. More precisely they use [public-key cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography) which, to keep things simple, means the issuer (e.g. government) signs the content of the QR code with a **SECRET** (aka **PRIVATE**) key and provide a **PUBLIC** key that we can use to validate the signature. That public key *cannot* be used to sign cards/passes, only to confirm the content was indeed signed with the corresponding **SECRET** key.

::: danger DISCLAIMER
This application was developed as a learning experience and should NOT be used to validate cards/passes in any legal context. Instead, always use the applications provided by the issuer.
:::

## Your Card/Pass Type

**{{ qrData.cardTypeDisplay }}**
          </q-markdown>
          <q-markdown v-if="qrData.statusSupported == 'yes'" no-line-numbers no-heading-anchor-links no-linkify>
This card/pass format is fully supported so if:

* You received a &lt;span class="bg-green text-white"&gt;&nbsp;valid&nbsp;&lt;/span&gt; status, then we were able to fully verify that the content of it was signed by the real legitimate issuer.
* You received an &lt;span class="bg-yellow-9 text-white"&gt;&nbsp;unknown&nbsp;&lt;/span&gt; status, then we should be able to verify it *BUT* we do not have your issuer in our list. See the next section if you want it added.
* You received an &lt;span class="bg-red-10 text-white"&gt;&nbsp;invalid&nbsp;&lt;/span&gt; status, then the content of your card/pass appears to be falsified. If you know this to be the case, you should know the airport will detect this as well, please get vaccinated. If this is really an official card/pass, it may be because we need to add a new public key to the issuer’s keystore. If you would like me to fix this, follow the instructions in the next section.
          </q-markdown>
          <q-markdown v-else no-line-numbers no-heading-anchor-links no-linkify>
This card/pass can be decoded but we currently do not support validation. This can be because:

* The format is not available publicly (e.g. NYS Excelsior Pass)
* The public key is not available (yet) for some reason
* The implementation is too complicated for the limited time that I have
          </q-markdown>
          <q-markdown v-if="qrData.statusSupported == 'yes'" no-line-numbers no-heading-anchor-links no-linkify>
### How to Request your Issuer be Added to VaxCheck

If your card/pass format is fully supported but we do not know your issuer, you can either:

1. Send me your QR code via [email](mailto:marco@vaxcheck.app) --- By doing this you will provide me with your name, birthdate and vaccination info but it’s the easiest method but provides less privacy.
2. Email me the information in the section below.
3. If you are a developer, you can also open an issue or send me a pull request [here](https://github.com/mponton/vaxcheck).

***Je parle français, n’hésitez donc pas à m’écrire dans la langue de Molière (ou celle de Plume Latraverse) ;-).***

### Issuer Info
          </q-markdown>
          <q-markdown v-if="qrData.statusSupported == 'yes'" no-line-numbers no-heading-anchor-links no-linkify show-copy>
```text
issuer name: In your own words (e.g. Government of Somewhere)
iss: {{ qrData.issuerInfo.iss }}
kid: {{ qrData.issuerInfo.kid }}
```
          </q-markdown>
          <!-- FIXME: The above works for now but it's ugly as hell and the Issuer Info only applies to SHC format... -->
        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>

</template>

<script>
import { defineComponent, ref } from "vue";
import { useQuasar } from "quasar";

import MainMarkdown from "assets/main.markdown";
import CamPermsMarkdown from "assets/cam-perms.markdown";

// https://github.com/zxing-js/browser
import { BrowserQRCodeReader } from "@zxing/browser";
import { NotFoundException, FormatException, ChecksumException } from "@zxing/library";

import { EventBus } from 'boot/global-event-bus';

import { SampleQrData } from "../lib/sample-data";
import { DecodingError } from "../lib/errors";
import { decodeSmartHealthCard } from "../lib/shc";
import { decodeEuDigitalGreenCard } from "../lib/eudgc";
import { decodeExcelsiorPass } from "../lib/excelsior-pass";

export default defineComponent({
  name: "PageIndex",

  setup() {
    const $q = useQuasar();
    const mainMarkdown = ref(MainMarkdown);
    const camPermsMarkdown = ref(CamPermsMarkdown);

    const camHelpDialog = ref(false);
    const statusInfoDialog = ref(false);
    const camera = ref(null);
    const filePicker = ref(null);
    const cameraScanInProgress = ref(null);
    const zxingControls = ref(null);
    const lastImagePickerEvent = ref({ timeStamp: 0 });
    const selectedImages = ref(null);
    const scanResult = ref(null);
    const qrData = ref(null);
    const sampleQrData = ref(SampleQrData);

    const codeReader = new BrowserQRCodeReader();

    async function decodeQRPayload() {
      const qrPayload = scanResult.value.text;
      console.log("Raw QR payload: ", qrPayload);

      try {
        // Smart Health Card
        if (qrPayload.match(/^shc:\//)) {
          qrData.value = await decodeSmartHealthCard(qrPayload);
          EventBus.$emit("qrDataChanged", qrData);
          console.log("qrData = ", qrData.value);
          return;
        }

        // EU Digital Green Card
        if (qrPayload.match(/^HC1:/)) {
          qrData.value = await decodeEuDigitalGreenCard(qrPayload);
          EventBus.$emit("qrDataChanged", qrData);
          console.log("qrData = ", qrData.value);
          return;
        }

        // JSON-encoded formats (e.g. NY Excelsior Pass)
        let qrPayloadParsed = null;
        try {
          qrPayloadParsed = JSON.parse(qrPayload);
          console.log("qrPayloadParsed = ", qrPayloadParsed);
        } catch (e) {
          // Uh... ¯\_(ツ)_/¯
          if (
            /^(\d|\w|\s|[~!@#$%^&*()_+={}\[\]|\\:;"'<>,\.?/-])+$/.test(
              qrPayload
            )
          ) {
            console.log(
              "Could not determine exact format of card, dumping DATA instead..."
            );
            qrData.value = {
              status: "unknown",
              statusBannerClass: "bg-grey-10 text-white",
              statusBannerIcon: "help_center",
              statusBannerMessage:
                "We were able to decode this QR code but unable to identify the format. As a very last resort, here's a dump of the data (which may look like garbage to you).",
              cardType: "Unknown",
              cardDump: qrPayload.trim(),
              cardDumpFormat: "text",
            };
            EventBus.$emit("qrDataChanged", qrData);
            return;
          } else {
            throw new DecodingError(
              "Unknown QR Code Format",
              "We were able to decode this QR code but unable to identify the format. The resulting data appears binary and unsafe for display."
            );
          }
        }

        if (qrPayloadParsed.credentialSchema && /libertyhealthpass/.test(qrPayloadParsed.credentialSchema.id)) {
          qrData.value = await decodeExcelsiorPass(qrPayloadParsed);
          EventBus.$emit("qrDataChanged", qrData);
          console.log("qrData = ", qrData.value);
          return;
        }

        // Last resort, dump info in JSON format, better than nothing for now...
        console.log(
          "Could not determine exact format of card from JSON data, dumping JSON instead..."
        );
        qrData.value = {
          status: "unknown",
          statusBannerClass: "bg-grey-10 text-white",
          statusBannerIcon: "help_center",
          statusBannerMessage:
            "This QR code produced valid JSON data but we could not determine the exact format and display it appropriately. As a last resort, here's a dump of the data.",
          cardType: "Unknown",
          cardDump: JSON.stringify(qrPayloadParsed, null, 2).trim(),
          cardDumpFormat: "js",
        };
        EventBus.$emit("qrDataChanged", qrData);
      } catch (e) {
        console.warn("e = ", e);
        if (e instanceof DecodingError) {
          showErrorDialog(e.errType, e.message);
        } else {
          showUnknownErrorDialog(e.name + ": " + e.message);
        }
      }
    }

    function showCameraPermissionsDialog() {
      $q.dialog({
        persistent: true,
        html: true,
        title: "Camera Access Required",
        message: "VaxCheck requires access to the camera to scan QR codes. Your browser is currently denying access. \
          This may be because your default settings for browser camera access are set to \"Deny\" or you possibly \
          mistakenly denied access when first prompted by the application.",
        ok: {},
        cancel: {
          label: "help",
        },
      }).onCancel(() => {
        camHelpDialog.value = true;
      });
    }

    function showErrorDialog(title, message) {
      $q.dialog({
        noBackdropDismiss: true,
        title: title,
        message: message,
      });
    }

    function showUnknownErrorDialog(errMsg) {
      $q.dialog({
        noBackdropDismiss: true,
        title: "Error",
        message:
          "An unhandled error occured. This message may (or may not) help troubleshoot it: " +
          errMsg,
      });
    }

    return {
      mainMarkdown,
      camPermsMarkdown,
      camHelpDialog,
      statusInfoDialog,
      camera,
      filePicker,
      cameraScanInProgress,
      zxingControls,
      selectedImages,
      scanResult,
      qrData,
      sampleQrData,
      showStatusInfo() {
        statusInfoDialog.value = true;
      },
      async scanUsingCamera() {
        // Clear any previously loaded QR data to clear display
        qrData.value = null;
        EventBus.$emit("qrDataChanged", qrData);

        const previewElem = document.querySelector("video");
        try {
          zxingControls.value = await codeReader.decodeFromVideoDevice(
            undefined,
            previewElem,
            async (result, error, controls) => {
              if (!cameraScanInProgress.value) {
                cameraScanInProgress.value = true;
              }
              if (result) {
                console.log("scanResult: ", result);
                scanResult.value = result;
                controls.stop();
                cameraScanInProgress.value = false;
                await decodeQRPayload();
              }
            }
          );
        } catch (e) {
          console.log("exception = ", e);
          if (e instanceof DOMException && e.name == "NotAllowedError") {
            showCameraPermissionsDialog();
          } else {
            showUnknownErrorDialog(e.message);
          }
        }
      },
      cancelCamera() {
        zxingControls.value.stop();
        cameraScanInProgress.value = false;
      },
      showImagePicker() {
        filePicker.value.pickFiles();
      },
      scanFromImage(evt) {
        console.log("event = ", evt);

        if (lastImagePickerEvent.value.timeStamp != evt.timeStamp) {
          lastImagePickerEvent.value = evt;
          const imgFile = evt.srcElement.files[0];
          console.log("imgFile = ", imgFile);
          const fileReader = new FileReader();
          fileReader.onloadend = async () => {
            // Clear file picker
            filePicker.value.removeAtIndex(0);
            try {
              const result = await codeReader.decodeFromImageUrl(
                fileReader.result
              );
              console.log("scanResult: ", result);
              scanResult.value = result;
              await decodeQRPayload();
            } catch (e) {
              // Clear any previously loaded QR data to clear display
              qrData.value = null;
              EventBus.$emit("qrDataChanged", qrData);

              // Try with jsQR --- Does't seem to be much better...
              // const canvas = document.querySelector("canvas");
              // const ctx = canvas.getContext('2d');
              // const img = new Image();
              // img.onload = () => {
              //   ctx.drawImage(img, 0, 0);
              // }
              // img.src = fileReader.result;
              // const imgData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
              // console.log(imgData);
              // const code = jsQR(imgData.data, imgData.width, imgData.height);
              // console.log("jsQR code = " + code);

              if (e instanceof NotFoundException) {
                showErrorDialog(
                  "No QR Code",
                  "Failed to find a QR code in the image provided"
                );
              } else if (e instanceof FormatException || e instanceof ChecksumException) {
                // FIXME: Decoding from an image fails often it seems... Why?
                showErrorDialog(
                  "Decoding Error",
                  "Failed to properly decode the QR code in the image"
                );
              } else {
                console.log("exception = ", e);
                showUnknownErrorDialog(e.name);
              }
            }
          };
          fileReader.readAsDataURL(imgFile);
        }
      },
    };
  },
});
</script>
