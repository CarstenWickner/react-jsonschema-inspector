import JsonSchemaOptionalsGroup from "./JsonSchemaOptionalsGroup";

export default class JsonSchemaAnyOfGroup extends JsonSchemaOptionalsGroup {
    /**
     * Constructor for the representation of a schema's "anyOf" property.
     * The "anyOf" property is a collection of sub-schemas of which one or multiple are expected to be fulfilled.
     *
     * @param {?Object} parserConfig configuration object determining how particular parts of a schema are being interpreted
     * @param {?Object} parserConfig.anyOf part of the configuration object focussing on a schema's "anyOf" property
     * @param {?String} parserConfig.anyOf.type indication how a schema's "anyOf" should be handled, e.g. "likeAllOf", "asAdditionalColumn"
     */
    constructor(parserConfig) {
        super(parserConfig && parserConfig.anyOf);
    }
}
