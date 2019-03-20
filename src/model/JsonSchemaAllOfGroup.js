import JsonSchemaGroup from "./JsonSchemaGroup";

class JsonSchemaAllOfGroup extends JsonSchemaGroup {
    with(schemaOrGroup) {
        if (schemaOrGroup instanceof JsonSchemaAllOfGroup) {
            // unwrap entries to avoid an AllOfGroup being nested in an AllOfGroup
            schemaOrGroup.entries.forEach(super.with.bind(this));
            return this;
        }
        // other groups or single schemas should just be added to the entries array
        return super.with(schemaOrGroup);
    }
}

export default JsonSchemaAllOfGroup;
