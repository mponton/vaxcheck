/*

Decode New York's state Excelsior Pass QR payload to "standardized" QR data used in HTML display.

Useful links:

    https://covid19vaccine.health.ny.gov/excelsior-pass

NOTE: Work here is purely based on reverse engineering from the JSON data encoded in the QR code.
At this point in time I do not know how to validate the pass since I could not find any technical
documentation and cannot download the NYS Excelsior Pass Scanner either.

*/

import { DecodingError } from "./errors";

export async function decodeExcelsiorPass(qrPayloadParsed) {
    if (!qrPayloadParsed.credentialSchema || !/libertyhealthpass/.test(qrPayloadParsed.credentialSchema.id)) {
        throw Error("BUG CHECK: decodeExcelsiorPass() called with a non-Excelsior payload");
    }
    if (!qrPayloadParsed.credentialSubject) {
        throw new DecodingError(
            "Missing Credential Subject",
            "We detected a NYS Excelsior Pass but a required field was not present when decoding it.");
    }
    const firstName = qrPayloadParsed.credentialSubject.subject.name.given;
    const lastName = qrPayloadParsed.credentialSubject.subject.name.family;
    const qrData = {
        statusSupported: "no",
        status: "unknown",
        statusBannerClass: "bg-yellow-9 text-white",
        statusBannerIcon: "warning",
        statusBannerMessage: "This is a New York Excelsior Pass but we cannot determine its validity",
        cardType: "excelsior",
        cardTypeDisplay: "NYS Excelsior Pass",
        issuedAt: qrPayloadParsed.issuanceDate,
        expirationDate: qrPayloadParsed.expirationDate,
        issuerInfo: {
            name: "New York State Department of Health",
            issuerUrl: "https://health.ny.gov/",
            proofUrl: "https://covid19vaccine.health.ny.gov/excelsior-pass"
        },
        patient: {
            firstName: firstName,
            lastName: lastName,
            fullName: firstName + " " + lastName,
            birthDate: qrPayloadParsed.credentialSubject.subject.birthDate
        },
        immunizations: [
            {
                occurrenceDateTime: "Unspecified",
                note: qrPayloadParsed.credentialSubject.passType
            }
        ]
    }

    return qrData;
}