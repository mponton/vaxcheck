/*

Decode Smart Health Card (SHC) QR payload to "standardized" QR data used in HTML display.

Useful links:

    https://smarthealth.cards/
    https://spec.smarthealth.cards/
    https://github.com/smart-on-fhir/health-cards
    http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/
    http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/StructureDefinition-vaccination-credential-patient.html
    http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/StructureDefinition-vaccination-credential-immunization.html

*/

import zlib from "browserify-zlib";
import jose from "node-jose";

import { DecodingError } from "./errors";
import { Issuers } from "./issuers";
import { VaxCodes } from "./vax-codes";
import { DiseaseCodes } from "./disease-codes";

export async function decodeSmartHealthCard(qrPayload) {
    if (!qrPayload.match(/^shc:\//)) {
        throw Error("BUG CHECK: decodeSmartHealthCard() called with a non-SHC payload");
    }

    // NOTE: We currently only support single-chunk JWS.
    let m = qrPayload.match(/^shc:\/(\d+)$/);
    if (m) {
        console.debug("Decoding SHC data");

        // A segment encoded with numeric mode consisting of the characters 0-9.
        // Each character "c" of the JWS is converted into a sequence of two digits
        // as by taking Ord(c)-45 and treating the result as a two-digit base ten number.
        // For example, 'X' is encoded as 43, since Ord('X') is 88, and 88-45 is 43.
        // (The constant "45" appears here because it is the ordinal value of -, the
        // lowest-valued character that can appear in a compact JWS. Subtracting 45
        // from the ordinal values of valid JWS characters produces a range between
        // 00 and 99, ensuring that each character of the JWS can be represented in
        // exactly two base-10 numeric digits.)
        const numericData = m[1];
        const jws = numericData
            .split(/(..)/)
            .filter((s) => {
                return s;
            })
            .map((s) => String.fromCharCode(parseInt(s, 10) + 45))
            .join("");
        console.debug("SHC jws = " + jws);

        // https://medium.facilelogin.com/jwt-jws-and-jwe-for-not-so-dummies-b63310d201a3
        // https://datatracker.ietf.org/doc/html/rfc7515
        // https://datatracker.ietf.org/doc/html/rfc7517
        // https://datatracker.ietf.org/doc/html/rfc7638
        const [joseHeaderBase64, jwsPayloadBase64, jwsSigBase64, rest] =
            jws.split(".");
        if (rest) {
            throw new DecodingError(
                "Invalid Smart Health Card",
                "We encountered extra data while decoding the SHC payload, the card appears to be invalid or is a new format that we do not support."
            );
        }
        const joseHeaderJson = Buffer.from(joseHeaderBase64, "base64");
        const jwsPayloadCompressedJson = Buffer.from(
            jwsPayloadBase64,
            "base64"
        );
        const jwsPayloadJson = zlib.inflateRawSync(jwsPayloadCompressedJson);
        const joseHeader = JSON.parse(joseHeaderJson);
        const jwsPayload = JSON.parse(jwsPayloadJson);

        console.debug("joseHeader = ", joseHeader);
        console.debug("jwsPayload = ", jwsPayload);

        // jwsPayload.vc.credentialSubject.fhirBundle.resourceType == "Bundle"
        // http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/StructureDefinition-vaccination-credential-bundle.html
        // jwsPayload.vc.credentialSubject.fhirBundle.entry[*].resource.resourceType == "Patient"
        // http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/StructureDefinition-vaccination-credential-patient.html
        // jwsPayload.vc.credentialSubject.fhirBundle.entry[*].resource.resourceType == "Immunization"
        // http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/StructureDefinition-vaccination-credential-immunization.html

        if (jwsPayload.vc.credentialSubject.fhirBundle.resourceType != "Bundle") {
            throw new DecodingError(
                "Invalid FHIR Resource Type",
                "We expected the Fast Healthcare Interoperability Resources (FHIR) resource type of Bundle but got an unexpected value. Not proceeding with further decoding.")
        }

        const patientResource =
            jwsPayload.vc.credentialSubject.fhirBundle.entry.filter((entry) => {
                return entry.resource.resourceType == "Patient";
            })[0].resource;
        const immunizationResources =
            jwsPayload.vc.credentialSubject.fhirBundle.entry
                .filter((entry) => {
                    return entry.resource.resourceType == "Immunization";
                })
                .map((entry) => entry.resource);
        // https://spec.smarthealth.cards/#health-cards-are-encoded-as-compact-serialization-json-web-signat
        // says "issuanceDate" should be represented by `nbf` field but Quebec uses `iat` instead.
        const issuedAt = jwsPayload.nbf ? jwsPayload.nbf : jwsPayload.iat;
        // FHIR doc says name can be set via `text` field is it cannot be categorized in given or family
        let fullName = patientResource.name[0].text;
        // The FHIR doc says given name is 0..1 entries. I'm not sure if 1 means a string but Quebec uses an array.
        // For "safety" I apply the same logic as for family name.
        const firstName = patientResource.name[0].given ?
            (patientResource.name[0].given.join ? patientResource.name[0].given.join(" ") : patientResource.name[0].given) : "";
        // FHIR doc and examples have family as a string but Quebec uses an array
        const lastName = patientResource.name[0].family ?
            (patientResource.name[0].family.join ? patientResource.name[0].family.join(" ") : patientResource.name[0].family) : "";
        if (!fullName) {
            fullName = firstName + " " + lastName;
        }
        const issuerInfo = Issuers[jwsPayload.iss];
        if (issuerInfo) {
            issuerInfo.iss = jwsPayload.iss,
            issuerInfo.kid = joseHeader.kid
        }
        const qrData = {
            statusSupported: "yes",
            status: "invalid",
            statusBannerClass: "bg-red-10 text-white",
            statusBannerIcon: "error_outline",
            statusBannerMessage: "This Smart Health Card is INVALID.",
            cardType: "shc",
            cardTypeDisplay: "Smart Health Card",
            issuedAt: new Date(issuedAt * 1000).toString(),
            issuerInfo: issuerInfo
                ? issuerInfo
                : {
                    name: "Unknown",
                    issuerUrl: null,
                    // NOTE: Ternary is for Quebec's weird old passes that don't have an `iss` field
                    proofUrl: jwsPayload.iss ? jwsPayload.iss.replace(
                        /^(https:\/\/[^\/]+)(\/.*)?$/,
                        "$1"
                    ) : null,
                    keystore: {
                        keys: [],
                    },
                    iss: jwsPayload.iss,
                    kid: joseHeader.kid
                },
            patient: {
                firstName: firstName,
                lastName: lastName,
                fullName: fullName,
                birthDate: patientResource.birthDate,
                // NOTE: FHIR doc says this should not be present but Quebec includes it
                gender: patientResource.gender,
            },
            // For our use case, SHC only allows a single patient so we assume all
            // records below are for the above patient.
            immunizations: immunizationResources.map((r) => {
                const vaxCode = r.vaccineCode.coding[0].code;
                const vaxSystem = r.vaccineCode.coding[0].system;
                const vaxLookup = VaxCodes[vaxSystem];
                let vaxDisplay = r.vaccineCode.coding[0].display;

                if (vaxLookup && !vaxDisplay) {
                    vaxDisplay = vaxLookup[vaxCode]
                        ? vaxLookup[vaxCode].display
                        : null;
                }
                if (!vaxDisplay) {
                    // NOTE: Quebec (and possibly others) does not include a `display`
                    //       field so if we don't have it in our lookup table we fallback
                    //       on providing the system for the code.
                    vaxDisplay = vaxSystem;
                }
                // Set/update field in object
                r.vaccineCode.coding[0].display = vaxDisplay;
                let location = null;
                if (r.location) {
                    location = r.location.display;
                }
                // Although not documented, SHC sample data includes a performer.actor.display
                // with a value of (e.g.) "ABC General Hospital" so we use it for location
                // if location was not already determined.
                if (!location && r.performer && r.performer.actor) {
                    location = r.performer.actor.display;
                }
                const note = r.note ? (r.note.join ? r.note.map((n) => n.text).join("\n") : r.note) : null;
                // As per SHC documentation, protocolApplied is not supposed to be present
                // but Quebec includes it so we display it if present.
                const patd = r.protocolApplied && r.protocolApplied.targetDisease;
                if (patd) {
                    let tdDisplay =
                        DiseaseCodes[r.protocolApplied.targetDisease.coding[0].code];
                    r.protocolApplied.targetDisease.coding[0].display = tdDisplay
                        ? tdDisplay
                        : "Unknown";
                }
                return {
                    location: location,
                    lotNumber: r.lotNumber,
                    note: note,
                    occurrenceDateTime: r.occurrenceDateTime,
                    // For now we assume only one of these is present
                    vaccineCode: r.vaccineCode.coding[0],
                    // This in theory should NOT be present but it is for Quebec (for now)
                    // http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/StructureDefinition-vaccination-credential-immunization.html#why-protocolapplied-is-not-allowed
                    // If present we assume only one entry
                    doseNumber: r.protocolApplied
                        ? r.protocolApplied.doseNumber
                        : null,
                    targetDisease: patd
                        ? r.protocolApplied.targetDisease.coding[0]
                        : null,
                    status: r.status,
                };
            }),
        };

        // Here qrData is pretty much filled but pass is considered invalid. Let's verify it now.

        // Signature Verification
        // https://github.com/cisco/node-jose

        const keystore = await jose.JWK.asKeyStore(qrData.issuerInfo.keystore);
        console.debug("keystore = ", keystore);

        let kid = joseHeader.kid;
        if (qrData.issuerInfo.issuerUrl == "https://quebec.ca") {
            // Weird stuff going on with the Quebec implementation...
            // See NOTE in ../lib/shc.js
            kid = "QUEBEC-01";
        }
        const key = keystore.get(kid, { kty: "EC", use: "sig", alg:"ES256", crv: "P-256" });
        console.debug("JWS verification key = ", key);

        if (!key) {
            qrData.status = "unknown";
            qrData.statusBannerClass = "bg-yellow-9 text-white";
            qrData.statusBannerIcon = "warning";
            qrData.statusBannerMessage = "We could not determine the validity of this Smart Health Card because we do not yet support the issuer.";
            return qrData;
        }

        const verifier = await jose.JWS.createVerify(key);
        try {
            const result = await verifier.verify(jws);

            console.debug("JWS verification result = ", result);

            qrData.status = "valid";
            qrData.statusBannerClass = "bg-green text-white";
            qrData.statusBannerIcon = "check";
            qrData.statusBannerMessage = "This Smart Health Card is valid.";
            return qrData;
        } catch (e) {
            console.warn("Invalid SHC signature: ", e);
            return qrData;
        }
    } else {
        throw new DecodingError(
            "Unsupported SHC Format",
            "This Smart Health Card contains more than one chunk (i.e. is composed of multiple QR code). We do not support this format yet.");
    }
}