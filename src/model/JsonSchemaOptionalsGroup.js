import JsonSchemaGroup from "./JsonSchemaGroup";

/**
 * Representation of an array of schemas that are not mandatory (e.g. "anyOf", "oneOf").
 */
export default class JsonSchemaOptionalsGroup extends JsonSchemaGroup {
    /**
     * Configuration object determining how a particular part of a schema is being interpreted.
     */
    settings;

    /**
     * Constructor for the representation of a schema's grouping property, e.g. "anyOf" or "oneOf".
     *
     * @param {Function} JsonSchema run-time reference to JsonSchema constructor to avoid circular dependencies at load-time
     * @param {Object} settings configuration object determining how the represented schema part should be interpreted
     * @param {String} setting.type indication how the represented schema's group of should be handled, e.g. "likeAllOf", "asAdditionalColumn"
     */
    constructor(JsonSchema, settings) {
        super(JsonSchema);
        if (process.env.NODE_ENV === "development") {
            if (!settings || !settings.type) {
                throw new Error("Missing configuration of desired 'type' of parsing");
            }
            if (typeof this.constructor.getDefaultGroupTitle !== "function") {
                throw new Error("JsonSchemaOptionalsGroup is abstract and expects static getDefaultGroupTitle() to be implemented by sub-class");
            }
        }
        this.settings = settings;
    }

    /**
     * Implementation of method expected by super class, determining desired behaviour from settings.type value.
     *
     * @returns {Boolean} return whether this optional group should be treated like a mandatory ("allOf") group
     */
    shouldBeTreatedLikeAllOf() {
        return this.settings.type === "likeAllOf";
    }

    /**
     * Extension of method from super class for creating a representation of this group's given options.
     * Additionally adding the settings.groupTitle (or fall-back value from getDefaultGroupTitle()) if no other groupTitle is present yet.
     */
    createOptionsRepresentation(containedOptions) {
        const result = super.createOptionsRepresentation(containedOptions);
        if (result.options && !result.groupTitle) {
            result.groupTitle = this.settings.groupTitle === undefined ? this.constructor.getDefaultGroupTitle() : this.settings.groupTitle;
        }
        return result;
    }
}
