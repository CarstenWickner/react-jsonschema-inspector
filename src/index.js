import InspectorComponent from "./component/Inspector";
import {
    getFieldValueFromSchemaGroup as getFieldValueFromSchemaGroupFunction
} from "./model/schemaUtils";
import {
    minimumValue, maximumValue, commonValues, listValues
} from "./model/utils";

export const Inspector = InspectorComponent;

export const getFieldValueFromSchemaGroup = getFieldValueFromSchemaGroupFunction;
export const getMinimumFieldValueFromSchemaGroup = (schemaGroup, fieldName, defaultValue, optionIndexes) => getFieldValueFromSchemaGroup(
    schemaGroup, fieldName, minimumValue, defaultValue, null, optionIndexes
);
export const getMaximumFieldValueFromSchemaGroup = (schemaGroup, fieldName, defaultValue, optionIndexes) => getFieldValueFromSchemaGroup(
    schemaGroup, fieldName, maximumValue, defaultValue, null, optionIndexes
);
export const getJointFieldValuesFromSchemaGroup = (schemaGroup, fieldName, defaultValue, optionIndexes) => getFieldValueFromSchemaGroup(
    schemaGroup, fieldName, commonValues, defaultValue, null, optionIndexes
);
export const getFieldValueArrayFromSchemaGroup = (schemaGroup, fieldName, defaultValue, optionIndexes) => getFieldValueFromSchemaGroup(
    schemaGroup, fieldName, listValues, defaultValue, null, optionIndexes
);
