/* eslint-disable quote-props */
import PropTypes from "prop-types";
import React from "react";

import JsonSchema from "./JsonSchema";
import InspectorDetailsForm from "./InspectorDetailsForm";
import { isDefined } from "./utils";

const isSelectionRequiredInParent = (columnData, selectionColumnIndex) => {
    if (selectionColumnIndex < 1) {
        // no parent to define any required properties
        return false;
    }
    const parentColumn = columnData[selectionColumnIndex - 1];
    const parentSchema = parentColumn.items[parentColumn.selectedItem];
    const targetItem = columnData[selectionColumnIndex].selectedItem;
    const schemaList = parentSchema.getPropertyParentSchemas();
    return schemaList.some(part => isDefined(part.schema.required) && part.schema.required.includes(targetItem));
};

export const collectFormFields = (itemSchema, columnData, selectionColumnIndex) => {
    const formFields = [];
    const addFormField = (labelText, rowValue) => {
        if (isDefined(rowValue)) {
            formFields.push({ labelText, rowValue });
        }
    };
    const getValue = fieldName => itemSchema.getFieldValue(fieldName);

    addFormField("Title", getValue("title"));
    addFormField("Description", getValue("description"));
    addFormField("Required",
        isSelectionRequiredInParent(columnData, selectionColumnIndex) ? "Yes" : null);
    addFormField("Type", getValue("type"));
    addFormField("Constant Value", getValue("const"));
    addFormField("Possible Values", getValue("enum"));

    const minimum = getValue("minimum");
    const exclusiveMinimum = getValue("exclusiveMinimum");
    let minValue;
    if (isDefined(minimum)) {
        // according to JSON Schema Draft 4, "exclusiveMinimum" is a boolean and used in combination with "minimum"
        // if "exclusiveMinimum" is not defined, is is treated as "false", i.e. "minimum" is inclusive by default
        minValue = exclusiveMinimum ? `${minimum} (exclusive)` : `${minimum} (inclusive)`;
    } else {
        // according to JSON Schema Draft 6, "exclusiveMinimum" is a number and can be used instead of "minimum"
        minValue = isDefined(exclusiveMinimum) ? `${exclusiveMinimum} (exclusive)` : null;
    }
    addFormField("Min Value", minValue);

    const maximum = getValue("maximum");
    const exclusiveMaximum = getValue("exclusiveMaximum");
    let maxValue;
    if (isDefined(maximum)) {
        // according to JSON Schema Draft 4, "exclusiveMaximum" is a boolean and used in combination with "maximum"
        // if "exclusiveMaximum" is not defined, is is treated as "false", i.e. "maximum" is inclusive by default
        maxValue = exclusiveMaximum ? `${maximum} (exclusive)` : `${maximum} (inclusive)`;
    } else {
        // according to JSON Schema Draft 6, "exclusiveMaximum" is a number and can be used instead of "maximum"
        maxValue = isDefined(exclusiveMaximum) ? `${exclusiveMaximum} (exclusive)` : null;
    }
    addFormField("Max Value", maxValue);

    const defaultValue = getValue("default");
    addFormField("Default Value", typeof defaultValue === "object" ? JSON.stringify(defaultValue) : defaultValue);
    let examples = getValue("examples");
    examples = (isDefined(examples) && examples.length > 0) ? examples : null;
    addFormField("Example(s)",
        (examples && typeof examples[0] === "object") ? JSON.stringify(examples) : examples);
    addFormField("Value Pattern", getValue("pattern"));
    addFormField("Value Format", getValue("format"));
    addFormField("Min Length", getValue("minLength"));
    addFormField("Max Length", getValue("maxLength"));
    addFormField("Min Items", getValue("minItems"));
    addFormField("Max Items", getValue("maxItems"));
    addFormField("Items Unique", getValue("uniqueItems") === true ? "Yes" : null);

    return formFields;
};

const renderDetailsForm = ({
    // eslint-disable-next-line react/prop-types
    itemSchema, columnData, selectionColumnIndex
}) => {
    const formFields = collectFormFields(itemSchema, columnData, selectionColumnIndex);
    // look-up the kind of value expected in the array (if the schema refers to an array)
    const arrayItemSchema = itemSchema.getTypeOfArrayItems();

    return (
        <div>
            <InspectorDetailsForm fields={formFields} />
            {arrayItemSchema && <hr className="jsonschema-inspector-details-separator" />}
            {arrayItemSchema && <h4 className="jsonschema-inspector-details-header">Array Entry Details</h4>}
            {arrayItemSchema && renderDetailsForm({
                itemSchema: arrayItemSchema,
                columnData,
                selectionColumnIndex: -1
            })}
        </div>
    );
};

const InspectorDetails = ({
    columnData, renderSelectionDetails, renderEmptyDetails
}) => {
    const lastColumnContainsSelection = columnData.length && columnData[columnData.length - 1].trailingSelection;
    const selectionColumnIndex = columnData.length - (lastColumnContainsSelection ? 1 : 2);
    const trailingSelectionColumn = selectionColumnIndex < 0 ? null : columnData[selectionColumnIndex];
    const itemSchema = trailingSelectionColumn ? trailingSelectionColumn.items[trailingSelectionColumn.selectedItem] : null;
    const detailsParameters = {
        itemSchema,
        columnData,
        selectionColumnIndex
    };
    return (
        <div className="jsonschema-inspector-details">
            {itemSchema && renderSelectionDetails && renderSelectionDetails(detailsParameters)}
            {itemSchema && !renderSelectionDetails && (
                <div className="jsonschema-inspector-details-content">
                    <h3 className="jsonschema-inspector-details-header">Details</h3>
                    {renderDetailsForm(detailsParameters)}
                </div>
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
    /** func({ itemSchema: JsonSchema, columnData, refScope, selectionColumnIndex: number }) */
    renderSelectionDetails: PropTypes.func,
    /** func({ rootColumnSchemas }) */
    renderEmptyDetails: PropTypes.func
};

InspectorDetails.defaultProps = {
    renderSelectionDetails: null,
    renderEmptyDetails: null
};

export default InspectorDetails;
