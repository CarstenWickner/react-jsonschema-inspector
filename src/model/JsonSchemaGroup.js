import { isNonEmptyObject, mapObjectValues, mergeSchemas } from "./utils";

/**
 * Representation of an array of schemas (e.g. "allOf", "anyOf", "oneOf"), offering a number of convenient functions for extracting information.
 */
export default class JsonSchemaGroup {
    /**
     * Array of JsonSchema and/or JsonSchemaGroup instances.
     */
    entries = [];

    /**
     * Run-time reference to the JsonSchema constructor to avoid circular dependencies at load-time.
     */
    JsonSchema;

    /**
     * Constructor for the representation of a schema's grouping property, e.g. "allOf", "anyOf", "oneOf".
     *
     * @param {Function} JsonSchema run-time reference to JsonSchema constructor to avoid circular dependencies at load-time
     */
    constructor(JsonSchema) {
        if (process.env.NODE_ENV === "development") {
            if (!JsonSchema) {
                throw new Error("Given JsonSchema is not a valid reference to that class");
            }
            if (typeof this.shouldBeTreatedLikeAllOf !== "function") {
                throw new Error("JsonSchemaGroup is abstract and expects shouldBeTreatedLikeAllOf() to be implemented by the instantiated sub-class");
            }
        }
        this.JsonSchema = JsonSchema;
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
    getProperties(optionTarget) {
        // collect schemas where we have both a boolean and a proper schema, favour the proper schema
        const result = this.entries
            .map(entry => this.getPropertiesFromEntry(entry, optionTarget))
            .reduce(mergeSchemas, {});
        // convert any remaining boolean values into empty schema wrappers
        return mapObjectValues(result, value => (
            isNonEmptyObject(value) ? value : new (this.JsonSchema)(value)
        ));
    }

    /**
     * Extract a single entry's properties.
     *
     * @param {JsonSchema|JsonSchemaGroup} entry schema or group of schemas to extract properties from
     * @param {?Array.<Object>} optionTarget array of mutable objects containing the selected optional sub-schema's (relative) index
     * @param {Number} optionTarget[].index counter that should be decreased for each passed optional sub-schema; the option at 0 is deemed selected
     */
    getPropertiesFromEntry(entry, optionTarget) {
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
                return {};
            }
        }
        if (entry instanceof JsonSchemaGroup) {
            return entry.getProperties(treatLikeAllOf ? optionTarget : optionTarget.slice(1));
        }
        // entry is a single JsonSchema
        const { schema: rawSchema, parserConfig, scope } = entry;
        const { required = [], properties = {} } = rawSchema;
        const rawProperties = Object.assign(
            {},
            ...required.map(value => ({ [value]: true })),
            properties
        );
        // properties is an Object.<String, raw-json-schema> and should be converted to an Object.<String, JsonSchema>
        return mapObjectValues(rawProperties,
            rawPropertySchema => (
                isNonEmptyObject(rawPropertySchema)
                    ? new (this.JsonSchema)(rawPropertySchema, parserConfig, scope)
                    : rawPropertySchema
            ));
    }

    /**
     * Determines optional paths in this schema group.
     *
     * @returns {Object} return representation of the available options on this group's top level
     * @returns {?String} return.groupTitle optional title text to be displayed for this group's options
     * @returns {?Array<Object>} return.options list of option representations (may contain representation of nested options)
     */
    getOptions() {
        let containedOptions;
        if (this.shouldBeTreatedLikeAllOf()) {
            containedOptions = this.entries
                // simple schemas can be ignored: no options to differentiate between there
                .filter(entry => entry instanceof JsonSchemaGroup)
                // for all groups: look-up their nested options recursively
                .map(nestedGroup => nestedGroup.getOptions())
                // if a nested group has no options to differentiate (i.e. also has shouldBeTreatedLikeAllOf() === true), we can ignore it as well
                .filter(nestedOptions => nestedOptions.options);
        } else {
            containedOptions = this.entries.map(entry => (
                // each entry is considered an option, groups may have some more nested options
                entry instanceof JsonSchemaGroup ? entry.getOptions() : {}
            ));
        }
        return this.createOptionsRepresentation(containedOptions);
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

    /**
     * Workaround to be (kinda) backwards-compatible with pre-groups API.
     *
     * @param {Function} func function to execute for all contained entries
     * @deprecated temporary workaround until migration to groups API is completed
     */
    some(func) {
        return this.entries.some(func);
    }
}
