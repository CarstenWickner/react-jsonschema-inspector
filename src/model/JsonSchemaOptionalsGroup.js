import JsonSchemaGroup from "./JsonSchemaGroup";

/**
 * Representation of an array of schemas that are not mandatory (e.g. `anyOf`, `oneOf`).
 */
export default class JsonSchemaOptionalsGroup extends JsonSchemaGroup {
    /**
     * Configuration object determining how a particular part of a schema is being interpreted.
     *
     * @type {{groupTitle: ?string, optionNameForIndex: ?Function}}
     */
    settings;

    /**
     * Constructor for the representation of a schema's grouping property, e.g. `anyOf` or `oneOf`.
     *
     * @param {Object} settings - configuration object determining how the represented schema part should be interpreted
     * @param {?string} settings.groupTitle - group title to show instead of the default provided by `getDefaultGroupTitle()`
     * @param {?Function} settings.optionNameForIndex - function for deriving an option's name/label from an 'optionIndexes' array
     */
    constructor(settings = {}) {
        super();
        if (process.env.NODE_ENV === "development") {
            if (typeof this.constructor.getDefaultGroupTitle !== "function") {
                throw new Error("JsonSchemaOptionalsGroup is abstract and expects static getDefaultGroupTitle() to be implemented by sub-class");
            }
        }
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
     * Additionally adding the `settings.groupTitle` (or fall-back value from `getDefaultGroupTitle()`) if no other `groupTitle` is present yet.
     *
     * @param {Array.<{groupTitle: ?string, options: ?Array.<Object>}>} containedOptions - nested option representations
     * @returns {{groupTitle: ?string, options: ?Array.<Object>}} representation of this group's contained optional hierarchy
     */
    createOptionsRepresentation(containedOptions) {
        const result = super.createOptionsRepresentation(containedOptions);
        if (result.options && !result.groupTitle) {
            result.groupTitle = this.settings.groupTitle === undefined ? this.constructor.getDefaultGroupTitle() : this.settings.groupTitle;
        }
        if (result.options) {
            result.optionNameForIndex = this.settings.optionNameForIndex;
        }
        return result;
    }
}