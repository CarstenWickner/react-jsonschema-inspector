import * as PropTypes from "prop-types";
import * as React from "react";

import { InspectorDetailsContent } from "./InspectorDetailsContent";
import { ColumnDataPropType } from "./renderDataUtils";
import { JsonSchemaGroup } from "../model/JsonSchemaGroup";
import { InspectorProps, RenderColumn, RenderItemsColumn, RenderOptionsColumn } from "../types/Inspector";

interface InspectorDetailsDefaultProps {
    renderSelectionDetails: InspectorProps["renderSelectionDetails"];
    renderEmptyDetails: InspectorProps["renderEmptyDetails"];
}

interface InspectorDetailsProps extends InspectorDetailsDefaultProps {
    columnData: Array<RenderColumn>;
}

export class InspectorDetails extends React.Component<InspectorDetailsProps> {
    render(): React.ReactNode {
        const { columnData, renderSelectionDetails, renderEmptyDetails } = this.props;
        const lastColumnContainsSelection = columnData.length && columnData[columnData.length - 1].trailingSelection;
        const selectionColumnIndex = columnData.length - (lastColumnContainsSelection ? 1 : 2);
        const trailingSelectionColumn = selectionColumnIndex < 0 ? null : columnData[selectionColumnIndex];
        let itemSchemaGroup: JsonSchemaGroup;
        let optionIndexes: Array<number>;
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
    }

    static propTypes = {
        columnData: ColumnDataPropType.isRequired,
        /** func({ itemSchema: JsonSchema, selectionColumnIndex: number, columnData }) */
        renderSelectionDetails: PropTypes.func,
        /** func({ rootColumnSchemas }) */
        renderEmptyDetails: PropTypes.func
    };

    static defaultProps: InspectorDetailsDefaultProps = {
        renderSelectionDetails: null,
        renderEmptyDetails: null
    };
}
