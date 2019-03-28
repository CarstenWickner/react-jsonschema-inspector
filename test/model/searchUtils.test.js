import {
    createRecursiveFilterFunction, collectReferencedSubSchemas, createFilterFunction, filteringByFields
} from "../../src/model/searchUtils";
import { createGroupFromSchema, getOptionsInSchemaGroup } from "../../src/model/schemaUtils";
import JsonSchema from "../../src/model/JsonSchema";

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
            expect(flatSearchFilter.mock.calls).toHaveLength(2);
            expect(flatSearchFilter.mock.calls[0][0]).toEqual(rawSchema);
            expect(flatSearchFilter.mock.calls[1][0]).toEqual(allOfPart);
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
                items: {
                    one: new JsonSchema({ title: "value" }),
                    other: new JsonSchema({ description: "something else" })
                }
            };
            expect(filterFunction(columnInput)).toEqual(["one", "other"]);
        });
        it("finding match in some column entries", () => {
            const filterFunction = createFilterFunction(rawSchema => rawSchema.title === "value");
            const columnInput = {
                items: {
                    one: new JsonSchema({ description: "value" }),
                    other: new JsonSchema({ title: "value" })
                }
            };
            expect(filterFunction(columnInput)).toEqual(["other"]);
        });
        it("returning empty array if no match can be found", () => {
            const filterFunction = createFilterFunction(() => false);
            const columnInput = {
                items: {
                    one: new JsonSchema({ description: "value" }),
                    other: new JsonSchema({ title: "value" })
                }
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
            items: {
                "Item One": schema.scope.find("#/definitions/One"),
                "Item Two": schema.scope.find("#/definitions/Two"),
                "Item Three": schema.scope.find("#/definitions/Three")
            }
        };
        it("finding match via circular reference to parent schema", () => {
            const filterFunction = createFilterFunction(rawSchema => rawSchema.title === "Match");
            expect(filterFunction(columnInput)).toEqual(["Item One", "Item Three"]);
        });
        it("avoiding endless loop even if no match can be found", () => {
            const filterFunction = createFilterFunction(() => false);
            expect(filterFunction(columnInput)).toEqual([]);
        });
    });
    describe("returning filter function for schema with optionals", () => {
        const likeAllOf = { type: "likeAllOf" };
        const asColumn = { type: "asAdditionalColumn" };

        describe("finding match via circular reference to parent schema", () => {
            const rawSchema = {
                title: "Match",
                properties: {
                    "I-One": { $ref: "#/definitions/One" },
                    "I-Two": { $ref: "#/definitions/Two" },
                    "I-Three": { $ref: "#/definitions/Three" },
                    "I-Four": { $ref: "#/definitions/Four" }
                },
                definitions: {
                    One: {
                        items: { $ref: "#" }
                    },
                    Two: {
                        oneOf: [
                            { items: { title: "Foo" } },
                            {
                                properties: {
                                    bar: { $ref: "#" }
                                }
                            }
                        ]
                    },
                    Three: {
                        anyOf: [
                            { $ref: "#" },
                            { title: "Foobar" }
                        ]
                    },
                    Four: {
                        anyOf: [
                            { $ref: "#/definitions/Two" },
                            { title: "Qux" }
                        ]
                    }
                }
            };

            it.each`
                parserConfigDescription         | parserConfig                            | result
                ${"empty parserConfig"}         | ${{}}                                   | ${["I-One"]}
                ${"oneOf 'likeAllOf'"}          | ${{ oneOf: likeAllOf }}                 | ${["I-One", "I-Two"]}
                ${"oneOf 'asAdditionalColumn'"} | ${{ oneOf: asColumn }}                  | ${["I-One", "I-Two"]}
                ${"anyOf 'likeAllOf'"}          | ${{ anyOf: likeAllOf }}                 | ${["I-One", "I-Three"]}
                ${"anyOf 'likeAllOf'"}          | ${{ anyOf: asColumn }}                  | ${["I-One", "I-Three"]}
                ${"oneOf and anyOf"}            | ${{ oneOf: asColumn, anyOf: asColumn }} | ${["I-One", "I-Two", "I-Three", "I-Four"]}
            `("with $parserConfigDescription", ({ parserConfig, result }) => {
                const schema = new JsonSchema(rawSchema, parserConfig);
                const columnInput = {
                    items: {
                        "I-One": schema.scope.find("#/definitions/One"),
                        "I-Two": schema.scope.find("#/definitions/Two"),
                        "I-Three": schema.scope.find("#/definitions/Three"),
                        "I-Four": schema.scope.find("#/definitions/Four")
                    }
                };
                const filterFunction = createFilterFunction(rawSubSchema => rawSubSchema.title === "Match", parserConfig);
                expect(filterFunction(columnInput)).toEqual(result);
            });
        });
        describe("finding matches in options", () => {
            const rawSchema = {
                oneOf: [
                    { description: "Foo" },
                    { title: "Match" },
                    {
                        oneOf: [
                            { title: "Match" },
                            { description: "Bar" }
                        ]
                    },
                    {
                        anyOf: [
                            { description: "Foobar" },
                            {
                                items: {
                                    anyOf: [
                                        { title: "Match" },
                                        { title: "Qux" }
                                    ]
                                }
                            }
                        ]
                    }
                ],
                anyOf: [
                    { title: "Match" },
                    { description: "Foo" },
                    {
                        anyOf: [
                            { description: "Bar" },
                            { title: "Match" }
                        ]
                    },
                    {
                        oneOf: [
                            {
                                items: {
                                    oneOf: [
                                        { title: "Qux" },
                                        { title: "Match" }
                                    ]
                                }
                            },
                            { description: "Foobar" }
                        ]
                    }
                ]
            };

            it.each`
                parserConfigDescription  | parserConfig                            | result
                ${"oneOf 'asAdditionalColumn'"} | ${{ oneOf: asColumn }}           | ${[[1], [2, 0]]}
                ${"anyOf 'likeAllOf'"}   | ${{ anyOf: asColumn }}                  | ${[[0], [2, 1]]}
                ${"oneOf and anyOf"}     | ${{ oneOf: asColumn, anyOf: asColumn }} | ${[[1, 0], [1, 2, 1], [1, 3, 0], [2, 1], [2, 2, 0], [2, 3, 1]]}
            `("with $parserConfigDescription", ({ parserConfig, result }) => {
                const schema = new JsonSchema(rawSchema, parserConfig);
                const contextGroup = createGroupFromSchema(schema);
                const columnInput = {
                    contextGroup,
                    options: getOptionsInSchemaGroup(contextGroup)
                };
                const filterFunction = createFilterFunction(rawSubSchema => rawSubSchema.title === "Match");
                expect(JSON.stringify(filterFunction(columnInput))).toEqual(JSON.stringify(result));
            });
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
