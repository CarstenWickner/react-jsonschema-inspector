import { createRecursiveFilterFunction, createFilterFunction } from "../src/searchUtils";
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
        it("schema with $ref", () => {
            expect(recursiveFilterFunction(new JsonSchema({ $ref: "something" }))).toBe(false);
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
    describe("returning filter function", () => {
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
});
