import React from "react";
import { shallow } from "enzyme";

import InspectorColumn from "../../src/component/InspectorColumn";

import JsonSchema from "../../src/model/JsonSchema";
import JsonSchemaGroup from "../../src/model/JsonSchemaGroup";

describe("renders correctly", () => {
    it("with minimal/default props (items)", () => {
        const { scope } = new JsonSchema({
            definitions: { Target: {} }
        });
        const component = shallow(
            <InspectorColumn
                items={{
                    "Item One": new JsonSchemaGroup().with(new JsonSchema({ $id: "Schema One" }, {}, scope)),
                    "Item Two": new JsonSchemaGroup().with(new JsonSchema({ $id: "Schema Two" }, {}, scope))
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
                    "Item One": new JsonSchemaGroup(),
                    "Item Two": new JsonSchemaGroup()
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
                    "Item One": new JsonSchemaGroup(),
                    "Item Two": new JsonSchemaGroup()
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
    it("with filtered items", () => {
        const component = shallow(
            <InspectorColumn
                items={{
                    "Item One": new JsonSchemaGroup(),
                    "Item Two": new JsonSchemaGroup()
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
    const onSelect = jest.fn(() => { });

    it("clearing selection when clicking on column", () => {
        const component = shallow(
            <InspectorColumn
                items={{ Foo: new JsonSchemaGroup() }}
                onSelect={onSelect}
            />
        );
        component.find(".jsonschema-inspector-column").prop("onClick")({});
        expect(onSelect.mock.calls).toHaveLength(1);
        // expect no second parameter indicating selected item
        expect(onSelect.mock.calls[0]).toHaveLength(1);
    });
    it("setting selection when clicking on item", () => {
        const component = shallow(
            <InspectorColumn
                items={{ Foo: new JsonSchemaGroup() }}
                onSelect={onSelect}
            />
        );
        component.find("InspectorItem").prop("onSelect")({});
        expect(onSelect.mock.calls).toHaveLength(1);
        // expect second parameter indicating selected item
        expect(onSelect.mock.calls[0]).toHaveLength(2);
        expect(onSelect.mock.calls[0][1]).toEqual("Foo");
    });
});
