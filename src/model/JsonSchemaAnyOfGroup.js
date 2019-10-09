import JsonSchemaOptionalsGroup from "./JsonSchemaOptionalsGroup";

/**
 * Representation of an `anyOf` element in a json schema.
 */
export default class JsonSchemaAnyOfGroup extends JsonSchemaOptionalsGroup {
    /**
     * @returns {string} default value if `anyOf.groupTitle` is not set in `parserConfig` provided to constructor.
     */
    static getDefaultGroupTitle() {
        return "any of";
    }

    /**
     * Constructor for the representation of a schema's `anyOf` property.
     * The `anyOf` property is a collection of sub-schemas of which one or multiple are expected to be fulfilled.
     *
     * @param {object} parserConfig - configuration object determining how particular parts of a schema are being interpreted
     * @param {object} parserConfig.anyOf - part of the configuration object focussing on a schema's `anyOf` property
     * @param {?string} parserConfig.anyOf.groupTitle - text to display above options to select from (defaults to value from getDefaultGroupTitle())
     */
    constructor(parserConfig) {
        super(parserConfig && parserConfig.anyOf);
    }
}
