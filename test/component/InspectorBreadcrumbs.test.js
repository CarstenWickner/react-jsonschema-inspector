import React from "react";
import { shallow } from "enzyme";

import InspectorBreadcrumbs from "../../src/component/InspectorBreadcrumbs";
import { createRenderDataBuilder } from "../../src/component/renderDataUtils";

describe("renders correctly", () => {
    const buildColumnData = createRenderDataBuilder(() => () => { });
    it("with minimal/default props", () => {
        const schema = {
            properties: {
                foo: true,
                bar: true
            }
        };
        const { columnData } = buildColumnData({ foobar: schema }, [], ["foobar"], {});
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={columnData}
                breadcrumbsOptions={{}}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("without selection", () => {
        const { columnData } = buildColumnData({ foo: {} }, [], [], {});
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={columnData}
                breadcrumbsOptions={{}}
            />
        );
        expect(component.find(".jsonschema-inspector-breadcrumbs-icon").exists()).toBe(true);
        expect(component.find(".jsonschema-inspector-breadcrumbs-item").exists()).toBe(false);
        expect(component.text()).toEqual("");
    });
    it("with prefix", () => {
        const { columnData } = buildColumnData({ foo: {} }, [], ["foo"], {});
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={columnData}
                breadcrumbsOptions={{
                    prefix: "variableContext."
                }}
            />
        );
        expect(component.find(".jsonschema-inspector-breadcrumbs-item")).toHaveLength(1);
        expect(component.text()).toEqual("variableContext.foo");
    });
    describe("schema with array", () => {
        const schemas = {
            foo: {
                items: {
                    properties: {
                        bar: { title: "Property Title" }
                    }
                }
            }
        };
        it.each`
            testTitle                 | selectedItems            | itemCount | breadcrumbsText
            ${"root selection"}       | ${["foo"]}               | ${1}      | ${"foo"}
            ${"array selection"}      | ${["foo", "[0]"]}        | ${2}      | ${"foo.[0]"}
            ${"array item selection"} | ${["foo", "[0]", "bar"]} | ${3}      | ${"foo.[0].bar"}
        `("$testTitle", ({ selectedItems, itemCount, breadcrumbsText }) => {
            const { columnData } = buildColumnData(schemas, [], selectedItems, {});
            const component = shallow(
                <InspectorBreadcrumbs
                    columnData={columnData}
                    breadcrumbsOptions={{}}
                />
            );
            expect(component.text()).toEqual(breadcrumbsText);
            expect(component.find(".jsonschema-inspector-breadcrumbs-item")).toHaveLength(itemCount);
        });
        it("with custom separator", () => {
            const { columnData } = buildColumnData(schemas, [], ["foo", "[0]", "bar"], {});
            const component = shallow(
                <InspectorBreadcrumbs
                    columnData={columnData}
                    breadcrumbsOptions={{
                        prefix: "$this->",
                        separator: "->"
                    }}
                />
            );
            expect(component.find(".jsonschema-inspector-breadcrumbs-item")).toHaveLength(3);
            expect(component.text()).toEqual("$this->foo->[0]->bar");
        });
    });
    describe("with option selection", () => {
        const parserConfig = {
            oneOf: {}
        };
        const schema = {
            oneOf: [
                { title: "Foobar" },
                {
                    properties: {
                        baz: true
                    }
                }
            ]
        };

        it("is skipping option selection", () => {
            const { columnData } = buildColumnData({ foo: schema }, [], ["foo", [1], "baz"], parserConfig);
            const component = shallow(
                <InspectorBreadcrumbs
                    columnData={columnData}
                    breadcrumbsOptions={{}}
                />
            );
            expect(component.find(".jsonschema-inspector-breadcrumbs-item")).toHaveLength(2);
            expect(component.text()).toEqual("foo.baz");
        });
        it.each`
            testTitle                                                                      | optionIndexes | hasNestedItems
            ${"indicates on previous breadcrumb when selected option has no nested items"} | ${[0]}        | ${false}
            ${"indicates on previous breadcrumb when selected option has nested property"} | ${[1]}        | ${true}
        `("$testTitle", ({ optionIndexes, hasNestedItems }) => {
            const { columnData } = buildColumnData({ foo: schema }, [], ["foo", optionIndexes], parserConfig);
            const component = shallow(
                <InspectorBreadcrumbs
                    columnData={columnData}
                    breadcrumbsOptions={{}}
                />
            );
            const singleItem = component.find(".jsonschema-inspector-breadcrumbs-item");
            expect(singleItem).toHaveLength(1);
            expect(singleItem.hasClass("has-nested-items")).toBe(hasNestedItems);
            expect(component.text()).toEqual("foo");
        });
    });
    it("with navigation by default", () => {
        const { columnData } = buildColumnData({ foo: {} }, [], ["foo"], {});
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={columnData}
                breadcrumbsOptions={{}}
            />
        );
        const selectedRootItem = component.find(".jsonschema-inspector-breadcrumbs-item");
        expect(selectedRootItem).toHaveLength(1);
        expect(selectedRootItem.prop("onDoubleClick")).toBeDefined();
    });
});
describe("handles double-click navigation", () => {
    const onSelectOne = jest.fn(() => { });
    const onSelectTwo = jest.fn(() => { });
    const { columnData } = createRenderDataBuilder(
        index => (index === 0 ? onSelectOne : onSelectTwo)
    )(
        {
            foo: {
                properties: {
                    bar: {}
                }
            }
        },
        [],
        ["foo", "bar"],
        {}
    );

    it("triggers onSelect on root selection", () => {
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={columnData}
                breadcrumbsOptions={{}}
            />
        );
        const selectedItems = component.find(".jsonschema-inspector-breadcrumbs-item");
        expect(selectedItems).toHaveLength(2);

        selectedItems.at(0).prop("onDoubleClick")({});
        expect(onSelectOne.mock.calls).toHaveLength(1);
        expect(onSelectOne.mock.calls[0][1]).toEqual("foo");
        expect(onSelectTwo.mock.calls).toHaveLength(0);
    });
    it("triggers onSelect on non-root selection", () => {
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={columnData}
                breadcrumbsOptions={{}}
            />
        );
        const selectedItems = component.find(".jsonschema-inspector-breadcrumbs-item");
        expect(selectedItems).toHaveLength(2);

        selectedItems.at(1).prop("onDoubleClick")({});
        expect(onSelectOne.mock.calls).toHaveLength(0);
        expect(onSelectTwo.mock.calls).toHaveLength(1);
        expect(onSelectTwo.mock.calls[0][1]).toEqual("bar");
    });
    it("ignored when navigation is prevented", () => {
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={columnData}
                breadcrumbsOptions={{
                    preventNavigation: true
                }}
            />
        );
        const selectedItems = component.find(".jsonschema-inspector-breadcrumbs-item");
        expect(selectedItems).toHaveLength(2);
        expect(selectedItems.at(0).prop("onDoubleClick")).not.toBeDefined();
        expect(selectedItems.at(1).prop("onDoubleClick")).not.toBeDefined();
    });
});
