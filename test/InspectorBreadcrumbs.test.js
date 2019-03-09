import React from "react";
import { shallow } from "enzyme";
import InspectorBreadcrumbs from "../src/InspectorBreadcrumbs";
import JsonSchema from "../src/JsonSchema";

describe("renders correctly", () => {
    it("with minimal/default props", () => {
        const schema = {
            properties: {
                "Item One": true,
                "Item Two": true
            }
        };
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={[
                    {
                        items: { "Schema One": new JsonSchema(schema) },
                        selectedItem: "Schema One",
                        trailingSelection: true,
                        onSelect: () => { }
                    },
                    {
                        items: {
                            "Item One": new JsonSchema(),
                            "Item Two": new JsonSchema()
                        },
                        onSelect: () => { }
                    }
                ]}
                breadcrumbsOptions={{}}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("without selection", () => {
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={[
                    {
                        items: { root: new JsonSchema() },
                        onSelect: () => { }
                    }
                ]}
                breadcrumbsOptions={{}}
            />
        );
        expect(component.find(".jsonschema-inspector-breadcrumbs-icon").exists()).toBe(true);
        expect(component.find(".jsonschema-inspector-breadcrumbs-item").exists()).toBe(false);
        expect(component.text()).toEqual("");
    });
    it("with prefix", () => {
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={[
                    {
                        items: { root: new JsonSchema() },
                        selectedItem: "root",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                breadcrumbsOptions={{
                    prefix: "variableContext."
                }}
            />
        );
        expect(component.find(".jsonschema-inspector-breadcrumbs-item")).toHaveLength(1);
        expect(component.text()).toEqual("variableContext.root");
    });
    it("with root array selection", () => {
        const itemSchema = {
            properties: {
                itemProperty: { title: "Property Title" }
            }
        };
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={[
                    {
                        items: {
                            root: new JsonSchema({ items: itemSchema })
                        },
                        selectedItem: "root",
                        trailingSelection: true,
                        onSelect: () => { }
                    },
                    {
                        items: {
                            itemProperty: new JsonSchema({ title: "Property Title" })
                        },
                        onSelect: () => { }
                    }
                ]}
                breadcrumbsOptions={{}}
            />
        );
        expect(component.find(".jsonschema-inspector-breadcrumbs-item")).toHaveLength(1);
        expect(component.text()).toEqual("root");
    });
    it("with array item selection", () => {
        const itemSchema = {
            properties: {
                itemProperty: { title: "Property Title" }
            }
        };
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={[
                    {
                        items: {
                            root: new JsonSchema({ items: itemSchema })
                        },
                        selectedItem: "root",
                        onSelect: () => { }
                    },
                    {
                        items: {
                            itemProperty: new JsonSchema({ title: "Property Title" })
                        },
                        selectedItem: "itemProperty",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                breadcrumbsOptions={{}}
            />
        );
        expect(component.find(".jsonschema-inspector-breadcrumbs-item")).toHaveLength(2);
        expect(component.text()).toEqual("root[0].itemProperty");
    });
    it("with custom arrayItemAccessor", () => {
        const itemSchema = {
            properties: {
                itemProperty: { title: "Property Title" }
            }
        };
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={[
                    {
                        items: {
                            root: new JsonSchema({ items: itemSchema })
                        },
                        selectedItem: "root",
                        onSelect: () => { }
                    },
                    {
                        items: {
                            itemProperty: new JsonSchema({ title: "Property Title" })
                        },
                        selectedItem: "itemProperty",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                breadcrumbsOptions={{
                    arrayItemAccessor: ".get(0)"
                }}
            />
        );
        expect(component.find(".jsonschema-inspector-breadcrumbs-item")).toHaveLength(2);
        expect(component.text()).toEqual("root.get(0).itemProperty");
    });
    it("with nested array item selection", () => {
        const itemSchema = {
            properties: {
                itemProperty: { title: "Property Title" }
            }
        };
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={[
                    {
                        items: {
                            root: new JsonSchema({
                                items: {
                                    items: {
                                        items: itemSchema
                                    }
                                }
                            })
                        },
                        selectedItem: "root",
                        onSelect: () => { }
                    },
                    {
                        items: {
                            itemProperty: new JsonSchema({ title: "Property Title" })
                        },
                        selectedItem: "itemProperty",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                breadcrumbsOptions={{}}
            />
        );
        expect(component.find(".jsonschema-inspector-breadcrumbs-item")).toHaveLength(2);
        expect(component.text()).toEqual("root[0][0][0].itemProperty");
    });
    it("with custom separator", () => {
        const itemSchema = {
            properties: {
                itemProperty: { title: "Property Title" }
            }
        };
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={[
                    {
                        items: {
                            root: new JsonSchema({
                                properties: {
                                    item: itemSchema
                                }
                            })
                        },
                        selectedItem: "root",
                        onSelect: () => { }
                    },
                    {
                        items: {
                            item: new JsonSchema(itemSchema)
                        },
                        selectedItem: "item",
                        trailingSelection: true,
                        onSelect: () => { }
                    },
                    {
                        items: {
                            itemProperty: new JsonSchema({ title: "Property Title" })
                        },
                        onSelect: () => { }
                    }
                ]}
                breadcrumbsOptions={{
                    prefix: "$this->",
                    separator: "->"
                }}
            />
        );
        expect(component.find(".jsonschema-inspector-breadcrumbs-item")).toHaveLength(2);
        expect(component.text()).toEqual("$this->root->item");
    });
    it("with navigation by default", () => {
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={[
                    {
                        items: { root: new JsonSchema({}) },
                        selectedItem: "root",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                breadcrumbsOptions={{}}
            />
        );
        const selectedRootItem = component.find(".jsonschema-inspector-breadcrumbs-item");
        expect(selectedRootItem).toHaveLength(1);
        expect(selectedRootItem.prop("onDoubleClick")).toBeDefined();
    });
});
describe("handles double-click navigation", () => {
    let onSelectOne;
    let onSelectTwo;
    let columnData;
    beforeEach(() => {
        onSelectOne = jest.fn(() => { });
        onSelectTwo = jest.fn(() => { });
        columnData = [
            {
                items: {
                    root: new JsonSchema({
                        properties: {
                            item: {}
                        }
                    })
                },
                selectedItem: "root",
                onSelect: onSelectOne
            },
            {
                items: {
                    item: new JsonSchema({})
                },
                selectedItem: "item",
                trailingSelection: true,
                onSelect: onSelectTwo
            }
        ];
    });

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
        expect(onSelectOne.mock.calls[0][1]).toEqual("root");
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
        expect(onSelectTwo.mock.calls[0][1]).toEqual("item");
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
