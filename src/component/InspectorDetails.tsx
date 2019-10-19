import PropTypes from "prop-types";
import React, { Component } from "react";

import InspectorDetailsContent from "./InspectorDetailsContent";
import { getColumnDataPropTypeShape } from "./renderDataUtils";
import { RenderColumn, RenderSelectionDetailsFunction, RenderEmptyDetailsFunction, RenderItemsColumn, RenderOptionsColumn } from "../types/Inspector";
import JsonSchemaGroup from "../model/JsonSchemaGroup";

interface InspectorDetailsDefaultProps {
    renderSelectionDetails: RenderSelectionDetailsFunction,
    renderEmptyDetails: RenderEmptyDetailsFunction
};

interface InspectorDetailsProps extends InspectorDetailsDefaultProps {
    columnData: Array<RenderColumn>
};

class InspectorDetails extends Component<InspectorDetailsProps> {
    render() {
        const {
            columnData, renderSelectionDetails, renderEmptyDetails
        } = this.props;
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
                {itemSchemaGroup && renderSelectionDetails && renderSelectionDetails({
                    itemSchemaGroup,
                    selectionColumnIndex,
                    columnData,
                    optionIndexes
                })}
                {itemSchemaGroup && !renderSelectionDetails && (
                    <InspectorDetailsContent
                        itemSchemaGroup={itemSchemaGroup}
                        selectionColumnIndex={selectionColumnIndex}
                        columnData={columnData}
                    />
                )}
                {!itemSchemaGroup && renderEmptyDetails && renderEmptyDetails({
                    rootColumnSchemas: columnData.length ? (columnData[0] as RenderItemsColumn).items : {}
                })}
            </div>
        );
    };

    static propTypes = {
        columnData: PropTypes.arrayOf(PropTypes.shape(getColumnDataPropTypeShape(false))).isRequired,
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

export default InspectorDetails;
