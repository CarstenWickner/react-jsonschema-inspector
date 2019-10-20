import {
    createGroupFromSchema, getIndexPermutationsForOptions, getOptionsInSchemaGroup,
    getFieldValueFromSchemaGroup, getPropertiesFromSchemaGroup, getTypeOfArrayItemsFromSchemaGroup
} from "../../src/model/schemaUtils";

import { JsonSchema } from "../../src/model/JsonSchema";
import { JsonSchemaGroup } from "../../src/model/JsonSchemaGroup";
import { JsonSchemaAllOfGroup } from "../../src/model/JsonSchemaAllOfGroup";
import { JsonSchemaAnyOfGroup } from "../../src/model/JsonSchemaAnyOfGroup";
import { JsonSchemaOneOfGroup } from "../../src/model/JsonSchemaOneOfGroup";
import { isDefined } from "../../src/model/utils";

describe("createGroupFromSchema()", () => {
    const rawFooSchema = { title: "Foo" };
    const rawBarSchema = { description: "Bar" };
    it("returns empty allOf group for empty schema", () => {
        expect(createGroupFromSchema(new JsonSchema({}, {})))
            .toEqual(new JsonSchemaAllOfGroup());
    });
    it("returns empty allOf group for boolean schema", () => {
        expect(createGroupFromSchema(new JsonSchema(true, {})))
            .toEqual(new JsonSchemaAllOfGroup());
    });
    it("returns allOf group with single entry for simple schema", () => {
        const schema = new JsonSchema(rawFooSchema, {});
        const result = createGroupFromSchema(schema);
        expect(result).toBeInstanceOf(JsonSchemaAllOfGroup);
        expect(result.entries).toHaveLength(1);
        expect(result.entries[0]).toBe(schema);
    });
    it("returns allOf group with referenced entry for simple schema", () => {
        const { scope } = new JsonSchema({
            definitions: { Foo: rawFooSchema }
        }, {});
        const schema = new JsonSchema({ $ref: "#/definitions/Foo" }, {}, scope);
        const result = createGroupFromSchema(schema);
        expect(result.entries).toHaveLength(1);
        expect(result.entries[0]).toBeInstanceOf(JsonSchema);
        expect((result.entries[0] as JsonSchema).schema).toEqual(rawFooSchema);
    });
    describe.each`
        groupName  | GroupClass
        ${"anyOf"} ] ${JsonSchemaAnyOfGroup}
        ${"oneOf"} ] ${JsonSchemaOneOfGroup}
    `("returns allOf group for schema containing $groupName", ({
        groupName, GroupClass
    }) => {
        it(`with single nested ${groupName} group`, () => {
            const schema = new JsonSchema({
                [groupName]: [rawFooSchema, rawBarSchema]
            }, {});
            const result = createGroupFromSchema(schema);
            expect(result.entries).toHaveLength(2);
            expect(result.entries[0]).toBe(schema);
            expect(result.entries[1]).toBeInstanceOf(GroupClass);
            const resultEntryTwo = result.entries[1] as JsonSchemaGroup;
            expect(resultEntryTwo.entries).toHaveLength(2);
            expect(resultEntryTwo.entries[0]).toBeInstanceOf(JsonSchema);
            expect((resultEntryTwo.entries[0] as JsonSchema).schema).toEqual(rawFooSchema);
            expect(resultEntryTwo.entries[1]).toBeInstanceOf(JsonSchema);
            expect((resultEntryTwo.entries[1] as JsonSchema).schema).toEqual(rawBarSchema);
        });
        it(`with multiple nested ${groupName} groups`, () => {
            const rawFoobarSchema = { type: "object" };
            const nestedOptionalSchema = {
                [groupName]: [rawBarSchema, rawFoobarSchema]
            };
            const schema = new JsonSchema({
                [groupName]: [rawFooSchema, nestedOptionalSchema]
            }, {});
            const result = createGroupFromSchema(schema);
            // top level: allOf: [ schema, anyOf/oneOf ]
            expect(result.entries).toHaveLength(2);
            expect(result.entries[0]).toBe(schema);
            // second level: anyOf/oneOf: [ foo, allOf ]
            expect(result.entries[1]).toBeInstanceOf(GroupClass);
            const resultEntryTwoGroup = result.entries[1] as JsonSchemaGroup;
            expect(resultEntryTwoGroup.entries).toHaveLength(2);
            expect(resultEntryTwoGroup.entries[0]).toBeInstanceOf(JsonSchema);
            expect((resultEntryTwoGroup.entries[0] as JsonSchema).schema).toEqual(rawFooSchema);
            // third level: allOf: [ secondLevel, anyOf/oneOf ]
            expect(resultEntryTwoGroup.entries[1]).toBeInstanceOf(JsonSchemaAllOfGroup);
            const resultEntryTwoNestedGroup = resultEntryTwoGroup.entries[1] as JsonSchemaGroup;
            expect(resultEntryTwoNestedGroup.entries).toHaveLength(2);
            expect(resultEntryTwoNestedGroup.entries[0]).toBeInstanceOf(JsonSchema);
            expect((resultEntryTwoNestedGroup.entries[0] as JsonSchema).schema).toEqual(nestedOptionalSchema);
            // fourth level: anyOf/oneOf: [ bar, foobar ]
            expect(resultEntryTwoNestedGroup.entries[1]).toBeInstanceOf(GroupClass);
            const resultEntryNestedNestedGroup = resultEntryTwoNestedGroup.entries[1] as JsonSchemaGroup;
            expect(resultEntryNestedNestedGroup.entries).toHaveLength(2);
            expect(resultEntryNestedNestedGroup.entries[0]).toBeInstanceOf(JsonSchema);
            expect((resultEntryNestedNestedGroup.entries[0] as JsonSchema).schema).toEqual(rawBarSchema);
            expect(resultEntryNestedNestedGroup.entries[1]).toBeInstanceOf(JsonSchema);
            expect((resultEntryNestedNestedGroup.entries[1] as JsonSchema).schema).toEqual(rawFoobarSchema);
        });
    });
    describe("returns allOf group for schema containing mixed groups", () => {
        const rawFoobarSchema = { type: "object" };
        const rawBazSchema = { minProperties: 1 };
        const rawQuxSchema = { maxProperties: 5 };
        const rawQuuxSchema = { additionalProperties: false };
        const rawTargetSchema = {
            allOf: [rawFooSchema, rawBarSchema],
            anyOf: [rawFoobarSchema, rawBazSchema],
            oneOf: [rawQuxSchema, rawQuuxSchema]
        };

        it("including oneOf and anyOf if both are present", () => {
            const schema = new JsonSchema(rawTargetSchema, {});
            const result = createGroupFromSchema(schema);
            expect(result).toBeInstanceOf(JsonSchemaAllOfGroup);
            expect(result.entries).toHaveLength(5);
            expect(result.entries[0]).toBe(schema);
            expect((result.entries[1] as JsonSchema).schema).toEqual(rawFooSchema);
            expect((result.entries[2] as JsonSchema).schema).toEqual(rawBarSchema);
            expect(result.entries[3]).toBeInstanceOf(JsonSchemaAnyOfGroup);
            const resultEntryFourGroup = result.entries[3] as JsonSchemaAnyOfGroup;
            expect(resultEntryFourGroup.entries).toHaveLength(2);
            expect((resultEntryFourGroup.entries[0] as JsonSchema).schema).toEqual(rawFoobarSchema);
            expect((resultEntryFourGroup.entries[1] as JsonSchema).schema).toEqual(rawBazSchema);
            expect(result.entries[4]).toBeInstanceOf(JsonSchemaOneOfGroup);
            const resultEntryFiveGroup = result.entries[4] as JsonSchemaOneOfGroup;
            expect(resultEntryFiveGroup.entries).toHaveLength(2);
            expect((resultEntryFiveGroup.entries[0] as JsonSchema).schema).toEqual(rawQuxSchema);
            expect((resultEntryFiveGroup.entries[1] as JsonSchema).schema).toEqual(rawQuuxSchema);
        });
    });
    it("throws error for invalid $ref if scope provided", () => {
        const { scope } = new JsonSchema({
            definitions: {
                foo: { title: "foo" },
                bar: { title: "bar" }
            }
        }, {});
        const schema = { $ref: "#/definitions/baz" };
        expect(() => createGroupFromSchema(new JsonSchema(schema, {}, scope)))
            .toThrowError("Cannot resolve $ref: \"#/definitions/baz\"");
    });
});
describe("getIndexPermutationsForOptions()", () => {
    it("collects permutations from options object", () => {
        const input = {
            options: [
                {},
                {
                    options: [
                        {
                            options: [
                                {},
                                {}
                            ]
                        },
                        {}
                    ]
                },
                {}
            ]
        };
        expect(getIndexPermutationsForOptions(input)).toEqual([
            [0],
            [1, 0, 0],
            [1, 0, 1],
            [1, 1],
            [2]
        ]);
    });
});
describe("getPropertiesFromSchemaGroup()", () => {
    it("returns properties from simple schema", () => {
        const rawFooSchema = { type: "string" };
        const rawBarSchema = { type: "number" };
        const schema = new JsonSchema({
            properties: {
                foo: rawFooSchema,
                bar: rawBarSchema
            }
        }, {});
        const result = getPropertiesFromSchemaGroup(createGroupFromSchema(schema));
        expect(Object.keys(result)).toHaveLength(2);
        expect(result.foo.schema).toEqual(rawFooSchema);
        expect(result.bar.schema).toEqual(rawBarSchema);
    });
    it("returns empty object for empty schema", () => {
        const schemaGroup = createGroupFromSchema(new JsonSchema({}, {}));
        expect(getPropertiesFromSchemaGroup(schemaGroup)).toEqual({});
    });
    it("returns `required` from simple schema", () => {
        const simpleSchema = new JsonSchema({
            required: ["Foo", "Bar"]
        }, {});
        const schemaGroup = createGroupFromSchema(simpleSchema);
        const result = getPropertiesFromSchemaGroup(schemaGroup);
        expect(result.Foo.schema).toStrictEqual({});
        expect(result.Bar.schema).toStrictEqual({});
    });
    it("returns combined `required` and `properties` from simple schema", () => {
        const rawFooSchema = { title: "foo" };
        const rawBarSchema = { description: "bar" };
        const simpleSchema = new JsonSchema({
            required: ["Foo", "Foobar"],
            properties: {
                Foo: rawFooSchema,
                Bar: rawBarSchema
            }
        }, {});
        const schemaGroup = createGroupFromSchema(simpleSchema);
        const result = getPropertiesFromSchemaGroup(schemaGroup);
        expect(result.Foo.schema).toEqual(rawFooSchema);
        expect(result.Bar.schema).toEqual(rawBarSchema);
        expect(result.Foobar.schema).toStrictEqual({});
    });
    it("returns combined `properties` from nested schemas", () => {
        const rawFooSchema = { title: "Title" };
        const rawBarSchema = { description: "Description" };
        const mainSchema = new JsonSchema({
            allOf: [
                {
                    properties: {
                        Foo: rawFooSchema,
                        Bar: true,
                        Baz: true
                    }
                },
                {
                    properties: {
                        Foo: true,
                        Bar: rawBarSchema,
                        Foobar: false
                    }
                }
            ]
        }, {});
        const schemaGroup = createGroupFromSchema(mainSchema);
        const result = getPropertiesFromSchemaGroup(schemaGroup);
        expect(result.Foo.schema).toEqual(rawFooSchema);
        expect(result.Bar.schema).toEqual(rawBarSchema);
        expect(result.Baz.schema).toEqual({});
        expect(result.Foobar.schema).toEqual({ not: {} });
    });
    describe.each`
        groupName
        ${"anyOf"}
        ${"oneOf"}
    `("$groupName with 'asAdditionalColumn' setting:", ({ groupName }) => {
        const rawFooSchema = { description: "Description Text" };
        const rawBarSchema = { title: "Title Value" };
        const schema = new JsonSchema({
            [groupName]: [
                {
                    properties: { foo: rawFooSchema }
                },
                {
                    properties: { bar: rawBarSchema }
                }
            ]
        }, {});
        it("ignored if no optionIndex provided", () => {
            const result = getPropertiesFromSchemaGroup(createGroupFromSchema(schema));
            expect(result).toEqual({});
        });
        it("returns first of two options", () => {
            const result = getPropertiesFromSchemaGroup(createGroupFromSchema(schema), [0]);
            expect(Object.keys(result)).toHaveLength(1);
            expect(result.foo).toBeInstanceOf(JsonSchema);
            expect(result.foo.schema).toEqual(rawFooSchema);
        });
        it("returns second of two options", () => {
            const result = getPropertiesFromSchemaGroup(createGroupFromSchema(schema), [1]);
            expect(Object.keys(result)).toHaveLength(1);
            expect(result.bar).toBeInstanceOf(JsonSchema);
            expect(result.bar.schema).toEqual(rawBarSchema);
        });
    });
});
describe("getOptionsInSchemaGroup()", () => {
    class MockJsonSchemaGroup extends JsonSchemaGroup {
        private considerAsSeparateOptions: boolean;
        constructor(considerAsSeparateOptions = false) {
            super();
            this.considerAsSeparateOptions = considerAsSeparateOptions;
        }
        considerSchemasAsSeparateOptions() { return this.considerAsSeparateOptions; }
    }

    describe("when considerSchemasAsSeparateOptions() === false", () => {
        it("ignores JsonSchema entries", () => {
            const group = new MockJsonSchemaGroup(false)
                .with(new JsonSchema(true, {}))
                .with(new JsonSchema(true, {}));
            expect(getOptionsInSchemaGroup(group)).toEqual({});
        });
        it("flattening single JsonSchemaGroup entry that contains options", () => {
            const group = new MockJsonSchemaGroup(false)
                .with(new JsonSchema(true, {}))
                .with(new MockJsonSchemaGroup(true)
                    .with(new JsonSchema(true, {}))
                    .with(new JsonSchema(true, {})));
            expect(getOptionsInSchemaGroup(group)).toEqual({
                options: [
                    {},
                    {}
                ]
            });
        });
        it("ignores JsonSchema entries while including parallel JsonSchemaGroup entries that contain options", () => {
            const group = new MockJsonSchemaGroup(false)
                .with(new JsonSchema(true, {}))
                .with(new MockJsonSchemaGroup(true)
                    .with(new JsonSchema(true, {}))
                    .with(new JsonSchema(true, {})))
                .with(new MockJsonSchemaGroup(true)
                    .with(new JsonSchema(true, {}))
                    .with(new JsonSchema(true, {})));
            expect(getOptionsInSchemaGroup(group)).toEqual({
                options: [
                    {
                        options: [
                            {},
                            {}
                        ]
                    },
                    {
                        options: [
                            {},
                            {}
                        ]
                    }
                ]
            });
        });
        it("ignores nested groups only containing JsonSchema entries when nested groups have considerSchemasAsSeparateOptions() === false", () => {
            const group = new MockJsonSchemaGroup(false)
                .with(new MockJsonSchemaGroup(false)
                    .with(new JsonSchema(true, {}))
                    .with(new JsonSchema(true, {})))
                .with(new MockJsonSchemaGroup(false)
                    .with(new MockJsonSchemaGroup(false)
                        .with(new JsonSchema(true, {}))
                        .with(new JsonSchema(true, {})))
                    .with(new JsonSchema(true, {})));
            expect(getOptionsInSchemaGroup(group)).toEqual({});
        });
    });
    describe("when considerSchemasAsSeparateOptions() === true", () => {
        it("represents JsonSchema entries as empty arrays", () => {
            const group = new MockJsonSchemaGroup(true)
                .with(new JsonSchema(true, {}))
                .with(new JsonSchema(true, {}));
            expect(getOptionsInSchemaGroup(group)).toEqual({
                options: [
                    {},
                    {}
                ]
            });
        });
        it("represents hierarchy of nested groups that have considerSchemasAsSeparateOptions() === true", () => {
            const group = new MockJsonSchemaGroup(true)
                .with(new MockJsonSchemaGroup(true)
                    .with(new JsonSchema(true, {}))
                    .with(new JsonSchema(true, {})))
                .with(new MockJsonSchemaGroup(true)
                    .with(new MockJsonSchemaGroup(true)
                        .with(new JsonSchema(true, {}))
                        .with(new JsonSchema(true, {})))
                    .with(new JsonSchema(true, {})));
            expect(getOptionsInSchemaGroup(group)).toEqual({
                options: [
                    {
                        options: [
                            {},
                            {}
                        ]
                    },
                    {
                        options: [
                            {
                                options: [
                                    {},
                                    {}
                                ]
                            },
                            {}
                        ]
                    }
                ]
            });
        });
    });
    it("represents hierarchy of nested groups with mixed considerSchemasAsSeparateOptions() – 1", () => {
        const group = new MockJsonSchemaGroup(true)
            .with(new MockJsonSchemaGroup(false)
                .with(new JsonSchema(true, {}))
                .with(new JsonSchema(true, {})))
            .with(new MockJsonSchemaGroup(false)
                .with(new MockJsonSchemaGroup(true)
                    .with(new JsonSchema(true, {}))
                    .with(new JsonSchema(true, {})))
                .with(new JsonSchema(true, {})));
        expect(getOptionsInSchemaGroup(group)).toEqual({
            options: [
                {},
                {
                    options: [
                        {},
                        {}
                    ]
                }
            ]
        });
    });
    it("represents hierarchy of nested groups with mixed considerSchemasAsSeparateOptions() – 2", () => {
        const group = new MockJsonSchemaGroup(false)
            .with(new MockJsonSchemaGroup(true)
                .with(new JsonSchema(true, {}))
                .with(new JsonSchema(true, {})))
            .with(new MockJsonSchemaGroup(true)
                .with(new MockJsonSchemaGroup(false)
                    .with(new JsonSchema(true, {}))
                    .with(new JsonSchema(true, {})))
                .with(new JsonSchema(true, {})));
        expect(getOptionsInSchemaGroup(group)).toEqual({
            options: [
                {
                    options: [
                        {},
                        {}
                    ]
                },
                {
                    options: [
                        {},
                        {}
                    ]
                }
            ]
        });
    });
});
describe("getFieldValueFromSchemaGroup()", () => {
    it("finds single value in simple schema", () => {
        const schemaGroup = createGroupFromSchema(new JsonSchema({ title: "Test" }, {}));
        expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toEqual("Test");
    });
    it.each`
        rawSchema            | description
        ${undefined}         | ${"undefined schema"}
        ${null}              | ${"null schema"}
        ${"not-a-schema"}    | ${"invalid schema"}
        ${{}}                | ${"empty schema"}
        ${{ title: "Test" }} | ${"schema without targeted field"}
    `("returns undefined for $rawSchema schema", ({ rawSchema }) => {
        const schemaGroup = createGroupFromSchema(new JsonSchema(rawSchema, {}));
        expect(getFieldValueFromSchemaGroup(schemaGroup, "description")).toBeUndefined();
    });
    it("find single value in $ref-erenced sub-schema", () => {
        const { scope } = new JsonSchema({
            definitions: {
                foo: { title: "foobar" }
            }
        }, {});
        const schema = { $ref: "#/definitions/foo" };
        const schemaGroup = createGroupFromSchema(new JsonSchema(schema, {}, scope));
        expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toBe("foobar");
    });
    it("ignores other fields if $ref found", () => {
        const { scope } = new JsonSchema({
            definitions: {
                bar: { title: "baz" }
            }
        }, {});
        const schema = {
            title: "foo",
            $ref: "#/definitions/bar"
        };
        const schemaGroup = createGroupFromSchema(new JsonSchema(schema, {}, scope));
        expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toBe("baz");
    });
    describe("allOf:", () => {
        it("finds single value", () => {
            const schema = {
                allOf: [
                    { description: "foo" },
                    { title: "bar" },
                    { type: "object" }
                ]
            };
            const schemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
            expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toBe("bar");
        });
        it("finds single value in $ref-erenced group", () => {
            const { scope } = new JsonSchema({
                definitions: {
                    foo: {
                        allOf: [
                            { description: "foobar" },
                            {
                                allOf: [
                                    { title: "baz" },
                                    { type: "object" }
                                ]
                            }
                        ]
                    }
                }
            }, {});
            const schema = { $ref: "#/definitions/foo" };
            const schemaGroup = createGroupFromSchema(new JsonSchema(schema, {}, scope));
            expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toBe("baz");
        });
        describe("merging multiple values from allOf", () => {
            const { scope } = new JsonSchema({
                definitions: {
                    foo: {
                        allOf: [
                            { $ref: "#/definitions/bar" },
                            { title: "foobar" }
                        ]
                    },
                    bar: { title: "baz" }
                }
            }, {});
            const schema = { $ref: "#/definitions/foo" };
            const schemaGroup = createGroupFromSchema(new JsonSchema(schema, {}, scope));

            it("list values by default", () => {
                expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toEqual(["baz", "foobar"]);
            });
            it("applies custom mergeFunction", () => {
                // custom merge function always overrides result with last encountered value
                const mergeFunction = (first, second) => (isDefined(second) ? second : first);
                expect(getFieldValueFromSchemaGroup(schemaGroup, "title", mergeFunction)).toBe("foobar");
            });
        });
    });
    it.each`
        fieldName
        ${"items"}
        ${"additionalItems"}
    `("ignores $fieldName", ({ fieldName }) => {
        const schema = {
            [fieldName]: { title: "Array-Entry-Title" }
        };
        const schemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
        expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toBeUndefined();
    });
});
describe("getTypeOfArrayItemsFromSchemaGroup()", () => {
    it("finds `items` in simple schema", () => {
        const itemSchema = { title: "Test" };
        const schema = { items: itemSchema };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema, {})));
        expect(result).toBeInstanceOf(JsonSchema);
        expect(result.schema).toEqual(itemSchema);
    });
    it("finds `additionalItems` in simple schema", () => {
        const additionalItemSchema = { description: "Value" };
        const schema = { additionalItems: additionalItemSchema };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema, {})));
        expect(result).toBeInstanceOf(JsonSchema);
        expect(result.schema).toEqual(additionalItemSchema);
    });
    it("ignores boolean `additionalItems`", () => {
        const additionalItemSchema = true;
        const schema = { additionalItems: additionalItemSchema };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema, {})));
        expect(result).toBeUndefined();
    });
    it("prefers `items` over `additionalItems` in simple schema", () => {
        const itemSchema = { title: "Test" };
        const additionalItemSchema = { description: "Value" };
        const schema = {
            items: itemSchema,
            additionalItems: additionalItemSchema
        };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema, {})));
        expect(result).toBeInstanceOf(JsonSchema);
        expect(result.schema).toEqual(itemSchema);
    });
    it("ignores boolean `items`", () => {
        const itemSchema = true;
        const additionalItemSchema = { description: "Value" };
        const schema = {
            items: itemSchema,
            additionalItems: additionalItemSchema
        };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema, {})));
        expect(result).toBeInstanceOf(JsonSchema);
        expect(result.schema).toEqual(additionalItemSchema);
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
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema, {})));
        expect(result).toBeInstanceOf(JsonSchema);
        expect(result.schema).toEqual(additionalItemSchema);
    });
    it("returns null if neither `items` nor `additionalItems` are present", () => {
        const schema = {
            type: "array"
        };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema, {})));
        expect(result).toBeUndefined();
    });
    it("picks first of multiple `items` in complex schema", () => {
        const schema = {
            allOf: [
                { items: { title: "foo" } },
                { items: { description: "bar" } },
                {
                    allOf: [
                        {},
                        { items: { type: "object" } }
                    ]
                }
            ]
        };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema, {})));
        expect(result).toBeInstanceOf(JsonSchema);
        expect(result.schema).toEqual({ title: "foo" });
    });
    describe.each`
        groupName
        ${"anyOf"}
        ${"oneOf"}
    `("picks up nested `items`/`additionalItems` in $groupName ('asAdditionalColumn')", ({ groupName }) => {
        const schema = {
            [groupName]: [
                { items: { title: "foo" } },
                { items: { description: "bar" } },
                {
                    [groupName]: [
                        { title: "no item type defined" },
                        { additionalItems: { type: "object" } }
                    ]
                }
            ]
        };

        it.each`
            testTitle                       | optionIndexes | expectedResult
            ${"one-level optionTarget (1)"} | ${[0]}        | ${{ title: "foo" }}
            ${"one-level optionTarget (2)"} | ${[1]}        | ${{ description: "bar" }}
            ${"two-level optionTarget"}     | ${[2, 1]}     | ${{ type: "object" }}
        `("$testTitle", ({ optionIndexes, expectedResult }) => {
            const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema, {})), optionIndexes);
            expect(result).toBeInstanceOf(JsonSchema);
            expect(result.schema).toEqual(expectedResult);
        });
        it.each`
            testTitle                                                    | optionIndexes
            ${"empty optionTarget"}                                      | ${[]}
            ${"negative optionTarget"}                                   | ${[-1]}
            ${"too high optionTarget"}                                   | ${[3]}
            ${"existing optionTarget without `items`/`additionalItems`"} | ${[2, 0]}
        `("returning undefined for $testTitle", ({ optionIndexes }) => {
            const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema, {})), optionIndexes);
            expect(result).toBeUndefined();
        });
    });
});
