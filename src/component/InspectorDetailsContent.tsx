/* eslint-disable react/no-array-index-key */
import PropTypes from "prop-types";
import React, { Component } from "react";

import InspectorDetailsForm from "./InspectorDetailsForm";
import { getColumnDataPropTypeShape } from "./renderDataUtils";

import JsonSchemaGroup from "../model/JsonSchemaGroup";
import { createOptionTargetArrayFromIndexes, getFieldValueFromSchemaGroup } from "../model/schemaUtils";
import {
    isDefined, listValues, commonValues, minimumValue, maximumValue
} from "../model/utils";
import { RenderColumn, RenderItemsColumn, RenderOptionsColumn } from "../types/Inspector";

function containsTrueOrReduce(allValues, reduceNonBooleans): boolean | undefined {
    if (Array.isArray(allValues)) {
        return allValues.includes(true) || !!allValues.reduce(reduceNonBooleans);
    }
    return allValues;
}

class InspectorDetailsContent extends Component<{
    itemSchemaGroup: JsonSchemaGroup, selectionColumnIndex: number, columnData: Array<RenderColumn>
}, {}> {
    checkIfIsRequired(selectionColumnIndex: number): boolean {
        if (selectionColumnIndex < 1) {
            return false;
        }
        const { columnData } = this.props;
        const { selectedItem } = columnData[selectionColumnIndex];
        if (typeof selectedItem === "string") {
            let parentSchemaGroup;
            let optionTarget;
            const parentColumn = columnData[selectionColumnIndex - 1];
            if ((parentColumn as RenderItemsColumn).items) {
                parentSchemaGroup = (parentColumn as RenderItemsColumn).items[parentColumn.selectedItem as string];
            } else {
                parentSchemaGroup = (parentColumn as RenderOptionsColumn).contextGroup;
                optionTarget = createOptionTargetArrayFromIndexes(parentColumn.selectedItem as Array<number>);
            }
            return parentSchemaGroup.someEntry(
                ({ schema: rawSchema }) => rawSchema.required && rawSchema.required.includes(selectedItem),
                optionTarget
            );
        }
        // simply check whether the parent (the one the selected option belongs to) is required
        return this.checkIfIsRequired(selectionColumnIndex - 1);
    }

    collectFormFields() {
        const {
            itemSchemaGroup, columnData, selectionColumnIndex
        } = this.props;
        const formFields = [];
        const addFormField = (labelText: string, rowValue?: any) => {
            if (isDefined(rowValue)) {
                formFields.push({ labelText, rowValue });
            }
        };
        const { selectedItem } = columnData[selectionColumnIndex];
        const optionIndexes = typeof selectedItem === "string" ? undefined : selectedItem;
        const getValue = (fieldName, mergeValues = listValues) => getFieldValueFromSchemaGroup(
            itemSchemaGroup, fieldName, mergeValues, undefined, undefined, optionIndexes
        );

        addFormField("Title", getValue("title"));
        addFormField("Description", getValue("description"));

        addFormField("Required", this.checkIfIsRequired(selectionColumnIndex) ? "Yes" : null);

        addFormField("Type", getValue("type", commonValues));
        const enumValues = commonValues(getValue("const", commonValues), getValue("enum", commonValues));
        if (isDefined(enumValues)) {
            if (!Array.isArray(enumValues)) {
                addFormField("Constant Value", enumValues);
            } else if (enumValues.length === 1) {
                addFormField("Constant Value", enumValues[0]);
            } else {
                addFormField("Possible Values", enumValues);
            }
        }

        // if multiple minimums are specified (in allOf parts), the highest minimum applies
        const minimum = getValue("minimum", maximumValue);
        const exclusiveMinimum = containsTrueOrReduce(getValue("exclusiveMinimum"), maximumValue);
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

        // if multiple maximums are specified (in allOf parts), the lowest maximum applies
        const maximum = getValue("maximum", minimumValue);
        const exclusiveMaximum = containsTrueOrReduce(getValue("exclusiveMaximum"), minimumValue);
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
        addFormField("Value Format", getValue("format", commonValues));
        // if multiple minimums are specified (in allOf parts), the highest minimum applies
        addFormField("Min Length", getValue("minLength", maximumValue));
        // if multiple maximums are specified (in allOf parts), the lowest maximum applies
        addFormField("Max Length", getValue("maxLength", minimumValue));
        addFormField("Min Items", getValue("minItems", maximumValue));
        addFormField("Max Items", getValue("maxItems", minimumValue));
        addFormField("Items Unique", containsTrueOrReduce(getValue("uniqueItems"), undefined) ? "Yes" : null);

        return formFields;
    }

    render() {
        return (
            <div className="jsonschema-inspector-details-content">
                <h3 className="jsonschema-inspector-details-header">Details</h3>
                <InspectorDetailsForm
                    key="main-form"
                    fields={this.collectFormFields()}
                />
            </div>
        );
    }

    static propTypes = {
        itemSchemaGroup: PropTypes.instanceOf(JsonSchemaGroup).isRequired,
        selectionColumnIndex: PropTypes.number,
        columnData: PropTypes.arrayOf(PropTypes.shape(getColumnDataPropTypeShape(false))).isRequired
    };

    static defaultProps = {
        selectionColumnIndex: undefined
    };
}

export default InspectorDetailsContent;
