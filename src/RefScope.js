import JsonSchema from "./JsonSchema";
import { isNonEmptyObject } from "./utils";

/**
 * Helper class to facilitate looking-up re-usable sub-schemas via the "$ref" keyword. A single RefScope instance refers to one main schema
 * and its contained "definitions". Other main schemas maybe used by adding their respective RefScope instances via .addOtherRefScopes().
 */
class RefScope {
    /**
     * Map.<String, JsonSchema>
     * collection of available sub-schema to be referenced via "$ref" within the originating schema.
     */
    internalRefs = new Map();

    /**
     * Map.<String, JsonSchema>
     * collection of available sub-schema to be referenced via "$ref" within the originating schema or from other schemas.
     */
    externalRefs = new Map();

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
        this.internalRefs.set("#", schema);
        // from JSON Schema Draft 6: "$id" replaces former "id"
        const mainAlias = schema.schema.$id || schema.schema.id;
        let externalRefBase;
        if (mainAlias && !mainAlias.startsWith("#")) {
            // an absolute URI can be used both within the schema itself but also from other schemas
            const mainAliasWithFragment = mainAlias.endsWith("#") ? mainAlias : (`${mainAlias}#`);
            const mainAliasWithoutFragment = mainAliasWithFragment.substring(0, mainAliasWithFragment.length - 1);
            this.externalRefs.set(mainAliasWithFragment, schema);
            this.externalRefs.set(mainAliasWithoutFragment, schema);
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
                    const subSchema = new JsonSchema(definition, schema.parserConfig, this);
                    // from JSON Schema Draft 6: "$id" replaces former "id"
                    const subAlias = definition.$id || definition.id;
                    if (subAlias) {
                        // any alias provided within "definitions" will only be available as short-hand in this schema
                        this.internalRefs.set(subAlias, subSchema);
                    }
                    // can always reference schema in definitions by its path, starting from the empty fragment
                    this.internalRefs.set(`#/definitions/${key}`, subSchema);
                    if (externalRefBase) {
                        // the convention was fulfilled and the top-level schema defined an absolute URI as its "$id"
                        // this allows referencing a schema in definitions by its path, starting from that URI
                        this.externalRefs.set(`${externalRefBase}/definitions/${key}`, subSchema);
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
     * @param {Boolean} includeInternalRefs whether the "$ref" value is from within the same main schema this RefScope belongs to
     * @returns {JsonSchema} the successfully looked-up reference (or null if no match was found)
     */
    findSchemaInThisScope = (ref, includeInternalRefs = true) => (
        (includeInternalRefs && this.internalRefs.get(ref)) || this.externalRefs.get(ref)
    );

    /**
     * Look-up a re-usable schema by its $ref-erence.
     *
     * @param {String} ref the "$ref" value for which to look-up the associated (sub-)schema
     * @returns {JsonSchema} the successfully looked-up reference
     * @throws error if no match was found
     */
    find = (ref) => {
        let result = this.findSchemaInThisScope(ref);
        if (!result) {
            this.otherScopes.some((otherScope) => {
                result = otherScope.findSchemaInThisScope(ref, false);
                return result;
            });
        }
        if (result) {
            return result;
        }
        throw new Error(`Cannot resolve $ref: "${ref}"`);
    };
}

export default RefScope;
