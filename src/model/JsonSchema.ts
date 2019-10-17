import RefScope from "./RefScope";

import { RawJsonSchema } from "../types/RawJsonSchema";
import { ParserConfig } from "../types/Inspector";

/**
 * Representation of a Json Schema, offering a number of convenient functions for traversing and extracting information.
 */
export default class JsonSchema {
    /**
     * Raw JSON Schema.
     *
     * @type {object}
     */
    schema: RawJsonSchema;

    /**
     * Configuration steering how the json schema is being traversed/parsed.
     *
     * @type {{oneOf: ?{groupTitle: ?string}, anyOf: ?{groupTitle: ?string}}}
     */
    parserConfig: ParserConfig;

    /**
     * @type {RefScope}
     */
    scope: RefScope;

    /**
     * Constructor for a JsonSchema (wrapper).
     *
     * @param {object} schema - the JSON Schema to represent
     * @param {object} parserConfig - configuration affecting how the json schema is being traversed/parsed
     * @param {?RefScope} scope - collection of available $ref targets (will be generated based on `schema` if not provided)
     */
    constructor(schema: RawJsonSchema, parserConfig: ParserConfig, scope?: RefScope) {
        this.schema = schema;
        this.parserConfig = parserConfig;
        this.scope = scope || new RefScope(this);
    }
}
