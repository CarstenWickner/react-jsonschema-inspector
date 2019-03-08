import React from "react";
import { shallow } from "enzyme";
import InspectorDetailsContent, { collectFormFields } from "../src/InspectorDetailsContent";
import JsonSchema from "../src/JsonSchema";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const schema = new JsonSchema({
            title: "Schema Title",
            description: "Text"
        });
        const component = shallow(
            <InspectorDetailsContent
                columnData={[
                    {
                        items: {
                            "Schema One": schema
                        },
                        selectedItem: "Schema One",
                        trailingSelection: true
                    }
                ]}
                itemSchema={schema}
                selectionColumnIndex={0}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("with root array selection", () => {
        const schema = {
            title: "Schema Title",
            items: { $ref: "#/definitions/itemSchema" },
            definitions: {
                itemSchema: {
                    description: "Array Item",
                    type: "object"
                }
            }
        };
        const columnData = [
            {
                items: {
                    "Schema One": new JsonSchema(schema)
                },
                selectedItem: "Schema One",
                trailingSelection: true
            }
        ];
        const component = shallow(
            <InspectorDetailsContent
                columnData={columnData}
                itemSchema={columnData[0].items["Schema One"]}
                selectionColumnIndex={0}
            />
        );
        const forms = component.find("InspectorDetailsForm");
        expect(forms).toHaveLength(2);
        expect(forms.first().prop("fields")).toEqual([
            {
                labelText: "Title",
                rowValue: "Schema Title"
            }
        ]);
        expect(forms.last().prop("fields")).toEqual([
            {
                labelText: "Description",
                rowValue: "Array Item"
            },
            {
                labelText: "Type",
                rowValue: "object"
            }
        ]);
        expect(component.exists(".jsonschema-inspector-details-separator")).toBe(true);
        const headers = component.find(".jsonschema-inspector-details-header");
        expect(headers).toHaveLength(2);
        expect(headers.first().text()).toEqual("Details");
        expect(headers.last().text()).toEqual("Array Entry Details");
    });
});
describe("collectFormFields()", () => {
    it("includes `title`", () => {
        const schema = { title: "Title Value" };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Title",
                rowValue: "Title Value"
            }
        ]);
    });
    it("includes `title` from $ref-erenced schema", () => {
        const schema = { $ref: "#/definitions/A" };
        const { scope } = new JsonSchema({
            definitions: {
                A: { title: "Title Value" }
            }
        });
        expect(collectFormFields(new JsonSchema(schema, scope), [{}], 0)).toEqual([
            {
                labelText: "Title",
                rowValue: "Title Value"
            }
        ]);
    });
    it("includes `description`", () => {
        const schema = { description: "Description Value" };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Description",
                rowValue: "Description Value"
            }
        ]);
    });
    it("includes `required`", () => {
        const columnData = [
            {
                items: {
                    "Schema One": new JsonSchema({
                        required: ["field"],
                        properties: {
                            field: { title: "Required Property" }
                        }
                    })
                },
                selectedItem: "Schema One",
                trailingSelection: false
            },
            {
                items: {
                    field: new JsonSchema({ title: "Required Property" })
                },
                selectedItem: "field",
                trailingSelection: true
            }
        ];
        expect(collectFormFields(columnData[1].items.field, columnData, 1)).toEqual([
            {
                labelText: "Title",
                rowValue: "Required Property"
            },
            {
                labelText: "Required",
                rowValue: "Yes"
            }
        ]);
    });
    it("includes `type`", () => {
        const schema = { type: "object" };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Type",
                rowValue: "object"
            }
        ]);
    });
    it("includes `const`", () => {
        const schema = { const: 42 };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Constant Value",
                rowValue: 42
            }
        ]);
    });
    it("includes `enum`", () => {
        const schema = { enum: [42, 84] };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Possible Values",
                rowValue: [42, 84]
            }
        ]);
    });
    it("includes `minimum` without exclusiveMinimum", () => {
        const schema = { minimum: 42 };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
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
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
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
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Min Value",
                rowValue: "42 (exclusive)"
            }
        ]);
    });
    it("includes `maximum` without `exclusiveMaximum`", () => {
        const schema = { maximum: 84 };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
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
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
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
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Max Value",
                rowValue: "84 (exclusive)"
            }
        ]);
    });
    it("includes `default` (object)", () => {
        const schema = { default: {} };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Default Value",
                rowValue: "{}"
            }
        ]);
    });
    it("includes `default` (non-object)", () => {
        const schema = { default: false };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
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
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Example(s)",
                rowValue: "[{\"field\":\"value\"}]"
            }
        ]);
    });
    it("includes `examples` (non-objects)", () => {
        const schema = { examples: [42, 84] };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Example(s)",
                rowValue: [42, 84]
            }
        ]);
    });
    it("ignores empty `examples`", () => {
        const schema = { examples: [] };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([]);
    });
    it("includes `pattern`", () => {
        const schema = { pattern: "[a-z]+" };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Value Pattern",
                rowValue: "[a-z]+"
            }
        ]);
    });
    it("includes `format`", () => {
        const schema = { format: "iri" };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Value Format",
                rowValue: "iri"
            }
        ]);
    });
    it("includes `minLength`", () => {
        const schema = { minLength: 1 };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Min Length",
                rowValue: 1
            }
        ]);
    });
    it("includes `maxLength`", () => {
        const schema = { maxLength: 100 };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Max Length",
                rowValue: 100
            }
        ]);
    });
    it("includes `minItems`", () => {
        const schema = { minItems: 1 };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Min Items",
                rowValue: 1
            }
        ]);
    });
    it("includes `maxItems`", () => {
        const schema = { maxItems: 100 };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Max Items",
                rowValue: 100
            }
        ]);
    });
    it("includes `uniqueItems`", () => {
        const schema = { uniqueItems: true };
        expect(collectFormFields(new JsonSchema(schema), [{}], 0)).toEqual([
            {
                labelText: "Items Unique",
                rowValue: "Yes"
            }
        ]);
    });
});
