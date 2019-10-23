import { JsonSchemaGroup } from "./JsonSchemaGroup";
import { JsonSchema } from "./JsonSchema";

/**
 * Representation of an `allOf` element in a Json Schema.
 */
export class JsonSchemaAllOfGroup extends JsonSchemaGroup {
    /**
     * Extension of method from super class for adding a given Json Schema or group to this group.
     *
     * @param {JsonSchema|JsonSchemaGroup} schemaOrGroup - entry to add to this group
     * @returns {JsonSchemaAllOfGroup} this (i.e. self-reference for chaining)
     */
    with(schemaOrGroup: JsonSchemaGroup | JsonSchema): this {
        if (schemaOrGroup instanceof JsonSchemaGroup && schemaOrGroup.shouldTreatEntriesAsOne()) {
            // unwrap entries to avoid an AllOfGroup being nested in an AllOfGroup
            schemaOrGroup.entries.forEach((entry) => this.with(entry));
            return this;
        }
        // other groups or single schemas should just be added to the entries array
        return super.with(schemaOrGroup);
    }
}
