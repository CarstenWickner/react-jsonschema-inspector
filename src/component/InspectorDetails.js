import PropTypes from "prop-types";
import React from "react";

import InspectorDetailsContent from "./InspectorDetailsContent";

import JsonSchema from "../model/JsonSchema";

const InspectorDetails = ({
    columnData, renderSelectionDetails, renderEmptyDetails
}) => {
    const lastColumnContainsSelection = columnData.length && columnData[columnData.length - 1].trailingSelection;
    const selectionColumnIndex = columnData.length - (lastColumnContainsSelection ? 1 : 2);
    const trailingSelectionColumn = selectionColumnIndex < 0 ? null : columnData[selectionColumnIndex];
    const itemSchema = trailingSelectionColumn ? trailingSelectionColumn.items[trailingSelectionColumn.selectedItem] : null;
    return (
        <div className="jsonschema-inspector-details">
            {itemSchema && renderSelectionDetails && renderSelectionDetails({
                itemSchema,
                selectionColumnIndex,
                columnData
            })}
            {itemSchema && !renderSelectionDetails && (
                <InspectorDetailsContent
                    itemSchema={itemSchema}
                    selectionColumnIndex={selectionColumnIndex}
                    columnData={columnData}
                />
            )}
            {!itemSchema && renderEmptyDetails && renderEmptyDetails({
                rootColumnSchemas: columnData.length ? columnData[0].items : {}
            })}
        </div>
    );
};

InspectorDetails.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape({
        items: PropTypes.objectOf(PropTypes.instanceOf(JsonSchema)).isRequired,
        selectedItem: PropTypes.string,
        trailingSelection: PropTypes.bool
    })).isRequired,
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
