import * as React from "react";
import { shallow } from "enzyme";

import { Inspector } from "../../src/component/Inspector";
import { ColViewProps } from "../../src/component/InspectorColView";
import { JsonSchema } from "../../src/model/JsonSchema";
import { RenderColumn, RenderItemsColumn } from "../../src/component/InspectorTypes";

describe("renders correctly", () => {
    const schemas = {
        "Schema One": {
            title: "Main Schema One Title",
            properties: {
                "Item One": {},
                "Item Two": {
                    items: {
                        title: "Item in Array"
                    }
                }
            }
        },
        "Schema Two": {
            properties: {
                "Item Three": { $ref: "https://carstenwickner.github.io/@jsonschema-inspector#/$defs/react-inspector" }
            }
        }
    };
    const referenceSchemas = [
        {
            $id: "https://carstenwickner.github.io/@jsonschema-inspector",
            $defs: {
                "react-inspector": { $ref: "https://carstenwickner.github.io/@jsonschema-inspector/react-inspector" }
            }
        },
        {
            $id: "https://carstenwickner.github.io/@jsonschema-inspector/react-inspector",
            title: "Title: Main React Component"
        }
    ];

    it("with minimal/default props", () => {
        const component = shallow(<Inspector schemas={schemas} referenceSchemas={referenceSchemas} />);
        expect(component).toMatchSnapshot();
    });
    describe("with search field in header", () => {
        it("filtering by fields with non-default debounce times", () => {
            const component = shallow(
                <Inspector
                    schemas={schemas}
                    referenceSchemas={referenceSchemas}
                    searchOptions={{
                        fields: ["title"],
                        debounceWait: 100,
                        debounceMaxWait: 1000,
                        inputPlaceholder: "Filter by Title"
                    }}
                />
            );
            const header = component.find(".jsonschema-inspector-header");
            expect(header.exists()).toBe(true);
            let searchField = header.childAt(0);
            expect(searchField.exists()).toBe(true);
            expect(searchField.prop("searchFilter")).toEqual("");
            const onSearchFilterChange: (newSearchFilter: string) => void = searchField.prop("onSearchFilterChange");
            // trigger change of search filter
            onSearchFilterChange("Title");
            (component.instance() as Inspector).debouncedApplySearchFilter(100, 1000).flush();
            searchField = component.find(".jsonschema-inspector-header").childAt(0);
            expect(searchField.prop("searchFilter")).toEqual("Title");
            expect(searchField.prop("placeholder")).toEqual("Filter by Title");
            const { filteredItems } = (component.find("InspectorColView").prop("columnData") as Array<RenderColumn>)[0];
            expect(filteredItems).toBeDefined();
            expect(filteredItems).toHaveLength(2);
            expect(filteredItems).toEqual(["Schema One", "Schema Two"]);
        });
        it("filtering via custom filterBy function", () => {
            const component = shallow(
                <Inspector
                    schemas={schemas}
                    referenceSchemas={referenceSchemas}
                    searchOptions={{
                        filterBy: (searchFilter) => (rawSchema): boolean => !!rawSchema[searchFilter]
                    }}
                />
            );
            const onSearchFilterChange: (newSearchFilter: string) => void = component
                .find(".jsonschema-inspector-header")
                .childAt(0)
                .prop("onSearchFilterChange");
            // trigger change of search filter (looking for all schemas with a `properties` field)
            onSearchFilterChange("properties");
            // flush based on default debounce times
            (component.instance() as Inspector).debouncedApplySearchFilter(200, 500).flush();
            expect(
                component
                    .find(".jsonschema-inspector-header")
                    .childAt(0)
                    .prop("searchFilter")
            ).toEqual("properties");
            const { filteredItems } = (component.find("InspectorColView").prop("columnData") as Array<RenderColumn>)[0];
            expect(filteredItems).toBeDefined();
            expect(filteredItems).toHaveLength(2);
            expect(filteredItems[0]).toEqual("Schema One");
            expect(filteredItems[1]).toEqual("Schema Two");
        });
        it("filtering by property names", () => {
            const component = shallow(
                <Inspector
                    schemas={schemas}
                    referenceSchemas={referenceSchemas}
                    searchOptions={{
                        byPropertyName: true
                    }}
                />
            );
            const onSearchFilterChange: (newSearchFilter: string) => void = component
                .find(".jsonschema-inspector-header")
                .childAt(0)
                .prop("onSearchFilterChange");
            // trigger change of search filter (looking for all top-level properties containing 'Schema Two')
            onSearchFilterChange("Schema Two");
            // flush based on default debounce times
            (component.instance() as Inspector).debouncedApplySearchFilter(200, 500).flush();
            expect(
                component
                    .find(".jsonschema-inspector-header")
                    .childAt(0)
                    .prop("searchFilter")
            ).toEqual("Schema Two");
            const { filteredItems } = (component.find("InspectorColView").prop("columnData") as Array<RenderColumn>)[0];
            expect(filteredItems).toBeDefined();
            expect(filteredItems).toHaveLength(1);
            expect(filteredItems[0]).toEqual("Schema Two");
        });
        it("filtering only when at least 3 characters were entered", () => {
            const component = shallow(
                <Inspector
                    schemas={schemas}
                    referenceSchemas={referenceSchemas}
                    searchOptions={{
                        filterBy: (searchFilter: string): (() => boolean) => (searchFilter.length < 3 ? undefined : (): boolean => true),
                        byPropertyName: false,
                        debounceWait: 100
                    }}
                />
            );
            const onSearchFilterChange: (newSearchFilter: string) => void = component
                .find(".jsonschema-inspector-header")
                .childAt(0)
                .prop("onSearchFilterChange");
            // trigger change of search filter (but without any filtering being applied since there are only two characters)
            onSearchFilterChange("12");
            // flush based on default debounce maxWait
            (component.instance() as Inspector).debouncedApplySearchFilter(100, 500).flush();
            expect(
                component
                    .find(".jsonschema-inspector-header")
                    .childAt(0)
                    .prop("searchFilter")
            ).toEqual("12");
            const { filteredItems } = (component.find("InspectorColView").prop("columnData") as Array<RenderColumn>)[0];
            expect(filteredItems).toBeUndefined();
        });
    });
    describe("with header tool-bar", () => {
        const renderHeaderToolBar = (): React.ReactChild => <div>tool-bar-item</div>;
        it("without search field", () => {
            const component = shallow(<Inspector schemas={schemas} renderHeaderToolBar={renderHeaderToolBar} searchOptions={null} />);
            const header = component.find(".jsonschema-inspector-header");
            expect(header.exists()).toBe(true);
            expect(header.childAt(0).text()).toBe("tool-bar-item");
            expect(header.childAt(1).exists()).toBe(false);
        });
        it("in addition to search field", () => {
            const component = shallow(
                <Inspector
                    schemas={schemas}
                    renderHeaderToolBar={renderHeaderToolBar}
                    searchOptions={{
                        byPropertyName: true
                    }}
                />
            );
            const header = component.find(".jsonschema-inspector-header");
            expect(header.exists()).toBe(true);
            expect(header.childAt(0).prop("searchFilter")).toBe("");
            expect(header.childAt(1).text()).toBe("tool-bar-item");
        });
    });
    it("without header", () => {
        const component = shallow(<Inspector schemas={schemas} searchOptions={null} />);
        expect(component.find(".jsonschema-inspector-header").exists()).toBe(false);
    });
    it("without footer", () => {
        const component = shallow(<Inspector schemas={schemas} breadcrumbs={null} />);
        expect(component.find(".jsonschema-inspector-footer").exists()).toBe(false);
    });
    it("with root selection", () => {
        const selectedSchema = "Schema One";
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={[selectedSchema]} />);
        const { columnData } = component.find("InspectorColView").props() as ColViewProps;
        expect(columnData).toHaveLength(2);
        expect(((columnData[0] as RenderItemsColumn).items[selectedSchema].entries[0] as JsonSchema).schema).toEqual(schemas[selectedSchema]);
        expect(columnData[0].selectedItem).toBe(selectedSchema);
        expect(columnData[0].trailingSelection).toBe(true);
        expect(typeof columnData[0].onSelect).toBe("function");
        expect(Object.keys((columnData[1] as RenderItemsColumn).items)).toEqual(["Item One", "Item Two"]);
        expect(typeof columnData[1].onSelect).toBe("function");
    });
    it("with multi-column leaf selection", () => {
        const selectedSchema = "Schema Two";
        const selectedItem = "Item Three";
        const component = shallow(
            <Inspector schemas={schemas} referenceSchemas={referenceSchemas} defaultSelectedItems={[selectedSchema, selectedItem]} />
        );
        const { columnData } = component.find("InspectorColView").props() as ColViewProps;
        expect(columnData).toHaveLength(2);
        expect(((columnData[0] as RenderItemsColumn).items[selectedSchema].entries[0] as JsonSchema).schema).toEqual(schemas[selectedSchema]);
        expect(columnData[0].selectedItem).toBe(selectedSchema);
        expect(typeof columnData[0].onSelect).toBe("function");
        expect(Object.keys((columnData[1] as RenderItemsColumn).items)).toEqual(["Item Three"]);
        expect(columnData[1].selectedItem).toBe(selectedItem);
        expect(columnData[1].trailingSelection).toBe(true);
        expect(typeof columnData[1].onSelect).toBe("function");
    });
    it("with multi-column branch selection", () => {
        const selectedSchema = "Schema One";
        const selectedItem = "Item Two";
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={[selectedSchema, selectedItem]} />);
        const { columnData } = component.find("InspectorColView").props() as ColViewProps;
        expect(columnData).toHaveLength(3);
        expect(Object.keys((columnData[1] as RenderItemsColumn).items)).toEqual(["Item One", "Item Two"]);
        expect(columnData[1].selectedItem).toBe(selectedItem);
        expect(columnData[1].trailingSelection).toBe(true);
        expect(typeof columnData[1].onSelect).toBe("function");
        expect(Object.keys((columnData[2] as RenderItemsColumn).items)).toEqual(["[0]"]);
        expect(typeof columnData[2].onSelect).toBe("function");
    });
    it("ignores invalid root selection", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema X"]} />);
        const { columnData } = component.find("InspectorColView").props() as ColViewProps;
        expect(columnData).toHaveLength(1);
        expect(columnData[0].selectedItem).toBeUndefined();
    });
    it("ignores invalid trailing non-root selection", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One", "Item X"]} />);
        const { columnData } = component.find("InspectorColView").props() as ColViewProps;
        expect(columnData).toHaveLength(2);
        expect(columnData[0].trailingSelection).toBe(true);
        expect(columnData[1].selectedItem).toBeUndefined();
    });
    it("ignores invalid intermediate non-root selection", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One", "Item X", "Property X"]} />);
        const { columnData } = component.find("InspectorColView").props() as ColViewProps;
        expect(columnData).toHaveLength(2);
        expect(columnData[0].trailingSelection).toBe(true);
        expect(columnData[1].selectedItem).toBeUndefined();
    });
});
describe("calls onSelect", () => {
    const schemas = {
        "Schema One": {
            properties: {
                "Item One": {},
                "Item Two": {
                    properties: {
                        "Property One": {}
                    }
                }
            }
        },
        "Schema Two": {}
    };
    const mockEvent = {
        stopPropagation: (): void => {}
    };
    const onSelect = jest.fn(() => {});

    it("when setting root selection", () => {
        const component = shallow(<Inspector schemas={schemas} onSelect={onSelect} />);
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, "Schema One");
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][0]).toEqual(["Schema One"]);
        expect(component.state("appendEmptyColumn")).toBe(false);
    });
    it("when setting root selection (without onSelect prop)", () => {
        const component = shallow(<Inspector schemas={schemas} />);
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, "Schema One");
        expect(component.state("appendEmptyColumn")).toBe(false);
    });
    it("when setting other root selection", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One"]} onSelect={onSelect} />);
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, "Schema Two");
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][0]).toEqual(["Schema Two"]);
        // expect it to be true because "Schema Two" has no nested items, but "Schema One" has
        expect(component.state("appendEmptyColumn")).toBe(true);
    });
    it("when setting other root selection (without onSelect prop)", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One"]} />);
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, "Schema Two");
        // expect it to be true because "Schema Two" has no nested items, but "Schema One" has
        expect(component.state("appendEmptyColumn")).toBe(true);
    });
    it("not when setting same root selection", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One"]} onSelect={onSelect} />);
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, "Schema One");
        expect(onSelect.mock.calls).toHaveLength(0);
    });
    it("when clearing and resetting root selection", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One"]} onSelect={onSelect} />);
        const { onSelect: rootColumnSelectForClearing } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelectForClearing(mockEvent, null);
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][0]).toEqual([]);
        expect(component.state("appendEmptyColumn")).toBe(true);

        const { onSelect: rootColumnSelectForReset } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelectForReset(mockEvent, "Schema One");
        expect(onSelect.mock.calls).toHaveLength(2);
        expect(onSelect.mock.calls[1][0]).toEqual(["Schema One"]);
        expect(component.state("appendEmptyColumn")).toBe(false);
    });
    it("when clearing root selection (without onSelect prop)", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One"]} />);
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, null);
        expect(component.state("appendEmptyColumn")).toBe(true);
    });
    it("not when clearing empty root selection", () => {
        const component = shallow(<Inspector schemas={schemas} onSelect={onSelect} />);
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, null);
        expect(onSelect.mock.calls).toHaveLength(0);
    });
    it("when setting non-root selection", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One"]} onSelect={onSelect} />);
        const { onSelect: secondColumnSelect } = component.find("InspectorColView").prop("columnData")[1];
        secondColumnSelect(mockEvent, "Item One");
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][0]).toEqual(["Schema One", "Item One"]);
        expect(component.state("appendEmptyColumn")).toBe(false);
    });
    it("when setting other non-root selection", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One", "Item One"]} onSelect={onSelect} />);
        const { onSelect: secondColumnSelect } = component.find("InspectorColView").prop("columnData")[1];
        secondColumnSelect(mockEvent, "Item Two");
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][0]).toEqual(["Schema One", "Item Two"]);
        expect(component.state("appendEmptyColumn")).toBe(false);
    });
    it("not when setting same non-root selection", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One", "Item One"]} onSelect={onSelect} />);
        const { onSelect: secondColumnSelect } = component.find("InspectorColView").prop("columnData")[1];
        secondColumnSelect(mockEvent, "Item One");
        expect(onSelect.mock.calls).toHaveLength(0);
    });
    it("when clearing non-root selection", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One", "Item One"]} onSelect={onSelect} />);
        const { onSelect: secondColumnSelect } = component.find("InspectorColView").prop("columnData")[1];
        secondColumnSelect(mockEvent, null);
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][0]).toEqual(["Schema One"]);
        // expect it to be false because "Item One" has no nested items
        expect(component.state("appendEmptyColumn")).toBe(false);
    });
    it("not when clearing empty non-root selection", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One"]} onSelect={onSelect} />);
        const { onSelect: secondColumnSelect } = component.find("InspectorColView").prop("columnData")[1];
        secondColumnSelect(mockEvent, null);
        expect(onSelect.mock.calls).toHaveLength(0);
    });
    it("with extra information (excluding breadcrumbs)", () => {
        const component = shallow(<Inspector schemas={schemas} breadcrumbs={null} onSelect={onSelect} />);
        const { onSelect: rootColumnSelect } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelect(mockEvent, "Schema One");
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][0]).toEqual(["Schema One"]);
        expect(onSelect.mock.calls[0][1].columnData).toHaveLength(2);
        expect(onSelect.mock.calls[0][2]).toBeUndefined();
    });
    it("with extra information (including breadcrumbs)", () => {
        const breadcrumbs = {
            prefix: "this.",
            mutateName: (selectedItem: string): string => selectedItem && selectedItem.replace(/\s/g, "")
        };
        const component = shallow(
            <Inspector schemas={schemas} defaultSelectedItems={["Schema One"]} breadcrumbs={breadcrumbs} onSelect={onSelect} />
        );
        const { onSelect: secondColumnSelect } = component.find("InspectorColView").prop("columnData")[1];
        secondColumnSelect(mockEvent, "Item One");
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][0]).toEqual(["Schema One", "Item One"]);
        expect(onSelect.mock.calls[0][1].columnData).toHaveLength(2);
        expect(onSelect.mock.calls[0][2]).toEqual(["this.SchemaOne", ".ItemOne"]);
    });
    it("with extra information in case of empty selection", () => {
        const component = shallow(<Inspector schemas={schemas} defaultSelectedItems={["Schema One"]} onSelect={onSelect} />);
        const { onSelect: rootColumnSelectForClearing } = component.find("InspectorColView").prop("columnData")[0];
        rootColumnSelectForClearing(mockEvent, null);
        expect(onSelect.mock.calls).toHaveLength(1);
        expect(onSelect.mock.calls[0][0]).toEqual([]);
        expect(onSelect.mock.calls[0][2]).toEqual([]);
    });
});
