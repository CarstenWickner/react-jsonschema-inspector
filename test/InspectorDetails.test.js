import React from "react";
import { shallow } from "enzyme";
import InspectorDetails from "../src/InspectorDetails";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(
            <InspectorDetails
                columnData={[
                    {
                        items: {
                            "Schema One": {
                                title: "Schema Title",
                                description: "Text"
                            }
                        },
                        selectedItem: "Schema One",
                        trailingSelection: true
                    }
                ]}
                refTargets={{}}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("with empty columnData", () => {
        const component = shallow(
            <InspectorDetails
                columnData={[]}
                refTargets={{}}
            />
        );
        expect(component.children().exists()).toBe(false);
    });
    it("with empty columnData and custom renderEmptyDetails", () => {
        const component = shallow(
            <InspectorDetails
                columnData={[]}
                refTargets={{}}
                renderEmptyDetails={({ rootColumnSchemas }) => (
                    <span className="custom-empty-details">{Object.keys(rootColumnSchemas).length}</span>
                )}
            />
        );
        expect(component.find(".custom-empty-details").text()).toBe("0");
    });
    it("with no selection", () => {
        const component = shallow(
            <InspectorDetails
                columnData={[
                    {
                        items: {
                            "Schema One": {
                                title: "Schema Title",
                                description: "Text"
                            }
                        }
                    }
                ]}
                refTargets={{}}
            />
        );
        expect(component.children().exists()).toBe(false);
    });
    it("with no selection and custom renderEmptyDetails", () => {
        const component = shallow(
            <InspectorDetails
                columnData={[
                    {
                        items: {
                            "Schema One": {
                                title: "Schema Title",
                                description: "Text"
                            }
                        }
                    }
                ]}
                refTargets={{}}
                renderEmptyDetails={({ rootColumnSchemas }) => (
                    <span className="custom-empty-details">{Object.keys(rootColumnSchemas).length}</span>
                )}
            />
        );
        expect(component.find(".custom-empty-details").text()).toBe("1");
    });
    it("with root array selection", () => {
        const columnData = [
            {
                items: {
                    "Schema One": {
                        title: "Schema Title",
                        items: { $ref: "itemSchema" }
                    }
                },
                selectedItem: "Schema One",
                trailingSelection: true
            }
        ];
        const refTargets = {
            itemSchema: {
                description: "Array Item",
                type: "object"
            }
        };
        const component = shallow(
            <InspectorDetails
                columnData={columnData}
                refTargets={refTargets}
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
    it("with root array selection and custom renderSelectionDetails", () => {
        const mainSchema = {
            title: "Schema Title",
            items: { $ref: "itemSchema" }
        };
        const columnDataProp = [
            {
                items: {
                    "Schema One": mainSchema
                },
                selectedItem: "Schema One",
                trailingSelection: true
            }
        ];
        const refTargetsProp = {
            itemSchema: {
                description: "Array Item",
                type: "object"
            }
        };
        const renderSelectionDetails = jest.fn(() => (<span className="custom-selection-details" />));
        const component = shallow(
            <InspectorDetails
                columnData={columnDataProp}
                refTargets={refTargetsProp}
                renderSelectionDetails={renderSelectionDetails}
            />
        );
        expect(component.exists(".custom-selection-details")).toBe(true);
        expect(renderSelectionDetails.mock.calls).toHaveLength(1);
        const {
            itemSchema, refTargets, columnData, selectionColumnIndex
        } = renderSelectionDetails.mock.calls[0][0];
        expect(itemSchema).toEqual(mainSchema);
        expect(refTargets).toEqual(refTargetsProp);
        expect(columnData).toEqual(columnDataProp);
        expect(selectionColumnIndex).toBe(0);
    });
});
describe("collectFormFields()", () => {
    it("includes `title`", () => {
        const schema = { title: "Title Value" };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Title",
                rowValue: "Title Value"
            }
        ]);
    });
    it("includes `title` from $ref-erenced schema", () => {
        const schema = { $ref: "A" };
        const refTargets = {
            A: { title: "Title Value" }
        };
        expect(InspectorDetails.collectFormFields(schema, refTargets, [{}], 0)).toEqual([
            {
                labelText: "Title",
                rowValue: "Title Value"
            }
        ]);
    });
    it("includes `description`", () => {
        const schema = { description: "Description Value" };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Description",
                rowValue: "Description Value"
            }
        ]);
    });
    it("includes `required`", () => {
        const schemaProperties = {
            field: { title: "Required Property" }
        };
        const columnData = [
            {
                items: {
                    "Schema One": {
                        required: ["field"],
                        properties: schemaProperties
                    }
                },
                selectedItem: "Schema One",
                trailingSelection: false
            },
            {
                items: schemaProperties,
                selectedItem: "field",
                trailingSelection: true
            }
        ];
        expect(InspectorDetails.collectFormFields({}, {}, columnData, 1)).toEqual([
            {
                labelText: "Required",
                rowValue: "Yes"
            }
        ]);
    });
    it("includes `type`", () => {
        const schema = { type: "object" };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Type",
                rowValue: "object"
            }
        ]);
    });
    it("includes `const`", () => {
        const schema = { const: 42 };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Constant Value",
                rowValue: 42
            }
        ]);
    });
    it("includes `enum`", () => {
        const schema = { enum: [42, 84] };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Possible Values",
                rowValue: [42, 84]
            }
        ]);
    });
    it("includes `minimum` without exclusiveMinimum", () => {
        const schema = { minimum: 42 };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
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
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
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
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Min Value",
                rowValue: "42 (exclusive)"
            }
        ]);
    });
    it("includes `maximum` without `exclusiveMaximum`", () => {
        const schema = { maximum: 84 };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
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
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
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
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Max Value",
                rowValue: "84 (exclusive)"
            }
        ]);
    });
    it("includes `default` (object)", () => {
        const schema = { default: {} };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Default Value",
                rowValue: "{}"
            }
        ]);
    });
    it("includes `default` (non-object)", () => {
        const schema = { default: false };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
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
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Example(s)",
                rowValue: "[{\"field\":\"value\"}]"
            }
        ]);
    });
    it("includes `examples` (non-objects)", () => {
        const schema = { examples: [42, 84] };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Example(s)",
                rowValue: [42, 84]
            }
        ]);
    });
    it("ignores empty `examples`", () => {
        const schema = { examples: [] };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([]);
    });
    it("includes `pattern`", () => {
        const schema = { pattern: "[a-z]+" };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Value Pattern",
                rowValue: "[a-z]+"
            }
        ]);
    });
    it("includes `format`", () => {
        const schema = { format: "iri" };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Value Format",
                rowValue: "iri"
            }
        ]);
    });
    it("includes `minLength`", () => {
        const schema = { minLength: 1 };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Min Length",
                rowValue: 1
            }
        ]);
    });
    it("includes `maxLength`", () => {
        const schema = { maxLength: 100 };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Max Length",
                rowValue: 100
            }
        ]);
    });
    it("includes `minItems`", () => {
        const schema = { minItems: 1 };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Min Items",
                rowValue: 1
            }
        ]);
    });
    it("includes `maxItems`", () => {
        const schema = { maxItems: 100 };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Max Items",
                rowValue: 100
            }
        ]);
    });
    it("includes `uniqueItems`", () => {
        const schema = { uniqueItems: true };
        expect(InspectorDetails.collectFormFields(schema, {}, [{}], 0)).toEqual([
            {
                labelText: "Items Unique",
                rowValue: "Yes"
            }
        ]);
    });
});
