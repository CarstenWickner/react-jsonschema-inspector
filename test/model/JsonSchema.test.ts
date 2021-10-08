import { JsonSchema, RefScope } from "../../src/model/JsonSchema";
import { RawJsonSchema } from "../../src/types/RawJsonSchema";

describe("constructed correctly()", () => {
    it("includes only self-reference for simple schema", () => {
        const schema = new JsonSchema(
            {
                title: "Test"
            },
            {}
        );
        const { scope } = schema;
        expect(scope.internalRefs.size).toBe(1);
        expect(scope.internalRefs.get("#")).toEqual(schema);
        expect(scope.externalRefs).toEqual(new Map());
    });
    it("remembers other scopes", () => {
        const scope = new RefScope();
        scope.addOtherScope(new RefScope());
        scope.addOtherScope(new RefScope());
        expect(scope.otherScopes).toHaveLength(2);
    });
    it("supports $id on root schema", () => {
        const schema = {
            $id: "http://valid-uri.com/$id"
        } as RawJsonSchema;
        const { scope } = new JsonSchema(schema, {});
        expect(scope.internalRefs.size).toBe(1);
        expect(scope.internalRefs.get("#")?.schema).toEqual(schema);

        expect(scope.externalRefs.size).toBe(2);
        expect(scope.externalRefs.get("http://valid-uri.com/$id")?.schema).toEqual(schema);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#")?.schema).toEqual(schema);
    });
    it("includes definitions", () => {
        const subSchema = { title: "Test" };
        const schema = {
            definitions: {
                A: subSchema
            }
        };
        const { scope } = new JsonSchema(schema, {});
        expect(scope.internalRefs.size).toBe(2);
        expect(scope.internalRefs.get("#").schema).toEqual(schema);
        expect(scope.internalRefs.get("#/definitions/A").schema).toEqual(subSchema);
        expect(scope.externalRefs).toEqual(new Map());
    });
    it("includes $defs", () => {
        const subSchema = { title: "Test" };
        const schema = {
            $defs: {
                A: subSchema
            }
        };
        const { scope } = new JsonSchema(schema, {});
        expect(scope.internalRefs.size).toBe(2);
        expect(scope.internalRefs.get("#").schema).toEqual(schema);
        expect(scope.internalRefs.get("#/$defs/A").schema).toEqual(subSchema);
        expect(scope.externalRefs).toEqual(new Map());
    });
    it("includes $defs in external references", () => {
        const subSchema = { title: "Test" };
        const schema = {
            $id: "http://valid-uri.com/$id",
            $defs: {
                A: subSchema
            }
        };
        const { scope } = new JsonSchema(schema, {});
        expect(scope.internalRefs.size).toBe(2);
        expect(scope.internalRefs.get("#").schema).toEqual(schema);
        expect(scope.internalRefs.get("#/$defs/A").schema).toEqual(subSchema);

        expect(scope.externalRefs.size).toBe(3);
        expect(scope.externalRefs.get("http://valid-uri.com/$id").schema).toEqual(schema);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#").schema).toEqual(schema);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#/$defs/A").schema).toEqual(subSchema);
    });
    it("ignores empty $defs", () => {
        const schema = new JsonSchema(
            {
                $defs: {
                    A: {}
                }
            },
            {}
        );
        const { scope } = schema;
        expect(scope.internalRefs.size).toBe(1);
        expect(scope.internalRefs.get("#")).toEqual(schema);
        expect(scope.externalRefs).toEqual(new Map());
    });
    it("supports $id on sub-schema", () => {
        const subSchemaA = { $id: "A-$id-value" } as RawJsonSchema;
        const schema = {
            $defs: {
                A: subSchemaA
            }
        } as RawJsonSchema;
        const { scope } = new JsonSchema(schema, {});
        expect(scope.internalRefs.size).toBe(3);
        expect(scope.internalRefs.get("#").schema).toEqual(schema);
        expect(scope.internalRefs.get("#/$defs/A").schema).toEqual(subSchemaA);
        expect(scope.internalRefs.get("A-$id-value").schema).toEqual(subSchemaA);

        expect(scope.externalRefs).toEqual(new Map());
    });
    it("ignores $id values on $defs in external references", () => {
        const subSchemaA = { $id: "A-$id-value" };
        const subSchemaB = { $anchor: "B-anchor-value" };
        const schema = {
            $id: "http://valid-uri.com/$id#",
            $defs: {
                A: subSchemaA,
                B: subSchemaB
            }
        };
        const { scope } = new JsonSchema(schema, {});
        expect(scope.internalRefs.size).toBe(5);
        expect(scope.internalRefs.get("#").schema).toEqual(schema);
        expect(scope.internalRefs.get("#/$defs/A").schema).toEqual(subSchemaA);
        expect(scope.internalRefs.get("#/$defs/B").schema).toEqual(subSchemaB);
        expect(scope.internalRefs.get("A-$id-value").schema).toEqual(subSchemaA);
        expect(scope.internalRefs.get("#B-anchor-value").schema).toEqual(subSchemaB);

        expect(scope.externalRefs.size).toBe(5);
        expect(scope.externalRefs.get("http://valid-uri.com/$id").schema).toEqual(schema);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#").schema).toEqual(schema);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#/$defs/A").schema).toEqual(subSchemaA);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#/$defs/B").schema).toEqual(subSchemaB);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#B-anchor-value").schema).toEqual(subSchemaB);
    });
});
describe("RefScope.findSchemaInThisScope()", () => {
    it("in `internalRefs`", () => {
        const schema = new JsonSchema({ title: "Test" }, {});
        const { scope } = schema;
        expect(scope.findSchemaInThisScope("#")).toEqual(schema);
    });
    it("not in `internalRefs` when they are specifically ignored", () => {
        const schema = new JsonSchema({ title: "Test" }, {});
        const { scope } = schema;
        expect(scope.findSchemaInThisScope("#", false)).toBeUndefined();
    });
    it("in `externalRefs`", () => {
        const schema = new JsonSchema({ $id: "Test" }, {});
        const { scope } = schema;
        expect(scope.findSchemaInThisScope("Test")).toEqual(schema);
    });
    it("in `externalRefs` when `internalRefs` are being ignored", () => {
        const schema = new JsonSchema({ $id: "Test" }, {});
        const { scope } = schema;
        expect(scope.findSchemaInThisScope("Test", false)).toEqual(schema);
    });
});
describe("RefScope.find()", () => {
    it("directly in this scope", () => {
        const schema = new JsonSchema({ title: "Test" }, {});
        const { scope } = schema;
        expect(scope.find("#")).toEqual(schema);
    });
    it("throws error if not found", () => {
        const schema = new JsonSchema({ title: "Test" }, {});
        const { scope } = schema;
        expect(() => scope.find("#/$defs/A")).toThrowError('Cannot resolve $ref: "#/$defs/A"');
    });
    it.each`
        testTitle             | mainSchemaId                            | expectedErrorMessage
        ${"without path"}     | ${"https://base.org"}                   | ${'Cannot resolve $ref: "test.json"/"https://base.org/test.json"'}
        ${"with path"}        | ${"https://base.org/main.json"}         | ${'Cannot resolve $ref: "test.json"/"https://base.org/test.json"'}
        ${"with nested path"} | ${"https://base.org/schemas/main.json"} | ${'Cannot resolve $ref: "test.json"/"https://base.org/schemas/test.json"'}
    `("throws error if not found, also considering base URI $testTitle", ({ mainSchemaId, expectedErrorMessage }) => {
        const schema = new JsonSchema({ $id: mainSchemaId, title: "Test" }, {});
        const { scope } = schema;
        expect(() => scope.find("test.json")).toThrowError(expectedErrorMessage);
    });
    it("via other scope's `externalRefs`", () => {
        const otherSchemaId = "http://valid-uri.com/$id#";
        const schema = new JsonSchema({ $id: otherSchemaId }, {});
        const { scope } = new JsonSchema({ title: "Test" }, {});
        scope.addOtherScope(schema.scope);
        expect(scope.find(otherSchemaId)).toEqual(schema);
    });
    it.each`
        testTitle             | mainSchemaId                            | targetSchemaId
        ${"without path"}     | ${"https://base.org"}                   | ${"https://base.org/test.json"}
        ${"with path"}        | ${"https://base.org/main.json"}         | ${"https://base.org/test.json"}
        ${"with nested path"} | ${"https://base.org/schemas/main.json"} | ${"https://base.org/schemas/test.json"}
    `("via other scope's `externalRefs`, also considering base URI $testTitle", ({ mainSchemaId, targetSchemaId }) => {
        const { scope: otherScopeWithoutMatch } = new JsonSchema({ $id: "https://something-else.com" }, {});
        const targetSchema = new JsonSchema({ $id: targetSchemaId }, {});
        const { scope: mainScope } = new JsonSchema({ $id: mainSchemaId, title: "Test" }, {});
        // first entry in otherScopes does not contain a matching element
        mainScope.addOtherScope(otherScopeWithoutMatch);
        // second entry in otherScopes has a matching $id value
        mainScope.addOtherScope(targetSchema.scope);
        expect(mainScope.find(targetSchemaId)).toEqual(targetSchema);
    });
    it("not via other scope's `internalRefs`", () => {
        const { scope } = new JsonSchema({ $id: "https://base.org/", title: "Test" }, {});
        scope.addOtherScope(
            new JsonSchema(
                {
                    $defs: {
                        A: { description: "Value" }
                    }
                },
                {}
            ).scope
        );
        expect(Array.from(scope.otherScopes[0].internalRefs.keys())).toEqual(["#", "#/$defs/A"]);
        expect(() => scope.find("#/$defs/A")).toThrowError('Cannot resolve $ref: "#/$defs/A"');
    });
});
