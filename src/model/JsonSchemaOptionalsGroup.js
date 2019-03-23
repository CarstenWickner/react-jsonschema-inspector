import JsonSchemaGroup from "./JsonSchemaGroup";
import JsonSchemaAllOfGroup from "./JsonSchemaAllOfGroup";

export default class JsonSchemaOptionalsGroup extends JsonSchemaGroup {
    /**
     * Configuration object determining how a particular part of a schema is being interpreted.
     */
    setting;

    /**
     * Constructor for the representation of a schema's grouping property, e.g. "anyOf" or "oneOf".
     *
     * @param {Function} JsonSchema run-time reference to JsonSchema constructor to avoid circular dependencies at load-time
     * @param {Object} setting configuration object determining how the represented schema part should be interpreted
     * @param {String} setting.type indication how the represented schema's group of should be handled, e.g. "likeAllOf", "asAdditionalColumn"
     */
    constructor(JsonSchema, setting) {
        super(JsonSchema);
        this.setting = setting;
    }

    shouldBeTreatedLikeAllOf() {
        return this.setting.type === "likeAllOf";
    }

    getOptions() {
        let result = [];
        this.entries
            .filter(entry => entry instanceof JsonSchemaGroup)
            .forEach((nestedGroup) => {
                const nestedOptions = nestedGroup.getOptions();
                if (nestedGroup instanceof JsonSchemaAllOfGroup) {
                    result = result.concat(nestedOptions);
                } else {
                    result.push(nestedOptions);
                }
            });
        return result;
    }

    /**
     * Extract a single entry's properties.
     *
     * @param {JsonSchema|JsonSchemaGroup} entry schema or group of schemas to extract properties from
     * @param {?Object} optionTarget mutable object containing the selected optional sub-schema's index (from the current traversing position)
     * @param {Number} optionTarget.index counter that should be decreased for each passed optional sub-schema; the option at 0 is deemed selected
     */
    getPropertiesFromEntry(entry, optionTarget) {
        if (!this.shouldBeTreatedLikeAllOf()) {
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
        return super.getPropertiesFromEntry(entry, optionTarget);
    }
}
