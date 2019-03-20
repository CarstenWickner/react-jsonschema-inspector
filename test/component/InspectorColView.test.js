import React from "react";
import { mount, shallow } from "enzyme";

import InspectorColView from "../../src/component/InspectorColView";
import JsonSchema from "../../src/model/JsonSchema";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(
            <InspectorColView
                columnData={[
                    {
                        items: {
                            "Item One": new JsonSchema(),
                            "Item Two": new JsonSchema()
                        },
                        selectedItem: "Item One",
                        onSelect: () => { }
                    },
                    {
                        items: {
                            "Item One-One": new JsonSchema(),
                            "Item One-Two": new JsonSchema()
                        },
                        selectedItem: "Item One-Two",
                        trailingSelection: true,
                        onSelect: () => { }
                    },
                    {
                        items: {
                            "Item One-Two-One": new JsonSchema(),
                            "Item One-Two-Two": new JsonSchema()
                        },
                        onSelect: () => { }
                    }
                ]}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("with empty column", () => {
        const component = shallow(
            <InspectorColView
                columnData={[
                    {
                        items: {
                            "Item One": new JsonSchema(),
                            "Item Two": new JsonSchema()
                        },
                        selectedItem: "Item Two",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                appendEmptyColumn
            />
        );
        expect(component.exists(".jsonschema-inspector-column-placeholder")).toBe(true);
    });
});
describe("update according to prop changes", () => {
    const singleColumnData = [
        {
            items: {
                "Item One": new JsonSchema(),
                "Item Two": new JsonSchema()
            },
            onSelect: () => { }
        }
    ];
    const doubleColumnData = [
        {
            items: {
                "Item One": new JsonSchema(),
                "Item Two": new JsonSchema()
            },
            selectedItem: "Item Two",
            trailingSelection: true,
            onSelect: () => { }
        },
        {
            items: {
                "Item Two-One": new JsonSchema(),
                "Item Two-Two": new JsonSchema()
            },
            onSelect: () => { }
        }
    ];

    it("setting root selection (while no empty column was displayed)", () => {
        const component = mount(
            <InspectorColView columnData={singleColumnData} />
        );
        // simulate selection in root column
        component.setProps({
            columnData: doubleColumnData
        });
        expect(component.find("InspectorColumn")).toHaveLength(2);
    });
    it("setting root selection (while empty column was displayed)", () => {
        const component = mount(
            <InspectorColView
                columnData={singleColumnData}
                appendEmptyColumn
            />
        );
        // simulate selection in root column
        component.setProps({
            columnData: doubleColumnData
        });
        expect(component.find("InspectorColumn")).toHaveLength(2);
    });
    it("clearing root selection", () => {
        const component = mount(
            <InspectorColView columnData={doubleColumnData} />
        );
        // simulate clearing the selection again (thereby adding an empty column)
        component.setProps({
            columnData: singleColumnData,
            appendEmptyColumn: true
        });
        expect(component.find("InspectorColumn")).toHaveLength(1);
    });
});
