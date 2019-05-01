import React from "react";
import { shallow } from "enzyme";

import InspectorItem from "../../src/component/InspectorItem";
import JsonSchema from "../../src/model/JsonSchema";
import JsonSchemaGroup from "../../src/model/JsonSchemaGroup";
import JsonSchemaOneOfGroup from "../../src/model/JsonSchemaOneOfGroup";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(
            <InspectorItem
                name="Item Name"
                schemaGroup={new JsonSchemaGroup()}
                onSelect={() => { }}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it.each`
        testTitle                 | optionIndexes | hasNestedItems
        ${"with nested items"}    | ${[0]}        | ${true}
        ${"without nested items"} | ${[1]}        | ${false}
    `("representing option $testTitle", ({ optionIndexes, hasNestedItems }) => {
        const schemaGroup = new JsonSchemaOneOfGroup()
            .with(new JsonSchema({
                properties: { foo: true }
            }))
            .with(new JsonSchema({
                title: "bar"
            }));
        const component = shallow(
            <InspectorItem
                name="Foobar"
                schemaGroup={schemaGroup}
                optionIndexes={optionIndexes}
                onSelect={() => { }}
            />
        );
        expect(component.hasClass("has-nested-items")).toBe(hasNestedItems);
    });
    it("with nested children", () => {
        const component = shallow(
            <InspectorItem
                name="Foo"
                schemaGroup={new JsonSchemaGroup().with(new JsonSchema({
                    properties: { bar: true }
                }))}
                onSelect={() => { }}
            />
        );
        expect(component.hasClass("has-nested-items")).toBe(true);
    });
    it("while selected", () => {
        const component = shallow(
            <InspectorItem
                name="Bar"
                schemaGroup={new JsonSchemaGroup()}
                onSelect={() => { }}
                selected
            />
        );
        expect(component.hasClass("selected")).toBe(true);
    });
    it("while matching filter", () => {
        const component = shallow(
            <InspectorItem
                name="Foobar"
                schemaGroup={new JsonSchemaGroup()}
                onSelect={() => { }}
                matchesFilter
            />
        );
        expect(component.find("button").hasClass("matching-filter")).toBe(true);
        expect(component.find("button").hasClass("not-matching-filter")).toBe(false);
    });
    it("while not matching filter", () => {
        const component = shallow(
            <InspectorItem
                name="Baz"
                schemaGroup={new JsonSchemaGroup()}
                onSelect={() => { }}
                matchesFilter={false}
            />
        );
        expect(component.find("button").hasClass("matching-filter")).toBe(false);
        expect(component.find("button").hasClass("not-matching-filter")).toBe(true);
    });
    it("with custom rendered content", () => {
        const component = shallow(
            <InspectorItem
                name="Qux"
                schemaGroup={new JsonSchemaGroup()}
                onSelect={() => { }}
                renderContent={() => (
                    <span className="custom-content">Custom content</span>
                )}
            />
        );
        expect(component.find(".custom-content").text()).toEqual("Custom content");
    });
});
describe("calls onSelect", () => {
    it.each`
        event
        ${"click"}
        ${"focus"}
    `("for $event event", ({ event }) => {
        let onSelectCounter = 0;
        const component = shallow(
            <InspectorItem
                name="Foo"
                schemaGroup={new JsonSchemaGroup()}
                onSelect={() => {
                    onSelectCounter += 1;
                }}
            />
        );
        component.simulate(event);
        expect(onSelectCounter).toBe(1);
    });
});
