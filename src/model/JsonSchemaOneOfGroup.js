import JsonSchemaOptionalsGroup from "./JsonSchemaOptionalsGroup";

export default class JsonSchemaOneOfGroup extends JsonSchemaOptionalsGroup {
    /**
     * Constructor for the representation of a schema's "oneOf" property.
     * The "oneOf" property is a collection of sub-schemas of which exactly one is expected to be fulfilled.
     *
     * @param {Function} JsonSchema run-time reference to JsonSchema constructor to avoid circular dependencies at load-time
     * @param {?Object} parserConfig configuration object determining how particular parts of a schema are being interpreted
     * @param {?Object} parserConfig.oneOf part of the configuration object focussing on a schema's "oneOf" property
     * @param {?String} parserConfig.oneOf.type indication how a schema's "oneOf" should be handled, e.g. "likeAllOf", "asAdditionalColumn"
     */
    constructor(JsonSchema, parserConfig) {
        super(JsonSchema, parserConfig && parserConfig.oneOf);
    }
}
