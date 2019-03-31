import React from "react";
import { shallow } from "enzyme";

import InspectorOptionsColumn from "../../src/component/InspectorOptionsColumn";

import JsonSchema from "../../src/model/JsonSchema";
import JsonSchemaAllOfGroup from "../../src/model/JsonSchemaAllOfGroup";
import JsonSchemaOneOfGroup from "../../src/model/JsonSchemaOneOfGroup";

describe("renders correctly", () => {
    const parserConfig = {
        oneOf: { type: "asAdditionalColumn" }
    };
    const contextGroup = new JsonSchemaAllOfGroup()
        .with(new JsonSchema({ description: "Foobar" }))
        .with(new JsonSchemaOneOfGroup(parserConfig)
            .with(new JsonSchema({ title: "Foo" }))
            .with(new JsonSchema({ title: "Bar" })));
    const options = {
        groupTitle: "one of",
        options: [{}, {}]
    };
    it("with minimal/default props", () => {
        const component = shallow(
            <InspectorOptionsColumn
                options={options}
                contextGroup={contextGroup}
                onSelect={() => { }}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("with selection", () => {
        const component = shallow(
            <InspectorOptionsColumn
                options={options}
                contextGroup={contextGroup}
                onSelect={() => { }}
                selectedItem={[1]}
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
            <InspectorOptionsColumn
                options={options}
                contextGroup={contextGroup}
                onSelect={() => { }}
                selectedItem={[1]}
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
            <InspectorOptionsColumn
                options={options}
                contextGroup={contextGroup}
                onSelect={() => { }}
                filteredItems={[[1]]}
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
    const parserConfig = {
        oneOf: { type: "asAdditionalColumn" }
    };
    const contextGroup = new JsonSchemaAllOfGroup()
        .with(new JsonSchema({ description: "Foobar" }, parserConfig))
        .with(new JsonSchemaOneOfGroup(parserConfig)
            .with(new JsonSchema({ title: "Foo" }, parserConfig))
            .with(new JsonSchema({ title: "Bar" }, parserConfig)));
    const options = {
        groupTitle: "one of",
        options: [{}, {}]
    };

    it("clearing selection when clicking on column", () => {
        const component = shallow(
            <InspectorOptionsColumn
                options={options}
                contextGroup={contextGroup}
                onSelect={onSelect}
            />
        );
        component.find(".jsonschema-inspector-column").prop("onClick")({});
        expect(onSelect.mock.calls).toHaveLength(1);
        // expect no second parameter indicating selected item
        expect(onSelect.mock.calls[0]).toHaveLength(1);
    });
    it("setting selection when clicking on option", () => {
        const component = shallow(
            <InspectorOptionsColumn
                options={options}
                contextGroup={contextGroup}
                onSelect={onSelect}
            />
        );
        const optionItems = component.find("InspectorItem");
        expect(optionItems).toHaveLength(2);
        optionItems.at(0).prop("onSelect")({});
        expect(onSelect.mock.calls).toHaveLength(1);
        // expect second parameter indicating selected option
        expect(onSelect.mock.calls[0]).toHaveLength(2);
        expect(onSelect.mock.calls[0][1]).toEqual([0]);
    });
});
