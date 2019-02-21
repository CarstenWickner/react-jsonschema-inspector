/* eslint-disable quote-props */
import PropTypes from "prop-types";
import React, { PureComponent } from "react";

import InspectorDetailsForm from "./InspectorDetailsForm";
import JsonSchemaPropType from "./JsonSchemaPropType";
import { getFieldValue, getPropertyParentFieldValue, isDefined } from "./utils";

class InspectorDetails extends PureComponent {
    static isSelectionRequiredInParent(columnData, selectionColumnIndex, refTargets) {
        if (selectionColumnIndex < 1) {
            // no parent to define any required properties
            return false;
        }
        const parentColumn = columnData[selectionColumnIndex - 1];
        const parentSchema = parentColumn.items[parentColumn.selectedItem];
        const requiredPropertiesInParent = getPropertyParentFieldValue(parentSchema, "required", refTargets);
        return requiredPropertiesInParent
            && requiredPropertiesInParent.includes(columnData[selectionColumnIndex].selectedItem);
    }

    static collectFormFields(itemSchema, refTargets, columnData, selectionColumnIndex) {
        const getValue = fieldName => getFieldValue(itemSchema, fieldName, refTargets);
        const buildFormField = (labelText, rowValue) => ({
            labelText,
            rowValue
        });
        const formFields = [];
        formFields.push(buildFormField("Title", getValue("title")));
        formFields.push(buildFormField("Description", getValue("description")));
        formFields.push(buildFormField("Required",
            InspectorDetails.isSelectionRequiredInParent(columnData, selectionColumnIndex, refTargets) ? "Yes" : null));
        formFields.push(buildFormField("Type", getValue("type")));
        formFields.push(buildFormField("Constant Value", getValue("const")));
        formFields.push(buildFormField("Possible Values", getValue("enum")));

        const minimum = getValue("minimum", refTargets);
        const exclusiveMinimum = getValue("exclusiveMinimum", refTargets);
        let minValue;
        if (isDefined(minimum)) {
            minValue = exclusiveMinimum ? `${minimum} (exclusive)` : `${minimum} (inclusive)`;
        } else {
            minValue = isDefined(exclusiveMinimum) ? `${exclusiveMinimum} (exclusive)` : null;
        }
        formFields.push(buildFormField("Min Value", minValue));

        const maximum = getValue("maximum", refTargets);
        const exclusiveMaximum = getValue("exclusiveMaximum", refTargets);
        let maxValue;
        if (isDefined(maximum)) {
            maxValue = exclusiveMaximum ? `${maximum} (exclusive)` : `${maximum} (inclusive)`;
        } else {
            maxValue = isDefined(exclusiveMaximum) ? `${exclusiveMaximum} (exclusive)` : null;
        }
        formFields.push(buildFormField("Max Value", maxValue));

        const defaultValue = getValue("default", refTargets);
        formFields.push(buildFormField("Default Value", typeof defaultValue === "object" ? JSON.stringify(defaultValue) : defaultValue));
        const examples = getValue("examples", refTargets);
        formFields.push(buildFormField("Example(s)",
            (isDefined(examples) && examples.length && typeof examples[0] === "object") ? JSON.stringify(examples) : examples));
        formFields.push(buildFormField("Value Pattern", getValue("pattern")));
        formFields.push(buildFormField("Value Format", getValue("format")));
        formFields.push(buildFormField("Min Length", getValue("minLength")));
        formFields.push(buildFormField("Max Length", getValue("maxLength")));
        formFields.push(buildFormField("Min Items", getValue("minItems")));
        formFields.push(buildFormField("Max Items", getValue("maxItems")));
        formFields.push(buildFormField("Items Unique", getValue("uniqueItems", refTargets) === true ? "Yes" : null));

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
        const arrayItemSchema = (typeof arrayItems === "object" && arrayItems)
            || (arrayItems === true && getFieldValue(itemSchema, "additionalItems", refTargets));

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
        const selectionColumnIndex = columnData.length - (columnData[columnData.length - 1].trailingSelection ? 1 : 2);
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
                        rootColumnSchemas: columnData[0].items,
                        refTargets
                    })}
            </div>
        );
    }
}

InspectorDetails.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape({
        items: PropTypes.objectOf(JsonSchemaPropType).isRequired,
        selectedItem: PropTypes.string
    })).isRequired,
    refTargets: PropTypes.objectOf(JsonSchemaPropType).isRequired,
    /** func({ itemSchema: JsonSchema, columnData, refTargets, selectionColumnIndex: number }) */
    renderSelectionDetails: PropTypes.func,
    /** func({ rootColumnSchemas, refTargets }) */
    renderEmptyDetails: PropTypes.func
};

InspectorDetails.defaultProps = {
    renderSelectionDetails: null,
    renderEmptyDetails: null
};

export default InspectorDetails;
