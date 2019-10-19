import JsonSchemaOptionalsGroup from "./JsonSchemaOptionalsGroup";
import { ParserConfig } from "../types/Inspector";

/**
 * Representation of an `oneOf` element in a json schema.
 */
export default class JsonSchemaOneOfGroup extends JsonSchemaOptionalsGroup {

    /**
     * Constructor for the representation of a schema's `oneOf` property.
     * The `oneOf` property is a collection of sub-schemas of which exactly one is expected to be fulfilled.
     *
     * @param {ParserConfig} parserConfig - configuration object determining how particular parts of a schema are being interpreted
     */
    constructor(parserConfig: ParserConfig) {
        super({
            groupTitle: "one of",
            ...((parserConfig && parserConfig.oneOf) || {})
        });
    }
}
