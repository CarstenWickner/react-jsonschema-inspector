import RefScope from "../../src/model/RefScope";
import JsonSchema from "../../src/model/JsonSchema";

describe("constructed correctly()", () => {
    it("includes only self-reference for simple schema", () => {
        const schema = new JsonSchema({
            title: "Test"
        });
        const scope = new RefScope(schema);
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
            id: "http://valid-uri.com/$id"
        };
        const { scope } = new JsonSchema(schema);
        expect(scope.internalRefs.size).toBe(1);
        expect(scope.internalRefs.get("#").schema).toEqual(schema);

        expect(scope.externalRefs.size).toBe(2);
        expect(scope.externalRefs.get("http://valid-uri.com/$id").schema).toEqual(schema);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#").schema).toEqual(schema);
    });
    it("supports id on root schema (if no $id is present)", () => {
        // supporting "id" to be backwards-compatible with JSON Schema Draft 4
        const schema = {
            id: "http://valid-uri.com/id"
        };
        const { scope } = new JsonSchema(schema);
        expect(scope.internalRefs.size).toBe(1);
        expect(scope.internalRefs.get("#").schema).toEqual(schema);

        expect(scope.externalRefs.size).toBe(2);
        expect(scope.externalRefs.get("http://valid-uri.com/id").schema).toEqual(schema);
        expect(scope.externalRefs.get("http://valid-uri.com/id#").schema).toEqual(schema);
    });
    it("ignores id on root schema (if $id is also present)", () => {
        // "id" was replaced by "$id" with JSON Schema Draft 6
        const schema = {
            $id: "http://valid-uri.com/$id",
            id: "http://valid-uri.com/id"
        };
        const { scope } = new JsonSchema(schema);
        expect(scope.internalRefs.size).toBe(1);
        expect(scope.internalRefs.get("#").schema).toEqual(schema);

        expect(scope.externalRefs.size).toBe(2);
        expect(scope.externalRefs.get("http://valid-uri.com/$id").schema).toEqual(schema);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#").schema).toEqual(schema);
    });
    it("includes definitions", () => {
        const subSchema = { title: "Test" };
        const schema = {
            definitions: {
                A: subSchema
            }
        };
        const { scope } = new JsonSchema(schema);
        expect(scope.internalRefs.size).toBe(2);
        expect(scope.internalRefs.get("#").schema).toEqual(schema);
        expect(scope.internalRefs.get("#/definitions/A").schema).toEqual(subSchema);
        expect(scope.externalRefs).toEqual(new Map());
    });
    it("includes definitions in external references", () => {
        const subSchema = { title: "Test" };
        const schema = {
            $id: "http://valid-uri.com/$id",
            definitions: {
                A: subSchema
            }
        };
        const { scope } = new JsonSchema(schema);
        expect(scope.internalRefs.size).toBe(2);
        expect(scope.internalRefs.get("#").schema).toEqual(schema);
        expect(scope.internalRefs.get("#/definitions/A").schema).toEqual(subSchema);

        expect(scope.externalRefs.size).toBe(3);
        expect(scope.externalRefs.get("http://valid-uri.com/$id").schema).toEqual(schema);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#").schema).toEqual(schema);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#/definitions/A").schema).toEqual(subSchema);
    });
    it("ignores undefined/null/invalid/empty definitions", () => {
        const schema = new JsonSchema({
            definitions: {
                A: undefined,
                B: null,
                C: "not-a-schema",
                D: {}
            }
        });
        const scope = new RefScope(schema);
        expect(scope.internalRefs.size).toBe(1);
        expect(scope.internalRefs.get("#")).toEqual(schema);
        expect(scope.externalRefs).toEqual(new Map());
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
        const { scope } = new JsonSchema(schema);
        expect(scope.internalRefs.size).toBe(7);
        expect(scope.internalRefs.get("#").schema).toEqual(schema);
        expect(scope.internalRefs.get("#/definitions/A").schema).toEqual(subSchemaA);
        expect(scope.internalRefs.get("#/definitions/B").schema).toEqual(subSchemaB);
        expect(scope.internalRefs.get("#/definitions/C").schema).toEqual(subSchemaC);
        expect(scope.internalRefs.get("A-$id-value").schema).toEqual(subSchemaA);
        expect(scope.internalRefs.get("B-id-value").schema).toEqual(subSchemaB);
        expect(scope.internalRefs.get("C-$id-value").schema).toEqual(subSchemaC);

        expect(scope.externalRefs).toEqual(new Map());
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
        const { scope } = new JsonSchema(schema);
        expect(scope.internalRefs.size).toBe(5);
        expect(scope.internalRefs.get("#").schema).toEqual(schema);
        expect(scope.internalRefs.get("#/definitions/A").schema).toEqual(subSchemaA);
        expect(scope.internalRefs.get("#/definitions/B").schema).toEqual(subSchemaB);
        expect(scope.internalRefs.get("A-$id-value").schema).toEqual(subSchemaA);
        expect(scope.internalRefs.get("B-id-value").schema).toEqual(subSchemaB);

        expect(scope.externalRefs.size).toBe(4);
        expect(scope.externalRefs.get("http://valid-uri.com/$id").schema).toEqual(schema);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#").schema).toEqual(schema);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#/definitions/A").schema).toEqual(subSchemaA);
        expect(scope.externalRefs.get("http://valid-uri.com/$id#/definitions/B").schema).toEqual(subSchemaB);
    });
});
describe("findSchemaInThisScope()", () => {
    it("in `internalRefs`", () => {
        const schema = new JsonSchema({ title: "Test" });
        const scope = new RefScope(schema);
        expect(scope.findSchemaInThisScope("#")).toEqual(schema);
    });
    it("not in `internalRefs` when they are specifically ignored", () => {
        const schema = new JsonSchema({ title: "Test" });
        const scope = new RefScope(schema);
        expect(scope.findSchemaInThisScope("#", false)).toBeUndefined();
    });
    it("in `externalRefs`", () => {
        const schema = new JsonSchema({ $id: "Test" });
        const scope = new RefScope(schema);
        expect(scope.findSchemaInThisScope("Test")).toEqual(schema);
    });
    it("in `externalRefs` when `internalRefs` are being ignored", () => {
        const schema = new JsonSchema({ $id: "Test" });
        const scope = new RefScope(schema);
        expect(scope.findSchemaInThisScope("Test", false)).toEqual(schema);
    });
});
describe("find()", () => {
    it("directly in this scope", () => {
        const schema = new JsonSchema({ title: "Test" });
        const scope = new RefScope(schema);
        expect(scope.find("#")).toEqual(schema);
    });
    it("throws error if not found", () => {
        const schema = new JsonSchema({ title: "Test" });
        const scope = new RefScope(schema);
        expect(() => scope.find("#/definitions/A")).toThrowError("Cannot resolve $ref: \"#/definitions/A\"");
    });
    it("via other scope's `externalRefs`", () => {
        const otherSchemaId = "http://valid-uri.com/$id#";
        const schema = new JsonSchema({ $id: otherSchemaId });
        const scope = new RefScope(new JsonSchema({ title: "Test" }));
        scope.addOtherScope(new RefScope(schema));
        expect(scope.find(otherSchemaId)).toEqual(schema);
    });
    it("not via other scope's `internalRefs`", () => {
        const scope = new RefScope(new JsonSchema({ title: "Test" }));
        scope.addOtherScope(new RefScope(new JsonSchema({
            definitions: {
                A: { description: "Value" }
            }
        })));
        expect(Array.from(scope.otherScopes[0].internalRefs.keys())).toEqual(["#", "#/definitions/A"]);
        expect(() => scope.find("#/definitions/A")).toThrowError("Cannot resolve $ref: \"#/definitions/A\"");
    });
});
