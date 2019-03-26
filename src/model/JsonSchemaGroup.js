/**
 * Representation of an array of schemas (e.g. "allOf", "anyOf", "oneOf"), offering a number of convenient functions for extracting information.
 */
export default class JsonSchemaGroup {
    /**
     * Array of JsonSchema and/or JsonSchemaGroup instances.
     */
    entries = [];

    /**
     * Constructor for the representation of a schema's grouping property, e.g. "allOf", "anyOf", "oneOf".
     */
    constructor() {
        if (process.env.NODE_ENV === "development") {
            if (typeof this.shouldBeTreatedLikeAllOf !== "function") {
                throw new Error("JsonSchemaGroup is abstract and expects shouldBeTreatedLikeAllOf() to be implemented by the instantiated sub-class");
            }
        }
    }

    /**
     * Adding the given Json Schema or group to this group.
     *
     * @param {JsonSchema|JsonSchemaGroup} schemaOrGroup entry to add to this group
     * @returns {JsonSchemaGroup} this (i.e. self-reference for chaining)
     */
    with(schemaOrGroup) {
        if (schemaOrGroup instanceof JsonSchemaGroup && schemaOrGroup.entries.length === 1) {
            // unwrap a group containing only a single entry
            this.entries.push(schemaOrGroup.entries[0]);
        } else {
            this.entries.push(schemaOrGroup);
        }
        return this;
    }

    /**
     * Extract the properties mentioned in this schema group.
     *
     * @param {?Array.<Object>} optionTarget array of mutable objects containing the selected optional sub-schema's (relative) index
     * @param {Number} optionTarget[].index counter that should be decreased for each passed optional sub-schema; the option at 0 is deemed selected
     * @returns {Object.<String, JsonSchema>} collection of all properties mentioned in this schema
     */
    extractValues(extractFromSchema, mergeResults, defaultValue, optionTarget) {
        // collect schemas where we have both a boolean and a proper schema, favour the proper schema
        return this.entries
            .map(entry => this.extractValuesFromEntry(entry, extractFromSchema, mergeResults, defaultValue, optionTarget))
            .reduce(mergeResults, defaultValue);
    }

    /**
     * Extract a single entry's properties.
     *
     * @param {JsonSchema|JsonSchemaGroup} entry schema or group of schemas to extract properties from
     * @param {?Array.<Object>} optionTarget array of mutable objects containing the selected optional sub-schema's (relative) index
     * @param {Number} optionTarget[].index counter that should be decreased for each passed optional sub-schema; the option at 0 is deemed selected
     */
    extractValuesFromEntry(entry, extractFromSchema, mergeResults, defaultValue, optionTarget) {
        const treatLikeAllOf = this.shouldBeTreatedLikeAllOf();
        if (!treatLikeAllOf) {
            // an optional entry should be kept if it is not the specifically selected one
            const isSelectedEntry = optionTarget && optionTarget.length && optionTarget[0].index === 0;
            if (optionTarget && optionTarget.length) {
                // eslint-disable-next-line no-param-reassign
                optionTarget[0].index -= 1;
            }
            if (!isSelectedEntry) {
                // ignore unselected option
                return defaultValue;
            }
        }
        if (entry instanceof JsonSchemaGroup) {
            return entry.extractValues(
                extractFromSchema,
                mergeResults,
                defaultValue,
                treatLikeAllOf ? optionTarget : optionTarget.slice(1)
            );
        }
        return extractFromSchema(entry);
    }

    /**
     * Create representation of this group's given options.
     *
     * @param {Array.<Object>} containedOptions list of (this kind of) option representations
     * @returns {Object} return representation of the available options on this group's top level
     * @returns {?String} return.groupTitle optional title text to be displayed for this group's options
     * @returns {?Array<Object>} return.options list of option representations (may contain representation of nested options)
     */
    // eslint-disable-next-line class-methods-use-this
    createOptionsRepresentation(containedOptions) {
        let result;
        if (containedOptions.length === 0) {
            result = {};
        } else if (containedOptions.length === 1) {
            // remove unnecessary hierarchy level by simply returning the single option from the array directly
            [result] = containedOptions;
        } else {
            result = {
                options: containedOptions
            };
        }
        return result;
    }
}
