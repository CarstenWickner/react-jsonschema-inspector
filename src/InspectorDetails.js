/* eslint-disable quote-props */
import PropTypes from "prop-types";
import React, { PureComponent } from "react";

import InspectorDetailsForm from "./InspectorDetailsForm";
import JsonSchemaPropType from "./JsonSchemaPropType";
import { getFieldValue, getPropertyParentSchemas, isDefined } from "./utils";

class InspectorDetails extends PureComponent {
    static isSelectionRequiredInParent(columnData, selectionColumnIndex, refTargets) {
        if (selectionColumnIndex < 1) {
            // no parent to define any required properties
            return false;
        }
        const parentColumn = columnData[selectionColumnIndex - 1];
        const parentSchema = parentColumn.items[parentColumn.selectedItem];
        const targetItem = columnData[selectionColumnIndex].selectedItem;
        const schemaList = getPropertyParentSchemas(parentSchema, refTargets);
        return schemaList.some(part => isDefined(part.required) && part.required.includes(targetItem));
    }

    static collectFormFields(itemSchema, refTargets, columnData, selectionColumnIndex) {
        const formFields = [];
        const addFormField = (labelText, rowValue) => {
            if (isDefined(rowValue)) {
                formFields.push({ labelText, rowValue });
            }
        };
        const getValue = fieldName => getFieldValue(itemSchema, fieldName, refTargets);

        addFormField("Title", getValue("title"));
        addFormField("Description", getValue("description"));
        addFormField("Required",
            InspectorDetails.isSelectionRequiredInParent(columnData, selectionColumnIndex, refTargets) ? "Yes" : null);
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
    }

    constructor(props) {
        super(props);
        this.renderDefaultSelectionDetails = this.renderDefaultSelectionDetails.bind(this);
    }

    renderDefaultSelectionDetails(parameters) {
        return (
            <div className="jsonschema-inspector-details-content">
                <h3 className="jsonschema-inspector-details-header">Details</h3>
                {this.renderDetailsForm(parameters)}
            </div>
        );
    }

    renderDetailsForm({
        itemSchema, refTargets, columnData, selectionColumnIndex
    }) {
        const formFields = InspectorDetails.collectFormFields(itemSchema, refTargets, columnData, selectionColumnIndex);

        const arrayItems = getFieldValue(itemSchema, "items", refTargets);
        // look-up the kind of value expected in the array (if the schema refers to an array)
        const arrayItemSchema = ((typeof arrayItems === "object") && arrayItems)
            || ((arrayItems === true) && getFieldValue(itemSchema, "additionalItems", refTargets));

        return (
            <div>
                <InspectorDetailsForm fields={formFields} />
                {arrayItemSchema && <hr className="jsonschema-inspector-details-separator" />}
                {arrayItemSchema && <h4 className="jsonschema-inspector-details-header">Array Entry Details</h4>}
                {arrayItemSchema && this.renderDetailsForm({
                    itemSchema: arrayItemSchema,
                    refTargets,
                    columnData,
                    selectionColumnIndex: -1
                })}
            </div>
        );
    }

    render() {
        const {
            columnData, refTargets, renderSelectionDetails, renderEmptyDetails
        } = this.props;
        const lastColumnContainsSelection = columnData.length && columnData[columnData.length - 1].trailingSelection;
        const selectionColumnIndex = columnData.length - (lastColumnContainsSelection ? 1 : 2);
        const trailingSelectionColumn = selectionColumnIndex < 0 ? null : columnData[selectionColumnIndex];
        const itemSchema = trailingSelectionColumn ? trailingSelectionColumn.items[trailingSelectionColumn.selectedItem] : null;
        return (
            <div className="jsonschema-inspector-details">
                {itemSchema
                    && (renderSelectionDetails || this.renderDefaultSelectionDetails)({
                        itemSchema,
                        refTargets,
                        columnData,
                        selectionColumnIndex
                    })}
                {!itemSchema
                    && renderEmptyDetails
                    && renderEmptyDetails({
                        rootColumnSchemas: columnData.length ? columnData[0].items : {}
                    })}
            </div>
        );
    }
}

InspectorDetails.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape({
        items: PropTypes.objectOf(JsonSchemaPropType).isRequired,
        selectedItem: PropTypes.string,
        trailingSelection: PropTypes.bool
    })).isRequired,
    refTargets: PropTypes.objectOf(JsonSchemaPropType).isRequired,
    /** func({ itemSchema: JsonSchema, columnData, refTargets, selectionColumnIndex: number }) */
    renderSelectionDetails: PropTypes.func,
    /** func({ rootColumnSchemas }) */
    renderEmptyDetails: PropTypes.func
};

InspectorDetails.defaultProps = {
    renderSelectionDetails: null,
    renderEmptyDetails: null
};

export default InspectorDetails;
