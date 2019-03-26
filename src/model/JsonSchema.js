import RefScope from "./RefScope";

/**
 * Representation of a Json Schema, offering a number of convenient functions for traversing and extracting information.
 */
export default class JsonSchema {
    /**
     * Raw JSON Schema
     */
    schema;

    /**
     * Configuration steering how the JSON schema is being traversed/parsed
     */
    parserConfig;

    /**
     * @type RefScope
     */
    scope;

    /**
     * Constructor for a JsonSchema (wrapper).
     *
     * @param {Object} schema the JSON Schema to represent
     * @param {Object} parserConfig configuration affecting how the JSON schema is being traversed/parsed
     * @param {?RefScope} scope collection of available $ref targets
     */
    constructor(schema, parserConfig, scope) {
        this.schema = schema;
        this.parserConfig = parserConfig;
        this.scope = scope || new RefScope(this);
    }
}
