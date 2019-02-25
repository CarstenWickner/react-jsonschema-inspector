import React from "react";
import { shallow } from "enzyme";
import InspectorColView from "../src/InspectorColView";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(
            <InspectorColView
                columnData={[
                    {
                        items: {
                            "Item One": {},
                            "Item Two": {}
                        },
                        selectedItem: "Item One",
                        onSelect: () => { }
                    },
                    {
                        items: {
                            "Item One-One": {},
                            "Item One-Two": {}
                        },
                        selectedItem: "Item One-Two",
                        trailingSelection: true,
                        onSelect: () => { }
                    },
                    {
                        items: {
                            "Item One-Two-One": {},
                            "Item One-Two-Two": {}
                        },
                        onSelect: () => { }
                    }
                ]}
                refTargets={{}}
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
                            "Item One": {},
                            "Item Two": {}
                        },
                        selectedItem: "Item Two",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                refTargets={{}}
                appendEmptyColumn
            />
        );
        expect(component.exists(".jsonschema-inspector-column-placeholder")).toBe(true);
    });
});
