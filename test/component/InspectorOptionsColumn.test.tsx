import * as React from "react";
import { shallow } from "enzyme";

import { InspectorOptionsColumn } from "../../src/component/InspectorOptionsColumn";

import { getOptionsInSchemaGroup } from "../../src/model/schemaUtils";
import { JsonSchema } from "../../src/model/JsonSchema";
import { JsonSchemaAllOfGroup } from "../../src/model/JsonSchemaAllOfGroup";
import { JsonSchemaAnyOfGroup, JsonSchemaOneOfGroup } from "../../src/model/JsonSchemaOptionalsGroup";
import { ParserConfig } from "../../src/types/ParserConfig";
import { isDefined } from "../../src/model/utils";

describe("renders correctly", () => {
    const oneOfOptionNameForIndex = (optionIndexes: Array<number>): string => `Exclusive Option ${optionIndexes.map((index) => index + 1).join("-")}`;
    const parserConfig: ParserConfig = {
        oneOf: { optionNameForIndex: oneOfOptionNameForIndex }
    };
    const contextGroup = new JsonSchemaAllOfGroup()
        .with(new JsonSchema({ description: "Foobar" }, {}))
        .with(
            new JsonSchemaOneOfGroup(parserConfig)
                .with(new JsonSchema({ title: "Foo" }, {}))
                .with(
                    new JsonSchemaAnyOfGroup(parserConfig).with(new JsonSchema({ title: "Bar" }, {})).with(new JsonSchema({ description: "Baz" }, {}))
                )
        );
    const options = getOptionsInSchemaGroup(contextGroup);
    it("with minimal/default props", () => {
        const component = shallow(<InspectorOptionsColumn options={options} contextGroup={contextGroup} onSelect={(): void => {}} />);
        expect(component).toMatchSnapshot();
    });
    it("with selection", () => {
        const component = shallow(
            <InspectorOptionsColumn options={options} contextGroup={contextGroup} onSelect={(): void => {}} selectedItem={[1, 0]} />
        );
        expect(component.hasClass("with-selection")).toBe(true);
        expect(component.hasClass("trailing-selection")).toBe(false);
        expect(component.find({ name: "Exclusive Option 1" }).prop("selected")).toBe(false);
        expect(component.find({ name: "Option 2-1" }).prop("selected")).toBe(true);
        expect(component.find({ name: "Option 2-2" }).prop("selected")).toBe(false);
        expect(component.find({ name: "Exclusive Option 1" }).prop("matchesFilter")).toBeUndefined();
        expect(component.find({ name: "Option 2-1" }).prop("matchesFilter")).toBeUndefined();
        expect(component.find({ name: "Option 2-2" }).prop("matchesFilter")).toBeUndefined();
    });
    it("with trailing selection", () => {
        const component = shallow(
            <InspectorOptionsColumn options={options} contextGroup={contextGroup} onSelect={(): void => {}} selectedItem={[0]} trailingSelection />
        );
        expect(component.hasClass("with-selection")).toBe(true);
        expect(component.hasClass("trailing-selection")).toBe(true);
        expect(component.find({ name: "Exclusive Option 1" }).prop("selected")).toBe(true);
        expect(component.find({ name: "Option 2-1" }).prop("selected")).toBe(false);
        expect(component.find({ name: "Option 2-2" }).prop("selected")).toBe(false);
        expect(component.find({ name: "Exclusive Option 1" }).prop("matchesFilter")).toBeUndefined();
        expect(component.find({ name: "Option 2-1" }).prop("matchesFilter")).toBeUndefined();
        expect(component.find({ name: "Option 2-2" }).prop("matchesFilter")).toBeUndefined();
    });
    it("with filtered items", () => {
        const component = shallow(
            <InspectorOptionsColumn options={options} contextGroup={contextGroup} onSelect={(): void => {}} filteredItems={[[1, 1]]} />
        );
        expect(component.hasClass("with-selection")).toBe(false);
        expect(component.hasClass("trailing-selection")).toBe(false);
        expect(component.find({ name: "Exclusive Option 1" }).prop("matchesFilter")).toBe(false);
        expect(component.find({ name: "Option 2-1" }).prop("matchesFilter")).toBe(false);
        expect(component.find({ name: "Option 2-2" }).prop("matchesFilter")).toBe(true);
    });
});
describe("calls onSelect", () => {
    const onSelect = jest.fn(() => {});
    const contextGroup = new JsonSchemaAllOfGroup()
        .with(new JsonSchema({ description: "Foobar" }, {}))
        .with(new JsonSchemaOneOfGroup({}).with(new JsonSchema({ title: "Foo" }, {})).with(new JsonSchema({ title: "Bar" }, {})));
    const options = {
        groupTitle: "one of",
        options: [{}, {}]
    };

    it("clearing selection when clicking on column", () => {
        const component = shallow(<InspectorOptionsColumn options={options} contextGroup={contextGroup} onSelect={onSelect} />);
        const onClickListener = component.find(".jsonschema-inspector-column").prop("onClick");
        expect(onClickListener).toBeDefined();
        if (isDefined(onClickListener)) {
            onClickListener({} as React.MouseEvent);
        }
        expect(onSelect.mock.calls).toHaveLength(1);
        // expect no second parameter indicating selected item
        expect(onSelect.mock.calls[0]).toHaveLength(1);
    });
    it("setting selection when clicking on option", () => {
        const component = shallow(<InspectorOptionsColumn options={options} contextGroup={contextGroup} onSelect={onSelect} />);
        expect(component.find({ name: "Option 1" }).exists()).toBe(true);
        expect(component.find({ name: "Option 2" }).exists()).toBe(true);
        component.find({ name: "Option 1" }).prop("onSelect")(null);
        expect(onSelect.mock.calls).toHaveLength(1);
        // expect second parameter indicating selected option
        expect(onSelect.mock.calls[0]).toHaveLength(2);
        expect(onSelect.mock.calls[0][1]).toEqual([0]);
    });
});
