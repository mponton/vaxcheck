//
// Public keys used for validation of SHC (and possibly other format) must be downloaded from
// the web. At the time of writing a really weird situation for Quebec is that the public
// keys don't even seem to be published anymore at the well known URL where they should be.
//
// Yet trying to find them I instead found someone on Github who developed a similar tool
// and someone managed to grab the public key somewhere...
//
// I decided to create lookup table of "Issuers" based on the `iss` field value (and possibly
// similar field from other formats) because:
//
//   1) I'd prefer the whole validation takes place WITHOUT any network access so people
//      are not worried about me stealing any of their information.
//   2) Even if you grab the public key needed from the URL, you still need some kind of
//      whitelist or SSL certificate pinning because there is nothing preventing some
//      fake card provider to setup https://fake-vax-proof.com/issuer/.well-known/jwks.json
//      and setting the SHC `iss` value to "https://fake-vax-proof.com/issuer/" to create
//      passes that appear valid.
//

// NOTE: There is something weird about the Quebec implementation. The SHC doc
// (https://spec.smarthealth.cards/#determining-keys-associated-with-an-issuer)
// says that public keys "SHALL have "kid" equal to the base64url-encoded
// SHA-256 JWK Thumbprint of the key (see RFC7638)". I had 3 QR codes sent
// to me by the government:
//
//   * Around 2021-05-12 after my first vaccine:
//        "kid" value is: 6o2huWY6on4LjAmxdSJMxuokYYUbHrN6T-JDva6pgIc
//        "iat" value is: 1621178394 (Sun May 16 2021 11:19:54 GMT-0400 (EDT))
//        "iss" value is ---> NOT set <---
//   * Around 2021-07-07 after my second vaccine:
//        "kid" value is: O7LmoKnLaK_5DVibTQ7ttt6AH_q6HHt358p7CB2flUg
//        "iat" value is: 1626021100 (Sun Jul 11 2021 12:31:40 GMT-0400 (EDT))
//        "iss" value is: https://covid19.quebec.ca/PreuveVaccinaleApi/issuer
//   * 2021-07-30 after requesting a new vaccination proof:
//        "kid" value is: qFdl0tDZK9JAWP6g9_cAv57c3KWxMKwvxCrRVSzcxvM
//        "iat" value is: 1627592390 (Thu Jul 29 2021 16:59:50 GMT-0400 (EDT))
//        "iss" value is: https://covid19.quebec.ca/PreuveVaccinaleApi/issuer
//
// My wife's equivalent 3 QR codes:
//
//   * Around 2021-05-17 after her first vaccine:
//        "kid" value is: fyTdFn0t8wQPcoXr_MiCmwivdVTKTrkhzBhgMqmlH34
//        "iat" value is: 1621285456 (Mon May 17 2021 17:04:16 GMT-0400 (EDT))
//        "iss" value is: https://covid19.quebec.ca/PreuveVaccinaleApi/issuer
//   * Around 2021-07-12 after her second vaccine:
//        "kid" value is: vLTCSHqxUWfUl6vajWyRVt-cJo_nReXY8F7tgg3i4sU
//        "iat" value is: 1626107319 (Mon Jul 12 2021 12:28:39 GMT-0400 (EDT))
//        "iss" value is: https://covid19.quebec.ca/PreuveVaccinaleApi/issuer
//   * 2021-07-30 after requesting a new vaccination proof:
//        "kid" value is: qFdl0tDZK9JAWP6g9_cAv57c3KWxMKwvxCrRVSzcxvM
//        "iat" value is: 1627587574 (Thu Jul 29 2021 15:39:34 GMT-0400 (EDT))
//        "iss" value is: https://covid19.quebec.ca/PreuveVaccinaleApi/issuer
//
// So in our case, only the last "kid" is identical and I suspect is because
// we each requested our proof on the same day.
//
// If the SHC standard was followed my understanding is that the Key ID (kid)
// would only change if the actual key changed since it's supposed to be a
// thumbprint of said key...
//
// Moreover the verifier is supposed to lookup the public key from the "iss"
// URL using the "kid" by downloading a JSON file that contains an array. Yet
// the hardcoded Quebec key BELOW will gladly validate all 6 of our QR codes. I
// suspect the QC government is not planning on using the SHC-approved way of
// doing things and will instead pin their public key(s) in the official app
// when they release it.

export const Issuers = {
    "https://smarthealth.cards/examples/issuer": {
        "name": "Smart Health Card (EXAMPLE)",
        "issuerUrl": "https://smarthealth.cards",
        "proofUrl": "https://spec.smarthealth.cards",
        "keystore": {
            "keys": [
                {
                    "kty": "EC",
                    "kid": "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s",
                    "use": "sig",
                    "alg": "ES256",
                    "crv": "P-256",
                    "x": "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw",
                    "y": "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8"
                }
            ]
        }
    },
    "https://covid19.quebec.ca/PreuveVaccinaleApi/issuer": {
        "name": "Quebec Government",
        "issuerUrl": "https://quebec.ca",
        "proofUrl": "https://covid19.quebec.ca",
        "keystore": {
            "keys": [
                // This is not working and returns a 404
                // https://covid19.quebec.ca/PreuveVaccinaleApi/issuer/.well-known/jwks.json
                //
                // QC public key "stolen" from https://github.com/fproulx/shc-covid19-decoder
                // on which I stumbled trying to find the public key(s) from the above URL.
                // I need to ask him where the hell he got it...
                {
                    "kty": "EC",
                    "kid": "QUEBEC-01",
                    "use": "sig",
                    "alg": "ES256",
                    "crv": "P-256",
                    "x": "XSxuwW_VI_s6lAw6LAlL8N7REGzQd_zXeIVDHP_j_Do",
                    "y": "88-aI4WAEl4YmUpew40a9vq_w5OcFvsuaKMxJRLRLL0"
                },
                // SHC Sample Key to test validation failure
                {
                    "kty": "EC",
                    "kid": "QUEBEC-01-FAIL",
                    "use": "sig",
                    "alg": "ES256",
                    "crv": "P-256",
                    "x": "7xbC_9ZmFwKqOHpwX6-LnlhIh5SMIuNwl0PW1yVI_sk",
                    "y": "7k2fdIRNDHdf93vL76wxdXEPtj_GiMTTyecm7EUUMQo"
                },
            ]
        }
    },
    // Originally from https://github.com/fproulx/shc-covid19-decoder/pull/6/files#diff-4256b154f3f806c69f38fa0e56022bd0d659769fa5ba4eff9001b4ef808b417eR11
    // but re-validated against https://myvaccinerecord.cdph.ca.gov/creds/.well-known/jwks.json on 2021-07-30
    "https://myvaccinerecord.cdph.ca.gov/creds": {
        "name": "California Department of Public Health",
        "issuerUrl": "https://cdph.ca.gov",
        "proofUrl": "https://myvaccinerecord.cdph.ca.gov",
        "keystore": {
            "keys": [
                {
                    "kty": "EC",
                    "kid": "7JvktUpf1_9NPwdM-70FJT3YdyTiSe2IvmVxxgDSRb0",
                    "use": "sig",
                    "alg": "ES256",
                    "crv": "P-256",
                    "x": "3dQz5ZlbazChP3U7bdqShfF0fvSXLXD9WMa1kqqH6i4",
                    "y": "FV4AsWjc7ZmfhSiHsw2gjnDMKNLwNqi2jMLmJpiKWtE"
                }
            ]
        }
    }
}
