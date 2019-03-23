import JsonSchemaGroup from "./JsonSchemaGroup";

export default class JsonSchemaAllOfGroup extends JsonSchemaGroup {
    // eslint-disable-next-line class-methods-use-this
    shouldBeTreatedLikeAllOf() {
        return true;
    }

    with(schemaOrGroup) {
        if (schemaOrGroup instanceof JsonSchemaGroup && schemaOrGroup.shouldBeTreatedLikeAllOf()) {
            // unwrap entries to avoid an AllOfGroup being nested in an AllOfGroup
            schemaOrGroup.entries.forEach(entry => this.with(entry));
            return this;
        }
        // other groups or single schemas should just be added to the entries array
        return super.with(schemaOrGroup);
    }

    getOptions() {
        return this.entries
            .filter(entry => entry instanceof JsonSchemaGroup)
            .map(nestedGroup => nestedGroup.getOptions());
    }
}
