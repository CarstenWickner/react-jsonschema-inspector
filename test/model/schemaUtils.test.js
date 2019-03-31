import {
    createGroupFromSchema, getFieldValueFromSchemaGroup, getOptionsInSchemaGroup, getPropertiesFromSchemaGroup, getTypeOfArrayItemsFromSchemaGroup
} from "../../src/model/schemaUtils";

import JsonSchema from "../../src/model/JsonSchema";
import JsonSchemaGroup from "../../src/model/JsonSchemaGroup";
import JsonSchemaAllOfGroup from "../../src/model/JsonSchemaAllOfGroup";
import JsonSchemaAnyOfGroup from "../../src/model/JsonSchemaAnyOfGroup";
import JsonSchemaOneOfGroup from "../../src/model/JsonSchemaOneOfGroup";
import { isDefined } from "../../src/model/utils";

describe("createGroupFromSchema()", () => {
    const rawFooSchema = { title: "Foo" };
    const rawBarSchema = { description: "Bar" };
    it("returns empty allOf group for empty schema", () => {
        expect(createGroupFromSchema(new JsonSchema({})))
            .toEqual(new JsonSchemaAllOfGroup());
    });
    it("returns empty allOf group for boolean schema", () => {
        expect(createGroupFromSchema(new JsonSchema(true)))
            .toEqual(new JsonSchemaAllOfGroup());
    });
    it("returns allOf group with single entry for simple schema", () => {
        const schema = new JsonSchema(rawFooSchema);
        const result = createGroupFromSchema(schema);
        expect(result).toBeInstanceOf(JsonSchemaAllOfGroup);
        expect(result.entries).toHaveLength(1);
        expect(result.entries[0]).toBe(schema);
    });
    it("returns allOf group with referenced entry for simple schema", () => {
        const { scope } = new JsonSchema({
            definitions: { Foo: rawFooSchema }
        });
        const schema = new JsonSchema({ $ref: "#/definitions/Foo" }, {}, scope);
        const result = createGroupFromSchema(schema);
        expect(result).toBeInstanceOf(JsonSchemaAllOfGroup);
        expect(result.entries).toHaveLength(1);
        expect(result.entries[0]).toBeInstanceOf(JsonSchema);
        expect(result.entries[0].schema).toEqual(rawFooSchema);
    });
    describe.each`
        groupName  | parserConfigDescription                                  | parserConfig
        ${"allOf"} | ${"(with empty parserConfig)"}                           | ${{}}
        ${"anyOf"} | ${"(when parserConfig.anyOf = { type: 'likeAllOf' })"} | ${{ anyOf: { type: "likeAllOf" } }}
        ${"oneOf"} | ${"(when parserConfig.oneOf = { type: 'likeAllOf' })"} | ${{ oneOf: { type: "likeAllOf" } }}
    `("returns allOf group for schema containing $groupName, flattening entries $parserConfigDescription", ({
        groupName, parserConfig
    }) => {
        it("for one nested level", () => {
            const schema = new JsonSchema({
                [groupName]: [rawFooSchema, rawBarSchema]
            }, parserConfig);
            const result = createGroupFromSchema(schema);
            expect(result).toBeInstanceOf(JsonSchemaAllOfGroup);
            expect(result.entries).toHaveLength(3);
            expect(result.entries[0]).toBe(schema);
            expect(result.entries[1]).toBeInstanceOf(JsonSchema);
            expect(result.entries[1].schema).toEqual(rawFooSchema);
            expect(result.entries[2]).toBeInstanceOf(JsonSchema);
            expect(result.entries[2].schema).toEqual(rawBarSchema);
        });
        it("for three nested levels", () => {
            const rawFoobarSchema = { type: "object" };
            const rawSecondLevelSchema = {
                [groupName]: [rawBarSchema, rawFoobarSchema]
            };
            const schema = new JsonSchema({
                [groupName]: [rawFooSchema, rawSecondLevelSchema]
            }, parserConfig);
            const result = createGroupFromSchema(schema);
            expect(result).toBeInstanceOf(JsonSchemaAllOfGroup);
            expect(result.entries).toHaveLength(5);
            expect(result.entries[0]).toBe(schema);
            expect(result.entries[1]).toBeInstanceOf(JsonSchema);
            expect(result.entries[1].schema).toEqual(rawFooSchema);
            expect(result.entries[2]).toBeInstanceOf(JsonSchema);
            expect(result.entries[2].schema).toEqual(rawSecondLevelSchema);
            expect(result.entries[3]).toBeInstanceOf(JsonSchema);
            expect(result.entries[3].schema).toEqual(rawBarSchema);
            expect(result.entries[4]).toBeInstanceOf(JsonSchema);
            expect(result.entries[4].schema).toEqual(rawFoobarSchema);
        });
    });
    describe.each`
        groupName  | GroupClass
        ${"anyOf"} ] ${JsonSchemaAnyOfGroup}
        ${"oneOf"} ] ${JsonSchemaOneOfGroup}
    `("returns allOf group for schema containing $groupName", ({
        groupName, GroupClass
    }) => {
        const parserConfig = {
            [groupName]: { type: "asAdditionalColumn" }
        };
        it(`with single nested ${groupName} group (when parserConfig.${groupName}.type === 'asAdditionalColumn')`, () => {
            const schema = new JsonSchema({
                [groupName]: [rawFooSchema, rawBarSchema]
            }, parserConfig);
            const result = createGroupFromSchema(schema);
            expect(result).toBeInstanceOf(JsonSchemaAllOfGroup);
            expect(result.entries).toHaveLength(2);
            expect(result.entries[0]).toBe(schema);
            expect(result.entries[1]).toBeInstanceOf(GroupClass);
            expect(result.entries[1].entries).toHaveLength(2);
            expect(result.entries[1].entries[0]).toBeInstanceOf(JsonSchema);
            expect(result.entries[1].entries[0].schema).toEqual(rawFooSchema);
            expect(result.entries[1].entries[1]).toBeInstanceOf(JsonSchema);
            expect(result.entries[1].entries[1].schema).toEqual(rawBarSchema);
        });
        it(`with multiple nested ${groupName} groups (when parserConfig.${groupName}.type === 'asAdditionalColumn')`, () => {
            const rawFoobarSchema = { type: "object" };
            const nestedOptionalSchema = {
                [groupName]: [rawBarSchema, rawFoobarSchema]
            };
            const schema = new JsonSchema({
                [groupName]: [rawFooSchema, nestedOptionalSchema]
            }, parserConfig);
            const result = createGroupFromSchema(schema);
            // top level: allOf: [ schema, anyOf/oneOf ]
            expect(result).toBeInstanceOf(JsonSchemaAllOfGroup);
            expect(result.entries).toHaveLength(2);
            expect(result.entries[0]).toBe(schema);
            // second level: anyOf/oneOf: [ foo, allOf ]
            expect(result.entries[1]).toBeInstanceOf(GroupClass);
            expect(result.entries[1].entries).toHaveLength(2);
            expect(result.entries[1].entries[0]).toBeInstanceOf(JsonSchema);
            expect(result.entries[1].entries[0].schema).toEqual(rawFooSchema);
            // third level: allOf: [ secondLevel, anyOf/oneOf ]
            expect(result.entries[1].entries[1]).toBeInstanceOf(JsonSchemaAllOfGroup);
            expect(result.entries[1].entries[1].entries).toHaveLength(2);
            expect(result.entries[1].entries[1].entries[0]).toBeInstanceOf(JsonSchema);
            expect(result.entries[1].entries[1].entries[0].schema).toEqual(nestedOptionalSchema);
            // fourth level: anyOf/oneOf: [ bar, foobar ]
            expect(result.entries[1].entries[1].entries[1]).toBeInstanceOf(GroupClass);
            expect(result.entries[1].entries[1].entries[1].entries).toHaveLength(2);
            expect(result.entries[1].entries[1].entries[1].entries[0]).toBeInstanceOf(JsonSchema);
            expect(result.entries[1].entries[1].entries[1].entries[0].schema).toEqual(rawBarSchema);
            expect(result.entries[1].entries[1].entries[1].entries[1]).toBeInstanceOf(JsonSchema);
            expect(result.entries[1].entries[1].entries[1].entries[1].schema).toEqual(rawFoobarSchema);
        });
    });
    describe("returns allOf group for schema containing mixed groups", () => {
        const rawFoobarSchema = { type: "object" };
        const rawBazSchema = { minProperties: 1 };
        const rawQuxSchema = { maxProperties: 5 };
        const rawQuuxSchema = { additionalProperties: false };

        it("flattening entries (when parserConfig.anyOf/oneOf.type = 'likeAllOf')", () => {
            const parserConfig = {
                anyOf: { type: "likeAllOf" },
                oneOf: { type: "likeAllOf" }
            };
            const schema = new JsonSchema({
                allOf: [rawFooSchema, rawBarSchema],
                anyOf: [rawFoobarSchema, rawBazSchema],
                oneOf: [rawQuxSchema, rawQuuxSchema]
            }, parserConfig);
            const result = createGroupFromSchema(schema);
            expect(result).toBeInstanceOf(JsonSchemaAllOfGroup);
            expect(result.entries).toHaveLength(7);
            expect(result.entries[0]).toBe(schema);
            expect(result.entries[1].schema).toEqual(rawFooSchema);
            expect(result.entries[2].schema).toEqual(rawBarSchema);
            expect(result.entries[3].schema).toEqual(rawFoobarSchema);
            expect(result.entries[4].schema).toEqual(rawBazSchema);
            expect(result.entries[5].schema).toEqual(rawQuxSchema);
            expect(result.entries[6].schema).toEqual(rawQuuxSchema);
        });
        it("with nested groups (when parserConfig.anyOf/oneOf.type = 'asAdditionalColumn')", () => {
            const parserConfig = {
                anyOf: { type: "asAdditionalColumn" },
                oneOf: { type: "asAdditionalColumn" }
            };
            const schema = new JsonSchema({
                allOf: [rawFooSchema, rawBarSchema],
                anyOf: [rawFoobarSchema, rawBazSchema],
                oneOf: [rawQuxSchema, rawQuuxSchema]
            }, parserConfig);
            const result = createGroupFromSchema(schema);
            expect(result).toBeInstanceOf(JsonSchemaAllOfGroup);
            expect(result.entries).toHaveLength(5);
            expect(result.entries[0]).toBe(schema);
            expect(result.entries[1].schema).toEqual(rawFooSchema);
            expect(result.entries[2].schema).toEqual(rawBarSchema);
            expect(result.entries[3]).toBeInstanceOf(JsonSchemaAnyOfGroup);
            expect(result.entries[3].entries).toHaveLength(2);
            expect(result.entries[3].entries[0].schema).toEqual(rawFoobarSchema);
            expect(result.entries[3].entries[1].schema).toEqual(rawBazSchema);
            expect(result.entries[4]).toBeInstanceOf(JsonSchemaOneOfGroup);
            expect(result.entries[4].entries).toHaveLength(2);
            expect(result.entries[4].entries[0].schema).toEqual(rawQuxSchema);
            expect(result.entries[4].entries[1].schema).toEqual(rawQuuxSchema);
        });
    });
    it("throws error for invalid $ref if scope provided", () => {
        const { scope } = new JsonSchema({
            definitions: {
                foo: { title: "foo" },
                bar: { title: "bar" }
            }
        });
        const schema = { $ref: "#/definitions/baz" };
        expect(() => createGroupFromSchema(new JsonSchema(schema, {}, scope)))
            .toThrowError("Cannot resolve $ref: \"#/definitions/baz\"");
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
        });
        const result = getPropertiesFromSchemaGroup(createGroupFromSchema(schema));
        expect(Object.keys(result)).toHaveLength(2);
        expect(result.foo).toBeInstanceOf(JsonSchema);
        expect(result.foo.schema).toEqual(rawFooSchema);
        expect(result.bar).toBeInstanceOf(JsonSchema);
        expect(result.bar.schema).toEqual(rawBarSchema);
    });
    it("returns empty object for empty schema", () => {
        const schemaGroup = createGroupFromSchema(new JsonSchema({}));
        expect(getPropertiesFromSchemaGroup(schemaGroup)).toEqual({});
    });
    it("returns `required` from simple schema", () => {
        const simpleSchema = new JsonSchema({
            required: ["Foo", "Bar"]
        });
        const schemaGroup = createGroupFromSchema(simpleSchema);
        const result = getPropertiesFromSchemaGroup(schemaGroup);
        expect(result.Foo).toBeInstanceOf(JsonSchema);
        expect(result.Foo.schema).toBe(true);
        expect(result.Bar).toBeInstanceOf(JsonSchema);
        expect(result.Bar.schema).toBe(true);
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
        });
        const schemaGroup = createGroupFromSchema(simpleSchema);
        const result = getPropertiesFromSchemaGroup(schemaGroup);
        expect(result.Foo).toBeInstanceOf(JsonSchema);
        expect(result.Foo.schema).toEqual(rawFooSchema);
        expect(result.Bar).toBeInstanceOf(JsonSchema);
        expect(result.Bar.schema).toEqual(rawBarSchema);
        expect(result.Foobar).toBeInstanceOf(JsonSchema);
        expect(result.Foobar.schema).toBe(true);
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
        });
        const schemaGroup = createGroupFromSchema(mainSchema);
        const result = getPropertiesFromSchemaGroup(schemaGroup);
        expect(result.Foo).toBeInstanceOf(JsonSchema);
        expect(result.Foo.schema).toEqual(rawFooSchema);
        expect(result.Bar).toBeInstanceOf(JsonSchema);
        expect(result.Bar.schema).toEqual(rawBarSchema);
        expect(result.Baz).toBeInstanceOf(JsonSchema);
        expect(result.Baz.schema).toEqual(true);
        expect(result.Foobar).toBeInstanceOf(JsonSchema);
        expect(result.Foobar.schema).toEqual(false);
    });
    describe.each`
        groupName
        ${"anyOf"}
        ${"oneOf"}
    `("$groupName with 'asAdditionalColumn' setting:", ({ groupName }) => {
        const parserConfig = {
            [groupName]: { type: "asAdditionalColumn" }
        };
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
        }, parserConfig);
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
        static getDefaultGroupTitle() {
            return "mocked";
        }
        constructor(treatLikeAllOf) {
            super();
            this.treatLikeAllOf = treatLikeAllOf;
        }
        shouldBeTreatedLikeAllOf() { return this.treatLikeAllOf && super.shouldBeTreatedLikeAllOf(); }
    }
    describe("when shouldBeTreatedLikeAllOf() === true", () => {
        it("ignores JsonSchema entries ", () => {
            const group = new MockJsonSchemaGroup(true)
                .with(new JsonSchema())
                .with(new JsonSchema());
            expect(getOptionsInSchemaGroup(group)).toEqual({});
        });
        it("ignores nested groups only containing JsonSchema entries when nested groups also have shouldBeTreatedLikeAllOf() === true", () => {
            const group = new MockJsonSchemaGroup(true)
                .with(
                    new MockJsonSchemaGroup(true)
                        .with(new JsonSchema())
                        .with(new JsonSchema())
                )
                .with(
                    new MockJsonSchemaGroup(true)
                        .with(
                            new MockJsonSchemaGroup(true)
                                .with(new JsonSchema())
                                .with(new JsonSchema())
                        )
                        .with(new JsonSchema())
                );
            expect(getOptionsInSchemaGroup(group)).toEqual({});
        });
    });
    describe("when shouldBeTreatedLikeAllOf() === false", () => {
        it("represents JsonSchema entries as empty arrays", () => {
            const group = new MockJsonSchemaGroup(false)
                .with(new JsonSchema())
                .with(new JsonSchema());
            expect(getOptionsInSchemaGroup(group)).toEqual({
                options: [
                    {},
                    {}
                ]
            });
        });
        it("represents hierarchy of nested groups that also have shouldBeTreatedLikeAllOf() === false", () => {
            const group = new MockJsonSchemaGroup(false)
                .with(
                    new MockJsonSchemaGroup(false)
                        .with(new JsonSchema())
                        .with(new JsonSchema())
                )
                .with(
                    new MockJsonSchemaGroup(false)
                        .with(
                            new MockJsonSchemaGroup(false)
                                .with(new JsonSchema())
                                .with(new JsonSchema())
                        )
                        .with(new JsonSchema())
                );
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
    it("represents hierarchy of nested groups with mixed shouldBeTreatedLikeAllOf() – 1", () => {
        const group = new MockJsonSchemaGroup(false)
            .with(
                new MockJsonSchemaGroup(true)
                    .with(new JsonSchema())
                    .with(new JsonSchema())
            )
            .with(
                new MockJsonSchemaGroup(true)
                    .with(
                        new MockJsonSchemaGroup(false)
                            .with(new JsonSchema())
                            .with(new JsonSchema())
                    )
                    .with(new JsonSchema())
            );
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
    it("represents hierarchy of nested groups with mixed shouldBeTreatedLikeAllOf() – 2", () => {
        const group = new MockJsonSchemaGroup(true)
            .with(
                new MockJsonSchemaGroup(false)
                    .with(new JsonSchema())
                    .with(new JsonSchema())
            )
            .with(
                new MockJsonSchemaGroup(false)
                    .with(
                        new MockJsonSchemaGroup(true)
                            .with(new JsonSchema())
                            .with(new JsonSchema())
                    )
                    .with(new JsonSchema())
            );
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
        const schemaGroup = createGroupFromSchema(new JsonSchema({ title: "Test" }));
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
        const schemaGroup = createGroupFromSchema(new JsonSchema(rawSchema));
        expect(getFieldValueFromSchemaGroup(schemaGroup, "description")).toBeUndefined();
    });
    it("find single value in $ref-erenced sub-schema", () => {
        const { scope } = new JsonSchema({
            definitions: {
                foo: { title: "foobar" }
            }
        });
        const schema = { $ref: "#/definitions/foo" };
        const schemaGroup = createGroupFromSchema(new JsonSchema(schema, {}, scope));
        expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toBe("foobar");
    });
    it("ignores other fields if $ref found", () => {
        const { scope } = new JsonSchema({
            definitions: {
                bar: { title: "baz" }
            }
        });
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
            const schemaGroup = createGroupFromSchema(new JsonSchema(schema));
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
            });
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
            });
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
    const likeAllOfConfig = { type: "likeAllOf" };
    describe.each`
        groupName
        ${"anyOf"}
        ${"oneOf"}
    `("$groupName (type in parserConfig = 'likeAllOf'):", ({ groupName }) => {
        const parserConfig = { [groupName]: likeAllOfConfig };
        it("finds single value", () => {
            const schema = {
                [groupName]: [
                    { description: "foo" },
                    { title: "bar" },
                    { type: "object" }
                ]
            };
            const schemaGroup = createGroupFromSchema(new JsonSchema(schema, parserConfig));
            expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toBe("bar");
        });
        it("finds single value in $ref-erenced group", () => {
            const { scope } = new JsonSchema({
                definitions: {
                    foo: {
                        [groupName]: [
                            { description: "bar" },
                            {
                                [groupName]: [
                                    { title: "baz" },
                                    { type: "object" }
                                ]
                            }
                        ]
                    }
                }
            }, parserConfig);
            const schema = { $ref: "#/definitions/foo" };
            const schemaGroup = createGroupFromSchema(new JsonSchema(schema, parserConfig, scope));
            expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toBe("baz");
        });
        describe("merging multiple values", () => {
            const schema = { $ref: "#/definitions/foo" };
            const { scope } = new JsonSchema({
                definitions: {
                    foo: {
                        [groupName]: [
                            { $ref: "#/definitions/bar" },
                            { title: "foobar" }
                        ]
                    },
                    bar: { title: "baz" }
                }
            }, parserConfig);
            const schemaGroup = createGroupFromSchema(new JsonSchema(schema, parserConfig, scope));

            it("list values by default", () => {
                expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toEqual(["baz", "foobar"]);
            });
            it("applies custom mergeFunction", () => {
                // custom merge function always overrides result with last encountered value
                const mergeFunction = (first, second) => (isDefined(second) ? second : first);
                expect(getFieldValueFromSchemaGroup(schemaGroup, "title", mergeFunction)).toBe("foobar");
            });
        });
        it("merging with value from allOf", () => {
            const schema = {
                [groupName]: [
                    { description: "foo" },
                    { title: "bar" }
                ],
                allOf: [
                    { title: "baz" },
                    { type: "object" }
                ]
            };
            const schemaGroup = createGroupFromSchema(new JsonSchema(schema, parserConfig));
            expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toEqual(["baz", "bar"]);
        });
    });
    it.each`
        parserConfig                                          | result            | testTitle
        ${{ anyOf: likeAllOfConfig, oneOf: likeAllOfConfig }} | ${["baz", "bar"]} | ${"both anyOf and oneOf considered when 'likeAllOf'"}
        ${{ oneOf: likeAllOfConfig }}                         | ${"bar"}          | ${"only oneOf ('likeAllOf') returned if anyOf ignored"}
        ${{ anyOf: likeAllOfConfig }}                         | ${"baz"}          | ${"only anyOf ('likeAllOf') returned if oneOf ignored"}
    `("$testTitle", ({ parserConfig, result }) => {
        const schema = {
            oneOf: [
                { description: "foo" },
                { title: "bar" },
                { type: "object" }
            ],
            anyOf: [
                { title: "baz" },
                { type: "object" }
            ]
        };
        const schemaGroup = createGroupFromSchema(new JsonSchema(schema, parserConfig));
        expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toEqual(result);
    });
    it.each`
        fieldName
        ${"items"}
        ${"additionalItems"}
    `("ignores $fieldName", ({ fieldName }) => {
        const schema = {
            [fieldName]: { title: "Array-Entry-Title" }
        };
        const schemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(getFieldValueFromSchemaGroup(schemaGroup, "title")).toBeUndefined();
    });
});
describe("getTypeOfArrayItemsFromSchemaGroup()", () => {
    it("finds `items` in simple schema", () => {
        const itemSchema = { title: "Test" };
        const schema = { items: itemSchema };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema)));
        expect(result).toBeInstanceOf(JsonSchema);
        expect(result.schema).toEqual(itemSchema);
    });
    it("finds `additionalItems` in simple schema", () => {
        const additionalItemSchema = { description: "Value" };
        const schema = { additionalItems: additionalItemSchema };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema)));
        expect(result).toBeInstanceOf(JsonSchema);
        expect(result.schema).toEqual(additionalItemSchema);
    });
    it("ignores boolean `additionalItems`", () => {
        const additionalItemSchema = true;
        const schema = { additionalItems: additionalItemSchema };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema)));
        expect(result).toBeUndefined();
    });
    it("prefers `items` over `additionalItems` in simple schema", () => {
        const itemSchema = { title: "Test" };
        const additionalItemSchema = { description: "Value" };
        const schema = {
            items: itemSchema,
            additionalItems: additionalItemSchema
        };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema)));
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
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema)));
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
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema)));
        expect(result).toBeInstanceOf(JsonSchema);
        expect(result.schema).toEqual(additionalItemSchema);
    });
    it("returns null if neither `items` nor `additionalItems` are present", () => {
        const schema = {
            type: "array"
        };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema)));
        expect(result).toBeUndefined();
    });
    it("picks first of multiple `items` in complex schema", () => {
        const schema = {
            allOf: [
                { items: { title: "foo" } },
                { items: { description: "bar" } },
                {
                    allOf: [
                        true,
                        { items: { type: "object" } }
                    ]
                }
            ]
        };
        const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema)));
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
                        true,
                        { additionalItems: { type: "object" } }
                    ]
                }
            ]
        };
        const parserConfig = {
            [groupName]: { type: "asAdditionalColumn" }
        };

        it.each`
            testTitle                       | optionIndexes | expectedResult
            ${"one-level optionTarget (1)"} | ${[0]}        | ${{ title: "foo" }}
            ${"one-level optionTarget (2)"} | ${[1]}        | ${{ description: "bar" }}
            ${"two-level optionTarget"}     | ${[2, 1]}     | ${{ type: "object" }}
        `("$testTitle", ({ optionIndexes, expectedResult }) => {
            const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema, parserConfig)), optionIndexes);
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
            const result = getTypeOfArrayItemsFromSchemaGroup(createGroupFromSchema(new JsonSchema(schema, parserConfig)), optionIndexes);
            expect(result).toBeUndefined();
        });
    });
});
