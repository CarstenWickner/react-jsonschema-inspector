import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import JsonSchemaPropType from './JsonSchemaPropType';
import { getFieldValue, isDefined } from './utils';

class InspectorDetails extends PureComponent {
    constructor(props) {
        super(props);
        this.renderDefaultSelectionDetails = this.renderDefaultSelectionDetails.bind(this);
    }

    render() {
        const { columnData, refTargets, renderSelectionDetails, renderEmptyDetails } = this.props;
        const trailingSelectionColumnIndex = columnData.length - (columnData[columnData.length - 1].trailingSelection ? 1 : 2);
        const trailingSelectionColumn = trailingSelectionColumnIndex < 0 ? null : columnData[trailingSelectionColumnIndex];
        const selectedItemSchema = trailingSelectionColumn ? trailingSelectionColumn.items[trailingSelectionColumn.selectedItem] : null;
        return (
            <div className="jsonschema-inspector-details">
                {selectedItemSchema && (renderSelectionDetails || this.renderDefaultSelectionDetails)(selectedItemSchema, refTargets, columnData, trailingSelectionColumnIndex)}
                {!selectedItemSchema && renderEmptyDetails && renderEmptyDetails(columnData[0].items, refTargets)}
            </div>
        );
    }

    renderDefaultSelectionDetails(itemSchema, refTargets, columnData, selectionColumnIndex) {
        return (
            <div className="jsonschema-inspector-details-content">
                <h3 className="jsonschema-inspector-details-header">Details</h3>
                {this.renderDetailsForm(itemSchema, refTargets, columnData, selectionColumnIndex)}
            </div>
        );
    }

    renderDetailsForm(itemSchema, refTargets, columnData, selectionColumnIndex) {
        const isRequired = this.isSelectionRequiredInParent(columnData, selectionColumnIndex, refTargets);

        const title = getFieldValue(itemSchema, 'title', refTargets);
        const description = getFieldValue(itemSchema, 'description', refTargets);
        const type = getFieldValue(itemSchema, 'type', refTargets);
        const constValue = getFieldValue(itemSchema, 'const', refTargets);
        const enumValue = getFieldValue(itemSchema, 'enum', refTargets);
        const defaultValue = getFieldValue(itemSchema, 'default', refTargets);
        const examples = getFieldValue(itemSchema, 'examples', refTargets);
        const pattern = getFieldValue(itemSchema, 'pattern', refTargets);
        const format = getFieldValue(itemSchema, 'format', refTargets);
        const minimum = getFieldValue(itemSchema, 'minimum', refTargets);
        const exclusiveMinimum = getFieldValue(itemSchema, 'exclusiveMinimum', refTargets);
        const maximum = getFieldValue(itemSchema, 'maximum', refTargets);
        const exclusiveMaximum = getFieldValue(itemSchema, 'exclusiveMaximum', refTargets);
        const minLength = getFieldValue(itemSchema, 'minLength', refTargets);
        const maxLength = getFieldValue(itemSchema, 'maxLength', refTargets);
        const minItems = getFieldValue(itemSchema, 'minItems', refTargets);
        const maxItems = getFieldValue(itemSchema, 'maxItems', refTargets);
        const uniqueItems = getFieldValue(itemSchema, 'uniqueItems', refTargets);

        const arrayItems = getFieldValue(itemSchema, 'items', refTargets);
        // look-up the kind of value expected in the array (if the schema refers to an array)
        const arrayItemSchema = (typeof arrayItems === 'object' && arrayItems) || (typeof arrayItems === 'boolean' && getFieldValue(itemSchema, 'additionalItems', refTargets));

        return (
            <div>
                <form className="jsonschema-inspector-details-form">
                    {this.renderDetailsFormRow("Title", title)}
                    {this.renderDetailsFormRow("Description", description)}
                    {isRequired && this.renderDetailsFormRow("Required", "Yes")}
                    {this.renderDetailsFormRow("Type", type)}
                    {this.renderDetailsFormRow("Constant Value", constValue)}
                    {this.renderDetailsFormRow("Possible Values", enumValue)}
                    {isDefined(minimum) && this.renderDetailsFormRow("Min Value", minimum + (exclusiveMinimum ? " (exclusive)" : " (inclusive)"))}
                    {!isDefined(minimum) && isDefined(exclusiveMinimum) && this.renderDetailsFormRow("Min Value", exclusiveMinimum + " (exclusive)")}
                    {isDefined(maximum) && this.renderDetailsFormRow("Max Value", maximum + (exclusiveMaximum ? " (exclusive)" : " (inclusive)"))}
                    {!isDefined(maximum) && isDefined(exclusiveMaximum) && this.renderDetailsFormRow("Max Value", exclusiveMaximum + " (exclusive)")}
                    {this.renderDetailsFormRow("Default Value", typeof defaultValue === 'object' ? JSON.stringify(defaultValue) : defaultValue)}
                    {isDefined(examples) && examples.length && this.renderDetailsFormRow("Example(s)", typeof examples[0] === 'object' ? JSON.stringify(examples) : examples)}
                    {this.renderDetailsFormRow("Value Pattern", pattern)}
                    {this.renderDetailsFormRow("Value Format", format)}
                    {this.renderDetailsFormRow("Min Length", minLength)}
                    {this.renderDetailsFormRow("Max Length", maxLength)}
                    {this.renderDetailsFormRow("Min Items", minItems)}
                    {this.renderDetailsFormRow("Max Items", maxItems)}
                    {typeof uniqueItems === 'boolean' && this.renderDetailsFormRow("Items Unique", uniqueItems ? "Yes" : "No")}
                </form>
                {arrayItemSchema && <hr />}
                {arrayItemSchema && <h4 className="jsonschema-inspector-details-header">Array Entry Details</h4>}
                {arrayItemSchema && this.renderDetailsForm(arrayItemSchema, refTargets, columnData, -1)}
            </div>
        );
    }

    renderDetailsFormRow(labelText, rowValue) {
        if (!isDefined(rowValue)) {
            return null;
        }
        return (
            <div className="jsonschema-inspector-details-form-row" key={labelText}>
                <label className="jsonschema-inspector-details-form-label">{labelText}:</label>
                <span className="jsonschema-inspector-details-form-value">{rowValue.toString()}</span>
            </div>
        );
    }

    isSelectionRequiredInParent(columnData, selectionColumnIndex, refTargets) {
        if (selectionColumnIndex < 1 || true) {
            // no parent to define any required properties
            return false;
        }
        const parentColumn = columnData[selectionColumnIndex - 1];
        const parentSchema = parentColumn.items[parentColumn.selectedItem];
        const requiredPropertiesInParent = getFieldValue(parentSchema, 'required', refTargets) || [];
        const selectionName = columnData[selectionColumnIndex].selectedItem;
        return requiredPropertiesInParent.includes(selectionName);
    }
}

InspectorDetails.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape({
        items: PropTypes.objectOf(JsonSchemaPropType).isRequired,
        selectedItem: PropTypes.string
    })).isRequired,
    refTargets: PropTypes.objectOf(JsonSchemaPropType),
    renderSelectionDetails: PropTypes.func, // func(selectedItemSchema: JsonSchema, refTargets, columnData, selectionColumnIndex: number)
    renderEmptyDetails: PropTypes.func // func(rootColumnData, refTargets)
};

export default InspectorDetails;
