import InspectorComponent from "./component/Inspector";
import {
    getFieldValueFromSchemaGroup as getFieldValueFromSchemaGroupFunction
} from "./model/schemaUtils";

export const Inspector = InspectorComponent;

export const getFieldValueFromSchemaGroup = getFieldValueFromSchemaGroupFunction;
