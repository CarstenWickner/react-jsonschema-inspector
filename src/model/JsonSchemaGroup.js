import JsonSchema from "./JsonSchema";
import { mapObjectValues, mergeObjects } from "./utils";

class JsonSchemaGroup {
    /**
     * Array of JsonSchema and/or JsonSchemaGroup instances.
     */
    entries = [];

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
        return this.entries
            .map(entry => this.getPropertiesFromEntry(entry, optionTarget))
            .reduce(mergeObjects, {});
    }

    /**
     * Extract a single entry's properties.
     *
     * @param {JsonSchema|JsonSchemaGroup} entry schema or group of schemas to extract properties from
     * @param {?Object} optionTarget mutable object containing the selected optional sub-schema's index (from the current traversing position)
     * @param {Number} optionTarget.index counter that should be decreased for each passed optional sub-schema; the option at 0 is deemed selected
     * @param {?Boolean} isOptional indication whether the given entry should be treated as optional (i.e. only include if optionTarget.index === 0)
     */
    getPropertiesFromEntry(entry, optionTarget, isOptional) {
        if (isOptional) {
            // an optional entry should be kept if it is not the specifically selected one
            const isSelectedEntry = optionTarget && optionTarget.index === 0;
            if (optionTarget) {
                // eslint-disable-next-line no-param-reassign
                optionTarget.index -= 1;
            }
            if (!isSelectedEntry) {
                // ignore unselected option
                return {};
            }
        }
        if (entry instanceof JsonSchemaGroup) {
            return entry.getProperties(optionTarget);
        }
        // entry is a single JsonSchema
        const { schema: rawSchema, scope } = entry;
        const { required = [], properties = {} } = rawSchema;
        const rawProperties = Object.assign(
            {},
            ...required.map(value => ({ [value]: true })),
            properties
        );
        // properties is an Object.<String, raw-json-schema> and should be converted to an Object.<String, JsonSchema>
        return mapObjectValues(rawProperties, rawPropertySchema => new JsonSchema(rawPropertySchema, this.parserConfig, scope));
    }

    some(func) {
        return this.entries.some(func);
    }
}

export default JsonSchemaGroup;
