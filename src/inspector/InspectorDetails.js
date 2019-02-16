import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import JsonSchemaPropType from './JsonSchemaPropType';
import { getPropertyValue } from './utils';

class InspectorDetails extends PureComponent {
    constructor(props) {
        super(props);
        this.renderDefaultSelectionDetails = this.renderDefaultSelectionDetails.bind(this);
    }

    render() {
        const { columnData, renderSelectionDetails, renderEmptyDetails } = this.props;
        const trailingSelectionColumnIndex = columnData.length - (columnData[columnData.length - 1].trailingSelection ? 1 : 2);
        const trailingSelectionColumn = trailingSelectionColumnIndex < 0 ? null : columnData[trailingSelectionColumnIndex];
        const selectedItemSchema = trailingSelectionColumn ? trailingSelectionColumn.items[trailingSelectionColumn.selectedItem] : null;
        return (
            <div className="jsonschema-inspector-details">
                {selectedItemSchema && (renderSelectionDetails || this.renderDefaultSelectionDetails)(selectedItemSchema, columnData, trailingSelectionColumnIndex)}
                {!selectedItemSchema && renderEmptyDetails && renderEmptyDetails(columnData)}
            </div>
        );
    }

    renderDefaultSelectionDetails(itemSchema, columnData, selectionColumnIndex) {
        return (
            <div className="jsonschema-inspector-details-content">
                <h3 className="jsonschema-inspector-details-header">Details</h3>
                {this.renderDetailsForm(itemSchema, columnData, selectionColumnIndex)}
            </div>
        );
    }

    renderDetailsForm(itemSchema, columnData, selectionColumnIndex) {
        const { refTargets } = columnData[0];
        const isRequired = this.isSelectionRequiredInParent(columnData, selectionColumnIndex);

        const title = getPropertyValue(itemSchema, 'title', refTargets);
        const description = getPropertyValue(itemSchema, 'description', refTargets);
        const type = getPropertyValue(itemSchema, 'type', refTargets);
        const constValue = getPropertyValue(itemSchema, 'const', refTargets);
        const enumValue = getPropertyValue(itemSchema, 'enum', refTargets);
        const defaultValue = getPropertyValue(itemSchema, 'default', refTargets);
        const examples = getPropertyValue(itemSchema, 'examples', refTargets);
        const pattern = getPropertyValue(itemSchema, 'pattern', refTargets);
        const format = getPropertyValue(itemSchema, 'format', refTargets);
        const minimum = getPropertyValue(itemSchema, 'minimum', refTargets);
        const exclusiveMinimum = getPropertyValue(itemSchema, 'exclusiveMinimum', refTargets);
        const maximum = getPropertyValue(itemSchema, 'maximum', refTargets);
        const exclusiveMaximum = getPropertyValue(itemSchema, 'exclusiveMaximum', refTargets);
        const minLength = getPropertyValue(itemSchema, 'minLength', refTargets);
        const maxLength = getPropertyValue(itemSchema, 'maxLength', refTargets);
        const minItems = getPropertyValue(itemSchema, 'minItems', refTargets);
        const maxItems = getPropertyValue(itemSchema, 'maxItems', refTargets);
        const uniqueItems = getPropertyValue(itemSchema, 'uniqueItems', refTargets);

        const arrayItems = getPropertyValue(itemSchema, 'items', refTargets);
        // look-up the kind of value expected in the array (if the schema refers to an array)
        const arrayItemSchema = (typeof arrayItems === 'object' && arrayItems) || (typeof arrayItems === 'boolean' && getPropertyValue(itemSchema, 'additionalItems', refTargets));

        return (
            <div>
                <form className="jsonschema-inspector-details-form">
                    {title && this.renderDetailsFormRow("Title", title)}
                    {description && this.renderDetailsFormRow("Description", description)}
                    {isRequired && this.renderDetailsFormRow("Required", "Yes")}
                    {type && this.renderDetailsFormRow("Type", type)}
                    {constValue && this.renderDetailsFormRow("Constant Value", constValue)}
                    {enumValue && this.renderDetailsFormRow("Possible Values", enumValue)}
                    {(defaultValue || defaultValue === false) && this.renderDetailsFormRow("Default Value", typeof defaultValue === 'object' ? JSON.stringify(defaultValue) : defaultValue)}
                    {examples && examples.length && this.renderDetailsFormRow("Example(s)", typeof examples[0] === 'object' ? JSON.stringify(examples) : examples)}
                    {pattern && this.renderDetailsFormRow("Value Pattern", pattern)}
                    {format && this.renderDetailsFormRow("Value Format", format)}
                    {(minimum || minimum === 0) && this.renderDetailsFormRow("Min Value", minimum + (exclusiveMinimum ? " (exclusive)" : " (inclusive)"))}
                    {!minimum && minimum !== 0 && (exclusiveMinimum || exclusiveMinimum === 0) && this.renderDetailsFormRow("Min Value", exclusiveMinimum + " (exclusive)")}
                    {(maximum || maximum === 0) && this.renderDetailsFormRow("Max Value", maximum + (exclusiveMaximum ? " (exclusive)" : " (inclusive)"))}
                    {!maximum && maximum !== 0 && (exclusiveMaximum || exclusiveMaximum === 0) && this.renderDetailsFormRow("Max Value", exclusiveMaximum + " (exclusive)")}
                    {minLength && this.renderDetailsFormRow("Min Length", minLength)}
                    {maxLength && this.renderDetailsFormRow("Max Length", maxLength)}
                    {minItems && this.renderDetailsFormRow("Min Items", minItems)}
                    {maxItems && this.renderDetailsFormRow("Max Items", maxItems)}
                    {typeof uniqueItems === 'boolean' && this.renderDetailsFormRow("Items Unique", uniqueItems ? "Yes" : "No")}
                </form>
                {arrayItemSchema && <hr />}
                {arrayItemSchema && <h4 className="jsonschema-inspector-details-header">Array Entry Details</h4>}
                {arrayItemSchema && this.renderDetailsForm(arrayItemSchema, columnData, -1)}
            </div>
        );
    }

    renderDetailsFormRow(labelText, rowValue) {
        return (
            <div className="jsonschema-inspector-details-form-row" key={labelText}>
                <label className="jsonschema-inspector-details-form-label">{labelText}:</label>
                <span className="jsonschema-inspector-details-form-value">{rowValue.toString()}</span>
            </div>
        );
    }

    isSelectionRequiredInParent(columnData, selectionColumnIndex) {
        if (selectionColumnIndex < 1) {
            // no parent to define any required properties
            return false;
        }
        const { refTargets } = columnData[0];
        const parentColumn = columnData[selectionColumnIndex - 1];
        const parentSchema = parentColumn.items[parentColumn.selectedItem];
        const requiredPropertiesInParent = getPropertyValue(parentSchema, 'required', refTargets) || [];
        const selectionName = columnData[selectionColumnIndex].selectedItem;
        return requiredPropertiesInParent.includes(selectionName);
    }
}

InspectorDetails.propTypes = {
    columnData: PropTypes.arrayOf(PropTypes.shape({
        items: PropTypes.objectOf(JsonSchemaPropType).isRequired,
        selectedItem: PropTypes.string,
        refTargets: PropTypes.objectOf(JsonSchemaPropType)
    })).isRequired,
    renderSelectionDetails: PropTypes.func, // func(selectedItemSchema: JsonSchema, columnData, selectionColumnIndex: number)
    renderEmptyDetails: PropTypes.func // func(columnData)
};

export default InspectorDetails;
