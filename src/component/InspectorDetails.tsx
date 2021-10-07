import * as React from "react";
import classNames from "classnames";

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
    let detailsContent: React.ReactElement | undefined;
    if (itemSchemaGroup && renderSelectionDetails) {
        detailsContent = renderSelectionDetails({
            itemSchemaGroup,
            selectionColumnIndex,
            columnData,
            optionIndexes
        });
    } else if (itemSchemaGroup && !renderSelectionDetails) {
        detailsContent = (
            <InspectorDetailsContent itemSchemaGroup={itemSchemaGroup} selectionColumnIndex={selectionColumnIndex} columnData={columnData} />
        );
    } else if (!itemSchemaGroup && renderEmptyDetails) {
        detailsContent = renderEmptyDetails({
            rootColumnSchemas: columnData.length ? (columnData[0] as RenderItemsColumn).items : {}
        });
    } else {
        detailsContent = undefined;
    }
    const wrapperClassName = classNames("jsonschema-inspector-details", {
        "nothing-to-show": !detailsContent
    });
    return <div className={wrapperClassName}>{detailsContent}</div>;
};
