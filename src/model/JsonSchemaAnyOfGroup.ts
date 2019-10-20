import { JsonSchemaOptionalsGroup } from "./JsonSchemaOptionalsGroup";
import { ParserConfig } from "../types/Inspector";

/**
 * Representation of an `anyOf` element in a json schema.
 */
export class JsonSchemaAnyOfGroup extends JsonSchemaOptionalsGroup {

    /**
     * Constructor for the representation of a schema's `anyOf` property.
     * The `anyOf` property is a collection of sub-schemas of which one or multiple are expected to be fulfilled.
     *
     * @param {ParserConfig} parserConfig - configuration object determining how particular parts of a schema are being interpreted
     */
    constructor(parserConfig: ParserConfig) {
        super({
            groupTitle: "any of",
            ...((parserConfig && parserConfig.anyOf) || {})
        });
    }
}
