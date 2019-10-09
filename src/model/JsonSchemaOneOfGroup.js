import JsonSchemaOptionalsGroup from "./JsonSchemaOptionalsGroup";

/**
 * Representation of an `oneOf` element in a json schema.
 */
export default class JsonSchemaOneOfGroup extends JsonSchemaOptionalsGroup {
    /**
     * @returns {string} default value if `oneOf.groupTitle` is not set in `parserConfig` provided to constructor
     */
    static getDefaultGroupTitle() {
        return "one of";
    }

    /**
     * Constructor for the representation of a schema's `oneOf` property.
     * The `oneOf` property is a collection of sub-schemas of which exactly one is expected to be fulfilled.
     *
     * @param {object} parserConfig - configuration object determining how particular parts of a schema are being interpreted
     * @param {object} parserConfig.oneOf - part of the configuration object focussing on a schema's `oneOf` property
     * @param {?string} parserConfig.oneOf.groupTitle - text to display above options to select from (defaults to value from getDefaultGroupTitle())
     */
    constructor(parserConfig) {
        super(parserConfig && parserConfig.oneOf);
    }
}
