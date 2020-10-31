import {
    collectReferencedSubSchemas,
    createFilterFunctionForSchema,
    createRecursiveFilterFunction,
    filteringByFields,
    filteringByPropertyName
} from "../../src/model/searchUtils";

import { JsonSchema } from "../../src/model/JsonSchema";
import { RawJsonSchema } from "../../src/types/RawJsonSchema";

describe("createRecursiveFilterFunction()", () => {
    const flatSearchFilter = jest.fn((rawSchema) => rawSchema.default);
    let recursiveFilterFunction: (target: JsonSchema, includeNestedOptionals?: boolean) => boolean;
    beforeEach(() => {
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
        it("empty schema", () => {
            expect(recursiveFilterFunction(new JsonSchema(true, {}))).toBe(false);
            expect(flatSearchFilter).not.toHaveBeenCalled();
        });
    });
    describe("plain schema", () => {
        it("check once (match)", () => {
            const rawSchema = { default: true };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema, {}))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(1);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema, true);
        });
        it("check once with $ref", () => {
            const rawSchema = { $ref: "something" };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema, {}))).toBe(false);
            expect(flatSearchFilter).toHaveBeenCalledTimes(1);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema, true);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema, {}))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema, true);
            expect(flatSearchFilter).toHaveBeenCalledWith(allOfPart, true);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema, {}))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema, true);
            expect(flatSearchFilter).toHaveBeenCalledWith(subSchemaOne, true);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema, {}))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(3);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema, true);
            expect(flatSearchFilter).toHaveBeenCalledWith(subSchemaOne, true);
            expect(flatSearchFilter).toHaveBeenCalledWith(subSchemaTwo, true);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema, {}))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema, true);
            expect(flatSearchFilter).toHaveBeenCalledWith(propertySchema, true);
        });
        it("check once (match)", () => {
            const itemSchema = {
                enum: ["value one"],
                default: true
            };
            const rawSchema = {
                items: itemSchema
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema, {}))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema, true);
            expect(flatSearchFilter).toHaveBeenCalledWith(itemSchema, true);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema, {}))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema, true);
            expect(flatSearchFilter).toHaveBeenCalledWith(propertySchema, true);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema, {}))).toBe(false);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema, true);
            expect(flatSearchFilter).toHaveBeenCalledWith(itemSchema, true);
        });
        it("check once (match)", () => {
            const additionalItemSchema = {
                enum: ["value one"],
                default: true
            };
            const rawSchema = {
                additionalItems: additionalItemSchema
            };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema, {}))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema, true);
            expect(flatSearchFilter).toHaveBeenCalledWith(additionalItemSchema, true);
        });
    });
});
describe("collectReferencedSubSchemas", () => {
    it("returns empty Map for simple schema", () => {
        const schema = new JsonSchema({ title: "No Reference" }, {});
        expect(collectReferencedSubSchemas(schema)).toEqual(new Map());
    });
    describe.each`
        fieldName
        ${"anyOf"}
        ${"oneOf"}
    `("for reference in '$fieldName'", ({ fieldName }) => {
        const rawSubSchema = {
            title: "Reference Target"
        };
        const schema = new JsonSchema(
            {
                definitions: { Foo: rawSubSchema },
                [fieldName]: [{}, { $ref: "#/definitions/Foo" }]
            },
            { [fieldName]: {} }
        );

        it("returns empty Map when includeNestedOptionals === false", () => {
            const result = collectReferencedSubSchemas(schema, false);
            expect(result.size).toBe(0);
        });
        it("returns Map with a single referenced sub-schema when includeNestedOptionals === true", () => {
            const result = collectReferencedSubSchemas(schema, true);
            expect(result.size).toBe(1);
            const [subSchema, resultIncludingNestedOptionals] = Array.from(result.entries())[0];
            expect(subSchema.schema).toEqual(rawSubSchema);
            expect(resultIncludingNestedOptionals).toBe(true);
        });
    });
    describe.each`
        referenceKeyword   | includeNestedOptionals
        ${"$ref"}          | ${true}
        ${"$recursiveRef"} | ${true}
        ${"$ref"}          | ${false}
        ${"$recursiveRef"} | ${false}
    `(
        "returns Map with a single referenced ($referenceKeyword) sub-schema (when includeNestedOptionals === $includeNestedOptionals)",
        ({ referenceKeyword, includeNestedOptionals }) => {
            const rawSubSchema = {
                title: "Reference Target"
            };
            it.each`
                fieldName            | referencingSchemaPart
                ${"properties"}      | ${{ bar: { [referenceKeyword]: "#/$defs/Foo" } }}
                ${"items"}           | ${{ [referenceKeyword]: "#/$defs/Foo" }}
                ${"additionalItems"} | ${{ [referenceKeyword]: "#/$defs/Foo" }}
            `("returning true as mapped result value for reference in '$fieldName'", ({ fieldName, referencingSchemaPart }) => {
                const schema = new JsonSchema(
                    {
                        $defs: { Foo: rawSubSchema },
                        [fieldName]: referencingSchemaPart
                    },
                    {}
                );
                const result = collectReferencedSubSchemas(schema, includeNestedOptionals);
                expect(result.size).toBe(1);
                const [subSchema, resultIncludingNestedOptionals] = Array.from(result.entries())[0];
                expect(subSchema.schema).toEqual(rawSubSchema);
                expect(resultIncludingNestedOptionals).toBe(true);
            });
            it("returning includeNestedOptionals flag as mapped result value for reference in 'allOf'", () => {
                const schema = new JsonSchema(
                    {
                        $defs: { Foo: rawSubSchema },
                        allOf: [{}, { [referenceKeyword]: "#/$defs/Foo" }]
                    },
                    {}
                );
                const result = collectReferencedSubSchemas(schema, includeNestedOptionals);
                expect(result.size).toBe(1);
                const [subSchema, resultIncludingNestedOptionals] = Array.from(result.entries())[0];
                expect(subSchema.schema).toEqual(rawSubSchema);
                expect(resultIncludingNestedOptionals).toBe(includeNestedOptionals);
            });
            const fooInDefinitions = { [referenceKeyword]: "#/definitions/Foo" };
            it.each`
                testDescription                                          | allOf
                ${"directly in 'allOf' (first) and as 'items' (second)"} | ${[fooInDefinitions, { items: fooInDefinitions }]}
                ${"directly in 'allOf' (second) and as 'items' (first)"} | ${[{ items: fooInDefinitions }, fooInDefinitions]}
            `("returning true as mapped result value if same reference occurs $testDescription", ({ allOf }) => {
                const schema = new JsonSchema(
                    {
                        definitions: { Foo: rawSubSchema },
                        allOf
                    },
                    {}
                );
                const result = collectReferencedSubSchemas(schema, includeNestedOptionals);
                expect(result.size).toBe(1);
                const [subSchema, resultIncludingNestedOptionals] = Array.from(result.entries())[0];
                expect(subSchema.schema).toEqual(rawSubSchema);
                expect(resultIncludingNestedOptionals).toBe(true);
            });
        }
    );
    it("returns Map with multiple referenced sub-schemas", () => {
        const schema = new JsonSchema(
            {
                $defs: {
                    Sub1: { title: "Reference Target" },
                    Sub2: { description: "Second Target" }
                },
                allOf: [{ $ref: "#/$defs/Sub1" }, { $ref: "#/$defs/Sub2" }]
            },
            {}
        );
        expect(collectReferencedSubSchemas(schema).size).toBe(2);
    });
    it("ignores self-reference", () => {
        const schema = new JsonSchema(
            {
                items: { $ref: "#" }
            },
            {}
        );
        expect(collectReferencedSubSchemas(schema)).toEqual(new Map());
    });
});
describe("createFilterFunctionForSchema()", () => {
    describe("returning filter function for simple schema", () => {
        it("finding match in all column entries", () => {
            const filterFunction = createFilterFunctionForSchema(() => true);
            expect(filterFunction(new JsonSchema({ title: "foo" }, {}), true)).toBe(true);
        });
        it("finding match in some column entries", () => {
            const filterFunction = createFilterFunctionForSchema((rawSchema) => rawSchema.title === "bar");
            expect(filterFunction(new JsonSchema({ title: "foo" }, {}), true)).toBe(false);
            expect(filterFunction(new JsonSchema({ title: "bar" }, {}), true)).toBe(true);
            expect(filterFunction(new JsonSchema({ description: "bar" }, {}), true)).toBe(false);
        });
        it("returning empty array if no match can be found", () => {
            const filterFunction = createFilterFunctionForSchema(() => false);
            expect(filterFunction(new JsonSchema({ title: "foo" }, {}), true)).toBe(false);
            expect(filterFunction(new JsonSchema({ description: "bar" }, {}), true)).toBe(false);
        });
    });
    describe("returning filter function for complex schema", () => {
        const schema = new JsonSchema(
            {
                $id: "https://unique-schema-identifier",
                title: "Match",
                properties: {
                    "Item One": { $ref: "#/$defs/One" },
                    "Item Two": { $ref: "#/$defs/Two" },
                    "Item Three": { $ref: "#/$defs/Three" }
                },
                $defs: {
                    One: {
                        items: { $ref: "#" }
                    },
                    Two: {
                        title: "Nothing"
                    },
                    Three: {
                        $ref: "#/$defs/Two",
                        allOf: [true, { $ref: "https://unique-schema-identifier#" }]
                    }
                }
            },
            {}
        );
        const schemaOne = schema.scope.find("#/$defs/One");
        const schemaTwo = schema.scope.find("#/$defs/Two");
        const schemaThree = schema.scope.find("#/$defs/Three");

        it("finding match via circular reference to parent schema", () => {
            const filterFunction = createFilterFunctionForSchema((rawSchema) => rawSchema.title === "Match");
            expect(filterFunction(schemaOne, true)).toBe(true);
            expect(filterFunction(schemaTwo, true)).toBe(false);
            expect(filterFunction(schemaThree, true)).toBe(true);
        });
        it("avoiding endless loop even if no match can be found", () => {
            const filterFunction = createFilterFunctionForSchema(() => false);
            expect(filterFunction(schemaOne, true)).toBe(false);
            expect(filterFunction(schemaTwo, true)).toBe(false);
            expect(filterFunction(schemaThree, true)).toBe(false);
        });
    });
    describe("returning filter function for schema with optionals", () => {
        describe("finding match via circular reference to parent schema", () => {
            const rawSchema = {
                title: "Match",
                properties: {
                    "Array of Main Schema": { $ref: "#/$defs/One" },
                    "OneOf with Main Schema as Property in Option": { $ref: "#/$defs/Two" },
                    "AnyOf with Main Schema as Option": { $ref: "#/$defs/Three" },
                    "AnyOf with OneOf as Option, which has Main Schema as Property": { $ref: "#/$defs/Four" },
                    "Array of Objects with Main Schema as Option": { $ref: "#/$defs/Five" }
                },
                $defs: {
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
                        anyOf: [{ $ref: "#" }, { title: "Foobar" }]
                    },
                    Four: {
                        anyOf: [{ $ref: "#/$defs/Two" }, { title: "Qux" }]
                    },
                    Five: {
                        items: { $ref: "#/$defs/Two" }
                    }
                }
            };

            it.each`
                pathToMatch                                               | subSchema  | resultWhenExcludingOptionals | resultWhenIncludingOptionals
                ${"'items'"}                                              | ${"One"}   | ${true}                      | ${true}
                ${"'oneOf' > [1] > 'properties' > 'bar'"}                 | ${"Two"}   | ${false}                     | ${true}
                ${"'anyOf' > [0]"}                                        | ${"Three"} | ${false}                     | ${true}
                ${"'anyOf' > [0] > 'oneOf' > [1] > 'properties' > 'bar'"} | ${"Four"}  | ${false}                     | ${true}
                ${"'items' > 'oneOf' > [0]"}                              | ${"Five"}  | ${true}                      | ${true}
            `("with match under $testDescription", ({ subSchema, resultWhenExcludingOptionals, resultWhenIncludingOptionals }) => {
                const { scope } = new JsonSchema(rawSchema, {});
                const filterFunction = createFilterFunctionForSchema((rawSubSchema) => rawSubSchema.title === "Match");

                // with "includeNestedOptionalsForMainSchema" flag set to false, it does not matter whether anyOf/oneOf are generally included
                // when the match is in a property, an "includeNestedOptionalsForMainSchema" false does not hide it
                expect(filterFunction(scope.find(`#/$defs/${subSchema}`), false)).toBe(resultWhenExcludingOptionals);
                // with "includeNestedOptionalsForMainSchema" flag set to true, both anyOf and oneOf parts are being considered
                expect(filterFunction(scope.find(`#/$defs/${subSchema}`), true)).toBe(resultWhenIncludingOptionals);
            });
        });

        describe("support non-optional parts of schema containing options", () => {
            const rawSchema = {
                minProperties: 1,
                allOf: [{ title: "Foo" }, { description: "Bar" }],
                anyOf: [{ maxProperties: 3 }, { type: "object" as const }],
                oneOf: [{ maxProperties: 5 }, { maxProperties: 7 }]
            };

            it.each`
                testTitle                             | flatSearchFilter                                        | includeOptionals | result
                ${"on main schema (incl. optionals)"} | ${(s: RawJsonSchema): boolean => s.minProperties === 1} | ${true}          | ${true}
                ${"on main schema (excl. optionals)"} | ${(s: RawJsonSchema): boolean => s.minProperties === 1} | ${false}         | ${true}
                ${"in allOf part (incl. optionals)"}  | ${(s: RawJsonSchema): boolean => s.title === "Foo"}     | ${true}          | ${true}
                ${"in allOf part (excl. optionals)"}  | ${(s: RawJsonSchema): boolean => s.title === "Foo"}     | ${false}         | ${true}
                ${"in anyOf part (incl. optionals)"}  | ${(s: RawJsonSchema): boolean => s.type === "object"}   | ${true}          | ${true}
                ${"in anyOf part (excl. optionals)"}  | ${(s: RawJsonSchema): boolean => s.type === "object"}   | ${false}         | ${false}
                ${"in oneOf part (incl. optionals)"}  | ${(s: RawJsonSchema): boolean => s.maxProperties === 7} | ${true}          | ${true}
                ${"in oneOf part (excl. optionals)"}  | ${(s: RawJsonSchema): boolean => s.maxProperties === 7} | ${false}         | ${false}
            `("$testTitle", ({ flatSearchFilter, includeOptionals, result }) => {
                const schema = new JsonSchema(rawSchema, {});
                const filterFunction = createFilterFunctionForSchema(flatSearchFilter);
                expect(filterFunction(schema, includeOptionals)).toBe(result);
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
        it("for empty array searchFields parameter", () => {
            expect(filteringByFields([], "filter")).toBeUndefined();
        });
        it("for undefined searchFilter parameter", () => {
            expect(filteringByFields(["const"], undefined)).toBeUndefined();
        });
        it("for null searchFilter parameter", () => {
            expect(filteringByFields(["const"], null)).toBeUndefined();
        });
        it("for empty searchFilter parameter", () => {
            expect(filteringByFields(["const"], "")).toBeUndefined();
        });
    });
    describe("finding", () => {
        it("exact match in specified field", () => {
            const filterFunction = filteringByFields(["const"], "fieldValue");
            expect(filterFunction({ const: "fieldValue" })).toBe(true);
        });
        it("partial match in specified field", () => {
            const filterFunction = filteringByFields(["const"], "Value");
            expect(filterFunction({ const: "fieldValuePart" })).toBe(true);
        });
        it("case-insensitive match in specified field", () => {
            const filterFunction = filteringByFields(["const"], "vALUEpART");
            expect(filterFunction({ const: "fieldValuePart" })).toBe(true);
        });
        it("match in first specified field", () => {
            const filterFunction = filteringByFields(["title", "description"], "value");
            const schema = {
                title: "value",
                description: "something else"
            };
            expect(filterFunction(schema)).toBe(true);
        });
        it("match in second specified field", () => {
            const filterFunction = filteringByFields(["title", "description"], "value");
            const schema = {
                title: "something else",
                description: "value"
            };
            expect(filterFunction(schema)).toBe(true);
        });
        it("no match if field not present", () => {
            const filterFunction = filteringByFields(["const"], "value");
            const schema = { title: "value" };
            expect(filterFunction(schema)).toBe(false);
        });
        it("no match if field value different", () => {
            const filterFunction = filteringByFields(["const"], "value");
            const schema = { const: "something else" };
            expect(filterFunction(schema)).toBe(false);
        });
        it("no match if field value not of type string", () => {
            const filterFunction = filteringByFields(["const"], "5");
            const schema = { const: 5 };
            expect(filterFunction(schema)).toBe(false);
        });
    });
});
describe("filteringByPropertyName()", () => {
    describe("returning undefined", () => {
        it("for undefined searchFilter parameter", () => {
            expect(filteringByPropertyName(undefined)).toBeUndefined();
        });
        it("for null searchFilter parameter", () => {
            expect(filteringByPropertyName(null)).toBeUndefined();
        });
        it("for empty searchFilter parameter", () => {
            expect(filteringByPropertyName("")).toBeUndefined();
        });
    });
    describe("finding", () => {
        it("exact match", () => {
            const filterFunction = filteringByPropertyName("propertyName");
            expect(filterFunction("propertyName")).toBe(true);
        });
        it("partial match", () => {
            const filterFunction = filteringByPropertyName("Name");
            expect(filterFunction("propertyName")).toBe(true);
        });
        it("case-insensitive match", () => {
            const filterFunction = filteringByPropertyName("PeRTynA");
            expect(filterFunction("propertyName")).toBe(true);
        });
        it("no match if property name different", () => {
            const filterFunction = filteringByPropertyName("Title");
            expect(filterFunction("propertyName")).toBe(false);
        });
    });
});
