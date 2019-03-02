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
                        items: { root: new JsonSchema({}) },
                        selectedItem: "root",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
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
                        items: { root: new JsonSchema({}) },
                        selectedItem: "root",
                        trailingSelection: true,
                        onSelect: () => { }
                    }
                ]}
                preventNavigation
            />
        );
        const selectedRootItem = component.find(".jsonschema-inspector-breadcrumbs-item");
        expect(selectedRootItem).toHaveLength(1);
        expect(selectedRootItem.prop("onDoubleClick")).not.toBeDefined();
    });
});
