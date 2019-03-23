import { isNonEmptyObject, mapObjectValues, mergeSchemas } from "./utils";

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
            if (typeof this.getOptions !== "function") {
                throw new Error("JsonSchemaGroup is abstract and expects getOptions() to be implemented by the instantiated sub-class");
            }
        }
        this.JsonSchema = JsonSchema;
    }

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
     * @param {?Object} optionTarget mutable object containing the selected optional sub-schema's index (from the current traversing position)
     * @param {Number} optionTarget.index counter that should be decreased for each passed optional sub-schema; the option at 0 is deemed selected
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
     * @param {?Object} optionTarget mutable object containing the selected optional sub-schema's index (from the current traversing position)
     * @param {Number} optionTarget.index counter that should be decreased for each passed optional sub-schema; the option at 0 is deemed selected
     */
    getPropertiesFromEntry(entry, optionTarget) {
        if (entry instanceof JsonSchemaGroup) {
            return entry.getProperties(optionTarget);
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

    some(func) {
        return this.entries.some(func);
    }
}
