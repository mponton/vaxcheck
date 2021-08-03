// This is really (for now) only used in the `protocolApplied` field which is not supposed to be present as per:
// http://build.fhir.org/ig/dvci/vaccine-credential-ig/branches/main/StructureDefinition-vaccination-credential-immunization.html#why-protocolapplied-is-not-allowed
// But for some reason it is in Quebec so created this as a lookup for now...
export const DiseaseCodes = {
    "840536004": "COVID-19"
}