import React from "react";
import { shallow } from "enzyme";
import Inspector from "../src/Inspector";

describe("renders correctly", () => {
    const schemas = {
        "Schema One": {
            properties: {
                "Item One": {},
                "Item Two": {
                    properties: {
                        "Property One": {}
                    }
                }
            }
        }
    };

    it("with minimal/default props", () => {
        const component = shallow(
            <Inspector
                schemas={schemas}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("without footer", () => {
        const component = shallow(
            <Inspector
                schemas={schemas}
                breadcrumbs={null}
            />
        );
        expect(component.find(".jsonschema-inspector-footer").exists()).toBe(false);
    });
    it("with root selection", () => {
        const selectedSchema = "Schema One";
        const component = shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={[selectedSchema]}
            />
        );
        const { columnData, refTargets } = component.find("InspectorColView").props();
        expect(refTargets).toEqual({
            "#": schemas[selectedSchema]
        });
        expect(columnData).toHaveLength(2);
        expect(columnData[0].items).toEqual(schemas);
        expect(columnData[0].selectedItem).toBe(selectedSchema);
        expect(columnData[0].trailingSelection).toBe(true);
        expect(typeof columnData[0].onSelect).toBe("function");
        expect(columnData[1].items).toEqual({
            "Item One": {},
            "Item Two": {
                properties: {
                    "Property One": {}
                }
            }
        });
        expect(columnData[1].selectedItem).toBe(null);
        expect(columnData[1].trailingSelection).toBe(false);
        expect(typeof columnData[1].onSelect).toBe("function");
    });
    it("with multi-column leaf selection", () => {
        const selectedSchema = "Schema One";
        const selectedItem = "Item One";
        const component = shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={[selectedSchema, selectedItem]}
            />
        );
        const { columnData, refTargets } = component.find("InspectorColView").props();
        expect(refTargets).toEqual({
            "#": schemas[selectedSchema]
        });
        expect(columnData).toHaveLength(2);
        expect(columnData[0].items).toEqual(schemas);
        expect(columnData[0].selectedItem).toBe(selectedSchema);
        expect(columnData[0].trailingSelection).toBe(false);
        expect(typeof columnData[0].onSelect).toBe("function");
        expect(columnData[1].items).toEqual({
            "Item One": {},
            "Item Two": {
                properties: {
                    "Property One": {}
                }
            }
        });
        expect(columnData[1].selectedItem).toBe(selectedItem);
        expect(columnData[1].trailingSelection).toBe(true);
        expect(typeof columnData[1].onSelect).toBe("function");
    });
    it("with multi-column branch selection", () => {
        const selectedSchema = "Schema One";
        const selectedItem = "Item Two";
        const component = shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={[selectedSchema, selectedItem]}
            />
        );
        const { columnData, refTargets } = component.find("InspectorColView").props();
        expect(refTargets).toEqual({
            "#": schemas[selectedSchema]
        });
        expect(columnData).toHaveLength(3);
        expect(columnData[1].items).toEqual({
            "Item One": {},
            "Item Two": {
                properties: {
                    "Property One": {}
                }
            }
        });
        expect(columnData[1].selectedItem).toBe(selectedItem);
        expect(columnData[1].trailingSelection).toBe(true);
        expect(typeof columnData[1].onSelect).toBe("function");
        expect(columnData[2].items).toEqual({ "Property One": {} });
        expect(columnData[2].selectedItem).toBe(null);
        expect(columnData[2].trailingSelection).toBe(false);
        expect(typeof columnData[2].onSelect).toBe("function");
    });
    it("throwing error on invalid root selection", () => {
        const component = () => shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={["Schema Two"]}
            />
        );
        expect(component).toThrowError("invalid selection 'Schema Two' in column at index 0");
    });
    it("throwing error on invalid non-root selection", () => {
        const component = () => shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={["Schema One", "Item Three"]}
            />
        );
        expect(component).toThrowError("invalid selection 'Item Three' in column at index 1");
    });
});
describe("calls onSelect", () => {
    const schemas = {
        "Schema One": {
            properties: {
                "Item One": {},
                "Item Two": {
                    properties: {
                        "Property One": {}
                    }
                }
            }
        },
        "Schema Two": {}
    };
    const mockEvent = {
        stopPropagation: () => { }
    };
    let onSelect;
    beforeEach(() => {
        onSelect = jest.fn(() => { });
    });

    it("when setting root selection", () => {
        const component = shallow(
            <Inspector
                schemas={schemas}
                onSelect={onSelect}
            />
        );
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, "Schema One");
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][1]).toEqual(["Schema One"]);
        expect(component.state("appendEmptyColumn")).toBe(false);
    });
    it("when setting other root selection", () => {
        const component = shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={["Schema One"]}
                onSelect={onSelect}
            />
        );
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, "Schema Two");
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][1]).toEqual(["Schema Two"]);
        // expect it to be true because "Schema Two" has no nested items, but "Schema One" has
        expect(component.state("appendEmptyColumn")).toBe(true);
    });
    it("not when setting same root selection", () => {
        const component = shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={["Schema One"]}
                onSelect={onSelect}
            />
        );
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, "Schema One");
        expect(onSelect.mock.calls).toHaveLength(0);
    });
    it("when clearing root selection", () => {
        const component = shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={["Schema One"]}
                onSelect={onSelect}
            />
        );
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, null);
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][1]).toEqual([]);
        expect(component.state("appendEmptyColumn")).toBe(true);
    });
    it("not when clearing empty root selection", () => {
        const component = shallow(
            <Inspector
                schemas={schemas}
                onSelect={onSelect}
            />
        );
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, null);
        expect(onSelect.mock.calls).toHaveLength(0);
    });
    it("when setting non-root selection", () => {
        const component = shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={["Schema One"]}
                onSelect={onSelect}
            />
        );
        const { onSelect: secondColumnSelect } = component.find("InspectorColView").prop("columnData")[1];
        secondColumnSelect(mockEvent, "Item One");
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][1]).toEqual(["Schema One", "Item One"]);
        expect(component.state("appendEmptyColumn")).toBe(false);
    });
    it("when setting other non-root selection", () => {
        const component = shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={["Schema One", "Item One"]}
                onSelect={onSelect}
            />
        );
        const { onSelect: secondColumnSelect } = component.find("InspectorColView").prop("columnData")[1];
        secondColumnSelect(mockEvent, "Item Two");
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][1]).toEqual(["Schema One", "Item Two"]);
        expect(component.state("appendEmptyColumn")).toBe(false);
    });
    it("not when setting same non-root selection", () => {
        const component = shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={["Schema One", "Item One"]}
                onSelect={onSelect}
            />
        );
        const { onSelect: secondColumnSelect } = component.find("InspectorColView").prop("columnData")[1];
        secondColumnSelect(mockEvent, "Item One");
        expect(onSelect.mock.calls).toHaveLength(0);
    });
    it("when clearing non-root selection", () => {
        const component = shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={["Schema One", "Item One"]}
                onSelect={onSelect}
            />
        );
        const { onSelect: secondColumnSelect } = component.find("InspectorColView").prop("columnData")[1];
        secondColumnSelect(mockEvent, null);
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][1]).toEqual(["Schema One"]);
        // expect it to be false because "Item One" has no nested items
        expect(component.state("appendEmptyColumn")).toBe(false);
    });
    it("not when clearing empty non-root selection", () => {
        const component = shallow(
            <Inspector
                schemas={schemas}
                defaultSelectedItems={["Schema One"]}
                onSelect={onSelect}
            />
        );
        const { onSelect: secondColumnSelect } = component.find("InspectorColView").prop("columnData")[1];
        secondColumnSelect(mockEvent, null);
        expect(onSelect.mock.calls).toHaveLength(0);
    });
});
