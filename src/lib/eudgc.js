/*

Decode EU Digital Green Card QR payload to "standardized" QR data used in HTML display.

Useful links:

    https://github.com/eu-digital-green-certificates
    https://github.com/eu-digital-green-certificates/dgc-overview
    https://github.com/eu-digital-green-certificates/dgc-participating-countries
    https://github.com/eu-digital-green-certificates/dgc-testdata
    https://github.com/eu-digital-green-certificates/dgc-participating-countries/issues/10
    https://github.com/section42/hcert-trustlist-mirror
    https://github.com/stapelberg/coronaqr

*/

import { DecodingError } from "./errors";

export async function decodeEuDigitalGreenCard(qrPayload) {
    throw new DecodingError("Unimplemented", "Support for EU's Digital Green Card is (probably) coming soon.")
}