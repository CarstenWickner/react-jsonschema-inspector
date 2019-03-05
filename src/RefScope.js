import JsonSchema from "./JsonSchema";
import { isNonEmptyObject } from "./utils";

/**
 * Helper class to faciliate looking-up re-usable sub-schemas via the "$ref" keyword. A single RefScope instance refers to one main schema
 * and its contained "definitions". Other main schemas maybe used by additing their respective RefScope instances via .addOtherRefScopes().
 */
class RefScope {
    /**
     * Object.<String, JsonSchema>
     * collection of available sub-schema to be referenced via "$ref" within the originating schema.
     */
    internalRefs = {};

    /**
     * Object.<String, JsonSchema>
     * collection of available sub-schema to be referenced via "$ref" within the originating schema or from other schemas.
     */
    externalRefs = {};

    /**
     * Array.<RefScope>
     * Array of other scopes (e.g. in case of separate schemas being provided for that purpose).
     */
    otherScopes = [];

    /**
     * Constructor collecting all available references to contained re-usable (sub-) schemas.
     *
     * @param {JsonSchema} schema to collect $ref-erence-able sub-schemas from
     */
    constructor(schema) {
        if (!schema || !isNonEmptyObject(schema.schema)) {
            return;
        }
        // can always self-reference via an empty fragment
        this.internalRefs["#"] = schema;
        // from JSON Schema Draft 6: "$id" replaces former "id"
        const mainAlias = schema.schema.$id || schema.schema.id;
        let externalRefBase;
        if (mainAlias && !mainAlias.startsWith("#")) {
            // an absolute URI can be used both within the schema itself but also from other schemas
            const mainAliasWithFragment = mainAlias.endsWith("#") ? mainAlias : (`${mainAlias}#`);
            const mainAliasWithoutFragment = mainAliasWithFragment.substring(0, mainAliasWithFragment.length - 1);
            this.externalRefs[mainAliasWithFragment] = schema;
            this.externalRefs[mainAliasWithoutFragment] = schema;
            // for definitions, there should always by the empty fragment between the URI and the definitions path
            externalRefBase = mainAliasWithFragment;
        } else {
            // no valid alias provided
            externalRefBase = null;
        }
        const { definitions } = schema.schema;
        if (isNonEmptyObject(definitions)) {
            Object.keys(definitions).forEach((key) => {
                const definition = definitions[key];
                if (isNonEmptyObject(definition)) {
                    const subSchema = new JsonSchema(definition, this);
                    // from JSON Schema Draft 6: "$id" replaces former "id"
                    const subAlias = definition.$id || definition.id;
                    if (subAlias) {
                        // any alias provided within "definitions" will only be available as short-hand in this schema
                        this.internalRefs[subAlias] = subSchema;
                    }
                    // can always reference schema in definitions by its path, starting from the empty fragment
                    this.internalRefs[`#/definitions/${key}`] = subSchema;
                    if (externalRefBase) {
                        // the convention was fulfilled and the top-level schema defined an absolute URI as its "$id"
                        // this allows referencing a schema in definitions by its path, starting from that URI
                        this.externalRefs[`${externalRefBase}/definitions/${key}`] = subSchema;
                    }
                }
            });
        }
    }

    /**
     * Add other available scope.
     *
     * @param {RefScope} refScope other reference scope that is available (at least its external $ref-erences)
     */
    addOtherScope = (refScope) => {
        this.otherScopes.push(refScope);
    };

    /**
     * Add other available scopes.
     *
     * @param {Array.<RefScope>} refScopes other reference scopes that are available (at least their external $ref-erences)
     */
    addOtherScopes = (refScopes) => {
        refScopes.forEach(this.addOtherScope);
    };

    /**
     * Look-up a re-usable schema by its $ref-erence.
     *
     * @param {String} ref the "$ref" value for which to look-up the associated (sub-)schema
     * @param {Boolean} includeInteralRefs whether the "$ref" value is from within the same main schema this RefScope belongs to
     * @returns {JsonSchema} the successfully looked-up reference (or null if no match was found)
     */
    findSchemaInThisScope = (ref, includeInteralRefs = true) => (
        (includeInteralRefs && this.internalRefs[ref]) || this.externalRefs[ref]
    );

    /**
     * Look-up a re-usable schema by its $ref-erence.
     *
     * @param {String} ref the "$ref" value for which to look-up the associated (sub-)schema
     * @returns {Object} the successfully looked-up reference; in case of a match containing two fields (otherwise empty):
     *          1. "scope" (containing the RefScope the match was found in, which may be different from this RefScope)
     *          2. "referencedSchema" (containing the specific (sub-)schema associated with the given "$ref" value)
     */
    find = (ref) => {
        let result = this.findSchemaInThisScope(ref);
        if (!result && !this.otherScopes.some((otherScope) => {
            result = otherScope.findSchemaInThisScope(ref, false);
            return result;
        })) {
            throw new Error(`Cannot resolve $ref: "${ref}"`);
        }
        return result;
    };
}

export default RefScope;
