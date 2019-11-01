import * as React from "react";

import { InspectorDetailsContent } from "./InspectorDetailsContent";
import { JsonSchemaGroup } from "../model/JsonSchemaGroup";
import { InspectorProps, RenderColumn, RenderItemsColumn, RenderOptionsColumn } from "./InspectorTypes";

export const InspectorDetails: React.FunctionComponent<{
    columnData: Array<RenderColumn>;
    renderSelectionDetails?: InspectorProps["renderSelectionDetails"];
    renderEmptyDetails?: InspectorProps["renderEmptyDetails"];
}> = ({ columnData, renderSelectionDetails, renderEmptyDetails }): React.ReactElement => {
    const lastColumnContainsSelection = columnData.length && columnData[columnData.length - 1].trailingSelection;
    const selectionColumnIndex = columnData.length - (lastColumnContainsSelection ? 1 : 2);
    const trailingSelectionColumn = selectionColumnIndex < 0 ? null : columnData[selectionColumnIndex];
    let itemSchemaGroup: JsonSchemaGroup | undefined = undefined;
    let optionIndexes: Array<number> | undefined = undefined;
    if (trailingSelectionColumn) {
        itemSchemaGroup = (trailingSelectionColumn as RenderItemsColumn).items
            ? (trailingSelectionColumn as RenderItemsColumn).items[trailingSelectionColumn.selectedItem as string]
            : (trailingSelectionColumn as RenderOptionsColumn).contextGroup;
        if ((trailingSelectionColumn as RenderOptionsColumn).options) {
            optionIndexes = trailingSelectionColumn.selectedItem as Array<number>;
        }
    }
    return (
        <div className="jsonschema-inspector-details">
            {itemSchemaGroup &&
                renderSelectionDetails &&
                renderSelectionDetails({
                    itemSchemaGroup,
                    selectionColumnIndex,
                    columnData,
                    optionIndexes
                })}
            {itemSchemaGroup && !renderSelectionDetails && (
                <InspectorDetailsContent itemSchemaGroup={itemSchemaGroup} selectionColumnIndex={selectionColumnIndex} columnData={columnData} />
            )}
            {!itemSchemaGroup &&
                renderEmptyDetails &&
                renderEmptyDetails({
                    rootColumnSchemas: columnData.length ? (columnData[0] as RenderItemsColumn).items : {}
                })}
        </div>
    );
};
