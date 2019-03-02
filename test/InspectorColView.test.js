import React from "react";
import { shallow } from "enzyme";
import InspectorColView from "../src/InspectorColView";
import JsonSchema from "../src/JsonSchema";

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
