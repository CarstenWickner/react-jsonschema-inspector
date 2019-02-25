import React from "react";
import { mount, shallow } from "enzyme";
import InspectorItem from "../src/InspectorItem";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const component = shallow(
            <InspectorItem
                name="Item Name"
                schema={{}}
                refTargets={{}}
                onSelect={() => { }}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("with nested children", () => {
        const component = shallow(
            <InspectorItem
                name="Item Name"
                schema={{
                    properties: {
                        "Child Item Name": true
                    }
                }}
                refTargets={{}}
                onSelect={() => { }}
            />
        );
        expect(component.hasClass("has-nested-items")).toBe(true);
    });
    it("while selected", () => {
        const component = shallow(
            <InspectorItem
                name="Item Name"
                schema={{}}
                refTargets={{}}
                onSelect={() => { }}
                selected
            />
        );
        expect(component.hasClass("selected")).toBe(true);
    });
    it("while autoFocus and selected", () => {
        // need to mount() in order to get access to buttonRef field
        const component = mount(
            <InspectorItem
                name="Item Name"
                schema={{}}
                refTargets={{}}
                onSelect={() => { }}
                selected
                autoFocus
            />
        );
        expect(component.find("button").hasClass("selected")).toBe(true);
        const { buttonRef } = component.instance();
        expect(buttonRef).toBeTruthy();
    });
    it("with custom rendered content", () => {
        const component = shallow(
            <InspectorItem
                name="Item Name"
                schema={{}}
                refTargets={{}}
                onSelect={() => { }}
                renderContent={() => (
                    <span className="custom-content">Custom content</span>
                )}
            />
        );
        expect(component.find(".custom-content").text()).toEqual("Custom content");
    });
});
describe("failing PropType validation", () => {
    it("for autoFocus if not selected", () => {
        const component = () => (
            <InspectorItem
                name="Item Name"
                schema={{}}
                refTargets={{}}
                onSelect={() => { }}
                autoFocus
            />
        );
        expect(component).toThrowError("Warning: Failed prop type: `autoFocus` is true while it is not `selected`\n    in InspectorItem");
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
                schema={{}}
                refTargets={{}}
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
