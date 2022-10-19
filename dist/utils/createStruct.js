"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.struct = void 0;
exports.struct = {
    /**
     * Encodes a JSON object into a protobuf {@link Struct}.
     *
     * @param {Object.<string, *>} value the JSON object.
     * @returns {Struct}
     */
    encode(json) {
        const fields = {};
        Object.keys(json).forEach((key) => {
            // If value is undefined, do not encode it.
            if (typeof json[key] === "undefined")
                return;
            /* @ts-ignore */
            fields[key] = value.encode(json[key]);
        });
        return { fields };
    },
    /**
     * Decodes a protobuf {@link Struct} into a JSON object.
     *
     * @param {Struct} struct the protobuf struct.
     * @returns {Object.<string, *>}
     */
    decode({ fields = {} }) {
        const json = {};
        Object.keys(fields).forEach((key) => {
            /* @ts-ignore */
            json[key] = value.decode(fields[key]);
        });
        return json;
    },
};
//# sourceMappingURL=createStruct.js.map