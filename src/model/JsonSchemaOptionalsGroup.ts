import { JsonSchemaGroup } from "./JsonSchemaGroup";
import { SchemaPartParserConfig } from "../types/ParserConfig";
import { RenderOptions } from "../types/RenderOptions";

/**
 * Representation of an array of schemas that are not mandatory (e.g. `anyOf`, `oneOf`).
 */
export class JsonSchemaOptionalsGroup extends JsonSchemaGroup {
    /**
     * Configuration object determining how a particular part of a schema is being interpreted.
     *
     * @type {SchemaPartParserConfig}
     */
    settings: SchemaPartParserConfig;

    /**
     * Constructor for the representation of a schema's grouping property, e.g. `anyOf` or `oneOf`.
     *
     * @param {SchemaPartParserConfig} settings - configuration object determining how the represented schema part should be interpreted
     */
    constructor(settings: SchemaPartParserConfig) {
        super();
        this.settings = settings;
    }

    /**
     * Implementation of method expected by super class.
     *
     * @returns {boolean} always 'true'
     */
    considerSchemasAsSeparateOptions(): boolean {
        return true;
    }

    /**
     * Extension of method from super class for creating a representation of this group's given options.
     * Additionally adding the `settings.groupTitle` if no other `groupTitle` is present yet.
     *
     * @param {Array.<RenderOptions>} containedOptions - nested option representations
     * @returns {RenderOptions} representation of this group's contained optional hierarchy
     */
    createOptionsRepresentation(containedOptions: Array<RenderOptions>): RenderOptions {
        const result = super.createOptionsRepresentation(containedOptions);
        if (result.options && !result.groupTitle) {
            result.groupTitle = this.settings.groupTitle;
        }
        if (result.options) {
            result.optionNameForIndex = this.settings.optionNameForIndex;
        }
        return result;
    }
}

/**
 * Representation of an `anyOf` element in a json schema.
 */
export class JsonSchemaAnyOfGroup extends JsonSchemaOptionalsGroup {
    /**
     * Constructor for the representation of a schema's `anyOf` property.
     * The `anyOf` property is a collection of sub-schemas of which one or multiple are expected to be fulfilled.
     *
     * @param {{ anyOf?: SchemaPartParserConfig}} parserConfig - configuration object determining how some parts of a schema are being interpreted
     * @param {SchemaPartParserConfig} parserConfig.anyOf - settings regarding 'anyOf' properties
     */
    constructor(parserConfig: { anyOf?: SchemaPartParserConfig }) {
        super({
            groupTitle: "any of",
            ...parserConfig.anyOf
        });
    }
}

/**
 * Representation of an `oneOf` element in a json schema.
 */
export class JsonSchemaOneOfGroup extends JsonSchemaOptionalsGroup {
    /**
     * Constructor for the representation of a schema's `oneOf` property.
     * The `oneOf` property is a collection of sub-schemas of which exactly one is expected to be fulfilled.
     *
     * @param {{ oneOf?: SchemaPartParserConfig}} parserConfig - configuration object determining how some parts of a schema are being interpreted
     * @param {SchemaPartParserConfig} parserConfig.oneOf - settings regarding 'anyOf' properties
     */
    constructor(parserConfig: { oneOf?: SchemaPartParserConfig }) {
        super({
            groupTitle: "one of",
            ...parserConfig.oneOf
        });
    }
}
