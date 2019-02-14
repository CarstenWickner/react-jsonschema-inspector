export function getNestedProperties(schema) {
    if (typeof schema !== 'object' || !schema) {
        return null;
    }
    if (schema.properties) {
        // if the given schema represents an "object", it will have a list of "properties"
        return schema.properties;
    }
    if (schema.items) {
        // if the given schema represents an "array", it will identify a schema for its "items"
        return getNestedProperties(schema.items);
    }
    // for other types, there are no nested items to show
    return null;
}

export function hasNestedProperties(schema) {
    if (typeof schema !== 'object' || !schema) {
        return false;
    }
    if (schema.properties) {
        // if the given schema represents an "object", it will have a list of "properties"
        return true;
    }
    if (schema.items) {
        // if the given schema represents an "array", it will identify a schema for its "items"
        return hasNestedProperties(schema.items);
    }
    // for other types, there are no nested items to show
    return false;
}