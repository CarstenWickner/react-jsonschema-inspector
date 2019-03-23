import JsonSchemaOptionalsGroup from "./JsonSchemaOptionalsGroup";

/**
 * Representation of an "anyOf" element in a Json Schema.
 */
export default class JsonSchemaAnyOfGroup extends JsonSchemaOptionalsGroup {
    /**
     * Providing default value if parserConfig.anyOf.groupTitle parameter provided to constructor is not defined.
     */
    static getDefaultGroupTitle() {
        return "any of";
    }

    /**
     * Constructor for the representation of a schema's "anyOf" property.
     * The "anyOf" property is a collection of sub-schemas of which one or multiple are expected to be fulfilled.
     *
     * @param {Function} JsonSchema run-time reference to JsonSchema constructor to avoid circular dependencies at load-time
     * @param {Object} parserConfig configuration object determining how particular parts of a schema are being interpreted
     * @param {Object} parserConfig.anyOf part of the configuration object focussing on a schema's "anyOf" property
     * @param {String} parserConfig.anyOf.type indication how a schema's "anyOf" should be handled, e.g. "likeAllOf", "asAdditionalColumn"
     * @param {?String} parserConfig.anyOf.groupTitle text to display above options to select from (defaults to value from getDefaultGroupTitle())
     */
    constructor(JsonSchema, parserConfig) {
        super(JsonSchema, parserConfig && parserConfig.anyOf);
    }
}
