import * as React from "react";
import { shallow } from "enzyme";

import { InspectorItem } from "../../src/component/InspectorItem";
import { JsonSchema } from "../../src/model/JsonSchema";
import { JsonSchemaGroup } from "../../src/model/JsonSchemaGroup";
import { JsonSchemaOneOfGroup } from "../../src/model/JsonSchemaOptionalsGroup";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(<InspectorItem name="Item Name" schemaGroup={new JsonSchemaGroup()} onSelect={(): void => {}} />);
        expect(component).toMatchSnapshot();
    });
    it.each`
        testTitle                 | optionIndexes | hasNestedItems
        ${"with nested items"}    | ${[0]}        | ${true}
        ${"without nested items"} | ${[1]}        | ${false}
    `("representing option $testTitle", ({ optionIndexes, hasNestedItems }) => {
        const schemaGroup = new JsonSchemaOneOfGroup({})
            .with(
                new JsonSchema(
                    {
                        properties: { foo: true }
                    },
                    {}
                )
            )
            .with(
                new JsonSchema(
                    {
                        title: "bar"
                    },
                    {}
                )
            );
        const component = shallow(<InspectorItem name="Foobar" schemaGroup={schemaGroup} optionIndexes={optionIndexes} onSelect={(): void => {}} />);
        expect(component.hasClass("has-nested-items")).toBe(hasNestedItems);
    });
    it("with nested children", () => {
        const component = shallow(
            <InspectorItem
                name="Foo"
                schemaGroup={new JsonSchemaGroup().with(
                    new JsonSchema(
                        {
                            properties: { bar: true }
                        },
                        {}
                    )
                )}
                onSelect={(): void => {}}
            />
        );
        expect(component.hasClass("has-nested-items")).toBe(true);
    });
    it("while selected", () => {
        const component = shallow(<InspectorItem name="Bar" schemaGroup={new JsonSchemaGroup()} onSelect={(): void => {}} selected />);
        expect(component.hasClass("selected")).toBe(true);
    });
    it("while matching filter", () => {
        const component = shallow(<InspectorItem name="Foobar" schemaGroup={new JsonSchemaGroup()} onSelect={(): void => {}} matchesFilter />);
        expect(component.find(".jsonschema-inspector-item").hasClass("matching-filter")).toBe(true);
        expect(component.find(".jsonschema-inspector-item").hasClass("not-matching-filter")).toBe(false);
    });
    it("while not matching filter", () => {
        const component = shallow(<InspectorItem name="Baz" schemaGroup={new JsonSchemaGroup()} onSelect={(): void => {}} matchesFilter={false} />);
        expect(component.find(".jsonschema-inspector-item").hasClass("matching-filter")).toBe(false);
        expect(component.find(".jsonschema-inspector-item").hasClass("not-matching-filter")).toBe(true);
    });
    it("with custom rendered content", () => {
        const group = new JsonSchemaGroup();
        const component = shallow(
            <InspectorItem
                name="Qux"
                schemaGroup={group}
                onSelect={(): void => {}}
                optionIndexes={[0]}
                renderContent={({ name, hasNestedItems, selected, schemaGroup, optionIndexes }): React.ReactElement => (
                    <span className="custom-content">{`${name}, ${hasNestedItems}, ${selected}, ${schemaGroup === group}, ${optionIndexes}`}</span>
                )}
            />
        );
        expect(component.find(".custom-content").text()).toEqual("Qux, false, false, true, 0");
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
                onSelect={(): void => {
                    onSelectCounter += 1;
                }}
            />
        );
        component.simulate(event);
        expect(onSelectCounter).toBe(1);
    });
});
