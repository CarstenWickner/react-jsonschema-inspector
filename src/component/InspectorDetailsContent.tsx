/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";

import { InspectorDetailsForm } from "./InspectorDetailsForm";

import { JsonSchemaGroup } from "../model/JsonSchemaGroup";
import { createOptionTargetArrayFromIndexes, getFieldValueFromSchemaGroup } from "../model/schemaUtils";
import { isDefined, listValues, commonValues, minimumValue, maximumValue } from "../model/utils";
import { RenderColumn, RenderItemsColumn, RenderOptionsColumn } from "./InspectorTypes";
import { TypeInRawJsonSchema, KeysOfRawJsonSchema } from "../types/RawJsonSchema";

function containsTrueOrReduce<T>(
    allValues: T | Array<boolean | T>,
    reduceNonBooleans: (combined: T, nextValue: T, index: number, all: Array<T>) => T
): boolean | T | undefined {
    if (Array.isArray(allValues)) {
        return allValues.includes(true) || (allValues.filter((value) => !(typeof value === "boolean")) as Array<T>).reduce(reduceNonBooleans);
    }
    return isDefined(allValues) ? allValues : undefined;
}

function checkIfIsRequired(selectionColumnIndex: number, columnData: Array<RenderColumn>): boolean {
    if (selectionColumnIndex < 1) {
        return false;
    }
    const { selectedItem } = columnData[selectionColumnIndex];
    if (typeof selectedItem === "string") {
        let parentSchemaGroup: JsonSchemaGroup;
        let optionTarget: Array<{ index: number }> | undefined;
        const parentColumn = columnData[selectionColumnIndex - 1];
        if ((parentColumn as RenderItemsColumn).items) {
            parentSchemaGroup = (parentColumn as RenderItemsColumn).items[parentColumn.selectedItem as string];
            optionTarget = undefined;
        } else {
            parentSchemaGroup = (parentColumn as RenderOptionsColumn).contextGroup;
            optionTarget = createOptionTargetArrayFromIndexes(parentColumn.selectedItem as Array<number>);
        }
        return parentSchemaGroup.someEntry(
            ({ schema: rawSchema }) => !!rawSchema.required && rawSchema.required.includes(selectedItem),
            optionTarget
        );
    }
    // simply check whether the parent (the one the selected option belongs to) is required
    return checkIfIsRequired(selectionColumnIndex - 1, columnData);
}

export function collectFormFields(
    itemSchemaGroup: JsonSchemaGroup,
    columnData: Array<RenderColumn>,
    selectionColumnIndex: number
): Array<{ labelText: string; rowValue: any }> {
    const formFields: Array<{ labelText: string; rowValue: any }> = [];
    const addFormField = (labelText: string, rowValue?: any): void => {
        if (isDefined(rowValue)) {
            formFields.push({ labelText, rowValue });
        }
    };
    const { selectedItem } = columnData[selectionColumnIndex];
    const optionIndexes = typeof selectedItem === "string" ? undefined : selectedItem;
    const getValue = <K extends KeysOfRawJsonSchema, T extends TypeInRawJsonSchema<K> | Array<TypeInRawJsonSchema<K>>>(
        fieldName: K,
        mergeValues: (combined: T | undefined, nextValue?: T | undefined) => T | undefined = listValues
    ): T | undefined => getFieldValueFromSchemaGroup(itemSchemaGroup, fieldName, mergeValues, undefined, undefined, optionIndexes);

    addFormField("Title", getValue("title"));
    addFormField("Description", getValue("description"));

    addFormField("Required", checkIfIsRequired(selectionColumnIndex, columnData) ? "Yes" : null);

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
    examples = isDefined(examples) && (!Array.isArray(examples) || examples.length) ? examples : null;
    addFormField("Example(s)", examples && Array.isArray(examples) && typeof examples[0] === "object" ? JSON.stringify(examples) : examples);
    addFormField("Value Pattern", getValue("pattern"));
    addFormField("Value Format", getValue("format", commonValues));
    // if multiple minimums are specified (in allOf parts), the highest minimum applies
    addFormField("Min Length", getValue("minLength", maximumValue));
    // if multiple maximums are specified (in allOf parts), the lowest maximum applies
    addFormField("Max Length", getValue("maxLength", minimumValue));
    addFormField("Min Items", getValue("minItems", maximumValue));
    addFormField("Max Items", getValue("maxItems", minimumValue));
    const uniqueItems = getValue("uniqueItems");
    addFormField("Items Unique", (Array.isArray(uniqueItems) && uniqueItems.includes(true)) || uniqueItems === true ? "Yes" : null);

    return formFields;
}

export const InspectorDetailsContent: React.FunctionComponent<{
    itemSchemaGroup: JsonSchemaGroup;
    columnData: Array<RenderColumn>;
    selectionColumnIndex: number;
}> = ({ itemSchemaGroup, columnData, selectionColumnIndex }): React.ReactElement => (
    <div className="jsonschema-inspector-details-content">
        <h3 className="jsonschema-inspector-details-header">Details</h3>
        <InspectorDetailsForm key="main-form" fields={collectFormFields(itemSchemaGroup, columnData, selectionColumnIndex)} />
    </div>
);
