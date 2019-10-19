import JsonSchemaGroup from "./JsonSchemaGroup";
import { SchemaPartParserConfig, RenderOptions } from "../types/Inspector";

/**
 * Representation of an array of schemas that are not mandatory (e.g. `anyOf`, `oneOf`).
 */
export default class JsonSchemaOptionalsGroup extends JsonSchemaGroup {
    /**
     * Configuration object determining how a particular part of a schema is being interpreted.
     *
     * @type {{groupTitle: ?string, optionNameForIndex: ?Function}}
     */
    settings: SchemaPartParserConfig;

    /**
     * Constructor for the representation of a schema's grouping property, e.g. `anyOf` or `oneOf`.
     *
     * @param {object} settings - configuration object determining how the represented schema part should be interpreted
     * @param {?string} settings.groupTitle - group title to show instead of the default provided by `getDefaultGroupTitle()`
     * @param {?Function} settings.optionNameForIndex - function for deriving an option's name/label from an 'optionIndexes' array
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
    // eslint-disable-next-line class-methods-use-this
    considerSchemasAsSeparateOptions() {
        return true;
    }

    /**
     * Extension of method from super class for creating a representation of this group's given options.
     * Additionally adding the `settings.groupTitle` if no other `groupTitle` is present yet.
     *
     * @param {Array.<RenderOptions} containedOptions - nested option representations
     * @returns {RenderOptions} representation of this group's contained optional hierarchy
     */
    createOptionsRepresentation(
        containedOptions: Array<RenderOptions>
    ): RenderOptions {
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
