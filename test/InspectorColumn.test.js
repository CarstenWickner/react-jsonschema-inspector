import React from "react";
import { shallow } from "enzyme";
import RefScope from "../src/RefScope";
import InspectorColumn from "../src/InspectorColumn";
import JsonSchema from "../src/JsonSchema";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(
            <InspectorColumn
                items={{
                    "Item One": new JsonSchema({
                        $id: "Schema One"
                    }, new RefScope({
                        definitions: { Target: {} }
                    })),
                    "Item Two": new JsonSchema({
                        $id: "Schema Two"
                    }, new RefScope({
                        definitions: { Target: {} }
                    }))
                }}
                onSelect={() => { }}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("with selection", () => {
        const component = shallow(
            <InspectorColumn
                items={{
                    "Item One": new JsonSchema(),
                    "Item Two": new JsonSchema()
                }}
                onSelect={() => { }}
                selectedItem="Item Two"
            />
        );
        expect(component.hasClass("with-selection")).toBe(true);
        expect(component.hasClass("trailing-selection")).toBe(false);
        expect(component.find("InspectorItem").at(0).prop("selected")).toBe(false);
        expect(component.find("InspectorItem").at(1).prop("selected")).toBe(true);
        expect(component.find("InspectorItem").at(0).prop("matchesFilter")).toBeUndefined();
        expect(component.find("InspectorItem").at(1).prop("matchesFilter")).toBeUndefined();
    });
    it("with trailing selection", () => {
        const component = shallow(
            <InspectorColumn
                items={{
                    "Item One": new JsonSchema(),
                    "Item Two": new JsonSchema()
                }}
                onSelect={() => { }}
                selectedItem="Item Two"
                trailingSelection
            />
        );
        expect(component.hasClass("with-selection")).toBe(true);
        expect(component.hasClass("trailing-selection")).toBe(true);
        expect(component.find("InspectorItem").at(0).prop("selected")).toBe(false);
        expect(component.find("InspectorItem").at(1).prop("selected")).toBe(true);
        expect(component.find("InspectorItem").at(0).prop("matchesFilter")).toBeUndefined();
        expect(component.find("InspectorItem").at(1).prop("matchesFilter")).toBeUndefined();
    });
    it("with filter", () => {
        const component = shallow(
            <InspectorColumn
                items={{
                    "Item One": new JsonSchema(),
                    "Item Two": new JsonSchema()
                }}
                onSelect={() => { }}
                filteredItems={["Item Two"]}
            />
        );
        expect(component.hasClass("with-selection")).toBe(false);
        expect(component.hasClass("trailing-selection")).toBe(false);
        expect(component.find("InspectorItem").at(0).prop("matchesFilter")).toBe(false);
        expect(component.find("InspectorItem").at(1).prop("matchesFilter")).toBe(true);
    });
});
describe("calls onSelect", () => {
    let onSelect;
    let component;
    beforeEach(() => {
        onSelect = jest.fn(() => { });
        component = shallow(
            <InspectorColumn
                items={{
                    "Item One": new JsonSchema()
                }}
                onSelect={onSelect}
            />
        );
    });

    it("clearing selection when clicking on column", () => {
        component.find(".jsonschema-inspector-column").prop("onClick")({});
        expect(onSelect.mock.calls).toHaveLength(1);
        // expect no second parameter indicating selected item
        expect(onSelect.mock.calls[0]).toHaveLength(1);
    });
    it("setting selection when clicking on item", () => {
        component.find("InspectorItem").prop("onSelect")({});
        expect(onSelect.mock.calls).toHaveLength(1);
        // expect no second parameter indicating selected item
        expect(onSelect.mock.calls[0]).toHaveLength(2);
        expect(onSelect.mock.calls[0][1]).toEqual("Item One");
    });
});
describe("failing PropType validation", () => {
    it("for invalid selectedItem", () => {
        const component = () => (
            <InspectorColumn
                items={{
                    "Item One": new JsonSchema()
                }}
                onSelect={() => { }}
                selectedItem={0}
            />
        );
        expect(component).toThrowError("Warning: Failed prop type: `selectedItem` is not a `string`\n"
            + "    in InspectorColumn");
    });
    it("for selectedItem not being part of items", () => {
        const component = () => (
            <InspectorColumn
                items={{
                    "Item One": new JsonSchema()
                }}
                onSelect={() => { }}
                selectedItem="Item Two"
            />
        );
        expect(component).toThrowError("Warning: Failed prop type: `selectedItem` is not part of `items`\n"
            + "    in InspectorColumn");
    });
    it("for trailingSelection without selectedItem", () => {
        const component = () => (
            <InspectorColumn
                items={{
                    "Item One": new JsonSchema()
                }}
                onSelect={() => { }}
                trailingSelection
            />
        );
        expect(component).toThrowError("Warning: Failed prop type: `trailingSelection` is true while there is no `selectedItem`\n"
            + "    in InspectorColumn");
    });
    it("for invalid filteredItems", () => {
        const component = () => (
            <InspectorColumn
                items={{
                    "Item One": new JsonSchema()
                }}
                onSelect={() => { }}
                filteredItems={1}
            />
        );
        expect(component).toThrowError("Warning: Failed prop type: `filteredItems` is not an `array`\n"
            + "    in InspectorColumn");
    });
    it("for filteredItems not all being part of items", () => {
        const component = () => (
            <InspectorColumn
                items={{
                    "Item One": new JsonSchema()
                }}
                onSelect={() => { }}
                filteredItems={["Item One", "Item Two"]}
            />
        );
        expect(component).toThrowError("Warning: Failed prop type: `filteredItems` are not all part of `items`\n"
            + "    in InspectorColumn");
    });
});
