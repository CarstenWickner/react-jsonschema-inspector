/* eslint-disable react/no-array-index-key */
import PropTypes from "prop-types";
import React from "react";

import InspectorDetailsForm from "./InspectorDetailsForm";

import JsonSchema from "../model/JsonSchema";
import { isDefined } from "../model/utils";

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

    let isRequired = false;
    if (selectionColumnIndex) {
        const parentColumn = columnData[selectionColumnIndex - 1];
        const parentSchema = parentColumn.items[parentColumn.selectedItem];
        const targetItem = columnData[selectionColumnIndex].selectedItem;
        const schemaList = parentSchema.getPropertyParentSchemas();
        isRequired = schemaList.some(part => isDefined(part.schema.required) && part.schema.required.includes(targetItem));
    }
    addFormField("Required", isRequired ? "Yes" : null);

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

const InspectorDetailsContent = ({
    itemSchema, columnData, selectionColumnIndex
}) => {
    // look-up the kind of value expected in the array (if the schema refers to an array)
    let singleArrayItemSchema = itemSchema.getTypeOfArrayItems();
    const arrayItemSchemas = [];
    while (singleArrayItemSchema) {
        arrayItemSchemas.push(singleArrayItemSchema);
        singleArrayItemSchema = singleArrayItemSchema.getTypeOfArrayItems();
    }

    return (
        <div className="jsonschema-inspector-details-content">
            <h3 className="jsonschema-inspector-details-header">Details</h3>
            <InspectorDetailsForm
                key="main-form"
                fields={collectFormFields(itemSchema, columnData, selectionColumnIndex)}
            />
            {arrayItemSchemas.map((arrayItemSchema, level) => [
                <hr
                    key={`separator-${level}`}
                    className="jsonschema-inspector-details-separator"
                />,
                <h4
                    key={`header-${level}`}
                    className="jsonschema-inspector-details-header"
                >
                    {"Array Entry Details"}
                </h4>,
                <InspectorDetailsForm
                    key={`entry-form-${level}`}
                    fields={collectFormFields(arrayItemSchema, columnData)}
                />
            ])}
        </div>
    );
};

InspectorDetailsContent.propTypes = {
    itemSchema: PropTypes.instanceOf(JsonSchema).isRequired,
    selectionColumnIndex: PropTypes.number,
    columnData: PropTypes.arrayOf(PropTypes.shape({
        items: PropTypes.objectOf(PropTypes.instanceOf(JsonSchema)).isRequired,
        selectedItem: PropTypes.string,
        trailingSelection: PropTypes.bool
    })).isRequired
};

InspectorDetailsContent.defaultProps = {
    selectionColumnIndex: undefined
};

export default InspectorDetailsContent;
