import RefScope from "../src/RefScope";

describe("constructed correctly()", () => {
    it("includes only self-reference for simple schema", () => {
        const schema = {
            title: "Test"
        };
        const scope = new RefScope(schema);
        expect(scope.internalRefs).toEqual({ "#": schema });
        expect(scope.externalRefs).toEqual({});
    });
    it("remembers copy of other scopes", () => {
        const otherScopes = [
            new RefScope({}),
            new RefScope({})
        ];
        const scope = new RefScope({}, otherScopes);
        scope.addOtherScope(new RefScope({}));
        expect(scope.otherScopes).toHaveLength(3);
        // expect original array parameter to remain unchanged
        expect(otherScopes).toHaveLength(2);
    });
    it("supports $id on root schema", () => {
        const schema = {
            id: "http://valid-uri.com/$id"
        };
        const scope = new RefScope(schema);
        expect(scope.internalRefs).toEqual({ "#": schema });
        expect(scope.externalRefs).toEqual({
            "http://valid-uri.com/$id": schema,
            "http://valid-uri.com/$id#": schema
        });
    });
    it("supports id on root schema (if no $id is present)", () => {
        // supporting "id" to be backwards-compatible with JSON Schema Draft 4
        const schema = {
            id: "http://valid-uri.com/id"
        };
        const scope = new RefScope(schema);
        expect(scope.internalRefs).toEqual({ "#": schema });
        expect(scope.externalRefs).toEqual({
            "http://valid-uri.com/id": schema,
            "http://valid-uri.com/id#": schema
        });
    });
    it("ignores id on root schema (if $id is also present)", () => {
        // "id" was replaced by "$id" with JSON Schema Draft 6
        const schema = {
            $id: "http://valid-uri.com/$id",
            id: "http://valid-uri.com/id"
        };
        const scope = new RefScope(schema);
        expect(scope.internalRefs).toEqual({ "#": schema });
        expect(scope.externalRefs).toEqual({
            "http://valid-uri.com/$id": schema,
            "http://valid-uri.com/$id#": schema
        });
    });
    it("includes definitions", () => {
        const subSchema = { title: "Test" };
        const schema = {
            definitions: {
                A: subSchema
            }
        };
        const scope = new RefScope(schema);
        expect(scope.internalRefs).toEqual({
            "#": schema,
            "#/definitions/A": subSchema
        });
        expect(scope.externalRefs).toEqual({});
    });
    it("includes definitions in external references", () => {
        const subSchema = { title: "Test" };
        const schema = {
            $id: "http://valid-uri.com/$id",
            definitions: {
                A: subSchema
            }
        };
        const scope = new RefScope(schema);
        expect(scope.internalRefs).toEqual({
            "#": schema,
            "#/definitions/A": subSchema
        });
        expect(scope.externalRefs).toEqual({
            "http://valid-uri.com/$id": schema,
            "http://valid-uri.com/$id#": schema,
            "http://valid-uri.com/$id#/definitions/A": subSchema
        });
    });
    it("ignores undefined/null/invalid/empty definitions", () => {
        const schema = {
            definitions: {
                A: undefined,
                B: null,
                C: "not-a-schema",
                D: {}
            }
        };
        const scope = new RefScope(schema);
        expect(scope.internalRefs).toEqual({ "#": schema });
        expect(scope.externalRefs).toEqual({});
    });
    it("supports $id over id on sub-schema", () => {
        const subSchemaA = { $id: "A-$id-value" };
        // supporting "id" to be backwards-compatible with JSON Schema Draft 4
        const subSchemaB = { id: "B-id-value" };
        // "id" was replaced by "$id" with JSON Schema Draft 6
        const subSchemaC = {
            $id: "C-$id-value",
            id: "C-id-value"
        };
        const schema = {
            definitions: {
                A: subSchemaA,
                B: subSchemaB,
                C: subSchemaC
            }
        };
        const scope = new RefScope(schema);
        expect(scope.internalRefs).toEqual({
            "#": schema,
            "#/definitions/A": subSchemaA,
            "#/definitions/B": subSchemaB,
            "#/definitions/C": subSchemaC,
            "A-$id-value": subSchemaA,
            "B-id-value": subSchemaB,
            "C-$id-value": subSchemaC
        });
        expect(scope.externalRefs).toEqual({});
    });
    it("ignores $id/id values on definitions in external references", () => {
        const subSchemaA = { $id: "A-$id-value" };
        const subSchemaB = { id: "B-id-value" };
        const schema = {
            $id: "http://valid-uri.com/$id#",
            definitions: {
                A: subSchemaA,
                B: subSchemaB
            }
        };
        const scope = new RefScope(schema);
        expect(scope.internalRefs).toEqual({
            "#": schema,
            "#/definitions/A": subSchemaA,
            "#/definitions/B": subSchemaB,
            "A-$id-value": subSchemaA,
            "B-id-value": subSchemaB
        });
        expect(scope.externalRefs).toEqual({
            "http://valid-uri.com/$id": schema,
            "http://valid-uri.com/$id#": schema,
            "http://valid-uri.com/$id#/definitions/A": subSchemaA,
            "http://valid-uri.com/$id#/definitions/B": subSchemaB
        });
    });
});
describe("findSchemaInThisScope()", () => {
    it("in `internalRefs`", () => {
        const schema = { title: "Test" };
        const scope = new RefScope(schema);
        const result = scope.findSchemaInThisScope("#");
        expect(result.schema).toEqual(schema);
    });
    it("not in `internalRefs` when they are specifically ignored", () => {
        const schema = { title: "Test" };
        const scope = new RefScope(schema);
        expect(scope.findSchemaInThisScope("#", false)).toBe(null);
    });
    it("in `externalRefs`", () => {
        const schema = { $id: "Test" };
        const scope = new RefScope(schema);
        const result = scope.findSchemaInThisScope("Test");
        expect(result.schema).toEqual(schema);
    });
    it("in `externalRefs` when `internalRefs` are being ignored", () => {
        const schema = { $id: "Test" };
        const scope = new RefScope(schema);
        const result = scope.findSchemaInThisScope("Test", false);
        expect(result.schema).toEqual(schema);
    });
});
describe("find()", () => {
    it("directly in this scope", () => {
        const schema = { title: "Test" };
        const scope = new RefScope(schema);
        const result = scope.find("#");
        expect(result.schema).toEqual(schema);
    });
    it("throws error if not found", () => {
        const schema = { title: "Test" };
        const scope = new RefScope(schema);
        expect(() => scope.find("#/definitions/A")).toThrowError("Cannot resolve $ref: \"#/definitions/A\"");
    });
    it("via other scope's `externalRefs`", () => {
        const otherSchemaId = "http://valid-uri.com/$id#";
        const schema = { $id: otherSchemaId };
        const scope = new RefScope({ title: "Test" }, [new RefScope(schema)]);
        const result = scope.find(otherSchemaId);
        expect(result.schema).toEqual(schema);
    });
    it("not via other scope's `internalRefs`", () => {
        const scope = new RefScope({ title: "Test" }, [
            new RefScope({
                definitions: {
                    A: { description: "Value" }
                }
            })
        ]);
        expect(Object.keys(scope.otherScopes[0].internalRefs)).toEqual(["#", "#/definitions/A"]);
        expect(() => scope.find("#/definitions/A")).toThrowError("Cannot resolve $ref: \"#/definitions/A\"");
    });
});
