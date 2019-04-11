/* eslint-disable react/no-array-index-key */
import PropTypes from "prop-types";
import React from "react";

import InspectorDetailsForm from "./InspectorDetailsForm";
import { getColumnDataPropTypeShape } from "./renderDataUtils";

import JsonSchemaGroup from "../model/JsonSchemaGroup";
import { createOptionTargetArrayFromIndexes, getFieldValueFromSchemaGroup } from "../model/schemaUtils";
import { isDefined, listValues } from "../model/utils";

function checkIfIsRequired(columnData, selectionColumnIndex) {
    if (!selectionColumnIndex) {
        return false;
    }
    const { selectedItem } = columnData[selectionColumnIndex];
    const parentColumn = columnData[selectionColumnIndex - 1];
    if (typeof selectedItem === "string") {
        let parentSchemaGroup;
        let optionTarget;
        if (parentColumn.items) {
            parentSchemaGroup = parentColumn.items[parentColumn.selectedItem];
        } else {
            parentSchemaGroup = parentColumn.contextGroup;
            optionTarget = createOptionTargetArrayFromIndexes(parentColumn.selectedItem);
        }
        return parentSchemaGroup.someEntry(
            ({ schema: rawSchema }) => rawSchema.required && rawSchema.required.includes(selectedItem),
            optionTarget
        );
    }
    // simply check whether the parent (the one the selected option belongs to) is required
    return checkIfIsRequired(columnData, selectionColumnIndex - 1);
}

export const collectFormFields = (itemSchemaGroup, columnData, selectionColumnIndex) => {
    const formFields = [];
    const addFormField = (labelText, rowValue) => {
        if (isDefined(rowValue)) {
            formFields.push({ labelText, rowValue });
        }
    };
    const { selectedItem } = columnData[selectionColumnIndex];
    const optionIndexes = typeof selectedItem === "string" ? undefined : selectedItem;
    const getValue = fieldName => getFieldValueFromSchemaGroup(itemSchemaGroup, fieldName, listValues, undefined, undefined, optionIndexes);

    addFormField("Title", getValue("title"));
    addFormField("Description", getValue("description"));

    addFormField("Required", checkIfIsRequired(columnData, selectionColumnIndex) ? "Yes" : null);

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

const InspectorDetailsContent = ({ itemSchemaGroup, columnData, selectionColumnIndex }) => (
    <div className="jsonschema-inspector-details-content">
        <h3 className="jsonschema-inspector-details-header">Details</h3>
        <InspectorDetailsForm
            key="main-form"
            fields={collectFormFields(itemSchemaGroup, columnData, selectionColumnIndex)}
        />
    </div>
);

InspectorDetailsContent.propTypes = {
    itemSchemaGroup: PropTypes.instanceOf(JsonSchemaGroup).isRequired,
    selectionColumnIndex: PropTypes.number,
    columnData: PropTypes.arrayOf(PropTypes.shape(getColumnDataPropTypeShape(false))).isRequired
};

InspectorDetailsContent.defaultProps = {
    selectionColumnIndex: undefined
};

export default InspectorDetailsContent;
