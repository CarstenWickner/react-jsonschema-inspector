import {
    createRecursiveFilterFunction, collectReferencedSubSchemas, createFilterFunctionForSchema, filteringByFields
} from "../../src/model/searchUtils";

import JsonSchema from "../../src/model/JsonSchema";

describe("createRecursiveFilterFunction()", () => {
    const flatSearchFilter = jest.fn(rawSchema => rawSchema.default);
    let recursiveFilterFunction;
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
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema, true);
        });
        it("check once with $ref", () => {
            const rawSchema = { $ref: "something" };
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(false);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(false);
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
            expect(recursiveFilterFunction(new JsonSchema(rawSchema))).toBe(true);
            expect(flatSearchFilter).toHaveBeenCalledTimes(2);
            expect(flatSearchFilter).toHaveBeenCalledWith(rawSchema, true);
            expect(flatSearchFilter).toHaveBeenCalledWith(additionalItemSchema, true);
        });
    });
});
describe("collectReferencedSubSchemas", () => {
    it("returns empty Map for simple schema", () => {
        const schema = new JsonSchema({ title: "No Reference" });
        expect(collectReferencedSubSchemas(schema)).toEqual(new Map());
    });
    it("returns Map with a single referenced sub-schema", () => {
        const rawSubSchema = {
            title: "Reference Target"
        };
        const schema = new JsonSchema({
            definitions: { Sub: rawSubSchema },
            items: { $ref: "#/definitions/Sub" }
        });
        const result = collectReferencedSubSchemas(schema);
        expect(result.size).toBe(1);
        const [subSchema, includingNestedOptionals] = Array.from(result.entries())[0];
        expect(subSchema.schema).toEqual(rawSubSchema);
        expect(includingNestedOptionals).toBe(true);
    });
    it("returns Map with multiple referenced sub-schemas", () => {
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
        expect(collectReferencedSubSchemas(schema)).toEqual(new Map());
    });
});
describe("createFilterFunctionForSchema()", () => {
    describe("returning filter function for simple schema", () => {
        it("finding match in all column entries", () => {
            const filterFunction = createFilterFunctionForSchema(() => true);
            expect(filterFunction(new JsonSchema({ title: "foo" }), true)).toBe(true);
        });
        it("finding match in some column entries", () => {
            const filterFunction = createFilterFunctionForSchema(rawSchema => rawSchema.title === "bar");
            expect(filterFunction(new JsonSchema({ title: "foo" }), true)).toBe(false);
            expect(filterFunction(new JsonSchema({ title: "bar" }), true)).toBe(true);
            expect(filterFunction(new JsonSchema({ description: "bar" }), true)).toBe(false);
        });
        it("returning empty array if no match can be found", () => {
            const filterFunction = createFilterFunctionForSchema(() => false);
            expect(filterFunction(new JsonSchema({ title: "foo" }), true)).toBe(false);
            expect(filterFunction(new JsonSchema({ description: "bar" }), true)).toBe(false);
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
        const schemaOne = schema.scope.find("#/definitions/One");
        const schemaTwo = schema.scope.find("#/definitions/Two");
        const schemaThree = schema.scope.find("#/definitions/Three");

        it("finding match via circular reference to parent schema", () => {
            const filterFunction = createFilterFunctionForSchema(rawSchema => rawSchema.title === "Match");
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
        const likeAllOf = { type: "likeAllOf" };
        const asColumn = { type: "asAdditionalColumn" };

        describe("finding match via circular reference to parent schema", () => {
            const rawSchema = {
                title: "Match",
                properties: {
                    "Array of Main Schema": { $ref: "#/definitions/One" },
                    "OneOf with Main Schema as Property in Option": { $ref: "#/definitions/Two" },
                    "AnyOf with Main Schema as Option": { $ref: "#/definitions/Three" },
                    "AnyOf with OneOf as Option, which has Main Schema as Property": { $ref: "#/definitions/Four" }
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
                parserConfigDescription         | parserConfig                            | resultIncluding | resultExcluding
                ${"empty parserConfig"}         | ${{}}                                   | ${[1, 0, 0, 0]} | ${[1, 0, 0, 0]}
                ${"oneOf 'likeAllOf'"}          | ${{ oneOf: likeAllOf }}                 | ${[1, 1, 0, 0]} | ${[1, 1, 0, 0]}
                ${"oneOf 'asAdditionalColumn'"} | ${{ oneOf: asColumn }}                  | ${[1, 1, 0, 0]} | ${[1, 0, 0, 0]}
                ${"anyOf 'likeAllOf'"}          | ${{ anyOf: likeAllOf }}                 | ${[1, 0, 1, 0]} | ${[1, 0, 1, 0]}
                ${"anyOf 'asAdditionalColumn'"} | ${{ anyOf: asColumn }}                  | ${[1, 0, 1, 0]} | ${[1, 0, 0, 0]}
                ${"oneOf and anyOf"}            | ${{ oneOf: asColumn, anyOf: asColumn }} | ${[1, 1, 1, 1]} | ${[1, 0, 0, 0]}
            `("with $parserConfigDescription", ({ parserConfig, resultIncluding, resultExcluding }) => {
                const { scope } = new JsonSchema(rawSchema, parserConfig);
                const filterFunction = createFilterFunctionForSchema(rawSubSchema => rawSubSchema.title === "Match", parserConfig);

                expect(filterFunction(scope.find("#/definitions/One"), true)).toBe(!!resultIncluding[0]);
                expect(filterFunction(scope.find("#/definitions/Two"), true)).toBe(!!resultIncluding[1]);
                expect(filterFunction(scope.find("#/definitions/Three"), true)).toBe(!!resultIncluding[2]);
                expect(filterFunction(scope.find("#/definitions/Four"), true)).toBe(!!resultIncluding[3]);

                expect(filterFunction(scope.find("#/definitions/One"), false)).toBe(!!resultExcluding[0]);
                expect(filterFunction(scope.find("#/definitions/Two"), false)).toBe(!!resultExcluding[1]);
                expect(filterFunction(scope.find("#/definitions/Three"), false)).toBe(!!resultExcluding[2]);
                expect(filterFunction(scope.find("#/definitions/Four"), false)).toBe(!!resultExcluding[3]);
            });
        });

        describe("support non-optional parts of schema containing options", () => {
            const rawSchema = {
                minProperties: 1,
                allOf: [
                    { title: "Foo" },
                    { description: "Bar" }
                ],
                anyOf: [
                    { maxProperties: 3 },
                    { type: "object" }
                ],
                oneOf: [
                    { maxProperties: 5 },
                    { maxProperties: 7 }
                ]
            };
            const parserConfig = {
                anyOf: asColumn,
                oneOf: asColumn
            };

            it.each`
                testTitle                                      | flatSearchFilter                  | includeOptionals | result
                ${"directly on main schema (incl. optionals)"} | ${sub => sub.minProperties === 1} | ${true}          | ${true}
                ${"directly on main schema (excl. optionals)"} | ${sub => sub.minProperties === 1} | ${false}         | ${true}
                ${"in allOf part (incl. optionals)"}           | ${sub => sub.title === "Foo"}     | ${true}          | ${true}
                ${"in allOf part (excl. optionals)"}           | ${sub => sub.title === "Foo"}     | ${false}         | ${true}
                ${"in anyOf part (incl. optionals)"}           | ${sub => sub.type === "object"}   | ${true}          | ${true}
                ${"in anyOf part (excl. optionals)"}           | ${sub => sub.type === "object"}   | ${false}         | ${false}
                ${"in oneOf part (incl. optionals)"}           | ${sub => sub.maxProperties === 7} | ${true}          | ${true}
                ${"in oneOf part (excl. optionals)"}           | ${sub => sub.maxProperties === 7} | ${false}         | ${false}
            `("$testTitle", ({ flatSearchFilter, includeOptionals, result }) => {
                const schema = new JsonSchema(rawSchema, parserConfig);
                const filterFunction = createFilterFunctionForSchema(flatSearchFilter, parserConfig);
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
