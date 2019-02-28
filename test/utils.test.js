import {
    isDefined, isNonEmptyObject, getPropertyParentSchemas, mergeObjects, getFieldValue, getTypeOfArrayItems, collectRefTargets
} from "../src/utils";

describe("isDefined()", () => {
    it("rejects undefined", () => {
        expect(isDefined(undefined)).toBe(false);
    });
    it("rejects null", () => {
        expect(isDefined(null)).toBe(false);
    });
    it("accepts falsy: false", () => {
        expect(isDefined(false)).toBe(true);
    });
    it("accepts falsy: 0", () => {
        expect(isDefined(0)).toBe(true);
    });
    it("accepts falsy: \"\"", () => {
        expect(isDefined("")).toBe(true);
    });
    it("accepts falsy: ''", () => {
        // eslint-disable-next-line quotes
        expect(isDefined('')).toBe(true);
    });
    it("accepts falsy: ``", () => {
        // eslint-disable-next-line quotes
        expect(isDefined(``)).toBe(true);
    });
    it("accepts truthy: 1", () => {
        // eslint-disable-next-line quotes
        expect(isDefined(1)).toBe(true);
    });
    it("accepts truthy: []", () => {
        // eslint-disable-next-line quotes
        expect(isDefined([])).toBe(true);
    });
    it("accepts truthy: {}", () => {
        // eslint-disable-next-line quotes
        expect(isDefined({})).toBe(true);
    });
    it("accepts truthy: \"string\"", () => {
        // eslint-disable-next-line quotes
        expect(isDefined("string")).toBe(true);
    });
});
describe("isNonEmptyObject()", () => {
    it("rejects undefined", () => {
        expect(isNonEmptyObject(undefined)).toBe(false);
    });
    it("rejects null", () => {
        expect(isNonEmptyObject(null)).toBe(false);
    });
    it("rejects non-object: 1", () => {
        expect(isNonEmptyObject(1)).toBe(false);
    });
    it("rejects non-object: \"string\"", () => {
        expect(isNonEmptyObject("string")).toBe(false);
    });
    it("rejects empty array: []", () => {
        expect(isNonEmptyObject(["value"])).toBe(false);
    });
    it("rejects non-empty array: [{key:\"value\"}]", () => {
        expect(isNonEmptyObject([{ key: "value" }])).toBe(false);
    });
    it("rejects empty object: {}", () => {
        expect(isNonEmptyObject({})).toBe(false);
    });
    it("accepts non-empty object: { key: \"value\" }", () => {
        expect(isNonEmptyObject({ key: "value" })).toBe(true);
    });
});
describe("getPropertyParentSchemas()", () => {
    it("returns given simple schema", () => {
        const schema = { title: "Test" };
        expect(getPropertyParentSchemas(schema)).toEqual([schema]);
    });
    it("returns empty array for undefined schema", () => {
        expect(getPropertyParentSchemas(undefined)).toEqual([]);
    });
    it("returns empty array for null schema", () => {
        expect(getPropertyParentSchemas(null)).toEqual([]);
    });
    it("returns empty array for invalid schema", () => {
        expect(getPropertyParentSchemas("not-a-schema")).toEqual([]);
    });
    it("returns empty array for empty schema", () => {
        expect(getPropertyParentSchemas({})).toEqual([]);
    });
    it("returns $ref-erenced sub-schema", () => {
        const schema = { $ref: "A" };
        const subSchemaA = { title: "Ref-Test" };
        const refTargets = { A: subSchemaA };
        expect(getPropertyParentSchemas(schema, refTargets)).toEqual([subSchemaA]);
    });
    it("returns empty array if no refTargets provided but $ref found", () => {
        const schema = { $ref: "other" };
        expect(getPropertyParentSchemas(schema)).toEqual([]);
    });
    it("ignores other fields if $ref found", () => {
        const schema = {
            allOf: [
                { title: "Main-Title" },
                { description: "Text" }
            ],
            $ref: "A"
        };
        const subSchemaA = { title: "Ref-Title" };
        const refTargets = { A: subSchemaA };
        expect(getPropertyParentSchemas(schema, refTargets)).toEqual([subSchemaA]);
    });
    it("throws error for invalid $ref if refTargets provided", () => {
        const schema = { $ref: "other" };
        const refTargets = {
            third: { title: "yet another title" },
            fourth: { title: "one more" }
        };
        expect(() => getPropertyParentSchemas(schema, refTargets))
            .toThrowError("Cannot resolve $ref: \"other\", only known references are: third, fourth");
    });
    it("includes all from allOf", () => {
        const subSchema1 = { description: "Description Text" };
        const subSchema2 = { title: "Title Value" };
        const schema = { allOf: [subSchema1, subSchema2] };
        expect(getPropertyParentSchemas(schema)).toEqual([schema, subSchema1, subSchema2]);
    });
    it("includes all from $ref-erenced allOf", () => {
        const schema = { $ref: "A" };
        const subSchemaA1 = { description: "Description Text" };
        const subSchemaA21 = { title: "Title Value" };
        const subSchemaA22 = { type: "object" };
        const subSchemaA2 = { allOf: [subSchemaA21, subSchemaA22] };
        const subSchemaA = { allOf: [subSchemaA1, subSchemaA2] };
        const refTargets = { A: subSchemaA };
        expect(getPropertyParentSchemas(schema, refTargets))
            .toEqual([subSchemaA, subSchemaA1, subSchemaA2, subSchemaA21, subSchemaA22]);
    });
    it("returns type of items", () => {
        const subSchemaItems = { title: "Title Value" };
        const schema = { items: subSchemaItems };
        expect(getPropertyParentSchemas(schema)).toEqual([subSchemaItems]);
    });
    it("returns $ref-erenced type of items", () => {
        const schema = { items: { $ref: "A" } };
        const subSchemaItems = { title: "Title Value" };
        const refTargets = { A: subSchemaItems };
        expect(getPropertyParentSchemas(schema, refTargets)).toEqual([subSchemaItems]);
    });
    it("returns type of additionalItems", () => {
        const subSchemaItems = { title: "Title Value" };
        const schema = { additionalItems: subSchemaItems };
        expect(getPropertyParentSchemas(schema)).toEqual([subSchemaItems]);
    });
    it("returns $ref-erenced type of additionalItems", () => {
        const schema = { additionalItems: { $ref: "A" } };
        const subSchemaItems = { title: "Title Value" };
        const refTargets = { A: subSchemaItems };
        expect(getPropertyParentSchemas(schema, refTargets)).toEqual([subSchemaItems]);
    });
});
describe("mergeObjects()", () => {
    it("returns second param if first param is undefined", () => {
        const secondParam = { title: "something" };
        expect(mergeObjects(undefined, secondParam)).toEqual(secondParam);
    });
    it("returns second param if first param is null", () => {
        const secondParam = { title: "something" };
        expect(mergeObjects(null, secondParam)).toEqual(secondParam);
    });
    it("returns second param if first param is not an object", () => {
        const secondParam = { title: "something" };
        expect(mergeObjects("not an object", secondParam)).toEqual(secondParam);
    });
    it("returns second param if first param is empty object", () => {
        const secondParam = { title: "something" };
        expect(mergeObjects({}, secondParam)).toEqual(secondParam);
    });
    it("returns first param if second param is undefined", () => {
        const firstParam = { title: "something" };
        expect(mergeObjects(firstParam, undefined)).toEqual(firstParam);
    });
    it("returns first param if second param is null", () => {
        const firstParam = { title: "something" };
        expect(mergeObjects(firstParam, null)).toEqual(firstParam);
    });
    it("returns first param if second param is not an object", () => {
        const firstParam = { title: "something" };
        expect(mergeObjects(firstParam, "not an object")).toEqual(firstParam);
    });
    it("returns first param if second param is empty object", () => {
        const firstParam = { title: "something" };
        expect(mergeObjects(firstParam, {})).toEqual(firstParam);
    });
    it("returns unchanged param if both are the same", () => {
        const param = { title: "something" };
        expect(mergeObjects(param, param)).toEqual(param);
    });
    it("returns single merged object if both params are non empty objects", () => {
        const firstParam = { title: "something" };
        const secondParam = { description: "text" };
        const result = mergeObjects(firstParam, secondParam);
        expect(result).toEqual({
            title: "something",
            description: "text"
        });
        // ensure that the original objects remain unchanged
        expect(result).not.toEqual(firstParam);
        expect(result).not.toEqual(secondParam);
    });
});
describe("getFieldValue()", () => {
    it("finds single value in simple schema", () => {
        const schema = { title: "Test" };
        expect(getFieldValue(schema, "title")).toEqual("Test");
    });
    it("returns undefined for undefined schema", () => {
        expect(getFieldValue(undefined, "title")).toBe(undefined);
    });
    it("returns undefined for null schema", () => {
        expect(getFieldValue(null, "title")).toBe(undefined);
    });
    it("returns undefined for invalid schema", () => {
        expect(getFieldValue("not-a-schema", "title")).toBe(undefined);
    });
    it("returns undefined for empty schema", () => {
        expect(getFieldValue({}, "title")).toBe(undefined);
    });
    it("returns undefined if field not present", () => {
        const schema = { title: "Test" };
        expect(getFieldValue(schema, "description")).toBe(undefined);
    });
    it("find single value in $ref-erenced sub-schema", () => {
        const schema = { $ref: "other" };
        const refTargets = {
            other: { title: "Ref-Test" }
        };
        expect(getFieldValue(schema, "title", refTargets)).toEqual("Ref-Test");
    });
    it("returns undefined if no refTargets provided but $ref found", () => {
        const schema = { $ref: "other" };
        expect(getFieldValue(schema, "title")).toBe(undefined);
    });
    it("ignores other fields if $ref found", () => {
        const schema = {
            title: "Main-Title",
            $ref: "other"
        };
        const refTargets = {
            other: { title: "Ref-Title" }
        };
        expect(getFieldValue(schema, "title", refTargets)).toBe("Ref-Title");
    });
    it("throws error for invalid $ref if refTargets provided", () => {
        const schema = { $ref: "other" };
        const refTargets = {
            third: { title: "yet another title" },
            fourth: { title: "one more" }
        };
        expect(() => getFieldValue(schema, "title", refTargets))
            .toThrowError("Cannot resolve $ref: \"other\", only known references are: third, fourth");
    });
    it("finds single value in allOf", () => {
        const schema = {
            allOf: [
                { description: "Description Text" },
                { title: "Title Value" },
                { type: "object" }
            ]
        };
        expect(getFieldValue(schema, "title")).toEqual("Title Value");
    });
    it("finds single value in $ref-erenced allOf", () => {
        const schema = { $ref: "A" };
        const refTargets = {
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
        };
        expect(getFieldValue(schema, "title", refTargets)).toEqual("Title Value");
    });
    it("lists multiple values by default", () => {
        const schema = { $ref: "A" };
        const refTargets = {
            A: {
                allOf: [
                    { $ref: "B" },
                    { title: "Specific Title" }
                ]
            },
            B: { title: "Generic Title" }
        };
        expect(getFieldValue(schema, "title", refTargets)).toEqual(["Generic Title", "Specific Title"]);
    });
    it("supports custom mergeFunction for multiple values", () => {
        const schema = { $ref: "A" };
        const refTargets = {
            A: {
                allOf: [
                    { $ref: "B" },
                    { title: "Specific Title" }
                ]
            },
            B: { title: "Generic Title" }
        };
        // custom merge function always overrides result with last encountered value
        const mergeFunction = (first, second) => (isDefined(second) ? second : first);
        expect(getFieldValue(schema, "title", refTargets, mergeFunction)).toEqual("Specific Title");
    });
    it("ignores items", () => {
        const schema = {
            items: {
                title: "Array-Entry-Title"
            }
        };
        expect(getFieldValue(schema, "title")).toBe(undefined);
    });
    it("ignores additionalItems", () => {
        const schema = {
            additionalItems: {
                title: "Array-Entry-Title"
            }
        };
        expect(getFieldValue(schema, "title")).toBe(undefined);
    });
});
describe("getTypeOfArrayItems()", () => {
    it("finds `items` in simple schema", () => {
        const itemSchema = { title: "Test" };
        const schema = {
            items: itemSchema
        };
        expect(getTypeOfArrayItems(schema)).toEqual(itemSchema);
    });
    it("finds `additionalItems` in simple schema", () => {
        const additionalItemSchema = { description: "Value" };
        const schema = {
            additionalItems: additionalItemSchema
        };
        expect(getTypeOfArrayItems(schema)).toEqual(additionalItemSchema);
    });
    it("ignores boolean `additionalItems`", () => {
        const additionalItemSchema = true;
        const schema = {
            additionalItems: additionalItemSchema
        };
        expect(getTypeOfArrayItems(schema)).toBe(null);
    });
    it("prefers `items` over `additionalItems` in simple schema", () => {
        const itemSchema = { title: "Test" };
        const additionalItemSchema = { description: "Value" };
        const schema = {
            items: itemSchema,
            additionalItems: additionalItemSchema
        };
        expect(getTypeOfArrayItems(schema)).toEqual(itemSchema);
    });
    it("ignores boolean `items`", () => {
        const itemSchema = true;
        const additionalItemSchema = { description: "Value" };
        const schema = {
            items: itemSchema,
            additionalItems: additionalItemSchema
        };
        expect(getTypeOfArrayItems(schema)).toEqual(additionalItemSchema);
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
        expect(getTypeOfArrayItems(schema)).toEqual(additionalItemSchema);
    });
    it("returns null if neither `items` nor `additionalItems` are present", () => {
        const schema = {
            type: "array"
        };
        expect(getTypeOfArrayItems(schema)).toBe(null);
    });
});
describe("collectRefTargets()", () => {
    it("returns empty object for undefined schema", () => {
        expect(collectRefTargets(undefined)).toEqual({});
    });
    it("returns empty object for null schema", () => {
        expect(collectRefTargets(null)).toEqual({});
    });
    it("returns empty object for invalid schema", () => {
        expect(collectRefTargets("not-a-schema")).toEqual({});
    });
    it("returns empty object for empty schema", () => {
        expect(collectRefTargets({})).toEqual({});
    });
    it("returns only self-reference for simple schema", () => {
        const schema = {
            title: "Test"
        };
        expect(collectRefTargets(schema)).toEqual({ "#": schema });
    });
    it("supports $id on root schema", () => {
        const schema = {
            $id: "$id-value"
        };
        expect(collectRefTargets(schema)).toEqual({
            "#": schema,
            "$id-value": schema
        });
    });
    it("supports id on root schema (if no $id is present)", () => {
        // supporting "id" to be backwards-compatible with JSON Schema Draft 4
        const schema = {
            id: "id-value"
        };
        expect(collectRefTargets(schema)).toEqual({
            "#": schema,
            "id-value": schema
        });
    });
    it("ignores id on root schema (if $id is also present)", () => {
        // "id" was replaced by "$id" with JSON Schema Draft 6
        const schema = {
            $id: "$id-value",
            id: "id-value"
        };
        expect(collectRefTargets(schema)).toEqual({
            "#": schema,
            "$id-value": schema
        });
    });
    it("includes definitions", () => {
        const subSchema = { title: "Test" };
        const schema = {
            definitions: {
                A: subSchema
            }
        };
        expect(collectRefTargets(schema)).toEqual({
            "#": schema,
            "#/definitions/A": subSchema
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
        expect(collectRefTargets(schema)).toEqual({ "#": schema });
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
        expect(collectRefTargets(schema)).toEqual({
            "#": schema,
            "#/definitions/A": subSchemaA,
            "A-$id-value": subSchemaA,
            "#/definitions/B": subSchemaB,
            "B-id-value": subSchemaB,
            "#/definitions/C": subSchemaC,
            "C-$id-value": subSchemaC
        });
    });
});
