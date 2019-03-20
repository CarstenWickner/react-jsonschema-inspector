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

    some(func) {
        return this.entries.some(func);
    }

    map(func) {
        return this.entries.map(func);
    }
}

export default JsonSchemaGroup;
