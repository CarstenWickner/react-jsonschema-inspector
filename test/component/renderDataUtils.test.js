import PropTypes from "prop-types";

import { createRenderDataBuilder, getColumnDataPropTypeShape, createFilterFunctionForColumn } from "../../src/component/renderDataUtils";

import JsonSchema from "../../src/model/JsonSchema";
import JsonSchemaGroup from "../../src/model/JsonSchemaGroup";
import { createGroupFromSchema, getOptionsInSchemaGroup, getFieldValueFromSchemaGroup } from "../../src/model/schemaUtils";
import { isDefined } from "../../src/model/utils";

describe("createRenderDataBuilder()", () => {
    const onSelectInColumn = jest.fn(columnIndex => () => columnIndex);
    const getRenderData = createRenderDataBuilder(onSelectInColumn);

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
            const rootColumn = columnData[0];
            // single item containing the given schema (wrapped in a JsonSchema and again wrapped in a JsonSchemaGroup)
            expect(Object.keys(rootColumn.items)).toHaveLength(1);
            expect(rootColumn.items.foo).toBeInstanceOf(JsonSchemaGroup);
            expect(rootColumn.items.foo.entries).toHaveLength(1);
            expect(rootColumn.items.foo.entries[0]).toBeInstanceOf(JsonSchema);
            expect(rootColumn.items.foo.entries[0].schema).toEqual(fooSchema);
            // onSelect being provided for column index 0
            expect(onSelectInColumn.mock.calls).toHaveLength(1);
            expect(onSelectInColumn.mock.calls[0][0]).toBe(0);

            expect(rootColumn.options).toBeUndefined();
            expect(rootColumn.contextGroup).toBeUndefined();
            expect(rootColumn.onSelect).toBeDefined();
            expect(rootColumn.onSelect()).toBe(0);
            expect(rootColumn.selectedItem).toBeFalsy();
            expect(rootColumn.trailingSelection).toBeFalsy();
        });
        it("returns single root column for multiple schemas including reference schemas", () => {
            const { columnData } = getRenderData(schemas, referenceSchemas, [], {});
            expect(columnData).toHaveLength(1);
            const rootColumn = columnData[0];
            // three items each containing a root schema (wrapped in a JsonSchema and again wrapped in a JsonSchemaGroup)
            expect(Object.keys(rootColumn.items)).toHaveLength(3);
            expect(rootColumn.items.foo).toBeInstanceOf(JsonSchemaGroup);
            expect(rootColumn.items.foo.entries).toHaveLength(1);
            expect(rootColumn.items.foo.entries[0]).toBeInstanceOf(JsonSchema);
            expect(rootColumn.items.foo.entries[0].schema).toEqual(fooSchema);
            expect(rootColumn.items.bar).toBeInstanceOf(JsonSchemaGroup);
            expect(rootColumn.items.bar.entries).toHaveLength(1);
            expect(rootColumn.items.bar.entries[0]).toBeInstanceOf(JsonSchema);
            expect(rootColumn.items.bar.entries[0].schema).toEqual(barSchema);
            expect(rootColumn.items.foobar).toBeInstanceOf(JsonSchemaGroup);
            expect(rootColumn.items.foobar.entries).toHaveLength(1);
            expect(rootColumn.items.foobar.entries[0]).toBeInstanceOf(JsonSchema);
            expect(rootColumn.items.foobar.entries[0].schema).toEqual(foobarSchema);
        });
        it("ignores invalid root selection", () => {
            const { columnData } = getRenderData(schemas, referenceSchemas, ["qux"], {});
            expect(columnData).toHaveLength(1);
            const rootColumn = columnData[0];
            expect(Object.keys(rootColumn.items)).toHaveLength(3);
            expect(rootColumn.options).toBeUndefined();
            expect(rootColumn.contextGroup).toBeUndefined();
            expect(rootColumn.onSelect).toBeDefined();
            expect(rootColumn.onSelect()).toBe(0);
            expect(rootColumn.selectedItem).toBeFalsy();
            expect(rootColumn.trailingSelection).toBeFalsy();
        });
        it("returns single column for root selection without nested items", () => {
            const { columnData } = getRenderData(schemas, referenceSchemas, ["foo"], {});
            expect(columnData).toHaveLength(1);
            const rootColumn = columnData[0];
            expect(Object.keys(rootColumn.items)).toHaveLength(3);
            expect(rootColumn.options).toBeUndefined();
            expect(rootColumn.contextGroup).toBeUndefined();
            expect(rootColumn.onSelect).toBeDefined();
            expect(rootColumn.onSelect()).toBe(0);
            expect(rootColumn.selectedItem).toBe("foo");
            expect(rootColumn.trailingSelection).toBe(true);
        });
        it("returns two columns for root selection with nested items", () => {
            const { columnData } = getRenderData(schemas, referenceSchemas, ["foobar"], {});
            expect(columnData).toHaveLength(2);
            const rootColumn = columnData[0];
            expect(Object.keys(rootColumn.items)).toHaveLength(3);
            expect(rootColumn.options).toBeUndefined();
            expect(rootColumn.contextGroup).toBeUndefined();
            expect(rootColumn.onSelect).toBeDefined();
            expect(rootColumn.onSelect()).toBe(0);
            expect(rootColumn.selectedItem).toBe("foobar");
            expect(rootColumn.trailingSelection).toBe(true);
            const secondColumn = columnData[1];
            expect(Object.keys(secondColumn.items)).toHaveLength(1);
            expect(secondColumn.items["Item Three"]).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.items["Item Three"].entries).toHaveLength(1);
            expect(secondColumn.items["Item Three"].entries[0]).toBeInstanceOf(JsonSchema);
            expect(secondColumn.items["Item Three"].entries[0].schema).toEqual(quxSchema);
            expect(secondColumn.options).toBeUndefined();
            expect(secondColumn.contextGroup).toBeUndefined();
            expect(secondColumn.onSelect).toBeDefined();
            expect(secondColumn.onSelect()).toBe(1);
            expect(secondColumn.selectedItem).toBeFalsy();
            expect(secondColumn.trailingSelection).toBeFalsy();
        });
        it("returns two columns for selection in both columns without further nested items", () => {
            const { columnData } = getRenderData(schemas, referenceSchemas, ["foobar", "Item Three"], {});
            expect(columnData).toHaveLength(2);
            const rootColumn = columnData[0];
            expect(Object.keys(rootColumn.items)).toHaveLength(3);
            expect(rootColumn.options).toBeUndefined();
            expect(rootColumn.contextGroup).toBeUndefined();
            expect(rootColumn.onSelect).toBeDefined();
            expect(rootColumn.onSelect()).toBe(0);
            expect(rootColumn.selectedItem).toBe("foobar");
            expect(rootColumn.trailingSelection).toBeFalsy();
            const secondColumn = columnData[1];
            expect(Object.keys(secondColumn.items)).toHaveLength(1);
            expect(secondColumn.items["Item Three"]).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.options).toBeUndefined();
            expect(secondColumn.contextGroup).toBeUndefined();
            expect(secondColumn.onSelect).toBeDefined();
            expect(secondColumn.onSelect()).toBe(1);
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
            const rootColumn = columnData[0];
            expect(Object.keys(rootColumn.items)).toHaveLength(2);
            expect(rootColumn.items.bar).toBeInstanceOf(JsonSchemaGroup);
            expect(rootColumn.selectedItem).toBe("bar");
            expect(rootColumn.trailingSelection).toBeFalsy();
            const secondColumn = columnData[1];
            expect(Object.keys(secondColumn.items)).toHaveLength(1);
            expect(secondColumn.items["[0]"]).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.items["[0]"].entries).toHaveLength(1);
            expect(secondColumn.items["[0]"].entries[0]).toBeInstanceOf(JsonSchema);
            expect(secondColumn.items["[0]"].entries[0].schema).toEqual(fooSchema);
            expect(secondColumn.options).toBeUndefined();
            expect(secondColumn.contextGroup).toBeUndefined();
            expect(secondColumn.onSelect).toBeDefined();
            expect(secondColumn.onSelect()).toBe(1);
            expect(secondColumn.selectedItem).toBe("[0]");
            expect(secondColumn.trailingSelection).toBe(true);
            const thirdColumn = columnData[2];
            expect(Object.keys(thirdColumn.items)).toHaveLength(1);
            expect(thirdColumn.items.qux).toBeInstanceOf(JsonSchemaGroup);
            expect(thirdColumn.selectedItem).toBeFalsy();
            expect(thirdColumn.trailingSelection).toBeFalsy();
        });
        it("allows for arrays in arrays", () => {
            const { columnData } = getRenderData(schemas, [], ["foobar", "[0]", "[0]", "qux"], {});
            expect(columnData).toHaveLength(4);
            const rootColumn = columnData[0];
            expect(Object.keys(rootColumn.items)).toHaveLength(2);
            expect(rootColumn.items.foobar).toBeInstanceOf(JsonSchemaGroup);
            expect(rootColumn.selectedItem).toBe("foobar");
            expect(rootColumn.trailingSelection).toBeFalsy();
            const secondColumn = columnData[1];
            expect(Object.keys(secondColumn.items)).toHaveLength(1);
            expect(secondColumn.items["[0]"]).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.items["[0]"].entries).toHaveLength(1);
            expect(secondColumn.items["[0]"].entries[0]).toBeInstanceOf(JsonSchema);
            expect(secondColumn.items["[0]"].entries[0].schema).toEqual(barSchema);
            expect(secondColumn.options).toBeUndefined();
            expect(secondColumn.contextGroup).toBeUndefined();
            expect(secondColumn.onSelect).toBeDefined();
            expect(secondColumn.onSelect()).toBe(1);
            expect(secondColumn.selectedItem).toBe("[0]");
            expect(secondColumn.trailingSelection).toBeFalsy();
            const thirdColumn = columnData[2];
            expect(Object.keys(thirdColumn.items)).toHaveLength(1);
            expect(thirdColumn.items["[0]"].entries[0].schema).toEqual(fooSchema);
            expect(thirdColumn.selectedItem).toBe("[0]");
            expect(thirdColumn.trailingSelection).toBeFalsy();
            const fourthColumn = columnData[3];
            expect(Object.keys(fourthColumn.items)).toHaveLength(1);
            expect(fourthColumn.items.qux).toBeInstanceOf(JsonSchemaGroup);
            expect(fourthColumn.selectedItem).toBe("qux");
            expect(fourthColumn.trailingSelection).toBe(true);
        });
        it("calls provided buildArrayItemProperties() with array schema and option indexes", () => {
            const getMaxDefined = (a, b) => {
                if (!isDefined(b)) {
                    return a;
                }
                if (!isDefined(a)) {
                    return b;
                }
                return Math.max(a, b);
            };
            const buildArrayProperties = (arrayItemSchema, arraySchemaGroup, optionIndexes) => ({
                "get(0)": arrayItemSchema,
                "size()": {
                    type: "number",
                    minItems: getFieldValueFromSchemaGroup(arraySchemaGroup, "minItems", getMaxDefined, 0, null, optionIndexes)
                }
            });
            const rootSchemas = {
                bar: {
                    oneOf: [
                        barSchema,
                        foobarSchema
                    ]
                }
            };
            const { columnData } = getRenderData(rootSchemas, [], ["bar", [0], "get(0)"], {}, buildArrayProperties);
            expect(columnData).toHaveLength(4);
            const rootColumn = columnData[0];
            expect(Object.keys(rootColumn.items)).toHaveLength(1);
            expect(rootColumn.items.bar).toBeInstanceOf(JsonSchemaGroup);
            expect(rootColumn.selectedItem).toBe("bar");
            expect(rootColumn.trailingSelection).toBeFalsy();
            const secondColumn = columnData[1];
            expect(secondColumn.items).toBeUndefined();
            expect(secondColumn.contextGroup.entries[0].schema).toEqual(rootSchemas.bar);
            expect(secondColumn.options).toEqual({
                groupTitle: "one of",
                options: [{}, {}]
            });
            expect(secondColumn.selectedItem).toEqual([0]);
            expect(secondColumn.trailingSelection).toBeFalsy();
            const thirdColumn = columnData[2];
            expect(Object.keys(thirdColumn.items)).toHaveLength(2);
            expect(thirdColumn.items["get(0)"].entries[0].schema).toEqual(fooSchema);
            expect(thirdColumn.items["size()"].entries[0].schema).toEqual({
                type: "number",
                minItems: 3
            });
            expect(thirdColumn.selectedItem).toBe("get(0)");
            expect(thirdColumn.options).toBeUndefined();
            expect(thirdColumn.contextGroup).toBeUndefined();
            expect(thirdColumn.onSelect).toBeDefined();
            expect(thirdColumn.trailingSelection).toBe(true);
            const fourthColumn = columnData[3];
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
                        anyOf: [
                            { title: "Bar" },
                            { description: "Foobar" }
                        ]
                    }
                ]
            }
        };
        const expectedOptions = {
            groupTitle: "one of",
            options: [
                {},
                {
                    groupTitle: "any of",
                    options: [
                        {}, {}
                    ]
                }
            ]
        };

        it.each`
            testTitle                               | selectedItems
            ${"without option selection"}           | ${["root"]}
            ${"ignoring invalid option selection"}  | ${["root", [3]]}
        `("offering the selected root schema's options ($testTitle)", ({ selectedItems }) => {
            const { columnData } = getRenderData(schemas, [], selectedItems);
            expect(columnData).toHaveLength(2);
            const rootColumn = columnData[0];
            expect(Object.keys(rootColumn.items)).toHaveLength(1);
            expect(rootColumn.options).toBeUndefined();
            expect(rootColumn.contextGroup).toBeUndefined();
            expect(rootColumn.onSelect).toBeDefined();
            expect(rootColumn.onSelect()).toBe(0);
            expect(rootColumn.selectedItem).toBe("root");
            expect(rootColumn.trailingSelection).toBe(true);
            const secondColumn = columnData[1];
            expect(secondColumn.items).toBeUndefined();
            expect(secondColumn.options).toEqual(expectedOptions);
            expect(secondColumn.contextGroup).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.contextGroup.entries).toHaveLength(2);
            expect(secondColumn.contextGroup.entries[0]).toBeInstanceOf(JsonSchema);
            expect(secondColumn.contextGroup.entries[1]).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.contextGroup.entries[1].entries).toHaveLength(2);
            expect(secondColumn.onSelect).toBeDefined();
            expect(secondColumn.onSelect()).toBe(1);
            expect(secondColumn.selectedItem).toBeFalsy();
            expect(secondColumn.trailingSelection).toBeFalsy();
        });
        it.each`
            testTitle                                                 | selectedItems
            ${"valid selection"}                                      | ${["root", [0]]}
            ${"ignoring option selection where there are no options"} | ${["root", [0], [0]]}
        `("offering the selected option's properties", ({ selectedItems }) => {
            const { columnData } = getRenderData(schemas, [], selectedItems);
            expect(columnData).toHaveLength(3);
            const rootColumn = columnData[0];
            expect(Object.keys(rootColumn.items)).toHaveLength(1);
            expect(rootColumn.options).toBeUndefined();
            expect(rootColumn.contextGroup).toBeUndefined();
            expect(rootColumn.selectedItem).toBe("root");
            expect(rootColumn.trailingSelection).toBeFalsy();
            const secondColumn = columnData[1];
            expect(secondColumn.items).toBeUndefined();
            expect(secondColumn.options).toEqual(expectedOptions);
            expect(secondColumn.contextGroup).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.contextGroup.entries).toHaveLength(2);
            expect(secondColumn.contextGroup.entries[0]).toBeInstanceOf(JsonSchema);
            expect(secondColumn.contextGroup.entries[1]).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.contextGroup.entries[1].entries).toHaveLength(2);
            expect(secondColumn.selectedItem).toEqual([0]);
            expect(secondColumn.trailingSelection).toBe(true);
            const thirdColumn = columnData[2];
            expect(Object.keys(thirdColumn.items)).toHaveLength(1);
            expect(thirdColumn.items.foo).toBeInstanceOf(JsonSchemaGroup);
            expect(thirdColumn.items.foo.entries).toHaveLength(1);
            expect(thirdColumn.items.foo.entries[0]).toBeInstanceOf(JsonSchema);
            expect(thirdColumn.items.foo.entries[0].schema).toEqual({ title: "Foo" });
            expect(thirdColumn.options).toBeUndefined();
            expect(thirdColumn.contextGroup).toBeUndefined();
            expect(thirdColumn.selectedItem).toBeFalsy();
            expect(thirdColumn.trailingSelection).toBeFalsy();
        });
        it("ignoring an invalid option selection", () => {
            const { columnData } = getRenderData(schemas, [], ["root", [0]]);
            expect(columnData).toHaveLength(3);
            const rootColumn = columnData[0];
            expect(Object.keys(rootColumn.items)).toHaveLength(1);
            expect(rootColumn.options).toBeUndefined();
            expect(rootColumn.contextGroup).toBeUndefined();
            expect(rootColumn.selectedItem).toBe("root");
            expect(rootColumn.trailingSelection).toBeFalsy();
            const secondColumn = columnData[1];
            expect(secondColumn.items).toBeUndefined();
            expect(secondColumn.options).toEqual(expectedOptions);
            expect(secondColumn.contextGroup).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.contextGroup.entries).toHaveLength(2);
            expect(secondColumn.contextGroup.entries[0]).toBeInstanceOf(JsonSchema);
            expect(secondColumn.contextGroup.entries[1]).toBeInstanceOf(JsonSchemaGroup);
            expect(secondColumn.contextGroup.entries[1].entries).toHaveLength(2);
            expect(secondColumn.selectedItem).toEqual([0]);
            expect(secondColumn.trailingSelection).toBe(true);
            const thirdColumn = columnData[2];
            expect(Object.keys(thirdColumn.items)).toHaveLength(1);
            expect(thirdColumn.items.foo).toBeInstanceOf(JsonSchemaGroup);
            expect(thirdColumn.items.foo.entries).toHaveLength(1);
            expect(thirdColumn.items.foo.entries[0]).toBeInstanceOf(JsonSchema);
            expect(thirdColumn.items.foo.entries[0].schema).toEqual({ title: "Foo" });
            expect(thirdColumn.options).toBeUndefined();
            expect(thirdColumn.contextGroup).toBeUndefined();
            expect(thirdColumn.selectedItem).toBeFalsy();
            expect(thirdColumn.trailingSelection).toBeFalsy();
        });
    });
});
describe("getColumnDataPropTypeShape()", () => {
    const columnDataPropTypeShape = getColumnDataPropTypeShape();
    describe("contextGroup", () => {
        it("no error if only `items` provided", () => {
            const result = columnDataPropTypeShape.contextGroup({
                items: {
                    foo: new JsonSchemaGroup()
                }
            });
            expect(result).toBe(null);
        });
        it("no error if `contextGroup` and `options` provided", () => {
            const result = columnDataPropTypeShape.contextGroup({
                contextGroup: new JsonSchemaGroup(),
                options: {
                    options: [{}, {}]
                }
            });
            expect(result).toBe(null);
        });
        it("no error if `contextGroup` is no JsonSchemaGroup", () => {
            const result = columnDataPropTypeShape.contextGroup({
                contextGroup: new JsonSchema(),
                options: {
                    options: [{}, {}]
                }
            });
            expect(result).toBeInstanceOf(Error);
        });
        it("error if no props provided", () => {
            const result = columnDataPropTypeShape.contextGroup({});
            expect(result).toBeInstanceOf(Error);
        });
        it("error if only `contextGroup` but no `options` provided", () => {
            const result = columnDataPropTypeShape.contextGroup({
                contextGroup: new JsonSchemaGroup()
            });
            expect(result).toBeInstanceOf(Error);
        });
        it("error if only `options` but no `contextGroup` provided", () => {
            const result = columnDataPropTypeShape.contextGroup({
                options: {
                    options: [{}, {}]
                }
            });
            expect(result).toBeInstanceOf(Error);
        });
        it("error if only empty `items` provided", () => {
            const result = columnDataPropTypeShape.contextGroup({
                items: {}
            });
            expect(result).toBeInstanceOf(Error);
        });
    });
    describe("selectedItem", () => {
        it("no error if no props provided", () => {
            const result = columnDataPropTypeShape.selectedItem({});
            expect(result).toBe(null);
        });
        it("no error if selectedItem is a string", () => {
            const result = columnDataPropTypeShape.selectedItem({ selectedItem: "foo" });
            expect(result).toBe(null);
        });
        it("no error if selectedItem is an array of numbers", () => {
            const result = columnDataPropTypeShape.selectedItem({ selectedItem: [0, 1, 5] });
            expect(result).toBe(null);
        });
        it("error if selectedItem is an empty array", () => {
            const result = columnDataPropTypeShape.selectedItem({ selectedItem: [] });
            expect(result).toBeInstanceOf(Error);
        });
        it("error if selectedItem is a number", () => {
            const result = columnDataPropTypeShape.selectedItem({ selectedItem: 0 });
            expect(result).toBeInstanceOf(Error);
        });
        it("error if selectedItem is a mixed array", () => {
            const result = columnDataPropTypeShape.selectedItem({ selectedItem: [0, "foo", 5] });
            expect(result).toBeInstanceOf(Error);
        });
    });
    describe("trailingSelection", () => {
        it("no error if no props provided", () => {
            const result = columnDataPropTypeShape.trailingSelection({});
            expect(result).toBe(null);
        });
        it("no error if `trailingSelection` is false", () => {
            const result = columnDataPropTypeShape.trailingSelection({
                trailingSelection: false
            });
            expect(result).toBe(null);
        });
        it("no error if `trailingSelection` is true and `selectedItem` is provided", () => {
            const result = columnDataPropTypeShape.trailingSelection({
                trailingSelection: true,
                selectedItem: "foo"
            });
            expect(result).toBe(null);
        });
        it("error if `trailingSelection` is true and no `selectedItem` is provided", () => {
            const result = columnDataPropTypeShape.trailingSelection({
                trailingSelection: true
            });
            expect(result).toBeInstanceOf(Error);
        });
        it("error if `trailingSelection` is a number", () => {
            const result = columnDataPropTypeShape.trailingSelection({
                trailingSelection: 0
            });
            expect(result).toBeInstanceOf(Error);
        });
    });
    describe("filteredItems", () => {
        it("no error if no props provided", () => {
            const result = columnDataPropTypeShape.filteredItems({});
            expect(result).toBe(null);
        });
        it("no error if `filteredItems` is empty array", () => {
            const result = columnDataPropTypeShape.filteredItems({
                filteredItems: [],
                items: {}
            });
            expect(result).toBe(null);
        });
        it("no error if `filteredItems` included in `items`", () => {
            const result = columnDataPropTypeShape.filteredItems({
                filteredItems: ["foo", "bar"],
                items: {
                    foo: new JsonSchemaGroup(),
                    bar: new JsonSchemaGroup(),
                    foobar: new JsonSchemaGroup()
                }
            });
            expect(result).toBe(null);
        });
        it("no error if `filteredItems` included in `options`", () => {
            const result = columnDataPropTypeShape.filteredItems({
                filteredItems: [[0], [1, 0]],
                options: {
                    options: [
                        {},
                        {
                            options: [{}, {}]
                        }
                    ]
                }
            });
            expect(result).toBe(null);
        });
        it("error if `filteredItems` is not an array", () => {
            const result = columnDataPropTypeShape.filteredItems({
                filteredItems: "foo",
                items: {}
            });
            expect(result).toBeInstanceOf(Error);
        });
        it("error if `filteredItems` not included in `items`", () => {
            const result = columnDataPropTypeShape.filteredItems({
                filteredItems: ["foo", "bar", "baz"],
                items: {
                    foo: new JsonSchemaGroup(),
                    bar: new JsonSchemaGroup(),
                    foobar: new JsonSchemaGroup()
                }
            });
            expect(result).toBeInstanceOf(Error);
        });
        it("error if `filteredItems` not included in `options`", () => {
            const result = columnDataPropTypeShape.filteredItems({
                filteredItems: [[0], [1]],
                options: {
                    options: [
                        {},
                        {
                            options: [{}, {}]
                        }
                    ]
                }
            });
            expect(result).toBeInstanceOf(Error);
        });
    });
    it("can treat onSelect as optional", () => {
        const propTypeShapeWithOptionalOnSelect = getColumnDataPropTypeShape(false);
        expect(Object.keys(propTypeShapeWithOptionalOnSelect)).toEqual(Object.keys(columnDataPropTypeShape));
        expect(propTypeShapeWithOptionalOnSelect.onSelect).toEqual(PropTypes.func);
    });
});
describe("createFilterFunctionForColumn()", () => {
    describe("returning filter function for simple schema", () => {
        it("finding match in all column entries", () => {
            const filterFunction = createFilterFunctionForColumn(() => true);
            const columnInput = {
                items: {
                    one: createGroupFromSchema(new JsonSchema({ title: "Foo" })),
                    other: createGroupFromSchema(new JsonSchema({ description: "Bar" }))
                }
            };
            expect(filterFunction(columnInput)).toEqual(["one", "other"]);
        });
        it("finding match in some column entries", () => {
            const filterFunction = createFilterFunctionForColumn(rawSchema => rawSchema.title === "value");
            const columnInput = {
                items: {
                    one: createGroupFromSchema(new JsonSchema({ description: "value" })),
                    other: createGroupFromSchema(new JsonSchema({ title: "value" }))
                }
            };
            expect(filterFunction(columnInput)).toEqual(["other"]);
        });
        it("returning empty array if no match can be found", () => {
            const filterFunction = createFilterFunctionForColumn(() => false);
            const columnInput = {
                items: {
                    one: createGroupFromSchema(new JsonSchema({ description: "value" })),
                    other: createGroupFromSchema(new JsonSchema({ title: "value" }))
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
                "Item One": createGroupFromSchema(schema.scope.find("#/definitions/One")),
                "Item Two": createGroupFromSchema(schema.scope.find("#/definitions/Two")),
                "Item Three": createGroupFromSchema(schema.scope.find("#/definitions/Three"))
            }
        };
        it("finding match via circular reference to parent schema", () => {
            const filterFunction = createFilterFunctionForColumn(rawSchema => rawSchema.title === "Match");
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
            const schema = new JsonSchema(rawSchema);
            const columnInput = {
                items: {
                    "I-One": createGroupFromSchema(schema.scope.find("#/definitions/One")),
                    "I-Two": createGroupFromSchema(schema.scope.find("#/definitions/Two")),
                    "I-Three": createGroupFromSchema(schema.scope.find("#/definitions/Three")),
                    "I-Four": createGroupFromSchema(schema.scope.find("#/definitions/Four"))
                }
            };
            const filterFunction = createFilterFunctionForColumn(rawSubSchema => rawSubSchema.title === "Match");
            expect(filterFunction(columnInput)).toEqual(["I-One", "I-Two", "I-Three", "I-Four"]);
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
            const schema = new JsonSchema(rawSchema);
            const contextGroup = createGroupFromSchema(schema);
            const columnInput = {
                contextGroup,
                options: getOptionsInSchemaGroup(contextGroup)
            };
            const filterFunction = createFilterFunctionForColumn(rawSubSchema => rawSubSchema.title === "Match");
            // stringify to more easily detect differences in case of test failure
            expect(JSON.stringify(filterFunction(columnInput))).toEqual(JSON.stringify([
                [0, 0],
                [0, 2, 1],
                [0, 3, 0],
                [1, 1],
                [1, 2, 0],
                [1, 3, 1]
            ]));
        });
    });
});
