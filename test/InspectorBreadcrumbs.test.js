import React from "react";
import { shallow } from "enzyme";
import InspectorBreadcrumbs from "../src/InspectorBreadcrumbs";

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
                        items: { "Schema One": schema },
                        selectedItem: "Schema One",
                        trailingSelection: true,
                        onSelect: () => { }
                    },
                    {
                        items: schema.properties,
                        selectedItem: null,
                        trailingSelection: false,
                        onSelect: () => { }
                    }
                ]}
                refTargets={{}}
            />
        );
        expect(component).toMatchSnapshot();
    });
    it("without selection", () => {
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={[
                    {
                        items: { root: {} },
                        selectedItem: null,
                        trailingSelection: false,
                        onSelect: () => { }
                    }
                ]}
                refTargets={{}}
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
                        items: { root: {} },
                        selectedItem: "root",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                refTargets={{}}
                prefix="variableContext."
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
                            root: { items: itemSchema }
                        },
                        selectedItem: "root",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                refTargets={{}}
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
                            root: { items: itemSchema }
                        },
                        selectedItem: "root",
                        trailingSelection: false,
                        onSelect: () => { }
                    },
                    {
                        items: itemSchema.properties,
                        selectedItem: "itemProperty",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                refTargets={{}}
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
                            root: { items: itemSchema }
                        },
                        selectedItem: "root",
                        trailingSelection: false,
                        onSelect: () => { }
                    },
                    {
                        items: itemSchema.properties,
                        selectedItem: "itemProperty",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                refTargets={{}}
                arrayItemAccessor=".get(0)"
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
                            root: {
                                items: {
                                    items: {
                                        items: itemSchema
                                    }
                                }
                            }
                        },
                        selectedItem: "root",
                        trailingSelection: false,
                        onSelect: () => { }
                    },
                    {
                        items: itemSchema.properties,
                        selectedItem: "itemProperty",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                refTargets={{}}
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
                            root: {
                                properties: {
                                    item: itemSchema
                                }
                            }
                        },
                        selectedItem: "root",
                        trailingSelection: false,
                        onSelect: () => { }
                    },
                    {
                        items: {
                            item: itemSchema
                        },
                        selectedItem: "item",
                        trailingSelection: true,
                        onSelect: () => { }
                    },
                    {
                        items: itemSchema.properties,
                        selectedItem: null,
                        trailingSelection: false,
                        onSelect: () => { }
                    }
                ]}
                refTargets={{}}
                prefix="$this->"
                separator="->"
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
                        items: { root: {} },
                        selectedItem: "root",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                refTargets={{}}
            />
        );
        const selectedRootItem = component.find(".jsonschema-inspector-breadcrumbs-item");
        expect(selectedRootItem).toHaveLength(1);
        expect(selectedRootItem.prop("onDoubleClick")).toBeDefined();
    });
    it("when preventing navigation", () => {
        const component = shallow(
            <InspectorBreadcrumbs
                columnData={[
                    {
                        items: { root: {} },
                        selectedItem: "root",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                refTargets={{}}
                preventNavigation
            />
        );
        const selectedRootItem = component.find(".jsonschema-inspector-breadcrumbs-item");
        expect(selectedRootItem).toHaveLength(1);
        expect(selectedRootItem.prop("onDoubleClick")).not.toBeDefined();
    });
});
