import * as React from "react";
import { mount, shallow } from "enzyme";

import { ColViewProps, InspectorColView } from "../../src/component/InspectorColView";
import { JsonSchemaGroup } from "../../src/model/JsonSchemaGroup";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(
            <InspectorColView
                columnData={[
                    {
                        items: {
                            "Item One": new JsonSchemaGroup(),
                            "Item Two": new JsonSchemaGroup()
                        },
                        selectedItem: "Item One",
                        onSelect: (): void => {}
                    },
                    {
                        options: {
                            groupTitle: "one of",
                            options: [{}, {}]
                        },
                        contextGroup: new JsonSchemaGroup(),
                        selectedItem: [0],
                        trailingSelection: true,
                        onSelect: (): void => {}
                    },
                    {
                        items: {
                            "Item One-Two-One": new JsonSchemaGroup(),
                            "Item One-Two-Two": new JsonSchemaGroup()
                        },
                        onSelect: (): void => {}
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
                            "Item One": new JsonSchemaGroup(),
                            "Item Two": new JsonSchemaGroup()
                        },
                        selectedItem: "Item Two",
                        trailingSelection: true,
                        onSelect: (): void => {}
                    }
                ]}
                appendEmptyColumn
            />
        );
        expect(component.exists(".jsonschema-inspector-column-placeholder")).toBe(true);
    });
});
describe("update according to prop changes", () => {
    const singleColumnData: ColViewProps["columnData"] = [
        {
            items: {
                "Item One": new JsonSchemaGroup(),
                "Item Two": new JsonSchemaGroup()
            },
            onSelect: (): void => {}
        }
    ];
    const doubleColumnData: ColViewProps["columnData"] = [
        {
            items: {
                "Item One": new JsonSchemaGroup(),
                "Item Two": new JsonSchemaGroup()
            },
            selectedItem: "Item Two",
            trailingSelection: true,
            onSelect: (): void => {}
        },
        {
            items: {
                "Item Two-One": new JsonSchemaGroup(),
                "Item Two-Two": new JsonSchemaGroup()
            },
            onSelect: (): void => {}
        }
    ];

    it("setting root selection (while no empty column was displayed)", () => {
        const component = mount(<InspectorColView columnData={singleColumnData} />);
        // simulate selection in root column
        component.setProps({
            columnData: doubleColumnData
        });
        expect(component.find(doubleColumnData[0]).exists()).toBe(true);
        expect(component.find(doubleColumnData[1]).exists()).toBe(true);
    });
    it("setting root selection (while empty column was displayed)", () => {
        const component = mount(<InspectorColView columnData={singleColumnData} appendEmptyColumn />);
        // simulate selection in root column
        component.setProps({
            columnData: doubleColumnData
        });
        expect(component.find(doubleColumnData[0]).exists()).toBe(true);
        expect(component.find(doubleColumnData[1]).exists()).toBe(true);
    });
    it("clearing root selection", () => {
        const component = mount(<InspectorColView columnData={doubleColumnData} />);
        // simulate clearing the selection again (thereby adding an empty column)
        component.setProps({
            columnData: singleColumnData,
            appendEmptyColumn: true
        });
        const rootColumn = component.find(singleColumnData[0]);
        expect(rootColumn.exists()).toBe(true);
        expect(Array.isArray(rootColumn)).toBe(false);
    });
});
