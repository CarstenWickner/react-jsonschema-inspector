import JsonSchemaGroup from "./JsonSchemaGroup";

export default class JsonSchemaOptionalsGroup extends JsonSchemaGroup {
    /**
     * Configuration object determining how a particular part of a schema is being interpreted.
     */
    setting;

    /**
     * Constructor for the representation of a schema's grouping property, e.g. "anyOf" or "oneOf".
     * The "anyOf" property is a collection of sub-schemas of which one or multiple are expected to be fulfilled.
     *
     * @param {?Object} setting configuration object determining how the represented schema part should be interpreted
     * @param {?String} setting.type indication how the represented schema's group of should be handled, e.g. "likeAllOf", "asAdditionalColumn"
     */
    constructor(setting) {
        super();
        this.setting = setting;
    }

    /**
     * Extract a single entry's properties.
     *
     * @param {JsonSchema|JsonSchemaGroup} entry schema or group of schemas to extract properties from
     * @param {?Object} optionTarget mutable object containing the selected optional sub-schema's index (from the current traversing position)
     * @param {Number} optionTarget.index counter that should be decreased for each passed optional sub-schema; the option at 0 is deemed selected
     */
    getPropertiesFromEntry(entry, optionTarget) {
        const treatAsOptional = !optionTarget || !this.setting || this.setting.type !== "likeAllOf";
        return super.getPropertiesFromEntry(entry, optionTarget, treatAsOptional);
    }
}
