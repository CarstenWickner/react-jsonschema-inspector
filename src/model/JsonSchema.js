import RefScope from "./RefScope";

/**
 * Representation of a Json Schema, offering a number of convenient functions for traversing and extracting information.
 */
export default class JsonSchema {
    /**
     * Raw JSON Schema.
     *
     * @type {object}
     */
    schema;

    /**
     * Configuration steering how the json schema is being traversed/parsed.
     *
     * @type {{oneOf: ?{groupTitle: ?string}, anyOf: ?{groupTitle: ?string}}}
     */
    parserConfig;

    /**
     * @type {RefScope}
     */
    scope;

    /**
     * Constructor for a JsonSchema (wrapper).
     *
     * @param {object} schema - the JSON Schema to represent
     * @param {object} parserConfig - configuration affecting how the json schema is being traversed/parsed
     * @param {?RefScope} scope - collection of available $ref targets (will be generated based on `schema` if not provided)
     */
    constructor(schema, parserConfig, scope) {
        this.schema = schema;
        this.parserConfig = parserConfig;
        this.scope = scope || new RefScope(this);
    }
}
