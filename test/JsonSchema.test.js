import JsonSchema from "../src/JsonSchema";
import RefScope from "../src/RefScope";
import { isDefined } from "../src/utils";

describe("getPropertyParentSchemas()", () => {
    it("returns given simple schema", () => {
        const schema = new JsonSchema({ title: "Test" }, new RefScope());
        expect(schema.getPropertyParentSchemas()).toEqual([schema]);
    });
    it("returns empty array for undefined schema", () => {
        expect(new JsonSchema(undefined, new RefScope()).getPropertyParentSchemas()).toEqual([]);
    });
    it("returns empty array for null schema", () => {
        expect(new JsonSchema(null, new RefScope()).getPropertyParentSchemas()).toEqual([]);
    });
    it("returns empty array for invalid schema", () => {
        expect(new JsonSchema("not-a-schema", new RefScope()).getPropertyParentSchemas()).toEqual([]);
    });
    it("returns empty array for empty schema", () => {
        expect(new JsonSchema({}, new RefScope()).getPropertyParentSchemas()).toEqual([]);
    });
    it("returns $ref-erenced sub-schema", () => {
        const scope = new RefScope({
            definitions: {
                A: { title: "Ref-Test" }
            }
        });
        const result = new JsonSchema({ $ref: "#/definitions/A" }, scope).getPropertyParentSchemas();
        expect(result).toHaveLength(1);
        expect(result[0].schema).toEqual({ title: "Ref-Test" });
    });
    it("throws error if no refScope provided but $ref found", () => {
        const schema = new JsonSchema({ $ref: "#/definitions/other" }, new RefScope());
        expect(() => schema.getPropertyParentSchemas())
            .toThrowError("Cannot resolve $ref: \"#/definitions/other\"");
    });
    it("ignores other fields if $ref found", () => {
        const schema = {
            allOf: [
                { title: "Main-Title" },
                { description: "Text" }
            ],
            $ref: "#/definitions/A"
        };
        const scope = new RefScope({
            definitions: {
                A: { title: "Ref-Title" }
            }
        });
        const result = new JsonSchema(schema, scope).getPropertyParentSchemas();
        expect(result).toHaveLength(1);
        expect(result[0].schema).toEqual({ title: "Ref-Title" });
    });
    it("includes all from allOf", () => {
        const subSchema1 = { description: "Description Text" };
        const subSchema2 = { title: "Title Value" };
        const scope = new RefScope();
        const schema = new JsonSchema({ allOf: [subSchema1, subSchema2] }, scope);
        const result = schema.getPropertyParentSchemas();
        expect(result).toHaveLength(3);
        expect(result[0]).toEqual(schema);
        expect(result[1].schema).toEqual(subSchema1);
        expect(result[2].schema).toEqual(subSchema2);
    });
    it("includes all from $ref-erenced allOf", () => {
        const subSchemaA1 = { description: "Description Text" };
        const subSchemaA21 = { title: "Title Value" };
        const subSchemaA22 = { type: "object" };
        const subSchemaA2 = { allOf: [subSchemaA21, subSchemaA22] };
        const subSchemaA = { allOf: [subSchemaA1, subSchemaA2] };
        const scope = new RefScope({
            definitions: { A: subSchemaA }
        });
        const result = new JsonSchema({ $ref: "#/definitions/A" }, scope).getPropertyParentSchemas();
        expect(result).toHaveLength(5);
        expect(result[0].schema).toEqual(subSchemaA);
        expect(result[1].schema).toEqual(subSchemaA1);
        expect(result[2].schema).toEqual(subSchemaA2);
        expect(result[3].schema).toEqual(subSchemaA21);
        expect(result[4].schema).toEqual(subSchemaA22);
    });
    it("returns type of items", () => {
        const subSchemaItems = { title: "Title Value" };
        const schema = { items: subSchemaItems };
        const scope = new RefScope();
        const result = new JsonSchema(schema, scope).getPropertyParentSchemas();
        expect(result).toHaveLength(1);
        expect(result[0].schema).toEqual(subSchemaItems);
        expect(result[0].scope).toEqual(scope);
    });
    it("returns $ref-erenced type of items", () => {
        const schema = { items: { $ref: "#/definitions/A" } };
        const subSchemaItems = { title: "Title Value" };
        const scope = new RefScope({
            definitions: { A: subSchemaItems }
        });
        const result = new JsonSchema(schema, scope).getPropertyParentSchemas();
        expect(result).toHaveLength(1);
        expect(result[0].schema).toEqual(subSchemaItems);
        expect(result[0].scope).toEqual(scope);
    });
    it("returns type of additionalItems", () => {
        const subSchemaItems = { title: "Title Value" };
        const schema = { additionalItems: subSchemaItems };
        const scope = new RefScope();
        const result = new JsonSchema(schema, scope).getPropertyParentSchemas();
        expect(result).toHaveLength(1);
        expect(result[0].schema).toEqual(subSchemaItems);
        expect(result[0].scope).toEqual(scope);
    });
    it("returns $ref-erenced type of additionalItems", () => {
        const schema = { additionalItems: { $ref: "#/definitions/A" } };
        const subSchemaItems = { title: "Title Value" };
        const scope = new RefScope({
            definitions: { A: subSchemaItems }
        });
        const result = new JsonSchema(schema, scope).getPropertyParentSchemas();
        expect(result).toHaveLength(1);
        expect(result[0].schema).toEqual(subSchemaItems);
        expect(result[0].scope).toEqual(scope);
    });
});
describe("getFieldValue()", () => {
    it("finds single value in simple schema", () => {
        const schema = { title: "Test" };
        expect(new JsonSchema(schema).getFieldValue("title")).toEqual("Test");
    });
    it("returns undefined for undefined schema", () => {
        expect(new JsonSchema().getFieldValue("title")).toBe(undefined);
    });
    it("returns undefined for null schema", () => {
        expect(new JsonSchema(null).getFieldValue("title")).toBe(undefined);
    });
    it("returns undefined for invalid schema", () => {
        expect(new JsonSchema("not-a-schema").getFieldValue("title")).toBe(undefined);
    });
    it("returns undefined for empty schema", () => {
        expect(new JsonSchema({}).getFieldValue("title")).toBe(undefined);
    });
    it("returns undefined if field not present", () => {
        const schema = { title: "Test" };
        expect(new JsonSchema(schema).getFieldValue("description")).toBe(undefined);
    });
    it("find single value in $ref-erenced sub-schema", () => {
        const schema = { $ref: "#/definitions/other" };
        const scope = new RefScope({
            definitions: {
                other: { title: "Ref-Test" }
            }
        });
        expect(new JsonSchema(schema, scope).getFieldValue("title")).toEqual("Ref-Test");
    });
    it("ignores other fields if $ref found", () => {
        const schema = {
            title: "Main-Title",
            $ref: "#/definitions/other"
        };
        const scope = new RefScope({
            definitions: {
                other: { title: "Ref-Title" }
            }
        });
        expect(new JsonSchema(schema, scope).getFieldValue("title")).toBe("Ref-Title");
    });
    it("throws error for invalid $ref if scope provided", () => {
        const schema = { $ref: "#/definitions/other" };
        const scope = new RefScope({
            definitions: {
                third: { title: "yet another title" },
                fourth: { title: "one more" }
            }
        });
        expect(() => new JsonSchema(schema, scope).getFieldValue("title"))
            .toThrowError("Cannot resolve $ref: \"#/definitions/other\"");
    });
    it("finds single value in allOf", () => {
        const schema = {
            allOf: [
                { description: "Description Text" },
                { title: "Title Value" },
                { type: "object" }
            ]
        };
        expect(new JsonSchema(schema).getFieldValue("title")).toEqual("Title Value");
    });
    it("finds single value in $ref-erenced allOf", () => {
        const schema = { $ref: "#/definitions/A" };
        const scope = new RefScope({
            definitions: {
                A: {
                    allOf: [
                        { description: "Description Text" },
                        {
                            allOf: [
                                { title: "Title Value" },
                                { type: "object" }
                            ]
                        }
                    ]
                }
            }
        });
        expect(new JsonSchema(schema, scope).getFieldValue("title")).toEqual("Title Value");
    });
    it("lists multiple values by default", () => {
        const schema = { $ref: "#/definitions/A" };
        const scope = new RefScope({
            definitions: {
                A: {
                    allOf: [
                        { $ref: "#/definitions/B" },
                        { title: "Specific Title" }
                    ]
                },
                B: { title: "Generic Title" }
            }
        });
        expect(new JsonSchema(schema, scope).getFieldValue("title")).toEqual(["Generic Title", "Specific Title"]);
    });
    it("supports custom mergeFunction for multiple values", () => {
        const schema = { $ref: "#/definitions/A" };
        const scope = new RefScope({
            definitions: {
                A: {
                    allOf: [
                        { $ref: "#/definitions/B" },
                        { title: "Specific Title" }
                    ]
                },
                B: { title: "Generic Title" }
            }
        });
        // custom merge function always overrides result with last encountered value
        const mergeFunction = (first, second) => (isDefined(second) ? second : first);
        expect(new JsonSchema(schema, scope).getFieldValue("title", mergeFunction)).toEqual("Specific Title");
    });
    it("ignores items", () => {
        const schema = {
            items: {
                title: "Array-Entry-Title"
            }
        };
        expect(new JsonSchema(schema).getFieldValue("title")).toBe(undefined);
    });
    it("ignores additionalItems", () => {
        const schema = {
            additionalItems: {
                title: "Array-Entry-Title"
            }
        };
        expect(new JsonSchema(schema).getFieldValue("title")).toBe(undefined);
    });
});
describe("getTypeOfArrayItems()", () => {
    it("finds `items` in simple schema", () => {
        const itemSchema = { title: "Test" };
        const schema = {
            items: itemSchema
        };
        expect(new JsonSchema(schema).getTypeOfArrayItems().schema).toEqual(itemSchema);
    });
    it("finds `additionalItems` in simple schema", () => {
        const additionalItemSchema = { description: "Value" };
        const schema = {
            additionalItems: additionalItemSchema
        };
        expect(new JsonSchema(schema).getTypeOfArrayItems().schema).toEqual(additionalItemSchema);
    });
    it("ignores boolean `additionalItems`", () => {
        const additionalItemSchema = true;
        const schema = {
            additionalItems: additionalItemSchema
        };
        expect(new JsonSchema(schema).getTypeOfArrayItems()).toBe(null);
    });
    it("prefers `items` over `additionalItems` in simple schema", () => {
        const itemSchema = { title: "Test" };
        const additionalItemSchema = { description: "Value" };
        const schema = {
            items: itemSchema,
            additionalItems: additionalItemSchema
        };
        expect(new JsonSchema(schema).getTypeOfArrayItems().schema).toEqual(itemSchema);
    });
    it("ignores boolean `items`", () => {
        const itemSchema = true;
        const additionalItemSchema = { description: "Value" };
        const schema = {
            items: itemSchema,
            additionalItems: additionalItemSchema
        };
        expect(new JsonSchema(schema).getTypeOfArrayItems().schema).toEqual(additionalItemSchema);
    });
    it("ignores array of `items`", () => {
        const itemSchemaArray = [
            { title: "Test" },
            { type: "object" }
        ];
        const additionalItemSchema = { description: "Value" };
        const schema = {
            items: itemSchemaArray,
            additionalItems: additionalItemSchema
        };
        expect(new JsonSchema(schema).getTypeOfArrayItems().schema).toEqual(additionalItemSchema);
    });
    it("returns null if neither `items` nor `additionalItems` are present", () => {
        const schema = {
            type: "array"
        };
        expect(new JsonSchema(schema).getTypeOfArrayItems()).toBe(null);
    });
});
