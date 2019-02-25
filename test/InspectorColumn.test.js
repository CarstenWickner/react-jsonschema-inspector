import React from "react";
import { shallow } from "enzyme";
import InspectorColumn from "../src/InspectorColumn";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(
            <InspectorColumn
                items={{
                    "Item One": {
                        $id: "Schema One"
                    },
                    "Item Two": {
                        $id: "Schema Two"
                    }
                }}
                refTargets={{
                    Target: {}
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
                    "Item One": true,
                    "Item Two": true
                }}
                refTargets={{}}
                onSelect={() => { }}
                selectedItem="Item Two"
            />
        );
        expect(component.hasClass("with-selection")).toBe(true);
        expect(component.hasClass("trailing-selection")).toBe(false);
        expect(component.find("InspectorItem").at(0).prop("selected")).toBe(false);
        expect(component.find("InspectorItem").at(1).prop("selected")).toBe(true);
        expect(component.find("InspectorItem").at(1).prop("autoFocus")).toBe(false);
    });
    it("with trailing selection", () => {
        const component = shallow(
            <InspectorColumn
                items={{
                    "Item One": true,
                    "Item Two": true
                }}
                refTargets={{}}
                onSelect={() => { }}
                selectedItem="Item Two"
                trailingSelection
            />
        );
        expect(component.hasClass("with-selection")).toBe(true);
        expect(component.hasClass("trailing-selection")).toBe(true);
        expect(component.find("InspectorItem").at(0).prop("selected")).toBe(false);
        expect(component.find("InspectorItem").at(1).prop("selected")).toBe(true);
        expect(component.find("InspectorItem").at(1).prop("autoFocus")).toBe(true);
    });
});
describe("failing PropType validation", () => {
    it("for invalid selectedItem", () => {
        const component = () => (
            <InspectorColumn
                items={{
                    "Item One": {}
                }}
                refTargets={{}}
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
                    "Item One": {}
                }}
                refTargets={{}}
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
                    "Item One": {}
                }}
                refTargets={{}}
                onSelect={() => { }}
                trailingSelection
            />
        );
        expect(component).toThrowError("Warning: Failed prop type: `trailingSelection` is true while there is no `selectedItem`\n"
            + "    in InspectorColumn");
    });
});
