
export class DecodingError extends Error {
    constructor(errType, errMessage) {
        super(errMessage);
        this.name = "DecodingError";
        this.errType = errType;
    }
}
