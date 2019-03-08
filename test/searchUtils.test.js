import { createRecursiveFilterFunction, collectReferencedSubSchemas, createFilterFunction } from "../src/searchUtils";
import JsonSchema from "../src/JsonSchema";

describe("createRecursiveFilterFunction()", () => {
    let flatSearchFilter;
    let recursiveFilterFunction;
    beforeEach(() => {
        flatSearchFilter = jest.fn(rawSchema => rawSchema.default);
        recursiveFilterFunction = createRecursiveFilterFunction(flatSearchFilter);
    });

    describe("skipping", () => {
        it("undefined schema", () => {
            expect(recursiveFilterFunction(undefined)).toBe(false);
            expect(flatSearchFilter).not.toHaveBeenCalled();
        });
        it("null schema", () => {
            expect(recursiveFilterFunction(null)).toBe(false);
            expect(flatSearchFilter).not.toHaveBeenCalled();
        });
        it("non-object schema", () => {
            expect(recursiveFilterFunction("not-a-schema")).toBe(false);
            expect(flatSearchFilter).not.toHaveBeenCalled();
        });
        it("empty schema", () => {
            expect(recursiveFilterFunction(new JsonSchema())).toBe(false);
            expect(flatSearchFilter).not.toHaveBeenCalled();
        });
    });
    describe("plain schema", () => {
        it("check once (match)", () => {
            const rawSchema = { default: true };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(1);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
        });
        it("check once with $ref", () => {
            const rawSchema = { $ref: "something" };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(false);
            expect(flatSearchFilter).toHaveBeenCalledTimes(1);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
        });
    });
    describe("allOf:", () => {
        it("short-circuit on success (match in main schema)", () => {
            const subSchemaOne = {
                default: true,
                enum: ["value one"]
            };
            const subSchemaTwo = {
                default: true,
                enum: ["value two", "value three"]
            };
            const rawSchema = {
                allOf: [subSchemaOne, subSchemaTwo],
                default: true
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(1);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
        });
        it("short-circuit on success (match in first allOf part)", () => {
            const subSchemaOne = {
                default: true,
                enum: ["value one"]
            };
            const subSchemaTwo = {
                default: true,
                enum: ["value two", "value three"]
            };
            const rawSchema = {
                allOf: [subSchemaOne, subSchemaTwo]
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
            expect(flatSearchFilter).toHaveBeenCalledWith(subSchemaOne);
        });
        it("check each part (match in last allOf part)", () => {
            const subSchemaOne = { enum: ["value one"] };
            const subSchemaTwo = {
                default: true,
                enum: ["value two", "value three"]
            };
            const rawSchema = {
                allOf: [subSchemaOne, subSchemaTwo]
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(3);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
            expect(flatSearchFilter).toHaveBeenCalledWith(subSchemaOne);
            expect(flatSearchFilter).toHaveBeenCalledWith(subSchemaTwo);
        });
    });
    describe("properties:", () => {
        it("short-circuit on success (match in allOf)", () => {
            const allOfPart = { default: true };
            const subSchemaOne = {
                default: true,
                enum: ["value one"]
            };
            const subSchemaTwo = { enum: ["value two", "value three"] };
            const rawSchema = {
                allOf: [allOfPart],
                properties: {
                    propertyOne: subSchemaOne,
                    propertyTwo: subSchemaTwo
                }
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
            expect(flatSearchFilter).toHaveBeenCalledWith(allOfPart);
        });
        it("short-circuit on success (match in first property)", () => {
            const subSchemaOne = {
                default: true,
                enum: ["value one"]
            };
            const subSchemaTwo = {
                default: true,
                enum: ["value two", "value three"]
            };
            const rawSchema = {
                properties: {
                    propertyOne: subSchemaOne,
                    propertyTwo: subSchemaTwo
                }
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
            expect(flatSearchFilter).toHaveBeenCalledWith(subSchemaOne);
        });
        it("check each part (match in last property)", () => {
            const subSchemaOne = { enum: ["value one"] };
            const subSchemaTwo = {
                default: true,
                enum: ["value two", "value three"]
            };
            const rawSchema = {
                properties: {
                    propertyOne: subSchemaOne,
                    propertyTwo: subSchemaTwo
                }
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(3);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
            expect(flatSearchFilter).toHaveBeenCalledWith(subSchemaOne);
            expect(flatSearchFilter).toHaveBeenCalledWith(subSchemaTwo);
        });
    });
    describe("items:", () => {
        it("short-circuit on success (match in properties)", () => {
            const propertySchema = { default: true };
            const itemSchema = {
                default: true,
                enum: ["value one"]
            };
            const rawSchema = {
                properties: { property: propertySchema },
                items: itemSchema
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
            expect(flatSearchFilter).toHaveBeenCalledWith(propertySchema);
        });
        it("check once (match)", () => {
            const itemSchema = {
                enum: ["value one"],
                default: true
            };
            const rawSchema = {
                items: itemSchema
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
            expect(flatSearchFilter).toHaveBeenCalledWith(itemSchema);
        });
    });
    describe("additionalItems:", () => {
        it("short-circuit on success (match in properties)", () => {
            const propertySchema = { default: true };
            const additionalItemSchema = {
                default: true,
                enum: ["value one"]
            };
            const rawSchema = {
                properties: { property: propertySchema },
                additionalItems: additionalItemSchema
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
            expect(flatSearchFilter).toHaveBeenCalledWith(propertySchema);
        });
        it("ignored if items is present", () => {
            const itemSchema = { default: false };
            const additionalItemSchema = {
                default: true,
                enum: ["value one"]
            };
            const rawSchema = {
                items: itemSchema,
                additionalItems: additionalItemSchema
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(false);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
            expect(flatSearchFilter).toHaveBeenCalledWith(itemSchema);
        });
        it("check once (match)", () => {
            const additionalItemSchema = {
                enum: ["value one"],
                default: true
            };
            const rawSchema = {
                additionalItems: additionalItemSchema
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
            expect(flatSearchFilter).toHaveBeenCalledWith(additionalItemSchema);
        });
    });
});
describe("collectReferencedSubSchemas", () => {
    it("returns empty Set for simple schema", () => {
        const schema = new JsonSchema({ title: "No Reference" });
        expect(collectReferencedSubSchemas(schema)).toEqual(new Set());
    });
    it("returns Set with a single referenced sub-schema", () => {
        const rawSubSchema = {
            title: "Reference Target"
        };
        const schema = new JsonSchema({
            definitions: { Sub: rawSubSchema },
            items: { $ref: "#/definitions/Sub" }
        });
        const result = collectReferencedSubSchemas(schema);
        expect(result.size).toBe(1);
        expect(Array.from(result.values())[0].schema).toEqual(rawSubSchema);
    });
    it("returns Set with multiple referenced sub-schemas", () => {
        const schema = new JsonSchema({
            definitions: {
                Sub1: { title: "Reference Target" },
                Sub2: { description: "Second Target" }
            },
            allOf: [
                { $ref: "#/definitions/Sub1" },
                { $ref: "#/definitions/Sub2" }
            ]
        });
        expect(collectReferencedSubSchemas(schema).size).toBe(2);
    });
    it("ignores self-reference", () => {
        const schema = new JsonSchema({
            items: { $ref: "#" }
        });
        expect(collectReferencedSubSchemas(schema)).toEqual(new Set());
    });
});
describe("createFilterFunction()", () => {
    describe("returning undefined", () => {
        it("for undefined searchFields parameter", () => {
            expect(createFilterFunction(undefined, "filter")).toBeUndefined();
        });
        it("for null searchFields parameter", () => {
            expect(createFilterFunction(null, "filter")).toBeUndefined();
        });
        it("for empty string searchFields parameter", () => {
            expect(createFilterFunction("", "filter")).toBeUndefined();
        });
        it("for empty array searchFields parameter", () => {
            expect(createFilterFunction([], "filter")).toBeUndefined();
        });
        it("for undefined searchFilter parameter", () => {
            expect(createFilterFunction(["field-name"], undefined)).toBeUndefined();
        });
        it("for null searchFilter parameter", () => {
            expect(createFilterFunction(["field-name"], null)).toBeUndefined();
        });
        it("for empty searchFilter parameter", () => {
            expect(createFilterFunction(["field-name"], "")).toBeUndefined();
        });
    });
    describe("returning filter function for simple schema", () => {
        it("finding exact match in specified field", () => {
            const filterFunction = createFilterFunction(["fieldName"], "fieldValue");
            const schema = new JsonSchema({ fieldName: "fieldValue" });
            const columnInput = { root: schema };
            expect(filterFunction(columnInput)).toEqual(["root"]);
        });
        it("finding partial match in specified field", () => {
            const filterFunction = createFilterFunction(["fieldName"], "Value");
            const schema = new JsonSchema({ fieldName: "fieldValuePart" });
            const columnInput = { root: schema };
            expect(filterFunction(columnInput)).toEqual(["root"]);
        });
        it("finding case-insensitive match in specified field", () => {
            const filterFunction = createFilterFunction(["fieldName"], "vALUEpART");
            const schema = new JsonSchema({ fieldName: "fieldValuePart" });
            const columnInput = { root: schema };
            expect(filterFunction(columnInput)).toEqual(["root"]);
        });
        it("finding match in first specified field", () => {
            const filterFunction = createFilterFunction(["fieldNameOne", "fieldNameTwo"], "value");
            const schema = new JsonSchema({
                fieldNameOne: "value",
                fieldNameTwo: "something else"
            });
            const columnInput = { root: schema };
            expect(filterFunction(columnInput)).toEqual(["root"]);
        });
        it("finding match in second specified field", () => {
            const filterFunction = createFilterFunction(["fieldNameOne", "fieldNameTwo"], "value");
            const schema = new JsonSchema({
                fieldNameOne: "something else",
                fieldNameTwo: "value"
            });
            const columnInput = { root: schema };
            expect(filterFunction(columnInput)).toEqual(["root"]);
        });
        it("finding match in multiple column entries", () => {
            const filterFunction = createFilterFunction(["fieldNameOne", "fieldNameTwo"], "value");
            const schemaOne = new JsonSchema({
                fieldNameOne: "something else",
                fieldNameTwo: "value"
            });
            const schemaTwo = new JsonSchema({
                fieldNameOne: "value",
                fieldNameTwo: "something else"
            });
            const columnInput = {
                root: schemaOne,
                other: schemaTwo
            };
            expect(filterFunction(columnInput)).toEqual(["root", "other"]);
        });
        it("no match if field not present", () => {
            const filterFunction = createFilterFunction(["fieldName"], "value");
            const schema = new JsonSchema({ otherField: "value" });
            const columnInput = { root: schema };
            expect(filterFunction(columnInput)).toEqual([]);
        });
        it("no match if field value different", () => {
            const filterFunction = createFilterFunction(["fieldName"], "value");
            const schema = new JsonSchema({ fieldName: "something else" });
            const columnInput = { root: schema };
            expect(filterFunction(columnInput)).toEqual([]);
        });
    });
    describe("returning filter function for complex schema", () => {
        it("finding match in referenced parent schema via multiple different references", () => {
            const filterFunction = createFilterFunction(["title"], "Match");
            const rawItemOneSchema = {
                allOf: [
                    { $ref: "#/definitions/Two" },
                    { $ref: "#" }
                ]
            };
            const rawItemTwoSchema = {
                items: { title: "Nothing" }
            };
            const rawItemThreeSchema = {
                allOf: [
                    { $ref: "#/definitions/Two" },
                    { $ref: "https://unique-schema-identifier#" }
                ]
            };
            const schema = new JsonSchema({
                $id: "https://unique-schema-identifier",
                title: "Match",
                properties: {
                    "Item One": { $ref: "#/definitions/One" },
                    "Item Two": { $ref: "#/definitions/Two" },
                    "Item Three": { $ref: "#defintiions/Three" }
                },
                definitions: {
                    One: rawItemOneSchema,
                    Two: rawItemTwoSchema,
                    Three: rawItemThreeSchema
                }
            });
            const columnInput = {
                "Item One": schema.scope.find("#/definitions/One"),
                "Item Two": schema.scope.find("#/definitions/Two"),
                "Item Three": schema.scope.find("#/definitions/Three")
            };
            expect(filterFunction(columnInput)).toEqual(["Item One", "Item Three"]);
            // performing another search based on the same sub-schema instances again should re-use previous results
            // unfortunately, it is unclear how to confirm that here (other than through coverage of the short-circuiting branch)
            expect(filterFunction({ root: schema })).toEqual(["root"]);
        });
    });
});
