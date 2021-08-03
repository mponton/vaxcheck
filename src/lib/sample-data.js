// This is used to fill in the blanks and test the HTML layout
export const SampleQrData = {
    issuerInfo: {
        "name": "Quebec Government",
        "issuerUrl": "https://quebec.ca",
        "proofUrl": "https://covid19.quebec.ca",
        "iss": "https://covid19.quebec.ca/PreuveVaccinaleApi/issuer",
        "kid": "QUEBEC-01"
    },
    issuedAt: "2021-07-30",
    expirationDate: "2022-07-30", // Not legit for SHC, just to test display
    statusSupported: "yes",
    status: "unknown",
    statusBannerClass: "bg-grey-9 text-white",
    statusBannerIcon: "help",
    statusBannerMessage: "Oops! Something went wrong.",
    cardType: "shc",
    cardTypeDisplay: "Smart Health Card",
    patient: {
        fullName: "JOHN DOE",
        firstName: "JOHN",
        lastName: "DOE",
        gender: "Male",
        birthDate: "1970-01-01"
    },
    immunizations: [
        {
            occurrenceDateTime: "2021-05-15",
            doseNumber: 1,
            location: "Somewhere on earth",
            vaccineCode: {
                code: "666",
                display: "Evil Vax",
                system: ""
            },
            targetDisease: {
                code: "777",
                display: "Fake Disease",
                system: ""
            },
            note: "Just some example note"
        },
        {
            occurrenceDateTime: "2021-07-15",
            doseNumber: 2,
            location: "Somewhere on earth",
            vaccineCode: {
                code: "666",
                display: "Evil Vax",
                system: ""
            },
            targetDisease: {
                code: "777",
                display: "Fake Disease",
                system: ""
            },
            note: "Just some example note"
        }
    ]
}