import PropTypes from "prop-types";

const simpleTypes = PropTypes.oneOf(["string", "integer", "number", "object", "array", "boolean", "null"]);
const jsonSchemaShape = {
    /* commented out: unsupported field (for now)
        $schema: PropTypes.string,
    */
    // as of JSON Schema Draft 6, instead of "id"
    $id: PropTypes.string,
    // in JSON Schema Draft 4, replaced by "$id" from Draft 6
    id: PropTypes.string,
    $ref: PropTypes.string,
    // some generic keywords allow for documentation (not validation)
    title: PropTypes.string,
    description: PropTypes.string,
    examples: PropTypes.array,
    default: PropTypes.any,
    type: PropTypes.oneOfType([simpleTypes, PropTypes.arrayOf(simpleTypes)]),

    // "enum" of allowed values
    enum: PropTypes.array,
    // "const" is just an alternative to an "enum" with a single entry
    const: PropTypes.any,
    // the following options are only applicable if the "type" includes the value "string"
    minLength: PropTypes.number,
    maxLength: PropTypes.number,
    pattern: PropTypes.string,
    format: PropTypes.string,
    // the following options are only applicable if the "type" includes the value "number"
    multipleOf: PropTypes.number,
    minimum: PropTypes.number,
    // as of JSON Schema Draft 6: number; before (Draft 4): boolean
    exclusiveMinimum: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
    maximum: PropTypes.number,
    // as of JSON Schema Draft 6: number; before (Draft 4): boolean
    exclusiveMaximum: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),

    // the following options are only applicable if the "type" includes the value "object"
    required: PropTypes.arrayOf(PropTypes.string),
    /* commented out: unsupported fields (for now)
        propertyNames: PropTypes.shape({
            minLength: PropTypes.number,
            maxLength: PropTypes.number,
            pattern: PropTypes.string,
            format: PropTypes.string
        }),
        minProperties: PropTypes.number,
        maxProperties: PropTypes.number,
    */
    // the following options are only applicable if the "type" includes the value "array"
    minItems: PropTypes.number,
    maxItems: PropTypes.number,
    uniqueItems: PropTypes.bool
};
const JsonSchemaPropType = PropTypes.shape(jsonSchemaShape);

// cater for recursive structure of object properties being described as JsonSchema
jsonSchemaShape.properties = PropTypes.objectOf(PropTypes.oneOfType([PropTypes.bool, JsonSchemaPropType]));
/* commented out: unsupported fields
    // these two fields describe placeholders for dynamic fields which may only be mentioned in the "Details"
    jsonSchemaShape.additionalProperties = PropTypes.oneOfType([PropTypes.bool, JsonSchemaPropType]);
    jsonSchemaShape.patternProperties = PropTypes.objectOf(JsonSchemaPropType);
*/

// cater for recursive structure of arrays containing JsonSchema - expecting only one kind of schema as type of "items"
// "items" may also contain an array of schemas which then each refer to the values at the respective positions which is not supported (for now)
jsonSchemaShape.items = PropTypes.oneOfType([PropTypes.bool, JsonSchemaPropType, PropTypes.array]);
// "additionalItems" are ignored if "items" is a boolean or single JsonSchemaPropType (i.e. not an array)
jsonSchemaShape.additionalItems = PropTypes.oneOfType([PropTypes.bool, JsonSchemaPropType]);
/* commented out: unsupported fields (for now)
    // validation of at least one item in an array being of a certain type
    jsonSchemaShape.contains = JsonSchemaPropType;
*/
// cater for re-usable sub-schemas that can be referenced via { "$ref": "..." }
jsonSchemaShape.definitions = PropTypes.objectOf(JsonSchemaPropType);

// cater for recursive combined schemas
jsonSchemaShape.allOf = PropTypes.arrayOf(JsonSchemaPropType);
// cater for conditional recursive combined schemas
jsonSchemaShape.anyOf = PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.bool, JsonSchemaPropType]));
jsonSchemaShape.oneOf = PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.bool, JsonSchemaPropType]));
/* commented out: unsupported fields (for now)
    jsonSchemaShape.not = JsonSchemaPropType;
    // some things may only apply if a particular property is present
    jsonSchemaShape.dependencies = PropTypes.objectOf(PropTypes.oneOfType([JsonSchemaPropType, PropTypes.arrayOf(PropTypes.string)]));
    // cater for conditional portions of the containing schema (e.g. additional properties)
    jsonSchemaShape.if = JsonSchemaPropType;
    jsonSchemaShape.then = JsonSchemaPropType;
    jsonSchemaShape.else = JsonSchemaPropType;
*/

/**
 * PropType for describing fields expected as per JSON Schema Draft 7 (with backwards-compatibility down to Draft 4).
 * Some dynamic fields/validations are not supported as they only make sense against an actual data instance and not when looking at the schema alone.
 */
export default JsonSchemaPropType;
