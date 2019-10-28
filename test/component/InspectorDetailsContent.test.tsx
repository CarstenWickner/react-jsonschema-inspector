import * as React from "react";
import { shallow } from "enzyme";

import { InspectorDetailsContent, collectFormFields } from "../../src/component/InspectorDetailsContent";
import { JsonSchema } from "../../src/model/JsonSchema";
import { createGroupFromSchema } from "../../src/model/schemaUtils";
import { createRenderDataBuilder } from "../../src/component/renderDataUtils";
import { RenderItemsColumn } from "../../src/types/Inspector";

describe("renders correctly", () => {
    const buildColumnData = createRenderDataBuilder(() => (): void => {});
    it("with minimal/default props", () => {
        const schemas = {
            "Schema One": {
                title: "Schema Title",
                description: "Text"
            }
        };
        const { columnData } = buildColumnData(schemas, [], ["Schema One"], {});
        const component = shallow(
            <InspectorDetailsContent
                columnData={columnData}
                itemSchemaGroup={((columnData[0] as unknown) as RenderItemsColumn).items["Schema One"]}
                selectionColumnIndex={0}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("with root array selection", () => {
        const arrayItemSchema = {
            description: "Array Item",
            type: "object"
        };
        const schema = {
            title: "Schema Title",
            items: { $ref: "#/definitions/itemSchema" },
            definitions: { itemSchema: arrayItemSchema }
        };
        const { columnData } = buildColumnData({ "Schema One": schema }, [], ["Schema One"], {});
        const component = shallow(
            <InspectorDetailsContent
                columnData={columnData}
                itemSchemaGroup={((columnData[0] as unknown) as RenderItemsColumn).items["Schema One"]}
                selectionColumnIndex={0}
            />
        );
        expect(component.find("InspectorDetailsForm").prop("fields")).toEqual([
            {
                labelText: "Title",
                rowValue: "Schema Title"
            }
        ]);
    });
    it("with option selection", () => {
        const schema = {
            oneOf: [{ title: "Foo" }, { title: "Bar" }]
        };
        const { columnData } = buildColumnData({ Foo: schema }, [], ["Foo", [1]], {});
        const component = shallow(
            <InspectorDetailsContent
                columnData={columnData}
                itemSchemaGroup={((columnData[0] as unknown) as RenderItemsColumn).items.Foo}
                selectionColumnIndex={1}
            />
        );
        expect(component.find("InspectorDetailsForm").prop("fields")).toEqual([
            {
                labelText: "Title",
                rowValue: "Bar"
            }
        ]);
    });
});
describe("collectFormFields()", () => {
    const buildColumnData = createRenderDataBuilder(() => (): void => {});
    it.each`
        field            | rowValue         | labelText
        ${"title"}       | ${"Title Value"} | ${"Title"}
        ${"description"} | ${"Desc. Value"} | ${"Description"}
        ${"type"}        | ${"object"}      | ${"Type"}
        ${"const"}       | ${42}            | ${"Constant Value"}
        ${"enum"}        | ${[42, 84]}      | ${"Possible Values"}
        ${"pattern"}     | ${"[a-z]+"}      | ${"Value Pattern"}
        ${"format"}      | ${"iri"}         | ${"Value Format"}
        ${"minLength"}   | ${1}             | ${"Min Length"}
        ${"maxLength"}   | ${100}           | ${"Max Length"}
        ${"minItems"}    | ${2}             | ${"Min Items"}
        ${"maxItems"}    | ${8}             | ${"Max Items"}
    `("includes `$field` – single value", ({ field, rowValue, labelText }) => {
        const { columnData } = buildColumnData(
            {
                Foo: { [field]: rowValue }
            },
            [],
            ["Foo"],
            {}
        );
        const itemSchemaGroup = ((columnData[0] as unknown) as RenderItemsColumn).items.Foo;
        expect(collectFormFields(itemSchemaGroup, columnData, 0)).toEqual([{ labelText, rowValue }]);
    });
    it.each`
        field            | modelValueOne | modelValueTwo         | rowValue                   | labelText
        ${"title"}       | ${"Title"}    | ${"Value"}            | ${["Title", "Value"]}      | ${"Title"}
        ${"description"} | ${"Desc."}    | ${"Value"}            | ${["Desc.", "Value"]}      | ${"Description"}
        ${"type"}        | ${"object"}   | ${["object", "null"]} | ${"object"}                | ${"Type"}
        ${"pattern"}     | ${"[a-z]+"}   | ${"[a-zA-Z]+"}        | ${["[a-z]+", "[a-zA-Z]+"]} | ${"Value Pattern"}
        ${"format"}      | ${"iri"}      | ${["uri", "iri"]}     | ${"iri"}                   | ${"Value Format"}
        ${"minLength"}   | ${1}          | ${5}                  | ${5}                       | ${"Min Length"}
        ${"maxLength"}   | ${100}        | ${80}                 | ${80}                      | ${"Max Length"}
        ${"minItems"}    | ${2}          | ${3}                  | ${3}                       | ${"Min Items"}
        ${"maxItems"}    | ${8}          | ${5}                  | ${5}                       | ${"Max Items"}
    `("includes `$field` with two values in allOf", (parameters) => {
        const { field, modelValueOne, modelValueTwo, rowValue, labelText } = parameters;
        const { columnData } = buildColumnData(
            {
                Foo: {
                    allOf: [{ [field]: modelValueOne }, { [field]: modelValueTwo }]
                }
            },
            [],
            ["Foo"],
            {}
        );
        const itemSchemaGroup = ((columnData[0] as unknown) as RenderItemsColumn).items.Foo;
        expect(collectFormFields(itemSchemaGroup, columnData, 0)).toEqual([{ labelText, rowValue }]);
    });
    it("includes `title` from $ref-erenced schema", () => {
        const referenceSchemas = [
            {
                $id: "external-id",
                definitions: {
                    Bar: { title: "Foobar" }
                }
            }
        ];
        const { columnData } = buildColumnData({ Foo: { $ref: "external-id#/definitions/Bar" } }, referenceSchemas, ["Foo"], {});
        const itemSchemaGroup = ((columnData[0] as unknown) as RenderItemsColumn).items.Foo;
        expect(collectFormFields(itemSchemaGroup, columnData, 0)).toEqual([
            {
                labelText: "Title",
                rowValue: "Foobar"
            }
        ]);
    });
    describe("includes `required`", () => {
        const schemas = {
            Foo: {
                required: ["Bar"],
                properties: {
                    Bar: {
                        description: "Required Property",
                        oneOf: [{ title: "Qux" }, { required: ["Foobar"] }]
                    }
                }
            }
        };

        it("from main schema", () => {
            const { columnData } = buildColumnData(schemas, [], ["Foo", "Bar"], {});
            const itemSchemaGroup = ((columnData[1] as unknown) as RenderItemsColumn).items.Bar;
            expect(collectFormFields(itemSchemaGroup, columnData, 1)).toEqual([
                {
                    labelText: "Description",
                    rowValue: "Required Property"
                },
                {
                    labelText: "Required",
                    rowValue: "Yes"
                }
            ]);
        });
        it("from optional sub schema", () => {
            const { columnData } = buildColumnData(schemas, [], ["Foo", "Bar", [0]], {});
            const itemSchemaGroup = ((columnData[1] as unknown) as RenderItemsColumn).items.Bar;
            expect(collectFormFields(itemSchemaGroup, columnData, 2)).toEqual([
                {
                    labelText: "Title",
                    rowValue: "Qux"
                },
                {
                    labelText: "Description",
                    rowValue: "Required Property"
                },
                {
                    labelText: "Required",
                    rowValue: "Yes"
                }
            ]);
        });
        it("from property in optional sub schema", () => {
            const { columnData } = buildColumnData(schemas, [], ["Foo", "Bar", [1], "Foobar"], {});
            const itemSchemaGroup = ((columnData[3] as unknown) as RenderItemsColumn).items.Foobar;
            expect(collectFormFields(itemSchemaGroup, columnData, 3)).toEqual([
                {
                    labelText: "Required",
                    rowValue: "Yes"
                }
            ]);
        });
    });
    describe("includes `minimum`", () => {
        it.each`
            testDescription                        | schema
            ${"without `exclusiveMinimum`"}        | ${{ minimum: 42 }}
            ${"with `exclusiveMinimum` === false"} | ${{ minimum: 42, exclusiveMinimum: false }}
        `("$testDescription", ({ schema }) => {
            const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
            expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([
                {
                    labelText: "Min Value",
                    rowValue: "42 (inclusive)"
                }
            ]);
        });
    });
    describe("includes `minimum` with boolean `exclusiveMinimum` (as per Draft 4)", () => {
        it.each`
            testDescription                        | schema
            ${"simple schema"}                     | ${{ minimum: 42, exclusiveMinimum: true }}
            ${"schema with multiple allOf values"} | ${{ allOf: [{ minimum: 42, exclusiveMinimum: false }, { exclusiveMinimum: true }] }}
        `("in $testDescription", ({ schema }) => {
            const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
            expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([
                {
                    labelText: "Min Value",
                    rowValue: "42 (exclusive)"
                }
            ]);
        });
    });
    describe("includes `exclusiveMinimum` (as per Draft 6)", () => {
        it.each`
            testDescription                        | schema
            ${"simple schema"}                     | ${{ exclusiveMinimum: 42 }}
            ${"schema with multiple allOf values"} | ${{ allOf: [{ exclusiveMinimum: 20 }, { exclusiveMinimum: 42 }] }}
        `("in $testDescription", ({ schema }) => {
            const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
            expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([
                {
                    labelText: "Min Value",
                    rowValue: "42 (exclusive)"
                }
            ]);
        });
    });
    describe("includes `maximum`", () => {
        it.each`
            testDescription                        | schema
            ${"without `exclusiveMaximum`"}        | ${{ maximum: 84 }}
            ${"with `exclusiveMaximum` === false"} | ${{ maximum: 84, exclusiveMaximum: false }}
        `("$testDescription", ({ schema }) => {
            const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
            expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([
                {
                    labelText: "Max Value",
                    rowValue: "84 (inclusive)"
                }
            ]);
        });
    });
    describe("includes `maximum` with boolean `exclusiveMaximum` (as per Draft 4)", () => {
        it.each`
            testDescription                        | schema
            ${"simple schema"}                     | ${{ maximum: 84, exclusiveMaximum: true }}
            ${"schema with multiple allOf values"} | ${{ allOf: [{ maximum: 84, exclusiveMaximum: false }, { exclusiveMaximum: true }] }}
        `("in $testDescription", ({ schema }) => {
            const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
            expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([
                {
                    labelText: "Max Value",
                    rowValue: "84 (exclusive)"
                }
            ]);
        });
    });
    describe("includes `exclusiveMaximum` (as per Draft 6)", () => {
        it.each`
            testDescription                        | schema
            ${"simple schema"}                     | ${{ exclusiveMaximum: 84 }}
            ${"schema with multiple allOf values"} | ${{ allOf: [{ exclusiveMaximum: 84 }, { exclusiveMaximum: 100 }] }}
        `("in $testDescription", ({ schema }) => {
            const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
            expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([
                {
                    labelText: "Max Value",
                    rowValue: "84 (exclusive)"
                }
            ]);
        });
    });
    describe("combining 'const' and 'enum'", () => {
        const fooBarEnum = { enum: ["foo", "bar"] };
        const barBazEnum = { enum: ["bar", "baz"] };
        const fooBarBazEnum = { enum: ["foo", "bar", "baz"] };
        it.each`
            testDescription                  | inputSchema                                  | labelText            | rowValue
            ${"when only 'const'"}           | ${{ const: "foo" }}                          | ${"Constant Value"}  | ${"foo"}
            ${"when single 'enum' value"}    | ${{ enum: ["foo"] }}                         | ${"Constant Value"}  | ${"foo"}
            ${"when multiple 'enum' values"} | ${{ enum: ["foo", "bar"] }}                  | ${"Possible Values"} | ${["foo", "bar"]}
            ${"when mixed"}                  | ${{ allOf: [{ const: "foo" }, fooBarEnum] }} | ${"Constant Value"}  | ${"foo"}
            ${"when intersecting enums (1)"} | ${{ allOf: [fooBarEnum, barBazEnum] }}       | ${"Constant Value"}  | ${"bar"}
            ${"when intersecting enums (2)"} | ${{ allOf: [fooBarEnum, fooBarBazEnum] }}    | ${"Possible Values"} | ${["foo", "bar"]}
        `("$testDescription", ({ inputSchema, labelText, rowValue }) => {
            const itemSchemaGroup = createGroupFromSchema(new JsonSchema(inputSchema, {}));
            expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([{ labelText, rowValue }]);
        });
    });
    it("includes `default` (object)", () => {
        const schema = { default: {} };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
        expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([
            {
                labelText: "Default Value",
                rowValue: "{}"
            }
        ]);
    });
    it("includes `default` (non-object)", () => {
        const schema = { default: false };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
        expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([
            {
                labelText: "Default Value",
                rowValue: false
            }
        ]);
    });
    it("includes `examples` (objects)", () => {
        const schema = {
            examples: [
                {
                    field: "value"
                }
            ]
        };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
        expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([
            {
                labelText: "Example(s)",
                rowValue: '[{"field":"value"}]'
            }
        ]);
    });
    it("includes `examples` (non-objects)", () => {
        const schema = { examples: [42, 84] };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
        expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([
            {
                labelText: "Example(s)",
                rowValue: [42, 84]
            }
        ]);
    });
    it("ignores empty `examples`", () => {
        const schema: { examples: Array<string> } = { examples: [] };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
        expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([]);
    });
    describe("includes `uniqueItems`", () => {
        it.each`
            testDescription                        | schema
            ${"simple schema"}                     | ${{ uniqueItems: true }}
            ${"schema with multiple allOf values"} | ${{ allOf: [{ uniqueItems: false }, { uniqueItems: true }] }}
        `("in $testDescription", ({ schema }) => {
            const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema, {}));
            expect(collectFormFields(itemSchemaGroup, [{ items: { foo: itemSchemaGroup } }], 0)).toEqual([
                {
                    labelText: "Items Unique",
                    rowValue: "Yes"
                }
            ]);
        });
    });
});
