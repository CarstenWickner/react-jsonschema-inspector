import React from "react";
import { shallow } from "enzyme";

import InspectorDetails from "../../src/component/InspectorDetails";
import JsonSchema from "../../src/model/JsonSchema";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(
            <InspectorDetails
                columnData={[
                    {
                        items: {
                            "Schema One": new JsonSchema({
                                title: "Schema Title",
                                description: "Text"
                            })
                        },
                        selectedItem: "Schema One",
                        trailingSelection: true
                    }
                ]}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("with empty columnData", () => {
        const component = shallow(
            <InspectorDetails
                columnData={[]}
            />
        );
        expect(component.children().exists()).toBe(false);
    });
    it("with empty columnData and custom renderEmptyDetails", () => {
        const component = shallow(
            <InspectorDetails
                columnData={[]}
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
                            "Schema One": new JsonSchema({
                                title: "Schema Title",
                                description: "Text"
                            })
                        }
                    }
                ]}
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
                            "Schema One": new JsonSchema({
                                title: "Schema Title",
                                description: "Text"
                            })
                        }
                    }
                ]}
                renderEmptyDetails={({ rootColumnSchemas }) => (
                    <span className="custom-empty-details">{Object.keys(rootColumnSchemas).length}</span>
                )}
            />
        );
        expect(component.find(".custom-empty-details").text()).toBe("1");
    });
    it("with root array selection", () => {
        const schema = new JsonSchema({
            title: "Schema Title",
            items: { $ref: "#/definitions/itemSchema" },
            definitions: {
                itemSchema: {
                    description: "Array Item",
                    type: "object"
                }
            }
        });
        const columnData = [
            {
                items: {
                    "Schema One": schema
                },
                selectedItem: "Schema One",
                trailingSelection: true
            }
        ];
        const component = shallow(
            <InspectorDetails
                columnData={columnData}
                itemSchema={schema}
                selectionColumnIndex={0}
            />
        );
        const { columnData: contentColumnDataProp, itemSchema, selectionColumnIndex } = component.find("InspectorDetailsContent").props();
        expect(contentColumnDataProp).toEqual(columnData);
        expect(itemSchema).toEqual(schema);
        expect(selectionColumnIndex).toEqual(0);
    });
    it("with root array selection and custom renderSelectionDetails", () => {
        const mainSchema = {
            title: "Schema Title",
            items: { $ref: "#/definitions/itemSchema" },
            definitions: {
                itemSchema: {
                    description: "Array Item",
                    type: "object"
                }
            }
        };
        const columnDataProp = [
            {
                items: {
                    "Schema One": new JsonSchema(mainSchema)
                },
                selectedItem: "Schema One",
                trailingSelection: true
            }
        ];
        const renderSelectionDetails = jest.fn(() => (<span className="custom-selection-details" />));
        const component = shallow(
            <InspectorDetails
                columnData={columnDataProp}
                renderSelectionDetails={renderSelectionDetails}
            />
        );
        expect(component.exists(".custom-selection-details")).toBe(true);
        expect(renderSelectionDetails.mock.calls).toHaveLength(1);
        const {
            itemSchema, columnData, selectionColumnIndex
        } = renderSelectionDetails.mock.calls[0][0];
        expect(itemSchema).toEqual(columnDataProp[0].items["Schema One"]);
        expect(columnData).toEqual(columnDataProp);
        expect(selectionColumnIndex).toBe(0);
    });
});
