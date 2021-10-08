import { isNonEmptyObject, deriveBaseUri } from "./utils";

import { RawJsonSchema, getValueFromRawJsonSchema } from "../types/RawJsonSchema";
import { ParserConfig } from "../types/ParserConfig";

const createRawSchemaFromBoolean = (value: boolean): RawJsonSchema => (value ? {} : { not: {} });

/**
 * Representation of a Json Schema, offering a number of convenient functions for traversing and extracting information.
 */
export class JsonSchema {
    /**
     * Raw JSON Schema.
     */
    readonly schema: RawJsonSchema;

    /**
     * Configuration steering how the json schema is being traversed/parsed.
     */
    readonly parserConfig: ParserConfig;

    /**
     * Collection of allowed references to other schemas/parts.
     */
    readonly scope: RefScope;

    /**
     * Constructor for a JsonSchema (wrapper).
     *
     * @param {boolean|RawJsonSchema} schema - the JSON Schema to represent
     * @param {ParserConfig} parserConfig - configuration affecting how the json schema is being traversed/parsed
     * @param {?RefScope} scope - collection of available $ref targets (will be generated based on `schema` if not provided)
     */
    constructor(schema: boolean | RawJsonSchema, parserConfig: ParserConfig, scope?: RefScope) {
        this.schema = typeof schema === "boolean" ? createRawSchemaFromBoolean(schema) : (schema as RawJsonSchema);
        this.parserConfig = parserConfig;
        this.scope = scope || new RefScope(this);
    }
}

/**
 * Helper class to facilitate looking-up re-usable sub-schemas via the "$ref" keyword. A single RefScope instance refers to one main schema
 * and its contained "$defs"/"definitions". Other main schemas maybe used by adding their respective RefScope instances via .addOtherRefScopes().
 */
export class RefScope {
    /**
     * Base URI for resolving references.
     */
    readonly baseUri: string | null;

    /**
     * Collection of available sub-schema to be referenced via "$ref" within the originating schema.
     */
    readonly internalRefs: Map<string, JsonSchema> = new Map();

    /**
     * Collection of available sub-schema to be referenced via "$ref" within the originating schema or from other schemas.
     */
    readonly externalRefs: Map<string, JsonSchema> = new Map();

    /**
     * Array of other scopes (e.g. in case of separate schemas being provided for that purpose).
     */
    otherScopes: Array<RefScope> = [];

    /**
     * Constructor collecting all available references to contained re-usable (sub-) schemas.
     *
     * @param {JsonSchema} schema - to collect $ref-erence-able sub-schemas from
     */
    constructor(schema?: JsonSchema) {
        this.baseUri = null;
        if (!schema || !isNonEmptyObject(schema.schema)) {
            return;
        }
        // can always self-reference via an empty fragment
        this.internalRefs.set("#", schema);
        // from JSON Schema Draft 6: "$id" replaces former "id"
        const mainAlias = getValueFromRawJsonSchema(schema.schema, "$id");
        let externalRefBase: string | null;
        if (mainAlias && !mainAlias.startsWith("#")) {
            // an absolute URI can be used both within the schema itself but also from other schemas
            const mainAliasWithFragment = mainAlias.endsWith("#") ? mainAlias : `${mainAlias}#`;
            const mainAliasWithoutFragment = mainAliasWithFragment.substring(0, mainAliasWithFragment.length - 1);
            this.externalRefs.set(mainAliasWithFragment, schema);
            this.externalRefs.set(mainAliasWithoutFragment, schema);
            // for definitions, there should always be the empty fragment between the URI and the definitions path
            externalRefBase = mainAliasWithFragment;
            this.baseUri = deriveBaseUri(mainAliasWithoutFragment);
        } else {
            // no valid alias provided
            externalRefBase = null;
        }
        // in draft 2019-09 the keyword "definitions" was renamed to "$defs"
        const definitionsKeyword = schema.schema.hasOwnProperty("$defs") ? "$defs" : "definitions";
        const definitions = getValueFromRawJsonSchema(schema.schema, definitionsKeyword);
        if (isNonEmptyObject(definitions)) {
            Object.keys(definitions).forEach((key) => {
                const definition = definitions[key];
                if (isNonEmptyObject(definition)) {
                    const subSchema: JsonSchema = new JsonSchema(definition, schema.parserConfig, this);
                    const subAlias = getValueFromRawJsonSchema(definition, "$id");
                    if (subAlias) {
                        // any alias provided within definitions will only be available as short-hand in this schema
                        this.internalRefs.set(subAlias, subSchema);
                    }
                    // from JSON Schema Draft 2019-09: "$anchor" for plain text references (that should no longer be provided via $id)
                    const anchor = getValueFromRawJsonSchema(definition, "$anchor");
                    if (anchor) {
                        // any alias provided within definitions will only be available as short-hand in this schema
                        this.internalRefs.set(`#${anchor}`, subSchema);
                    }
                    // can always reference schema in definitions by its path, starting from the empty fragment
                    this.internalRefs.set(`#/${definitionsKeyword}/${key}`, subSchema);
                    if (externalRefBase) {
                        // the convention was fulfilled and the top-level schema defined an absolute URI as its "$id"
                        // this allows referencing a schema in definitions by its path, starting from that URI
                        this.externalRefs.set(`${externalRefBase}/${definitionsKeyword}/${key}`, subSchema);
                        if (anchor) {
                            // from JSON Schema Draft 2019-09: "$anchor" can also be used in combination with base URI
                            this.externalRefs.set(`${externalRefBase}${anchor}`, subSchema);
                        }
                    }
                }
            });
        }
    }

    /**
     * Add other available scope.
     *
     * @param {RefScope} refScope - other reference scope that is available (at least its external $ref-erences)
     */
    addOtherScope(refScope: RefScope): void {
        this.otherScopes.push(refScope);
    }

    /**
     * Look-up a re-usable schema by its $ref-erence.
     *
     * @param {string} ref - the "$ref" value for which to look-up the associated (sub-)schema
     * @param {boolean} includeInternalRefs - whether the "$ref" value is from within the same main schema this RefScope belongs to
     * @returns {JsonSchema} the successfully looked-up reference (or null if no match was found)
     */
    findSchemaInThisScope(ref: string, includeInternalRefs = true): JsonSchema | undefined {
        return (includeInternalRefs && this.internalRefs.get(ref)) || this.externalRefs.get(ref);
    }

    /**
     * Look-up a re-usable schema by its $ref-erence.
     *
     * @param {string} ref - the "$ref" value for which to look-up the associated (sub-)schema
     * @returns {JsonSchema} the successfully looked-up reference
     * @throws error if no match was found
     */
    find(ref: string): JsonSchema {
        let result = this.findSchemaInThisScope(ref);
        const alternativeRef = !result && this.baseUri && !ref.startsWith("#") && `${this.baseUri}${ref}`;
        if (alternativeRef) {
            result = this.findSchemaInThisScope(alternativeRef);
        }
        if (!result) {
            this.otherScopes.some((otherScope) => {
                result = otherScope.findSchemaInThisScope(ref, false);
                if (!result && alternativeRef) {
                    result = otherScope.findSchemaInThisScope(alternativeRef, false);
                }
                return result;
            });
        }
        if (result) {
            return result;
        }
        throw new Error(`Cannot resolve $ref: "${ref}"${alternativeRef ? `/"${alternativeRef}"` : ""}`);
    }
}
