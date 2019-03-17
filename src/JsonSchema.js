import RefScope from "./RefScope";
import {
    isNonEmptyObject, listValues, mapObjectValues, mergeObjects
} from "./utils";

class JsonSchema {
    /**
     * Alternative factory method to the constructor, returning "undefined" if the given schema is not a non-empty object.
     *
     * @param {Object} rawSchema the JSON Schema to represent
     * @param {Object} parserConfig configuration affecting how the JSON schema is being traversed/parsed
     * @param {RefScope} scope collection of available $ref targets
     * @returns {JsonSchema|undefined}
     */
    static createIfNotEmpty(rawSchema, parserConfig, scope) {
        return isNonEmptyObject(rawSchema) ? new JsonSchema(rawSchema, parserConfig, scope) : undefined;
    }

    /**
     * Raw JSON Schema
     */
    schema;

    /**
     * Configuration steering how the JSON schema is being traversed/parsed
     */
    parserConfig;

    /**
     * @type RefScope
     */
    scope;

    /**
     * Constructor for a JsonSchema (wrapper).
     *
     * @param {Object} schema the JSON Schema to represent
     * @param {Object} parserConfig configuration affecting how the JSON schema is being traversed/parsed
     * @param {?RefScope} scope collection of available $ref targets
     */
    constructor(schema, parserConfig, scope) {
        this.schema = schema;
        this.parserConfig = parserConfig;
        this.scope = scope || new RefScope(this);
    }

    getRelevantSchemaParts() {
        const { allOf, anyOf, oneOf } = this.schema;
        const includeAnyOf = anyOf && this.parserConfig && this.parserConfig.anyOf === "likeAllOf";
        const includeOneOf = oneOf && this.parserConfig && this.parserConfig.oneOf === "likeAllOf";
        if (allOf || includeAnyOf || includeOneOf) {
            let result = allOf;
            if (includeAnyOf) {
                result = result ? result.concat(anyOf) : anyOf;
            }
            if (includeOneOf) {
                result = result ? result.concat(oneOf) : oneOf;
            }
            return result;
        }
        return undefined;
    }

    /**
     * Look-up of values associated with a specific kind of field in the given JSON schema definition.
     * If the targeted schema is an array, the sub-schemas of its "items" will be ignored.
     *
     * @param {String} fieldName name/key of the field to look-up
     * @param {?Function} mergeFunction optional: how to combine two encountered values into one
     * @param {?Function} mappingFunction optional: converting the raw value before calling the mergeFunction
     * @return {*} result of the given mergeFunction over all encountered values of fields with the given name
     */
    getFieldValue(fieldName, mergeFunction = listValues, mappingFunction) {
        if (!isNonEmptyObject(this.schema)) {
            return undefined;
        }
        if (this.schema.$ref) {
            // schema variable is merely a reference to a separately defined schema
            const referencedSchema = this.scope.find(this.schema.$ref);
            // by convention, if $ref is specified, all other properties in the schema are being ignored
            return referencedSchema.getFieldValue(fieldName, mergeFunction, mappingFunction);
        }
        const rawValue = this.schema[fieldName];
        let value = mappingFunction ? mappingFunction(rawValue, this.parserConfig, this.scope) : rawValue;
        const schemaParts = this.getRelevantSchemaParts();
        if (schemaParts) {
            // schema variable is supposed to be combined with a given list of sub-schemas
            value = schemaParts
                .map(part => new JsonSchema(part, this.parserConfig, this.scope).getFieldValue(fieldName, mergeFunction, mappingFunction))
                .reduce(mergeFunction, value);
        }
        return value;
    }

    /**
     * Version of the getFieldValue() function to look-up of nested JSON schema definitions (while preserving the appropriate reference scope).
     *
     * This method is intended to be used to look-up fields like "items" or "additionalItems".
     *
     * @param {String} fieldName name/key of the field to look-up
     * @param {Function} mergeFunction optional: how to combine two encountered values into one
     * @return {*} result of the given mergeFunction over all encountered values of fields with the given name
     */
    getSchemaFieldValue(fieldName, mergeFunction = listValues) {
        return this.getFieldValue(fieldName, mergeFunction, JsonSchema.createIfNotEmpty);
    }

    /**
     * Determine whether this schema represents an array and if so, return the sub-schema describing its contents.
     *
     * @returns {JsonSchema} type of array contents or null if it is not an array or its content type could not be determined
     */
    getTypeOfArrayItems() {
        return this.getSchemaFieldValue("items") || this.getSchemaFieldValue("additionalItems") || null;
    }

    /**
     * Look-up of any nested sub-schemas that may contain information about "properties" in the given JSON schema definition.
     * If the given JSON schema definition refers is an array, it is assumed to not have relevant information.
     * Instead, the referenced schemas of its "Items" will be returned.
     *
     * This method is intended to be used to look-up fields like "properties" or "required" which are not associated with arrays.
     *
     * BEWARE: if a schema consists of multiple sub-schemas and only one of them defines an "items" field, the other sibling schemas
     * will still be included in the result list - they are just assumed to not have any relevant fields we are looking for.
     *
     * @returns {Array<JsonSchema>} array listing sub-schemas that may define properties about their children
     */
    getPropertyParentSchemas() {
        if (!isNonEmptyObject(this.schema)) {
            return [];
        }
        if (this.schema.$ref) {
            const referencedSchema = this.scope.find(this.schema.$ref);
            // this schema is just a reference to another separately defined schema
            return referencedSchema.getPropertyParentSchemas();
        }
        const schemaParts = this.getRelevantSchemaParts();
        if (schemaParts) {
            let returnedSchemas = [this];
            schemaParts.forEach((rawSchemaPart) => {
                returnedSchemas = returnedSchemas.concat(new JsonSchema(rawSchemaPart, this.parserConfig, this.scope).getPropertyParentSchemas());
            });
            return returnedSchemas;
        }
        if (isNonEmptyObject(this.schema.items)) {
            // unsupported: specifying array of schemas referring to entries at respective positions in described array
            // schema.items contains a single schema, that specifies the type of any value in the described array
            return new JsonSchema(this.schema.items, this.parserConfig, this.scope).getPropertyParentSchemas();
        }
        if (isNonEmptyObject(this.schema.additionalItems)) {
            // the given schema is an array which may specify its content type in "additionalItems"
            return new JsonSchema(this.schema.additionalItems, this.parserConfig, this.scope).getPropertyParentSchemas();
        }
        // if there are no nested schemas, only this schema itself may contain properties
        return [this];
    }

    /**
     * Extract the properties mentioned in this schema – also considering all nested sub-schema by using getPropertyParentSchemas().
     *
     * @returns {Object.<String, JsonSchema>} collection of all properties mentioned in this schema
     */
    getProperties() {
        return this.getPropertyParentSchemas().map(({ schema, scope }) => {
            // properties is an Object.<String, raw-json-schema>
            const { properties, required = [] } = schema;
            const rawProperties = Object.assign(
                {},
                ...required.map(value => ({ [value]: true })),
                isNonEmptyObject(properties) ? properties : {}
            );
            return mapObjectValues(rawProperties, rawSchema => new JsonSchema(rawSchema, this.parserConfig, scope));
        }).reduce(mergeObjects, {});
    }
}

export default JsonSchema;
