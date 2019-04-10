import JsonSchemaGroup from "./JsonSchemaGroup";

/**
 * Representation of an `allOf` element in a Json Schema.
 */
export default class JsonSchemaAllOfGroup extends JsonSchemaGroup {
    /**
     * Indicate whether the entries of this group should be treated as if they were all defined in a single schema.
     *
     * @returns {boolean} always `true`, i.e. entries should be included transparently
     */
    // eslint-disable-next-line class-methods-use-this
    shouldBeTreatedLikeAllOf() {
        return true;
    }

    /**
     * Extension of method from super class for adding a given Json Schema or group to this group.
     *
     * @param {JsonSchema|JsonSchemaGroup} schemaOrGroup - entry to add to this group
     * @returns {JsonSchemaAllOfGroup} this (i.e. self-reference for chaining)
     */
    with(schemaOrGroup) {
        if (schemaOrGroup instanceof JsonSchemaGroup && schemaOrGroup.shouldBeTreatedLikeAllOf()) {
            // unwrap entries to avoid an AllOfGroup being nested in an AllOfGroup
            schemaOrGroup.entries.forEach(entry => this.with(entry));
            return this;
        }
        // other groups or single schemas should just be added to the entries array
        return super.with(schemaOrGroup);
    }
}
