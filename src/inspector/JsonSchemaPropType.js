import PropTypes from 'prop-types';

const simpleTypes = PropTypes.oneOf(["string", "integer", "number", "object", "array", "boolean", "null"]);
const jsonSchemaShape = {
    /* commented out: unsupported field (for now)
        $schema: PropTypes.string,
    */
    $id: PropTypes.string,
    $ref: PropTypes.string,
    // some generic keywords allow for documentation (not validation)
    title: PropTypes.string,
    description: PropTypes.string,
    examples: PropTypes.array,
    default: PropTypes.any,
    type: PropTypes.oneOfType([simpleTypes, PropTypes.arrayOf(simpleTypes)]),
    /* commented out: unsupported fields (for now)
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
        exclusiveMinimum: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
        maximum: PropTypes.number,
        exclusiveMaximum: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
        // the following options are only applicable if the "type" includes the value "object"
        propertyNames: PropTypes.shape({
            minLength: PropTypes.number,
            maxLength: PropTypes.number,
            pattern: PropTypes.string,
            format: PropTypes.string
        }),
        minProperties: PropTypes.number,
        maxProperties: PropTypes.number,
        required: PropTypes.arrayOf(PropTypes.string),
        // the following options are only applicable if the "type" includes the value "array"
        minItems: PropTypes.number,
        maxItems: PropTypes.number,
        uniqueItems: PropTypes.bool
    */
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
// "additionalItems" are ignored if "items" is a single JsonSchemaPropType (i.e. not an array)
jsonSchemaShape.additionalItems = PropTypes.oneOfType([PropTypes.bool, JsonSchemaPropType]);
/* commented out: unsupported fields (for now)
    // validation of at least one item in an array being of a certain type
    jsonSchemaShape.contains = JsonSchemaPropType;
*/
// cater for re-usable sub-schemas that can be referenced via { "$ref": "..." }
jsonSchemaShape.definitions = PropTypes.objectOf(JsonSchemaPropType);

// cater for recursive combined schemas
jsonSchemaShape.allOf = PropTypes.arrayOf(JsonSchemaPropType);
/* commented out: unsupported fields (for now)
    // cater for conditional recursive combined schemas
    jsonSchemaShape.anyOf = PropTypes.arrayOf(JsonSchemaPropType);
    jsonSchemaShape.oneOf = PropTypes.arrayOf(JsonSchemaPropType);
    jsonSchemaShape.not = JsonSchemaPropType;
    // one property may only be required if another is also present
    jsonSchemaShape.dependencies = PropTypes.objectOf(PropTypes.oneOfType([JsonSchemaPropType, PropTypes.arrayOf(PropTypes.string)]));
    // cater for conditional portions of the containing schema (e.g. additional properties)
    jsonSchemaShape.if = JsonSchemaPropType;
    jsonSchemaShape.then = JsonSchemaPropType;
    jsonSchemaShape.else = JsonSchemaPropType;
*/

export default JsonSchemaPropType;
