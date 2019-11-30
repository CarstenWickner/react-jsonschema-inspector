import * as React from "react";
import { shallow } from "enzyme";

import { InspectorDetails } from "../../src/component/InspectorDetails";
import { createRenderDataBuilder } from "../../src/component/renderDataUtils";
import { JsonSchema } from "../../src/model/JsonSchema";
import { JsonSchemaGroup } from "../../src/model/JsonSchemaGroup";
import { RenderItemsColumn, RenderColumn } from "../../src/component/InspectorTypes";

describe("renders correctly", () => {
    const buildColumnData = createRenderDataBuilder(() => (): void => {});
    it("with minimal/default props", () => {
        const { columnData } = buildColumnData(
            {
                Foo: {
                    title: "Bar",
                    description: "Foobar"
                }
            },
            [],
            ["Foo"],
            {}
        );
        const component = shallow(<InspectorDetails columnData={columnData} />);
        expect(component).toMatchSnapshot();
    });
    describe("with empty columnData", () => {
        it("shows nothing by default", () => {
            const component = shallow(<InspectorDetails columnData={[]} />);
            expect(component.children().exists()).toBe(false);
        });
        it("applies custom renderEmptyDetails", () => {
            const component = shallow(
                <InspectorDetails
                    columnData={[]}
                    renderEmptyDetails={({ rootColumnSchemas }): React.ReactElement => (
                        <span className="custom-empty-details">{Object.keys(rootColumnSchemas).length}</span>
                    )}
                />
            );
            expect(component.find(".custom-empty-details").text()).toBe("0");
        });
    });
    describe("with no selection", () => {
        const { columnData } = buildColumnData(
            {
                Foo: {
                    title: "Bar",
                    description: "Foobar"
                }
            },
            [],
            [],
            {}
        );

        it("shows nothing by default", () => {
            const component = shallow(<InspectorDetails columnData={columnData} />);
            expect(component.children().exists()).toBe(false);
        });
        it("applies custom renderEmptyDetails", () => {
            const component = shallow(
                <InspectorDetails
                    columnData={columnData}
                    renderEmptyDetails={({ rootColumnSchemas }): React.ReactElement => (
                        <span className="custom-empty-details">{Object.keys(rootColumnSchemas).length}</span>
                    )}
                />
            );
            expect(component.find(".custom-empty-details").text()).toBe("1");
        });
    });
    describe("with array item selection", () => {
        const schema = {
            title: "Bar",
            items: { $ref: "#/$defs/itemSchema" },
            $defs: {
                itemSchema: {
                    description: "Array Item",
                    type: "object"
                }
            }
        };
        const { columnData: columnDataProp } = buildColumnData({ Foo: schema }, [], ["Foo", "[0]"], {});

        it("show InspectorDetailsContent by default", () => {
            const component = shallow(<InspectorDetails columnData={columnDataProp} />);
            const { columnData, itemSchemaGroup, selectionColumnIndex } = component.childAt(0).props() as {
                itemSchemaGroup: JsonSchemaGroup;
                columnData: Array<RenderColumn>;
                selectionColumnIndex: number;
            };
            expect(columnData).toEqual(columnDataProp);
            expect(itemSchemaGroup).toEqual(((columnDataProp[1] as unknown) as RenderItemsColumn).items["[0]"]);
            expect(selectionColumnIndex).toEqual(1);
        });
        it("applies custom renderSelectionDetails", () => {
            const renderSelectionDetails = jest.fn(() => <span className="custom-selection-details" />);
            const component = shallow(<InspectorDetails columnData={columnDataProp} renderSelectionDetails={renderSelectionDetails} />);
            expect(component.exists(".custom-selection-details")).toBe(true);
            expect(renderSelectionDetails.mock.calls).toHaveLength(1);
            const { columnData, itemSchemaGroup, selectionColumnIndex } = renderSelectionDetails.mock.calls[0][0] as {
                itemSchemaGroup: JsonSchemaGroup;
                columnData: Array<RenderColumn>;
                selectionColumnIndex: number;
            };
            expect(columnData).toEqual(columnDataProp);
            expect(itemSchemaGroup).toEqual(((columnDataProp[1] as unknown) as RenderItemsColumn).items["[0]"]);
            expect(selectionColumnIndex).toBe(1);
        });
    });
    describe("with option selection", () => {
        const subSchema = {
            title: "Sub Title"
        };
        const schema = {
            title: "Bar",
            oneOf: [
                subSchema,
                {
                    description: "Sub Description"
                }
            ]
        };
        const { columnData: columnDataProp } = buildColumnData({ Foo: schema }, [], ["Foo", [0]], {});

        it("show InspectorDetailsContent by default", () => {
            const component = shallow(<InspectorDetails columnData={columnDataProp} />);
            const { columnData, itemSchemaGroup, selectionColumnIndex } = component.childAt(0).props() as {
                itemSchemaGroup: JsonSchemaGroup;
                columnData: Array<RenderColumn>;
                selectionColumnIndex: number;
            };
            expect(columnData).toEqual(columnDataProp);
            expect((itemSchemaGroup.entries[0] as JsonSchema).schema).toEqual(schema);
            expect(selectionColumnIndex).toEqual(1);
        });
        it("applies custom renderSelectionDetails", () => {
            const renderSelectionDetails = jest.fn(() => <span className="custom-selection-details" />);
            const component = shallow(<InspectorDetails columnData={columnDataProp} renderSelectionDetails={renderSelectionDetails} />);
            expect(component.exists(".custom-selection-details")).toBe(true);
            expect(renderSelectionDetails.mock.calls).toHaveLength(1);
            const { columnData, itemSchemaGroup, selectionColumnIndex } = renderSelectionDetails.mock.calls[0][0] as {
                itemSchemaGroup: JsonSchemaGroup;
                columnData: Array<RenderColumn>;
                selectionColumnIndex: number;
            };
            expect(columnData).toEqual(columnDataProp);
            expect((itemSchemaGroup.entries[0] as JsonSchema).schema).toEqual(schema);
            expect(selectionColumnIndex).toBe(1);
        });
    });
});
