import PropTypes from "prop-types";
import React from "react";

import InspectorDetailsContent from "./InspectorDetailsContent";
import { getColumnDataPropTypeShape } from "./renderDataUtils";

const InspectorDetails = ({
    columnData, renderSelectionDetails, renderEmptyDetails
}) => {
    const lastColumnContainsSelection = columnData.length && columnData[columnData.length - 1].trailingSelection;
    const selectionColumnIndex = columnData.length - (lastColumnContainsSelection ? 1 : 2);
    const trailingSelectionColumn = selectionColumnIndex < 0 ? null : columnData[selectionColumnIndex];
    let itemSchemaGroup;
    let optionIndexes;
    if (trailingSelectionColumn) {
        itemSchemaGroup = trailingSelectionColumn.items
            ? trailingSelectionColumn.items[trailingSelectionColumn.selectedItem]
            : trailingSelectionColumn.contextGroup;
        if (trailingSelectionColumn.options) {
            optionIndexes = trailingSelectionColumn.selectedItem;
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
                rootColumnSchemas: columnData.length ? columnData[0].items : {}
            })}
        </div>
    );
};

InspectorDetails.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape(getColumnDataPropTypeShape(false))).isRequired,
    /** func({ itemSchema: JsonSchema, selectionColumnIndex: number, columnData }) */
    renderSelectionDetails: PropTypes.func,
    /** func({ rootColumnSchemas }) */
    renderEmptyDetails: PropTypes.func
};

InspectorDetails.defaultProps = {
    renderSelectionDetails: null,
    renderEmptyDetails: null
};

export default InspectorDetails;
