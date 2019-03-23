import JsonSchema from "../../src/model/JsonSchema";
import JsonSchemaAllOfGroup from "../../src/model/JsonSchemaAllOfGroup";
import JsonSchemaAnyOfGroup from "../../src/model/JsonSchemaAnyOfGroup";
import JsonSchemaOneOfGroup from "../../src/model/JsonSchemaOneOfGroup";
import { isDefined } from "../../src/model/utils";

describe("getPropertyParentSchemas()", () => {
    it("returns given simple schema", () => {
        const schema = new JsonSchema({ title: "Test" });
        expect(schema.getPropertyParentSchemas().entries).toEqual([schema]);
    });
    it("returns empty array for undefined schema", () => {
        expect(new JsonSchema(undefined).getPropertyParentSchemas().entries).toEqual([]);
    });
    it("returns empty array for null schema", () => {
        expect(new JsonSchema(null).getPropertyParentSchemas().entries).toEqual([]);
    });
    it("returns empty array for invalid schema", () => {
        expect(new JsonSchema("not-a-schema").getPropertyParentSchemas().entries).toEqual([]);
    });
    it("returns empty array for empty schema", () => {
        expect(new JsonSchema({}).getPropertyParentSchemas().entries).toEqual([]);
    });
    it("returns $ref-erenced sub-schema", () => {
        const { scope } = new JsonSchema({
            definitions: {
                A: { title: "Ref-Test" }
            }
        });
        const { entries } = new JsonSchema({ $ref: "#/definitions/A" }, {}, scope).getPropertyParentSchemas();
        expect(entries).toHaveLength(1);
        expect(entries[0].schema).toEqual({ title: "Ref-Test" });
    });
    it("throws error if no refScope provided but $ref found", () => {
        const schema = new JsonSchema({ $ref: "#/definitions/other" });
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
        const { scope } = new JsonSchema({
            definitions: {
                A: { title: "Ref-Title" }
            }
        });
        const { entries } = new JsonSchema(schema, {}, scope).getPropertyParentSchemas();
        expect(entries).toHaveLength(1);
        expect(entries[0].schema).toEqual({ title: "Ref-Title" });
    });
    it("includes all from allOf", () => {
        const subSchema1 = { description: "Description Text" };
        const subSchema2 = { title: "Title Value" };
        const schema = new JsonSchema({ allOf: [subSchema1, subSchema2] });
        const { entries } = schema.getPropertyParentSchemas();
        expect(entries).toHaveLength(3);
        expect(entries[0]).toEqual(schema);
        expect(entries[1].schema).toEqual(subSchema1);
        expect(entries[2].schema).toEqual(subSchema2);
    });
    it("includes all from $ref-erenced allOf", () => {
        const subSchemaA1 = { description: "Description Text" };
        const subSchemaA21 = { title: "Title Value" };
        const subSchemaA22 = { type: "object" };
        const subSchemaA2 = { allOf: [subSchemaA21, subSchemaA22] };
        const subSchemaA = { allOf: [subSchemaA1, subSchemaA2] };
        const { scope } = new JsonSchema({
            definitions: { A: subSchemaA }
        });
        const { entries } = new JsonSchema({ $ref: "#/definitions/A" }, {}, scope).getPropertyParentSchemas();
        expect(entries).toHaveLength(5);
        expect(entries[0].schema).toEqual(subSchemaA);
        expect(entries[1].schema).toEqual(subSchemaA1);
        expect(entries[2].schema).toEqual(subSchemaA2);
        expect(entries[3].schema).toEqual(subSchemaA21);
        expect(entries[4].schema).toEqual(subSchemaA22);
    });
    describe.each`
        groupName
        ${"anyOf"}
        ${"oneOf"}
    `("$groupName with 'likeAllOf' setting:", ({ groupName }) => {
        const parserConfig = {
            [groupName]: { type: "likeAllOf" }
        };

        it("ignored if parserConfig not set", () => {
            const subSchema1 = { description: "Description Text" };
            const subSchema2 = { title: "Title Value" };
            const schema = new JsonSchema({ [groupName]: [subSchema1, subSchema2] });
            const { entries } = schema.getPropertyParentSchemas();
            expect(entries).toHaveLength(1);
            expect(entries[0]).toEqual(schema);
        });
        it("included if parserConfig set", () => {
            const subSchema1 = { description: "Description Text" };
            const subSchema2 = { title: "Title Value" };
            const schema = new JsonSchema({ [groupName]: [subSchema1, subSchema2] }, parserConfig);
            const { entries } = schema.getPropertyParentSchemas();
            expect(entries).toHaveLength(3);
            expect(entries[0]).toEqual(schema);
            expect(entries[1].schema).toEqual(subSchema1);
            expect(entries[2].schema).toEqual(subSchema2);
        });
        it("includes all $ref-erenced if parserConfig set", () => {
            const subSchemaA1 = { description: "Description Text" };
            const subSchemaA21 = { title: "Title Value" };
            const subSchemaA22 = { type: "object" };
            const subSchemaA2 = { [groupName]: [subSchemaA21, subSchemaA22] };
            const subSchemaA = { [groupName]: [subSchemaA1, subSchemaA2] };
            const { scope } = new JsonSchema({
                definitions: { A: subSchemaA }
            }, parserConfig);
            const { entries } = new JsonSchema({ $ref: "#/definitions/A" }, parserConfig, scope).getPropertyParentSchemas();
            expect(entries).toHaveLength(5);
            expect(entries[0].schema).toEqual(subSchemaA);
            expect(entries[1].schema).toEqual(subSchemaA1);
            expect(entries[2].schema).toEqual(subSchemaA2);
            expect(entries[3].schema).toEqual(subSchemaA21);
            expect(entries[4].schema).toEqual(subSchemaA22);
        });
        it("ignored if allOf is present", () => {
            const subSchema1 = { description: "Description Text" };
            const subSchema2 = { title: "Title Value" };
            const subSchema3 = { default: true };
            const subSchema4 = { type: "boolean" };
            const schema = new JsonSchema({
                [groupName]: [subSchema1, subSchema2],
                allOf: [subSchema3, subSchema4]
            }, parserConfig);
            const { entries } = schema.getPropertyParentSchemas();
            expect(entries).toHaveLength(3);
            expect(entries[0]).toEqual(schema);
            // allOf is included if present
            expect(entries[1].schema).toEqual(subSchema3);
            expect(entries[2].schema).toEqual(subSchema4);
            // sub schemas from anyOf/oneOf are ignored
        });
    });
    describe.each`
        groupName  | groupClass
        ${"anyOf"} | ${JsonSchemaAnyOfGroup}
        ${"oneOf"} | ${JsonSchemaOneOfGroup}
    `("$groupName with 'asAdditionalColumn' setting:", ({ groupName, groupClass }) => {
        const parserConfig = {
            [groupName]: { type: "asAdditionalColumn" }
        };

        it("ignored if parserConfig not set", () => {
            const subSchema1 = { description: "Description Text" };
            const subSchema2 = { title: "Title Value" };
            const schema = new JsonSchema({ [groupName]: [subSchema1, subSchema2] });
            const { entries } = schema.getPropertyParentSchemas();
            expect(entries).toHaveLength(1);
            expect(entries[0]).toEqual(schema);
        });
        it("included if parserConfig set", () => {
            const subSchema1 = { description: "Description Text" };
            const subSchema2 = { title: "Title Value" };
            const schema = new JsonSchema({ [groupName]: [subSchema1, subSchema2] }, parserConfig);
            const { entries } = schema.getPropertyParentSchemas();
            expect(entries).toHaveLength(2);
            expect(entries[0]).toEqual(schema);
            expect(entries[1]).toBeInstanceOf(groupClass);
            expect(entries[1].entries).toHaveLength(2);
            expect(entries[1].entries[0].schema).toEqual(subSchema1);
            expect(entries[1].entries[1].schema).toEqual(subSchema2);
        });
        it("includes all $ref-erenced if parserConfig set", () => {
            const subSchemaA1 = { description: "Description Text" };
            const subSchemaA21 = { title: "Title Value" };
            const subSchemaA22 = { type: "object" };
            const subSchemaA2 = { [groupName]: [subSchemaA21, subSchemaA22] };
            const subSchemaA = { [groupName]: [subSchemaA1, subSchemaA2] };
            const { scope } = new JsonSchema({
                definitions: { A: subSchemaA }
            }, parserConfig);
            const { entries } = new JsonSchema({ $ref: "#/definitions/A" }, parserConfig, scope).getPropertyParentSchemas();
            expect(entries).toHaveLength(2);
            expect(entries[0].schema).toEqual(subSchemaA);
            expect(entries[1]).toBeInstanceOf(groupClass);
            expect(entries[1].entries).toHaveLength(2);
            expect(entries[1].entries[0].schema).toEqual(subSchemaA1);
            expect(entries[1].entries[1]).toBeInstanceOf(JsonSchemaAllOfGroup);
            expect(entries[1].entries[1].entries).toHaveLength(2);
            expect(entries[1].entries[1].entries[0].schema).toEqual(subSchemaA2);
            expect(entries[1].entries[1].entries[1]).toBeInstanceOf(groupClass);
            expect(entries[1].entries[1].entries[1].entries).toHaveLength(2);
            expect(entries[1].entries[1].entries[1].entries[0].schema).toEqual(subSchemaA21);
            expect(entries[1].entries[1].entries[1].entries[1].schema).toEqual(subSchemaA22);
        });
        it("ignored if allOf is present", () => {
            const subSchema1 = { description: "Description Text" };
            const subSchema2 = { title: "Title Value" };
            const subSchema3 = { default: true };
            const subSchema4 = { type: "boolean" };
            const schema = new JsonSchema({
                [groupName]: [subSchema1, subSchema2],
                allOf: [subSchema3, subSchema4]
            }, parserConfig);
            const { entries } = schema.getPropertyParentSchemas();
            expect(entries).toHaveLength(3);
            expect(entries[0]).toEqual(schema);
            // allOf is included if present
            expect(entries[1].schema).toEqual(subSchema3);
            expect(entries[2].schema).toEqual(subSchema4);
            // sub schemas from anyOf/oneOf are ignored
        });
    });
    describe("oneOf ignored if anyOf is present and configured to be included", () => {
        const subSchema1 = { description: "Description Text" };
        const subSchema2 = { title: "Title Value" };
        const subSchema3 = { default: true };
        const subSchema4 = { type: "boolean" };
        it("anyOf: likeAllOf", () => {
            const parserConfig = {
                anyOf: { type: "likeAllOf" },
                oneOf: { type: "likeAllOf" }
            };
            const schema = new JsonSchema({
                oneOf: [subSchema1, subSchema2],
                anyOf: [subSchema3, subSchema4]
            }, parserConfig);
            const { entries } = schema.getPropertyParentSchemas();
            expect(entries).toHaveLength(3);
            expect(entries[0]).toEqual(schema);
            // anyOf is included
            expect(entries[1].schema).toEqual(subSchema3);
            expect(entries[2].schema).toEqual(subSchema4);
            // sub schemas from oneOf are ignored
        });
        it("anyOf: asAdditionalColumn", () => {
            const parserConfig = {
                anyOf: { type: "asAdditionalColumn" },
                oneOf: { type: "asAdditionalColumn" }
            };
            const schema = new JsonSchema({
                oneOf: [subSchema1, subSchema2],
                anyOf: [subSchema3, subSchema4]
            }, parserConfig);
            const { entries } = schema.getPropertyParentSchemas();
            expect(entries).toHaveLength(2);
            expect(entries[0]).toEqual(schema);
            // anyOf is included
            expect(entries[1]).toBeInstanceOf(JsonSchemaAnyOfGroup);
            expect(entries[1].entries).toHaveLength(2);
            expect(entries[1].entries[0].schema).toEqual(subSchema3);
            expect(entries[1].entries[1].schema).toEqual(subSchema4);
            // sub schemas from oneOf are ignored
        });
    });
    describe("oneOf returned if anyOf is present but not configured to be included", () => {
        const subSchema1 = { description: "Description Text" };
        const subSchema2 = { title: "Title Value" };
        const subSchema3 = { default: true };
        const subSchema4 = { type: "boolean" };
        it("oneOf: likeAllOf", () => {
            const parserConfig = { oneOf: { type: "likeAllOf" } };
            const schema = new JsonSchema({
                oneOf: [subSchema1, subSchema2],
                anyOf: [subSchema3, subSchema4]
            }, parserConfig);
            const { entries } = schema.getPropertyParentSchemas();
            expect(entries).toHaveLength(3);
            expect(entries[0]).toEqual(schema);
            // oneOf is included
            expect(entries[1].schema).toEqual(subSchema1);
            expect(entries[2].schema).toEqual(subSchema2);
            // sub schemas from anyOf are ignored since they are not mentioned in the parserConfig
        });
        it("oneOF: asAdditionalColumn", () => {
            const parserConfig = { oneOf: { type: "asAdditionalColumn" } };
            const schema = new JsonSchema({
                oneOf: [subSchema1, subSchema2],
                anyOf: [subSchema3, subSchema4]
            }, parserConfig);
            const { entries } = schema.getPropertyParentSchemas();
            expect(entries).toHaveLength(2);
            expect(entries[0]).toEqual(schema);
            // oneOf is included
            expect(entries[1]).toBeInstanceOf(JsonSchemaOneOfGroup);
            expect(entries[1].entries).toHaveLength(2);
            expect(entries[1].entries[0].schema).toEqual(subSchema1);
            expect(entries[1].entries[1].schema).toEqual(subSchema2);
            // sub schemas from anyOf are ignored since they are not mentioned in the parserConfig
        });
    });
    it("returns type of items", () => {
        const subSchemaItems = { title: "Title Value" };
        const schema = new JsonSchema({ items: subSchemaItems });
        const { entries } = schema.getPropertyParentSchemas();
        expect(entries).toHaveLength(1);
        expect(entries[0].schema).toEqual(subSchemaItems);
        expect(entries[0].scope).toEqual(schema.scope);
    });
    it("returns $ref-erenced type of items", () => {
        const schema = { items: { $ref: "#/definitions/A" } };
        const subSchemaItems = { title: "Title Value" };
        const { scope } = new JsonSchema({
            definitions: { A: subSchemaItems }
        });
        const { entries } = new JsonSchema(schema, {}, scope).getPropertyParentSchemas();
        expect(entries).toHaveLength(1);
        expect(entries[0].schema).toEqual(subSchemaItems);
        expect(entries[0].scope).toEqual(scope);
    });
    it("returns type of additionalItems", () => {
        const subSchemaItems = { title: "Title Value" };
        const schema = new JsonSchema({ additionalItems: subSchemaItems });
        const { entries } = schema.getPropertyParentSchemas();
        expect(entries).toHaveLength(1);
        expect(entries[0].schema).toEqual(subSchemaItems);
        expect(entries[0].scope).toEqual(schema.scope);
    });
    it("returns $ref-erenced type of additionalItems", () => {
        const schema = { additionalItems: { $ref: "#/definitions/A" } };
        const subSchemaItems = { title: "Title Value" };
        const { scope } = new JsonSchema({
            definitions: { A: subSchemaItems }
        });
        const { entries } = new JsonSchema(schema, {}, scope).getPropertyParentSchemas();
        expect(entries).toHaveLength(1);
        expect(entries[0].schema).toEqual(subSchemaItems);
        expect(entries[0].scope).toEqual(scope);
    });
});
describe("getProperties()", () => {
    it("returns properties from simple schema", () => {
        const rawFooSchema = { type: "string" };
        const rawBarSchema = { type: "number" };
        const schema = new JsonSchema({
            properties: {
                foo: rawFooSchema,
                bar: rawBarSchema
            }
        });
        const result = schema.getProperties();
        expect(Object.keys(result)).toHaveLength(2);
        expect(result.foo).toBeInstanceOf(JsonSchema);
        expect(result.foo.schema).toEqual(rawFooSchema);
        expect(result.bar).toBeInstanceOf(JsonSchema);
        expect(result.bar.schema).toEqual(rawBarSchema);
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
            const result = schema.getProperties();
            expect(result).toEqual({});
        });
        it("returns first of two options", () => {
            const result = schema.getProperties(0);
            expect(Object.keys(result)).toHaveLength(1);
            expect(result.foo).toBeInstanceOf(JsonSchema);
            expect(result.foo.schema).toEqual(rawFooSchema);
        });
        it("returns second of two options", () => {
            const result = schema.getProperties(1);
            expect(Object.keys(result)).toHaveLength(1);
            expect(result.bar).toBeInstanceOf(JsonSchema);
            expect(result.bar.schema).toEqual(rawBarSchema);
        });
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
        const { scope } = new JsonSchema({
            definitions: {
                other: { title: "Ref-Test" }
            }
        });
        expect(new JsonSchema(schema, {}, scope).getFieldValue("title")).toEqual("Ref-Test");
    });
    it("ignores other fields if $ref found", () => {
        const schema = {
            title: "Main-Title",
            $ref: "#/definitions/other"
        };
        const { scope } = new JsonSchema({
            definitions: {
                other: { title: "Ref-Title" }
            }
        });
        expect(new JsonSchema(schema, {}, scope).getFieldValue("title")).toBe("Ref-Title");
    });
    it("throws error for invalid $ref if scope provided", () => {
        const schema = { $ref: "#/definitions/other" };
        const { scope } = new JsonSchema({
            definitions: {
                third: { title: "yet another title" },
                fourth: { title: "one more" }
            }
        });
        expect(() => new JsonSchema(schema, {}, scope).getFieldValue("title"))
            .toThrowError("Cannot resolve $ref: \"#/definitions/other\"");
    });
    describe("allOf:", () => {
        it("finds single value", () => {
            const schema = {
                allOf: [
                    { description: "Description Text" },
                    { title: "Title Value" },
                    { type: "object" }
                ]
            };
            expect(new JsonSchema(schema).getFieldValue("title")).toEqual("Title Value");
        });
        it("finds single value in $ref-erenced group", () => {
            const schema = { $ref: "#/definitions/A" };
            const { scope } = new JsonSchema({
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
            expect(new JsonSchema(schema, {}, scope).getFieldValue("title")).toEqual("Title Value");
        });
        it("lists multiple values by default", () => {
            const schema = { $ref: "#/definitions/A" };
            const { scope } = new JsonSchema({
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
            expect(new JsonSchema(schema, {}, scope).getFieldValue("title")).toEqual(["Generic Title", "Specific Title"]);
        });
        it("supports custom mergeFunction for multiple values", () => {
            const schema = { $ref: "#/definitions/A" };
            const { scope } = new JsonSchema({
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
            expect(new JsonSchema(schema, {}, scope).getFieldValue("title", mergeFunction)).toEqual("Specific Title");
        });
    });
    describe.each`
        groupName
        ${"anyOf"}
        ${"oneOf"}
    `("$groupName:", ({ groupName }) => {
        const parserConfig = {
            [groupName]: { type: "likeAllOf" }
        };
        it("finds single value", () => {
            const schema = {
                [groupName]: [
                    { description: "Description Text" },
                    { title: "Title Value" },
                    { type: "object" }
                ]
            };
            expect(new JsonSchema(schema, parserConfig).getFieldValue("title"))
                .toEqual("Title Value");
        });
        it("ignores value if allOf is present", () => {
            const schema = {
                [groupName]: [
                    { description: "Description Text" },
                    { title: "Title Value" }
                ],
                allOf: [
                    { title: "Title in allOf" },
                    { type: "object" }
                ]
            };
            expect(new JsonSchema(schema, parserConfig).getFieldValue("title"))
                .toEqual("Title in allOf");
        });
        it("finds single value in $ref-erenced group", () => {
            const schema = { $ref: "#/definitions/A" };
            const { scope } = new JsonSchema({
                definitions: {
                    A: {
                        [groupName]: [
                            { description: "Description Text" },
                            {
                                [groupName]: [
                                    { title: "Title Value" },
                                    { type: "object" }
                                ]
                            }
                        ]
                    }
                }
            }, parserConfig);
            expect(new JsonSchema(schema, parserConfig, scope).getFieldValue("title"))
                .toEqual("Title Value");
        });
        it("lists multiple values by default", () => {
            const schema = { $ref: "#/definitions/A" };
            const { scope } = new JsonSchema({
                definitions: {
                    A: {
                        [groupName]: [
                            { $ref: "#/definitions/B" },
                            { title: "Specific Title" }
                        ]
                    },
                    B: { title: "Generic Title" }
                }
            }, parserConfig);
            expect(new JsonSchema(schema, parserConfig, scope).getFieldValue("title"))
                .toEqual(["Generic Title", "Specific Title"]);
        });
        it("supports custom mergeFunction for multiple values", () => {
            const schema = { $ref: "#/definitions/A" };
            const { scope } = new JsonSchema({
                definitions: {
                    A: {
                        [groupName]: [
                            { $ref: "#/definitions/B" },
                            { title: "Specific Title" }
                        ]
                    },
                    B: { title: "Generic Title" }
                }
            }, parserConfig);
            // custom merge function always overrides result with last encountered value
            const mergeFunction = (first, second) => (isDefined(second) ? second : first);
            expect(new JsonSchema(schema, parserConfig, scope).getFieldValue("title", mergeFunction))
                .toEqual("Specific Title");
        });
    });
    it("oneOf ignored if anyOf is present and configured to be included", () => {
        const schema = {
            oneOf: [
                { description: "Description Text" },
                { title: "Title Value" },
                { type: "object" }
            ],
            anyOf: [
                { title: "Title in anyOf" },
                { type: "object" }
            ]
        };
        const parserConfig = {
            anyOf: { type: "likeAllOf" },
            oneOf: { type: "likeAllOf" }
        };
        expect(new JsonSchema(schema, parserConfig).getFieldValue("title"))
            .toEqual("Title in anyOf");
    });
    it("oneOf returned if anyOf is present but not configured to be included", () => {
        const schema = {
            oneOf: [
                { description: "Description Text" },
                { title: "Title Value" },
                { type: "object" }
            ],
            anyOf: [
                { title: "Title in anyOf" },
                { type: "object" }
            ]
        };
        const parserConfig = {
            oneOf: { type: "likeAllOf" }
        };
        expect(new JsonSchema(schema, parserConfig).getFieldValue("title"))
            .toEqual("Title Value");
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
describe("getProperties()", () => {
    it("returns empty object for empty schema", () => {
        const emptySchema = new JsonSchema({});
        expect(emptySchema.getProperties()).toEqual({});
    });
    it("returns contained `properties` from simple schema", () => {
        const itemOneSchema = { title: "Title" };
        const itemTwoSchema = { description: "Description" };
        const simpleSchema = new JsonSchema({
            properties: {
                "Item One": itemOneSchema,
                "Item Two": itemTwoSchema
            }
        });
        const result = simpleSchema.getProperties();
        expect(result["Item One"].schema).toEqual(itemOneSchema);
        expect(result["Item Two"].schema).toEqual(itemTwoSchema);
    });
    it("returns `required` from simple schema", () => {
        const simpleSchema = new JsonSchema({
            required: ["Item One", "Item Two"]
        });
        const result = simpleSchema.getProperties();
        expect(result["Item One"].schema).toBe(true);
        expect(result["Item Two"].schema).toBe(true);
    });
    it("returns combined `required` and `properties` from simple schema", () => {
        const itemOneSchema = { title: "Title" };
        const itemTwoSchema = { description: "Description" };
        const simpleSchema = new JsonSchema({
            required: ["Item One", "Item Three"],
            properties: {
                "Item One": itemOneSchema,
                "Item Two": itemTwoSchema
            }
        });
        const result = simpleSchema.getProperties();
        expect(result["Item One"].schema).toEqual(itemOneSchema);
        expect(result["Item Two"].schema).toEqual(itemTwoSchema);
        expect(result["Item Three"].schema).toBe(true);
    });
    it("returns combined `properties` from nested schemas", () => {
        const itemOneSchema = { title: "Title" };
        const itemTwoSchema = { description: "Description" };
        const mainSchema = new JsonSchema({
            allOf: [
                {
                    properties: {
                        "Item One": itemOneSchema
                    }
                },
                {
                    properties: {
                        "Item Two": itemTwoSchema
                    }
                }
            ]
        });
        const result = mainSchema.getProperties();
        expect(result["Item One"].schema).toEqual(itemOneSchema);
        expect(result["Item Two"].schema).toEqual(itemTwoSchema);
    });
});