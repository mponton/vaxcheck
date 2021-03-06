# VaxCheck

## What is it?

This is a Quasar/Vue SPA that allows you to decode the QR code of vaccination cards/passes from some countries/regions to display the data they contain and, when possible, verify that the pass is valid.

## Background Story

In Quebec (Canada) we got our COVID-19 proof of vaccination QR codes starting in May 2021. At the time of writing in early August 2021 there was still no official application to decode the QR codes and there was already a lot of noise in the media about its content, privacy issues, ease of decoding and fake passes. I was curious to know the content of this QR code and how validation worked. At the same time I had a few days off and an interest in learning [Quasar](https://quasar.dev/), [Vue.JS](https://vuejs.org/) and frontend Javascript development. It was a good excuse to get my hands dirty.

I created version 1.0.0 of this application from scratch in ~3 (long) days, filled with rabbit holes. I already knew JavaScript but had never worked with Quasar and Vue nor used any of the JavaScript libraries needed for this project. Of course, I knew nothing about the QR codes formats. I decoded the QR code first to get the raw data, figured it was a Smart Health Card, moved to the [SHC technical specs](https://spec.smarthealth.cards/) and Googled my way thru Quasar, Vue and libraries I needed to complete the work. That is until I hit a snag with the public key for the Quebec Province (see [below](#quebec-specific-notes) for details).

I learned enough to be dangerous 😄 with Quasar, Vue and async/await. Although I knew JavaScript, I really mostly used it in VMware vRealize Automation and this thing runs an old version of the [Rhino engine](https://github.com/mozilla/rhino) that really does not support much of the newer JS syntax and features.

If you are a frontend developer reading this, be warned, if you dig in my code, your eyes could start bleeding 😆. Still, I decided to open-source it and publish it on GitHub Pages. I'll probably keep updating it for a while if time allows and interest does not wane. I'd like to add support for EUDGP (interesting and covers lots of countries in one shot) and other countries/regions using SHC (low hanging fruits).

If you are a graphics designer, well, *YOUR* eyes will definitely bleed. If it was not for some same defaults and Quasar's rich component library your head would probably explode. Anyway, I won't be stealing your job anytime soon.

## Implementation Details

### Security & Privacy

As mentioned previously, this is a Single Page Application (SPA) that runs completely in the browser. The application does not communicate with any API, has no tracking whatsoever and will gladly run in "airplane mode" once loaded (albeit with some icons possibly missing). It it hosted as a static site on GitHub Pages and served over HTTPS.

### Card/Pass Signature Validation

The main "problem" with the SHC/EUDGP formats is that there is no central authority that can be used to ensure an issuer is legitimate. Effectively, you are provided with signed data and with a location from where to get the public key(s) to use to validate the signature, but there is no way to confirm the issuer is a legitimate entity. This means I could easily create properly signed vaccination cards/passes this way:

1. Create a private/public key pair that can be used to sign cards/passes
2. Create the card/pass in the correct format and include a link to my public key in the proper field (e.g. `iss` for SHC; e.g. `https://evil-issuer.tld/mypass`)
3. Sign the card/pass using my private key
4. Encode the card/pass in a QR code

Technically, per the "spec", this card/pass is now valid. It has the proper format, was properly signed and can be verified using the provided public key. The problem is "Evil Issuer" is not a government entity.

Of course, I suspect this is really a non-issue for "official" applications developed by the legitimate issuers as they will surely either include their public key(s) in the application itself, pin their SSL certificate to ensure they connect to *their* official website or, even, use mutual SSL authentication to grab their keystore.

For my use case, I decided to include a "whitelist" of issuers and their keystore for now. This allows for "offline" use, however any issuer that would change their keystore at the "well known" address will require an update to the code for things to keep working. Another alternative would be to include a similar whitelist but get keys directly from the issuer but this would not work offline and to be more secure would also require SSL pinning.

### Quebec-Specific Notes

So, this whole thing started with the Quebec QR codes. It was going well (with some unexpected findings; see below) until I wanted to add validation and needed the public key. The SHC specification says the public key required to validate the payload can be found in the keystore at `<iss>/.well-known/jwks.json`. For Quebec, this is `https://covid19.quebec.ca/PreuveVaccinaleApi/issuer/.well-known/jwks.json`. If you try to load this resource (August 1st 2021 at time of writing), this returns a 404.

So from there I started Googling like crazy, pissed off about the situation, trying to find the public key I needed and stumbled on [this repo](https://github.com/fproulx/shc-covid19-decoder) by [Francois Proulx](https://github.com/fproulx), more precisely, [these lines](https://github.com/fproulx/shc-covid19-decoder/blob/main/src/shc.js#L28-L29). I tested his code against my own QR code and it validated properly. After adding the public key from his repo in my project I was also able to validate QR codes from Quebec. I will definitely be asking him where he got this key as I failed to find it anywhere but in his repo. My guess is that it got published by Quebec early on (he created his project back in May) but then removed for some reason. We'll see...

Other than this public key snag, the Quebec implementation does not seem to follow the SHC specification currently published. The main difference is that the [SHC specification](https://spec.smarthealth.cards/#determining-keys-associated-with-an-issuer) says that the public keys `SHALL have "kid" equal to the base64url-encoded SHA-256 JWK Thumbprint of the key (see RFC7638)`.  Effectively, the `kid` (Key ID) should not change as long as the key does not change and that key ID is supposed to be used to find the proper public key to use from the keystore at the well known address to validate the payload. The Quebec `kid` seems to change daily. On a total of 6 QR codes from my wife, requested on different days, only the last one request on the same day with about 3hrs between them have the same `kid`. I'm not sure how Quebec is going to deal with this but I suspect they will simply include all their key(s) in the official app. Or maybe they never expected to use more than one valid key at any time... I'm not sure if the `kid` is randomly generated at interval or if it contains any "secret" data. If anyone has information their want to share with me, don't hesitate to reach out!

In addition to the above, the SHC specification requires the use of a [FHIR credential bundle](http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/StructureDefinition-vaccination-credential-bundle.html) in the payload. Quebec's implementation again (*it seems*) does not fully match what is published as they include fields that should not be there (e.g. `protocolApplied`). That said, it could be that the FHIR specifications changed since their implementation. I don't want to throw rocks at anyone here.

### New York State Excelsior Pass

On August 22nd I read an [article (in French)](https://ici.radio-canada.ca/nouvelle/1818113/passeport-vaccinal-risque-danger-securite-cybersecurite) written by [Nicolas De Rosa](https://twitter.com/n_de_rosa) that mentions that the NYS Excelsior pass is based on the SHC framework. I thought this was a mistake so I reached out to inform Nicolas that, from my findings, the QR code is NOT using the SHC format. In return he shared this [article](https://www.governor.ny.gov/news/governor-cuomo-announces-launch-excelsior-pass-plus-support-safe-secure-return-tourism-and) clearly saying IT IS based on the SHC framework.

This left me quite puzzled so today I reached out to my US family again and asked they send me their "latest" QR codes from the Excelsior application. I tested again and my findings still show these codes are NOT readable as SHC codes. I'm not sure if NY state is working on a new still-to-be-released version of their app and codes to follow with California and Louisiana but for now, these are not SHC-compatible. Here's some technical details (simplified):

* The [SHC specifications](https://spec.smarthealth.cards/#encoding-chunks-as-qr-codes) says the QR code should begin with `shc:/` followed by data encoded in `numeric` mode (e.g. `shc:/56762909524320603460292437404460<snipped for brevity>`). The Excelsior passes I have decoded so far do not follow this format and instead contain JSON data *directly*.
* An SHC payload is JSON data that follows the [HL7 FHIR vaccine credential](http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/) structure and contains a JOSE header and [JSON Web Signature](https://datatracker.ietf.org/doc/html/rfc7515). The main part of the payload looks like this:

```json
{
  "iss": "<<URL for Issuer>>",
  "nbf": 1611160486,
  "vc": {
    "@context": [
      "https://www.w3.org/2018/credentials/v1"
    ],
    "type": [
      "VerifiableCredential",
      "https://smarthealth.cards#health-card",
      "https://smarthealth.cards#immunization",
      "https://smarthealth.cards#covid19"
    ],
    "credentialSubject": {
      "fhirVersion": "4.0.1",
      "fhirBundle": {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": [
          {
            "fullUrl": "resource:0",
            "resource": {
              "resourceType": "Patient",
              "name": [
                {
                  "family": "Anyperson",
                  "given": [
                    "Johnathan",
                    "Biggleston III"
                  ]
                }
              ],
              "gender": "male",
              "birthDate": "1951-01-20",
              "address": [ {
                  "postalCode": "12345",
                  "country": "US"
                } ]
            }
          },
          {
            "fullUrl": "resource:1",
            "resource": {
              "resourceType": "Immunization",
              "meta": {"security": [{"code": "IAL1.2"}]},
              "status": "completed",
              "vaccineCode": {
                "coding": [
                  {
                    "system": "http://hl7.org/fhir/sid/cvx",
                    "code": "207"
                  }
                ]
              },
              "patient": {
                "reference": "resource:0"
              },
              "occurrenceDateTime": "2021-01-01",
              "location": {
                "reference": "resource:3"
              },
              "performer": [
                {
                  "actor": {
                    "display": "ABC General Hospital"
                  }
                }
              ],
              "lotNumber": "Lot #0000001"
            }
          },
          {
            "fullUrl": "resource:2",
            "resource": {
              "resourceType": "Immunization",
              "status": "completed",
              "vaccineCode": {
                "coding": [
                  {
                    "system": "http://hl7.org/fhir/sid/cvx",
                    "code": "207"
                  }
                ]
              },
              "patient": {
                "reference": "resource:0"
              },
              "occurrenceDateTime": "2021-01-29",
              "performer": [
                {
                  "actor": {
                    "display": "ABC General Hospital"
                  }
                }
              ],
              "lotNumber": "Lot #0000007"
            }
          }
        ]
      }
    }
  }
}
```

* The Excelsior JSON payload looks like this:

```json
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1"
    ],
    "id": "did:hpass:b3a918aa1ec2b0f0d58a6ca3e7c8ebb6a631cbb2408ad5e8ecaca9fdb48ee4bf:7210026a6918e3250c1d1094636c0a89cc06468cf302bce2216e20c755d020ac#REDACTED",
    "type": [
        "VerifiableCredential"
    ],
    "issuer": "did:hpass:b3a918aa1ec2b0f0d58a6ca3e7c8ebb6a631cbb2408ad5e8ecaca9fdb48ee4bf:7210026a6918e3250c1d1094636c0a89cc06468cf302bce2216e20c755d020ac",
    "issuanceDate": "2021-mm-ddThh:mm:ssZ",
    "expirationDate": "2021-mm-ddThh:mm:ssZ",
    "credentialSchema": {
        "id": "did:hpass:b3a918aa1ec2b0f0d58a6ca3e7c8ebb6a631cbb2408ad5e8ecaca9fdb48ee4bf:7210026a6918e3250c1d1094636c0a89cc06468cf302bce2216e20c755d020ac;id=libertyhealthpass;version=0.1",
        "type": "JsonSchemaValidator2018"
    },
    "credentialSubject": {
        "display": "#24387E",
        "passType": "COVID-19 Vaccination",
        "subject": {
            "birthDate": "19xx-xx-xx",
            "name": {
                "family": "Doe",
                "given": "John"
            }
        },
        "type": "Liberty HealthPass"
    },
    "proof": {
        "created": "2021-mm-ddThh:mm:ssZ",
        "creator": "did:hpass:b3a918aa1ec2b0f0d58a6ca3e7c8ebb6a631cbb2408ad5e8ecaca9fdb48ee4bf:7210026a6918e3250c1d1094636c0a89cc06468cf302bce2216e20c755d020ac#key-1",
        "nonce": "806afff9-4398-41bb-a913-f106b0cfcb6b",
        "signatureValue": "MEQCIBZK6N-N-NnQpCBY3L-kDlmp63xs8qP-q9k9YfdUgDwTAiB4h9kc7YZ2Mg7HBg1hYBCJUes1o30SLV7vkR2XMa-ZIw",
        "type": "EcdsaSecp256r1Signature2019"
    }
}
```

Bottom line, I have no idea how the NY state article can claim they use the SHC framework at this time. Unless I am unaware of some technicality (that may allow them to claim that somehow) or an of new upcoming version, I don't think this is correct.

If you have information on the matter feel free to reach out to me. I'm pretty curious to learn more about this.

## Thanks and Kudos

* [Francois Proulx](https://github.com/fproulx) for Quebec's public key (and his project of course, although I'm glad I found it a bit late otherwise I probably never would have started this)
* [Quasar](https://quasar.dev/) and [Vue](https://vuejs.org/) developers and communities (what amazing framework these are with such great documentation!)
* [Danny Connell](https://www.youtube.com/channel/UC6eR_ndNgaTeE5t2Ud4ZiHw) (watching his videos gave me interest in Quasar and Vue and helped me when I finally got my hands dirty)

## TODOs

* [ ] Add support for EU Digital Green Pass
* [ ] Try to get some test data to confirm California SHC work as expected (anyone reading this from California? 😉)
* [ ] Add/integrate with [VCI Directory](https://github.com/the-commons-project/vci-directory)
* [ ] Identify any other countries/regions using SHC (it's easy to add support for them)
* [ ] Look into improving scanning QR from image (current implementation is finicky and a bad experience...)
* [ ] Translate to French using Vue's i18n

## Standard Quasar Development Info

### Install the dependencies

```bash
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
npm run lint
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.conf.js](https://v2.quasar.dev/quasar-cli/quasar-conf-js).
