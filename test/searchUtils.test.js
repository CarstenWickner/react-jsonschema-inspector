import {
    createRecursiveFilterFunction, collectReferencedSubSchemas, createFilterFunction, filteringByFields
} from "../src/searchUtils";
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
    describe.each`
        groupName
        ${"anyOf"}
        ${"oneOf"}
    `("$groupName:", ({ groupName }) => {
        it("short-circuit on success (match in main schema)", () => {
            const subSchemaOne = { enum: ["value one"] };
            const subSchemaTwo = { enum: ["value two", "value three"] };
            const rawSchema = {
                [groupName]: [subSchemaOne, subSchemaTwo],
                default: true
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(1);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
        });
        describe("match in first part", () => {
            const subSchemaOne = {
                default: true,
                enum: ["value one"]
            };
            const subSchemaTwo = { enum: ["value two", "value three"] };
            const rawSchema = { [groupName]: [subSchemaOne, subSchemaTwo] };

            it("ignored if no parserConfig present", () => {
                expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(false);
                expect(flatSearchFilter).toHaveBeenCalledTimes(1);
                expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
            });
            it("ignored if specifically ignored in parserConfig present", () => {
                expect(recursiveFilterFunction(new JsonSchema(rawSchema, { [groupName]: "ignore" }))).toBe(false);
                expect(flatSearchFilter).toHaveBeenCalledTimes(1);
                expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
            });
            it("short-circuiting on success (with enabled option in parserConfig)", () => {
                expect(recursiveFilterFunction(new JsonSchema(rawSchema, { [groupName]: "likeAllOf" }))).toBe(true);
                expect(flatSearchFilter).toHaveBeenCalledTimes(2);
                expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema);
                expect(flatSearchFilter).toHaveBeenCalledWith(subSchemaOne);
            });
        });
        it("check each part (no match but with enabled option in parserConfig)", () => {
            const subSchemaOne = { enum: ["value one"] };
            const subSchemaTwo = { enum: ["value two", "value three"] };
            const rawSchema = { [groupName]: [subSchemaOne, subSchemaTwo] };

            expect(recursiveFilterFunction(new JsonSchema(rawSchema, { [groupName]: "likeAllOf" }))).toBe(false);
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
    describe("returning filter function for simple schema", () => {
        it("finding match in all column entries", () => {
            const filterFunction = createFilterFunction(() => true);
            const columnInput = {
                one: new JsonSchema({ title: "value" }),
                other: new JsonSchema({ description: "something else" })
            };
            expect(filterFunction(columnInput)).toEqual(["one", "other"]);
        });
        it("finding match in some column entries", () => {
            const filterFunction = createFilterFunction(rawSchema => rawSchema.title === "value");
            const columnInput = {
                one: new JsonSchema({ description: "value" }),
                other: new JsonSchema({ title: "value" })
            };
            expect(filterFunction(columnInput)).toEqual(["other"]);
        });
        it("returning empty array if no match can be found", () => {
            const filterFunction = createFilterFunction(() => false);
            const columnInput = {
                one: new JsonSchema({ description: "value" }),
                other: new JsonSchema({ title: "value" })
            };
            expect(filterFunction(columnInput)).toEqual([]);
        });
    });
    describe("returning filter function for complex schema", () => {
        const schema = new JsonSchema({
            $id: "https://unique-schema-identifier",
            title: "Match",
            properties: {
                "Item One": { $ref: "#/definitions/One" },
                "Item Two": { $ref: "#/definitions/Two" },
                "Item Three": { $ref: "#/definitions/Three" }
            },
            definitions: {
                One: {
                    items: { $ref: "#" }
                },
                Two: {
                    items: { title: "Nothing" }
                },
                Three: {
                    allOf: [
                        { $ref: "#/definitions/Two" },
                        { $ref: "https://unique-schema-identifier#" }
                    ]
                }
            }
        });
        const columnInput = {
            "Item One": schema.scope.find("#/definitions/One"),
            "Item Two": schema.scope.find("#/definitions/Two"),
            "Item Three": schema.scope.find("#/definitions/Three")
        };
        it("finding match in via circular reference to parent schema", () => {
            const filterFunction = createFilterFunction(rawSchema => rawSchema.title === "Match");
            expect(filterFunction(columnInput)).toEqual(["Item One", "Item Three"]);
        });
        it("avoiding endless loop even if no match can be found", () => {
            const filterFunction = createFilterFunction(() => false);
            expect(filterFunction(columnInput)).toEqual([]);
        });
    });
});
describe("filteringByFields()", () => {
    describe("returning undefined", () => {
        it("for undefined searchFields parameter", () => {
            expect(filteringByFields(undefined, "filter")).toBeUndefined();
        });
        it("for null searchFields parameter", () => {
            expect(filteringByFields(null, "filter")).toBeUndefined();
        });
        it("for empty string searchFields parameter", () => {
            expect(filteringByFields("", "filter")).toBeUndefined();
        });
        it("for empty array searchFields parameter", () => {
            expect(filteringByFields([], "filter")).toBeUndefined();
        });
        it("for undefined searchFilter parameter", () => {
            expect(filteringByFields(["field-name"], undefined)).toBeUndefined();
        });
        it("for null searchFilter parameter", () => {
            expect(filteringByFields(["field-name"], null)).toBeUndefined();
        });
        it("for empty searchFilter parameter", () => {
            expect(filteringByFields(["field-name"], "")).toBeUndefined();
        });
    });
    describe("finding", () => {
        it("exact match in specified field", () => {
            const filterFunction = filteringByFields(["fieldName"], "fieldValue");
            expect(filterFunction({ fieldName: "fieldValue" })).toBe(true);
        });
        it("partial match in specified field", () => {
            const filterFunction = filteringByFields(["fieldName"], "Value");
            expect(filterFunction({ fieldName: "fieldValuePart" })).toBe(true);
        });
        it("case-insensitive match in specified field", () => {
            const filterFunction = filteringByFields(["fieldName"], "vALUEpART");
            expect(filterFunction({ fieldName: "fieldValuePart" })).toBe(true);
        });
        it("match in first specified field", () => {
            const filterFunction = filteringByFields(["fieldNameOne", "fieldNameTwo"], "value");
            const schema = {
                fieldNameOne: "value",
                fieldNameTwo: "something else"
            };
            expect(filterFunction(schema)).toBe(true);
        });
        it("match in second specified field", () => {
            const filterFunction = filteringByFields(["fieldNameOne", "fieldNameTwo"], "value");
            const schema = {
                fieldNameOne: "something else",
                fieldNameTwo: "value"
            };
            expect(filterFunction(schema)).toBe(true);
        });
        it("no match if field not present", () => {
            const filterFunction = filteringByFields(["fieldName"], "value");
            const schema = { otherField: "value" };
            expect(filterFunction(schema)).toBe(false);
        });
        it("no match if field value different", () => {
            const filterFunction = filteringByFields(["fieldName"], "value");
            const schema = { fieldName: "something else" };
            expect(filterFunction(schema)).toBe(false);
        });
    });
});
