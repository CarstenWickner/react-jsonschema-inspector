import React from "react";
import { shallow } from "enzyme";
import InspectorItem from "../src/InspectorItem";
import JsonSchema from "../src/JsonSchema";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(
            <InspectorItem
                name="Item Name"
                schema={new JsonSchema()}
                onSelect={() => { }}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("with nested children", () => {
        const component = shallow(
            <InspectorItem
                name="Item Name"
                schema={new JsonSchema({
                    properties: {
                        "Child Item Name": true
                    }
                })}
                onSelect={() => { }}
            />
        );
        expect(component.hasClass("has-nested-items")).toBe(true);
    });
    it("while selected", () => {
        const component = shallow(
            <InspectorItem
                name="Item Name"
                schema={new JsonSchema()}
                onSelect={() => { }}
                selected
            />
        );
        expect(component.hasClass("selected")).toBe(true);
    });
    it("while matching filter", () => {
        const component = shallow(
            <InspectorItem
                name="Item Name"
                schema={new JsonSchema()}
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
                name="Item Name"
                schema={new JsonSchema()}
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
                name="Item Name"
                schema={new JsonSchema()}
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
    let onSelectCounter;
    let component;
    beforeEach(() => {
        onSelectCounter = 0;
        component = shallow(
            <InspectorItem
                name="Item Name"
                schema={new JsonSchema()}
                onSelect={() => {
                    onSelectCounter += 1;
                }}
            />
        );
    });

    it("for click event", () => {
        // trigger the onClick callback
        component.simulate("click");
        expect(onSelectCounter).toBe(1);
    });

    it("for focus event", () => {
        // trigger the onFocus callback
        component.simulate("focus");
        expect(onSelectCounter).toBe(1);
    });
});
