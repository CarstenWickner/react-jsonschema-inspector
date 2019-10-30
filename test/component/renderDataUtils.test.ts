import { createRenderDataBuilder, createFilterFunctionForColumn } from "../../src/component/renderDataUtils";

import { JsonSchema } from "../../src/model/JsonSchema";
import { JsonSchemaGroup } from "../../src/model/JsonSchemaGroup";
import { createGroupFromSchema, getOptionsInSchemaGroup, getFieldValueFromSchemaGroup } from "../../src/model/schemaUtils";
import { maximumValue } from "../../src/model/utils";
import { InspectorProps, RenderItemsColumn, RenderOptionsColumn } from "../../src/component/InspectorTypes";
import { ParserConfig } from "../../src/types/ParserConfig";

describe("createRenderDataBuilder()", () => {
    let lastCalledOnSelectColumnIndex: number;
    const onSelectInColumn = jest.fn((columnIndex: number): RenderItemsColumn["onSelect"] => (): void => {
        lastCalledOnSelectColumnIndex = columnIndex;
    });
    const getRenderData = createRenderDataBuilder(onSelectInColumn);

    beforeEach(() => {
        lastCalledOnSelectColumnIndex = undefined;
    });

    describe("without arrays or optionals", () => {
        const fooSchema = {
            title: "Foo"
        };
        const barSchema = {
            description: "Bar",
            properties: {
                "Item One": {},
                "Item Two": {
                    properties: {
                        "Property One": {}
                    }
                }
            }
        };
        const foobarSchema = {
            properties: {
                "Item Three": { $ref: "https://foo.bar/foobar#/definitions/qux" }
            }
        };
        const schemas = {
            foo: fooSchema,
            bar: barSchema,
            foobar: foobarSchema
        };
        const quxSchema = {
            $id: "https://foo.bar/foobar/qux",
            title: "Qux"
        };
        const referenceSchemas = [
            {
                $id: "https://foo.bar/foobar",
                definitions: {
                    qux: { $ref: "https://foo.bar/foobar/qux" }
                }
            },
            quxSchema
        ];

        it("returns single root column if there are no other settings", () => {
            const { columnData } = getRenderData({ foo: fooSchema }, [], [], {});
            expect(columnData).toHaveLength(1);
            const rootColumn = (columnData[0] as unknown) as RenderItemsColumn;
            // single item containing the given schema (wrapped in a JsonSchema and again wrapped in a JsonSchemaGroup)
            expect(Object.keys(rootColumn.items)).toHaveLength(1);
            expect(rootColumn.items.foo).toBeInstanceOf(JsonSchemaGroup);
            const rootColumnItemsFoo = rootColumn.items.foo as JsonSchemaGroup;
            expect(rootColumnItemsFoo.entries).toHaveLength(1);
            expect(rootColumnItemsFoo.entries[0]).toBeInstanceOf(JsonSchema);
            expect((rootColumnItemsFoo.entries[0] as JsonSchema).schema).toEqual(fooSchema);
            // onSelect being provided for column index 0
            expect(onSelectInColumn.mock.calls).toHaveLength(1);
            expect(onSelectInColumn.mock.calls[0][0]).toBe(0);

            expect(rootColumn.onSelect).toBeDefined();
            rootColumn.onSelect(null);
            expect(lastCalledOnSelectColumnIndex).toBe(0);
            expect(rootColumn.selectedItem).toBeFalsy();
            expect(rootColumn.trailingSelection).toBeFalsy();
        });
        it("returns single root column for multiple schemas including reference schemas", () => {
            const { columnData } = getRenderData(schemas, referenceSchemas, [], {});
            expect(columnData).toHaveLength(1);
            const rootColumn = (columnData[0] as unknown) as RenderItemsColumn;
            // three items each containing a root schema (wrapped in a JsonSchema and again wrapped in a JsonSchemaGroup)
            expect(Object.keys(rootColumn.items)).toHaveLength(3);
            expect(rootColumn.items.foo).toBeInstanceOf(JsonSchemaGroup);
            const rootColumnItemsFoo = rootColumn.items.foo as JsonSchemaGroup;
            expect(rootColumnItemsFoo.entries).toHaveLength(1);
            expect(rootColumnItemsFoo.entries[0]).toBeInstanceOf(JsonSchema);
            expect((rootColumnItemsFoo.entries[0] as JsonSchema).schema).toEqual(fooSchema);
            expect(rootColumn.items.bar).toBeInstanceOf(JsonSchemaGroup);
            const rootColumnItemsBar = rootColumn.items.bar as JsonSchemaGroup;
            expect(rootColumnItemsBar.entries).toHaveLength(1);
            expect(rootColumnItemsBar.entries[0]).toBeInstanceOf(JsonSchema);
            expect((rootColumnItemsBar.entries[0] as JsonSchema).schema).toEqual(barSchema);
            expect(rootColumn.items.foobar).toBeInstanceOf(JsonSchemaGroup);
            const rootColumnItemsFoobar = rootColumn.items.foobar as JsonSchemaGroup;
            expect(rootColumnItemsFoobar.entries).toHaveLength(1);
            expect(rootColumnItemsFoobar.entries[0]).toBeInstanceOf(JsonSchema);
            expect((rootColumnItemsFoobar.entries[0] as JsonSchema).schema).toEqual(foobarSchema);
        });
        it("ignores invalid root selection", () => {
            const { columnData } = getRenderData(schemas, referenceSchemas, ["qux"], {});
            expect(columnData).toHaveLength(1);
            const rootColumn = (columnData[0] as unknown) as RenderItemsColumn;
            expect(Object.keys(rootColumn.items)).toHaveLength(3);
            expect(rootColumn.onSelect).toBeDefined();
            rootColumn.onSelect(null);
            expect(lastCalledOnSelectColumnIndex).toBe(0);
            expect(rootColumn.selectedItem).toBeFalsy();
            expect(rootColumn.trailingSelection).toBeFalsy();
        });
        it("returns single column for root selection without nested items", () => {
            const { columnData } = getRenderData(schemas, referenceSchemas, ["foo"], {});
            expect(columnData).toHaveLength(1);
            const rootColumn = (columnData[0] as unknown) as RenderItemsColumn;
            expect(Object.keys(rootColumn.items)).toHaveLength(3);
            expect(rootColumn.onSelect).toBeDefined();
            rootColumn.onSelect(null);
            expect(lastCalledOnSelectColumnIndex).toBe(0);
            expect(rootColumn.selectedItem).toBe("foo");
            expect(rootColumn.trailingSelection).toBe(true);
        });
        it("returns two columns for root selection with nested items", () => {
            const { columnData } = getRenderData(schemas, referenceSchemas, ["foobar"], {});
            expect(columnData).toHaveLength(2);
            const rootColumn = (columnData[0] as unknown) as RenderItemsColumn;
            expect(Object.keys(rootColumn.items)).toHaveLength(3);
            expect(rootColumn.onSelect).toBeDefined();
            rootColumn.onSelect(null);
            expect(lastCalledOnSelectColumnIndex).toBe(0);
            expect(rootColumn.selectedItem).toBe("foobar");
            expect(rootColumn.trailingSelection).toBe(true);
            const secondColumn = (columnData[1] as unknown) as RenderItemsColumn;
            expect(Object.keys(secondColumn.items)).toHaveLength(1);
            expect(secondColumn.items["Item Three"]).toBeInstanceOf(JsonSchemaGroup);
            const secondColumnItemThree = secondColumn.items["Item Three"] as JsonSchemaGroup;
            expect(secondColumnItemThree.entries).toHaveLength(1);
            expect(secondColumnItemThree.entries[0]).toBeInstanceOf(JsonSchema);
            expect((secondColumnItemThree.entries[0] as JsonSchema).schema).toEqual(quxSchema);
            expect(secondColumn.onSelect).toBeDefined();
            secondColumn.onSelect(null);
            expect(lastCalledOnSelectColumnIndex).toBe(1);
            expect(secondColumn.selectedItem).toBeFalsy();
            expect(secondColumn.trailingSelection).toBeFalsy();
        });
        it("returns two columns for selection in both columns without further nested items", () => {
            const { columnData } = getRenderData(schemas, referenceSchemas, ["foobar", "Item Three"], {});
            expect(columnData).toHaveLength(2);
            const rootColumn = (columnData[0] as unknown) as RenderItemsColumn;
            expect(Object.keys(rootColumn.items)).toHaveLength(3);
            expect(rootColumn.onSelect).toBeDefined();
            rootColumn.onSelect(null);
            expect(lastCalledOnSelectColumnIndex).toBe(0);
            expect(rootColumn.selectedItem).toBe("foobar");
            expect(rootColumn.trailingSelection).toBeFalsy();
            const secondColumn = (columnData[1] as unknown) as RenderItemsColumn;
            expect(Object.keys(secondColumn.items)).toHaveLength(1);
            expect(secondColumn.items["Item Three"]).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.onSelect).toBeDefined();
            secondColumn.onSelect(null);
            expect(lastCalledOnSelectColumnIndex).toBe(1);
            expect(secondColumn.selectedItem).toBe("Item Three");
            expect(secondColumn.trailingSelection).toBe(true);
        });
    });
    describe("with arrays", () => {
        const fooSchema = {
            properties: {
                qux: {}
            }
        };
        const barSchema = {
            items: fooSchema,
            minItems: 3
        };
        const foobarSchema = {
            items: barSchema
        };
        const schemas = {
            bar: barSchema,
            foobar: foobarSchema
        };

        it("returns extra column when array is selected", () => {
            const { columnData } = getRenderData(schemas, [], ["bar", "[0]"], {});
            expect(columnData).toHaveLength(3);
            const rootColumn = (columnData[0] as unknown) as RenderItemsColumn;
            expect(Object.keys(rootColumn.items)).toHaveLength(2);
            expect(rootColumn.items.bar).toBeInstanceOf(JsonSchemaGroup);
            expect(rootColumn.selectedItem).toBe("bar");
            expect(rootColumn.trailingSelection).toBeFalsy();
            const secondColumn = (columnData[1] as unknown) as RenderItemsColumn;
            expect(Object.keys(secondColumn.items)).toHaveLength(1);
            expect(secondColumn.items["[0]"]).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.items["[0]"].entries).toHaveLength(1);
            expect(secondColumn.items["[0]"].entries[0]).toBeInstanceOf(JsonSchema);
            expect((secondColumn.items["[0]"].entries[0] as JsonSchema).schema).toEqual(fooSchema);
            expect(secondColumn.onSelect).toBeDefined();
            secondColumn.onSelect(null);
            expect(lastCalledOnSelectColumnIndex).toBe(1);
            expect(secondColumn.selectedItem).toBe("[0]");
            expect(secondColumn.trailingSelection).toBe(true);
            const thirdColumn = (columnData[2] as unknown) as RenderItemsColumn;
            expect(Object.keys(thirdColumn.items)).toHaveLength(1);
            expect(thirdColumn.items.qux).toBeInstanceOf(JsonSchemaGroup);
            expect(thirdColumn.selectedItem).toBeFalsy();
            expect(thirdColumn.trailingSelection).toBeFalsy();
        });
        it("allows for arrays in arrays", () => {
            const { columnData } = getRenderData(schemas, [], ["foobar", "[0]", "[0]", "qux"], {});
            expect(columnData).toHaveLength(4);
            const rootColumn = (columnData[0] as unknown) as RenderItemsColumn;
            expect(Object.keys(rootColumn.items)).toHaveLength(2);
            expect(rootColumn.items.foobar).toBeInstanceOf(JsonSchemaGroup);
            expect(rootColumn.selectedItem).toBe("foobar");
            expect(rootColumn.trailingSelection).toBeFalsy();
            const secondColumn = (columnData[1] as unknown) as RenderItemsColumn;
            expect(Object.keys(secondColumn.items)).toHaveLength(1);
            expect(secondColumn.items["[0]"]).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.items["[0]"].entries).toHaveLength(1);
            expect(secondColumn.items["[0]"].entries[0]).toBeInstanceOf(JsonSchema);
            expect((secondColumn.items["[0]"].entries[0] as JsonSchema).schema).toEqual(barSchema);
            expect(secondColumn.onSelect).toBeDefined();
            secondColumn.onSelect(null);
            expect(lastCalledOnSelectColumnIndex).toBe(1);
            expect(secondColumn.selectedItem).toBe("[0]");
            expect(secondColumn.trailingSelection).toBeFalsy();
            const thirdColumn = (columnData[2] as unknown) as RenderItemsColumn;
            expect(Object.keys(thirdColumn.items)).toHaveLength(1);
            expect((thirdColumn.items["[0]"].entries[0] as JsonSchema).schema).toEqual(fooSchema);
            expect(thirdColumn.selectedItem).toBe("[0]");
            expect(thirdColumn.trailingSelection).toBeFalsy();
            const fourthColumn = (columnData[3] as unknown) as RenderItemsColumn;
            expect(Object.keys(fourthColumn.items)).toHaveLength(1);
            expect(fourthColumn.items.qux).toBeInstanceOf(JsonSchemaGroup);
            expect(fourthColumn.selectedItem).toBe("qux");
            expect(fourthColumn.trailingSelection).toBe(true);
        });
        it("calls provided buildArrayItemProperties() with array schema and option indexes", () => {
            const buildArrayProperties: InspectorProps["buildArrayProperties"] = (arrayItemSchema, arraySchemaGroup, optionIndexes) => ({
                "get(0)": arrayItemSchema,
                "size()": {
                    type: "number",
                    minimum: getFieldValueFromSchemaGroup(arraySchemaGroup, "minItems", maximumValue, 0, null, optionIndexes)
                }
            });
            const rootSchemas = {
                bar: {
                    oneOf: [barSchema, foobarSchema]
                }
            };
            const { columnData } = getRenderData(rootSchemas, [], ["bar", [0], "get(0)"], {}, buildArrayProperties);
            expect(columnData).toHaveLength(4);
            const rootColumn = (columnData[0] as unknown) as RenderItemsColumn;
            expect(Object.keys(rootColumn.items)).toHaveLength(1);
            expect(rootColumn.items.bar).toBeInstanceOf(JsonSchemaGroup);
            expect(rootColumn.selectedItem).toBe("bar");
            expect(rootColumn.trailingSelection).toBeFalsy();
            const secondColumn = (columnData[1] as unknown) as RenderOptionsColumn;
            expect((secondColumn.contextGroup.entries[0] as JsonSchema).schema).toEqual(rootSchemas.bar);
            expect(secondColumn.options).toEqual({
                groupTitle: "one of",
                options: [{}, {}]
            });
            expect(secondColumn.selectedItem).toEqual([0]);
            expect(secondColumn.trailingSelection).toBeFalsy();
            const thirdColumn = (columnData[2] as unknown) as RenderItemsColumn;
            expect(Object.keys(thirdColumn.items)).toHaveLength(2);
            expect((thirdColumn.items["get(0)"].entries[0] as JsonSchema).schema).toEqual(fooSchema);
            expect((thirdColumn.items["size()"].entries[0] as JsonSchema).schema).toEqual({
                type: "number",
                minimum: 3
            });
            expect(thirdColumn.selectedItem).toBe("get(0)");
            expect(thirdColumn.onSelect).toBeDefined();
            expect(thirdColumn.trailingSelection).toBe(true);
            const fourthColumn = (columnData[3] as unknown) as RenderItemsColumn;
            expect(Object.keys(fourthColumn.items)).toHaveLength(1);
            expect(fourthColumn.items.qux).toBeInstanceOf(JsonSchemaGroup);
            expect(fourthColumn.selectedItem).toBeFalsy();
            expect(fourthColumn.trailingSelection).toBeFalsy();
        });
    });
    describe("with optionals", () => {
        const schemas = {
            root: {
                oneOf: [
                    {
                        properties: {
                            foo: { title: "Foo" }
                        }
                    },
                    {
                        anyOf: [{ title: "Bar" }, { description: "Foobar" }]
                    }
                ]
            }
        };
        const expectedOptions = {
            groupTitle: "exactly one of",
            optionNameForIndex: JSON.stringify,
            options: [
                {},
                {
                    groupTitle: "at least one of",
                    optionNameForIndex: JSON.stringify,
                    options: [{}, {}]
                }
            ]
        };
        const parserConfig: ParserConfig = {
            anyOf: { groupTitle: "at least one of", optionNameForIndex: JSON.stringify },
            oneOf: { groupTitle: "exactly one of", optionNameForIndex: JSON.stringify }
        };

        it.each`
            testTitle                              | selectedItems
            ${"without option selection"}          | ${["root"]}
            ${"ignoring invalid option selection"} | ${["root", [3]]}
        `("offering the selected root schema's options ($testTitle)", ({ selectedItems }) => {
            const { columnData } = getRenderData(schemas, [], selectedItems, parserConfig);
            expect(columnData).toHaveLength(2);
            const rootColumn = (columnData[0] as unknown) as RenderItemsColumn;
            expect(Object.keys(rootColumn.items)).toHaveLength(1);
            expect(rootColumn.onSelect).toBeDefined();
            rootColumn.onSelect(null);
            expect(lastCalledOnSelectColumnIndex).toBe(0);
            expect(rootColumn.selectedItem).toBe("root");
            expect(rootColumn.trailingSelection).toBe(true);
            const secondColumn = (columnData[1] as unknown) as RenderOptionsColumn;
            expect(secondColumn.options).toEqual(expectedOptions);
            expect(secondColumn.contextGroup).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.contextGroup.entries).toHaveLength(2);
            expect(secondColumn.contextGroup.entries[0]).toBeInstanceOf(JsonSchema);
            expect(secondColumn.contextGroup.entries[1]).toBeInstanceOf(JsonSchemaGroup);
            expect((secondColumn.contextGroup.entries[1] as JsonSchemaGroup).entries).toHaveLength(2);
            expect(secondColumn.onSelect).toBeDefined();
            secondColumn.onSelect(null);
            expect(lastCalledOnSelectColumnIndex).toBe(1);
            expect(secondColumn.selectedItem).toBeFalsy();
            expect(secondColumn.trailingSelection).toBeFalsy();
        });
        it.each`
            testTitle                                                 | selectedItems
            ${"valid selection"}                                      | ${["root", [0]]}
            ${"ignoring option selection where there are no options"} | ${["root", [0], [0]]}
        `("offering the selected option's properties", ({ selectedItems }) => {
            const { columnData } = getRenderData(schemas, [], selectedItems, parserConfig);
            expect(columnData).toHaveLength(3);
            const rootColumn = (columnData[0] as unknown) as RenderItemsColumn;
            expect(Object.keys(rootColumn.items)).toHaveLength(1);
            expect(rootColumn.selectedItem).toBe("root");
            expect(rootColumn.trailingSelection).toBeFalsy();
            const secondColumn = (columnData[1] as unknown) as RenderOptionsColumn;
            expect(secondColumn.options).toEqual(expectedOptions);
            expect(secondColumn.contextGroup).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.contextGroup.entries).toHaveLength(2);
            expect(secondColumn.contextGroup.entries[0]).toBeInstanceOf(JsonSchema);
            expect(secondColumn.contextGroup.entries[1]).toBeInstanceOf(JsonSchemaGroup);
            expect((secondColumn.contextGroup.entries[1] as JsonSchemaGroup).entries).toHaveLength(2);
            expect(secondColumn.selectedItem).toEqual([0]);
            expect(secondColumn.trailingSelection).toBe(true);
            const thirdColumn = (columnData[2] as unknown) as RenderItemsColumn;
            expect(Object.keys(thirdColumn.items)).toHaveLength(1);
            expect(thirdColumn.items.foo).toBeInstanceOf(JsonSchemaGroup);
            expect(thirdColumn.items.foo.entries).toHaveLength(1);
            expect(thirdColumn.items.foo.entries[0]).toBeInstanceOf(JsonSchema);
            expect((thirdColumn.items.foo.entries[0] as JsonSchema).schema).toEqual({ title: "Foo" });
            expect(thirdColumn.selectedItem).toBeFalsy();
            expect(thirdColumn.trailingSelection).toBeFalsy();
        });
        it("ignoring an invalid option selection", () => {
            const { columnData } = getRenderData(schemas, [], ["root", [0]], parserConfig);
            expect(columnData).toHaveLength(3);
            const rootColumn = (columnData[0] as unknown) as RenderItemsColumn;
            expect(Object.keys(rootColumn.items)).toHaveLength(1);
            expect(rootColumn.selectedItem).toBe("root");
            expect(rootColumn.trailingSelection).toBeFalsy();
            const secondColumn = (columnData[1] as unknown) as RenderOptionsColumn;
            expect(secondColumn.options).toEqual(expectedOptions);
            expect(secondColumn.contextGroup).toBeInstanceOf(JsonSchemaGroup);
            const secondColumnContextGroup = secondColumn.contextGroup;
            expect(secondColumnContextGroup.entries).toHaveLength(2);
            expect(secondColumnContextGroup.entries[0]).toBeInstanceOf(JsonSchema);
            expect(secondColumnContextGroup.entries[1]).toBeInstanceOf(JsonSchemaGroup);
            expect((secondColumnContextGroup.entries[1] as JsonSchemaGroup).entries).toHaveLength(2);
            expect(secondColumn.selectedItem).toEqual([0]);
            expect(secondColumn.trailingSelection).toBe(true);
            const thirdColumn = (columnData[2] as unknown) as RenderItemsColumn;
            expect(Object.keys(thirdColumn.items)).toHaveLength(1);
            expect(thirdColumn.items.foo).toBeInstanceOf(JsonSchemaGroup);
            const thirdColumnItemsFoo = thirdColumn.items.foo as JsonSchemaGroup;
            expect(thirdColumnItemsFoo.entries).toHaveLength(1);
            expect(thirdColumnItemsFoo.entries[0]).toBeInstanceOf(JsonSchema);
            expect((thirdColumnItemsFoo.entries[0] as JsonSchema).schema).toEqual({ title: "Foo" });
            expect(thirdColumn.selectedItem).toBeFalsy();
            expect(thirdColumn.trailingSelection).toBeFalsy();
        });
    });
});
describe("createFilterFunctionForColumn()", () => {
    describe("returning filter function for simple schema", () => {
        it("finding match in all column entries", () => {
            const filterFunction = createFilterFunctionForColumn(() => true);
            const columnInput = {
                items: {
                    one: createGroupFromSchema(new JsonSchema({ title: "Foo" }, {})),
                    other: createGroupFromSchema(new JsonSchema({ description: "Bar" }, {}))
                }
            };
            expect(filterFunction(columnInput)).toEqual(["one", "other"]);
        });
        it("finding match in some column entries", () => {
            const filterFunction = createFilterFunctionForColumn((rawSchema) => rawSchema.title === "value");
            const columnInput = {
                items: {
                    one: createGroupFromSchema(new JsonSchema({ description: "value" }, {})),
                    other: createGroupFromSchema(new JsonSchema({ title: "value" }, {}))
                }
            };
            expect(filterFunction(columnInput)).toEqual(["other"]);
        });
        it("returning empty array if no match can be found", () => {
            const filterFunction = createFilterFunctionForColumn(() => false);
            const columnInput = {
                items: {
                    one: createGroupFromSchema(new JsonSchema({ description: "value" }, {})),
                    other: createGroupFromSchema(new JsonSchema({ title: "value" }, {}))
                }
            };
            expect(filterFunction(columnInput)).toEqual([]);
        });
    });
    describe("returning filter function for complex schema", () => {
        const schema = new JsonSchema(
            {
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
                        allOf: [{ $ref: "#/definitions/Two" }, { $ref: "https://unique-schema-identifier#" }]
                    }
                }
            },
            {}
        );
        const columnInput = {
            items: {
                "Item One": createGroupFromSchema(schema.scope.find("#/definitions/One")),
                "Item Two": createGroupFromSchema(schema.scope.find("#/definitions/Two")),
                "Item Three": createGroupFromSchema(schema.scope.find("#/definitions/Three"))
            }
        };
        it("finding match via circular reference to parent schema", () => {
            const filterFunction = createFilterFunctionForColumn((rawSchema) => rawSchema.title === "Match");
            expect(filterFunction(columnInput)).toEqual(["Item One", "Item Three"]);
        });
        it("avoiding endless loop even if no match can be found", () => {
            const filterFunction = createFilterFunctionForColumn(() => false);
            expect(filterFunction(columnInput)).toEqual([]);
        });
    });
    describe("returning filter function for schema with optionals", () => {
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
                        anyOf: [{ $ref: "#" }, { title: "Foobar" }]
                    },
                    Four: {
                        anyOf: [{ $ref: "#/definitions/Two" }, { title: "Qux" }]
                    }
                }
            };
            const schema = new JsonSchema(rawSchema, {});
            const columnInput = {
                items: {
                    "I-One": createGroupFromSchema(schema.scope.find("#/definitions/One")),
                    "I-Two": createGroupFromSchema(schema.scope.find("#/definitions/Two")),
                    "I-Three": createGroupFromSchema(schema.scope.find("#/definitions/Three")),
                    "I-Four": createGroupFromSchema(schema.scope.find("#/definitions/Four"))
                }
            };
            const filterFunction = createFilterFunctionForColumn((rawSubSchema) => rawSubSchema.title === "Match");
            expect(filterFunction(columnInput)).toEqual(["I-One", "I-Two", "I-Three", "I-Four"]);
        });
        describe("finding matches in options", () => {
            const rawSchema = {
                oneOf: [
                    { description: "Foo" },
                    { title: "Match" },
                    {
                        oneOf: [{ title: "Match" }, { description: "Bar" }]
                    },
                    {
                        anyOf: [
                            { description: "Foobar" },
                            {
                                items: {
                                    anyOf: [{ title: "Match" }, { title: "Qux" }]
                                }
                            }
                        ]
                    }
                ],
                anyOf: [
                    { title: "Match" },
                    { description: "Foo" },
                    {
                        anyOf: [{ description: "Bar" }, { title: "Match" }]
                    },
                    {
                        oneOf: [
                            {
                                items: {
                                    oneOf: [{ title: "Qux" }, { title: "Match" }]
                                }
                            },
                            { description: "Foobar" }
                        ]
                    }
                ]
            };
            const schema = new JsonSchema(rawSchema, {});
            const contextGroup = createGroupFromSchema(schema);
            const columnInput = {
                contextGroup,
                options: getOptionsInSchemaGroup(contextGroup)
            };
            const filterFunction = createFilterFunctionForColumn((rawSubSchema) => rawSubSchema.title === "Match");
            // stringify to more easily detect differences in case of test failure
            expect(JSON.stringify(filterFunction(columnInput))).toEqual(JSON.stringify([[0, 0], [0, 2, 1], [0, 3, 0], [1, 1], [1, 2, 0], [1, 3, 1]]));
        });
    });
});
