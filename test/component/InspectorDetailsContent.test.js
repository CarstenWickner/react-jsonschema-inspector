import React from "react";
import { shallow } from "enzyme";

import InspectorDetailsContent, { collectFormFields } from "../../src/component/InspectorDetailsContent";
import JsonSchema from "../../src/model/JsonSchema";
import { createGroupFromSchema } from "../../src/model/schemaUtils";
import { createRenderDataBuilder } from "../../src/component/renderDataUtils";

describe("renders correctly", () => {
    const buildColumnData = createRenderDataBuilder(() => () => { });
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
                itemSchemaGroup={columnData[0].items["Schema One"]}
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
                itemSchemaGroup={columnData[0].items["Schema One"]}
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
        const parserConfig = {
            oneOf: { type: "asAdditionalColumn" }
        };
        const schema = {
            oneOf: [
                { title: "Foo" },
                { title: "Bar" }
            ]
        };
        const { columnData } = buildColumnData({ Foo: schema }, [], ["Foo", [1]], parserConfig);
        const component = shallow(
            <InspectorDetailsContent
                columnData={columnData}
                itemSchemaGroup={columnData[0].items.Foo}
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
    const buildColumnData = createRenderDataBuilder(() => () => { });
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
    `("includes `$field`", ({ field, rowValue, labelText }) => {
        const { columnData } = buildColumnData({ Foo: { [field]: rowValue } }, [], ["Foo"], {});
        const itemSchemaGroup = columnData[0].items.Foo;
        expect(collectFormFields(itemSchemaGroup, columnData, 0))
            .toEqual([{ labelText, rowValue }]);
    });
    it("includes `title` from $ref-erenced schema", () => {
        const referenceSchemas = [{
            $id: "external-id",
            definitions: {
                Bar: { title: "Foobar" }
            }
        }];
        const { columnData } = buildColumnData({ Foo: { $ref: "external-id#/definitions/Bar" } }, referenceSchemas, ["Foo"], {});
        const itemSchemaGroup = columnData[0].items.Foo;
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
                        oneOf: [
                            { title: "Qux" },
                            { title: "Quux" }
                        ]
                    }
                },
                anyOf: [
                    { required: ["Foobar"] },
                    true
                ]
            }
        };

        it("from main schema", () => {
            const { columnData } = buildColumnData(schemas, [], ["Foo", "Bar"], {});
            const itemSchemaGroup = columnData[1].items.Bar;
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
            const parserConfig = {
                oneOf: { type: "asAdditionalColumn" }
            };
            const { columnData } = buildColumnData(schemas, [], ["Foo", "Bar", [0]], parserConfig);
            const itemSchemaGroup = columnData[1].items.Bar;
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
            const parserConfig = {
                anyOf: { type: "asAdditionalColumn" }
            };
            const { columnData } = buildColumnData(schemas, [], ["Foo", [0], "Foobar"], parserConfig);
            const itemSchemaGroup = columnData[2].items.Foobar;
            expect(collectFormFields(itemSchemaGroup, columnData, 2)).toEqual([
                {
                    labelText: "Required",
                    rowValue: "Yes"
                }
            ]);
        });
    });
    it("includes `minimum` without exclusiveMinimum", () => {
        const schema = { minimum: 42 };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(collectFormFields(itemSchemaGroup, [{}], 0)).toEqual([
            {
                labelText: "Min Value",
                rowValue: "42 (inclusive)"
            }
        ]);
    });
    it("includes `minimum` with boolean exclusiveMinimum (as per Draft 4)", () => {
        const schema = {
            minimum: 42,
            exclusiveMinimum: true
        };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(collectFormFields(itemSchemaGroup, [{}], 0)).toEqual([
            {
                labelText: "Min Value",
                rowValue: "42 (exclusive)"
            }
        ]);
    });
    it("includes `exclusiveMinimum` (as per Draft 6)", () => {
        const schema = {
            exclusiveMinimum: 42
        };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(collectFormFields(itemSchemaGroup, [{}], 0)).toEqual([
            {
                labelText: "Min Value",
                rowValue: "42 (exclusive)"
            }
        ]);
    });
    it("includes `maximum` without `exclusiveMaximum`", () => {
        const schema = { maximum: 84 };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(collectFormFields(itemSchemaGroup, [{}], 0)).toEqual([
            {
                labelText: "Max Value",
                rowValue: "84 (inclusive)"
            }
        ]);
    });
    it("includes `maximum` with boolean `exclusiveMaximum` (as per Draft 4)", () => {
        const schema = {
            maximum: 84,
            exclusiveMaximum: true
        };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(collectFormFields(itemSchemaGroup, [{}], 0)).toEqual([
            {
                labelText: "Max Value",
                rowValue: "84 (exclusive)"
            }
        ]);
    });
    it("includes `exclusiveMaximum` (as per Draft 6)", () => {
        const schema = {
            exclusiveMaximum: 84
        };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(collectFormFields(itemSchemaGroup, [{}], 0)).toEqual([
            {
                labelText: "Max Value",
                rowValue: "84 (exclusive)"
            }
        ]);
    });
    it("includes `default` (object)", () => {
        const schema = { default: {} };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(collectFormFields(itemSchemaGroup, [{}], 0)).toEqual([
            {
                labelText: "Default Value",
                rowValue: "{}"
            }
        ]);
    });
    it("includes `default` (non-object)", () => {
        const schema = { default: false };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(collectFormFields(itemSchemaGroup, [{}], 0)).toEqual([
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
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(collectFormFields(itemSchemaGroup, [{}], 0)).toEqual([
            {
                labelText: "Example(s)",
                rowValue: "[{\"field\":\"value\"}]"
            }
        ]);
    });
    it("includes `examples` (non-objects)", () => {
        const schema = { examples: [42, 84] };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(collectFormFields(itemSchemaGroup, [{}], 0)).toEqual([
            {
                labelText: "Example(s)",
                rowValue: [42, 84]
            }
        ]);
    });
    it("ignores empty `examples`", () => {
        const schema = { examples: [] };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(collectFormFields(itemSchemaGroup, [{}], 0)).toEqual([]);
    });
    it("includes `uniqueItems`", () => {
        const schema = { uniqueItems: true };
        const itemSchemaGroup = createGroupFromSchema(new JsonSchema(schema));
        expect(collectFormFields(itemSchemaGroup, [{}], 0)).toEqual([
            {
                labelText: "Items Unique",
                rowValue: "Yes"
            }
        ]);
    });
});
