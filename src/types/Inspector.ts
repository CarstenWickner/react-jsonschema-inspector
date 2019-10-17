import React from "react";

import JsonSchema from "../model/JsonSchema";
import JsonSchemaGroup from "../model/JsonSchemaGroup";
import JsonSchemaOptionalsGroup from "../model/JsonSchemaOptionalsGroup";

import { RawJsonSchema } from "./RawJsonSchema";

export interface ParserConfig {
    /**
     * Setting indicating how to include schema parts wrapped in "anyOf".
     */
    anyOf?: SchemaPartParserConfig,
    /**
     * Setting indicating how to include schema parts wrapped in "oneOf".
     */
    oneOf?: SchemaPartParserConfig
};

export interface SchemaPartParserConfig {
    /**
     * Optional title to show above multiple parts in a given wrapper (e.g. "anyOf"/"oneOf").
     */
    groupTitle?: string,
    /**
     * Supplier for an alternative name to be displayed (default is: (indexes) => `Option ${indexes.joining('.')}`).
     */
    optionNameForIndex?: (indexes: Array<number>) => string | undefined
};

export interface BuildArrayPropertiesFunction {
    (
        // declared type of the array's items
        schema: JsonSchema,
        // schema group representing the array
        schemaGroup: JsonSchemaGroup,
        // selected optionIndexes in the array's JsonSchemaGroup (if it contains options)
        optionIndexes?: Array<number>
    ) => { [key: string]: JsonSchema | RawJsonSchema }
};

export interface BreadcrumbsOptions {
    /*
     * Text to show in front of root level selection, e.g. "//" or "./"
     */
    prefix?: string,
    /*
     * Text to add between the selected item names from adjacent columns, e.g. "." or "/"
     */
    separator?: string,
    /*
     * Function to identify breadcrumb names that should not be prepended with a "separator"
     */
    skipSeparator?: (name: string, column: RenderColumn, index: number) => boolean,
    /*
     * Function to derive the selected item's representation in the breadcrumbs from their name
     */
    mutateName?: (selectedItem: string, column: RenderColumn, index: number) => undefined | null | string,
    /*
     * Flag indicating whether double-clicking an item should preserve subsequent selections, otherwise they are discarded
     */
    preventNavigation?: boolean,
    /*
     * Custom render function for a single breadcrumb item.
     */
    renderItem?: (props: { breadcrumbText: string, hasNestedItems: boolean, column: RenderColumn, index: number }) => React.ReactNode,
    /*
     * Custom render function for adding extra elements (e.g. a "Copy to Clipboard" button) after the breadcrumbs.
     */
    renderTrailingContent?: (props: { breadcrumbTexts: Array<string>, columnData: Array<RenderColumn> }) => React.ReactNode
};

export interface FilterFunction {
    (rawSchema: RawJsonSchema) => boolean
};

export interface OnSelectCallback {
    (
        newSelection: Array<string | Array<number>>,
        newRenderData: { columnData: Array<RenderColumn> },
        breadcrumbsTexts?: Array<string>
    ) => void
};

export interface RenderItemContentFunction {
    (props: {
        name: string,
        hasNestedItems: boolean,
        selected: boolean,
        schemaGroup: JsonSchemaGroup,
        optionIndexes?: Array<number>
    }) => React.ReactNode
};

export interface RenderSelectionDetailsFunction {
    (props: {
        itemSchemaGroup: JsonSchemaGroup,
        columnData: Array<RenderColumn>,
        selectionColumnIndex: number,
        optionIndexes?: Array<number>
    }) => React.ReactNode
};

export interface RenderEmptyDetailsFunction {
    (props: {
        rootColumnSchemas: { [key: string]: JsonSchemaGroup }
    }) => React.ReactNode
};

export interface SearchOptions {
    byPropertyName?: boolean,
    fields?: Array<string>,
    filterBy?: (enteredSearchFilter: string | null) => FilterFunction | undefined,
    inputPlaceholder?: string,
    debounceWait?: number,
    debounceMaxWait?: number
};

interface RenderColumnDetails {
    selectedItem?: string | Array<number>,
    trailingSelection?: boolean,
    filteredItems?: Array<string> | Array<Array<number>>,
    onSelect?: RenderColumnOnSelectFunction
};

export interface RenderColumnOnSelectFunction {
    (event: any, selectedItem?: string | Array<number>) => void
};

export interface RenderItemsColumn extends RenderColumnDetails {
    items: { [key: string]: JsonSchemaGroup }
};

export interface RenderOptionsColumn extends RenderColumnDetails {
    options: RenderOptions,
    contextGroup: JsonSchemaOptionalsGroup
}

export type RenderColumn = RenderItemsColumn | RenderOptionsColumn;

export interface RenderOptions {
    groupTitle?: string,
    options?: Array<RenderOptions>,
    optionNameForIndex?: (indexes: Array<number>) => string | undefined
};
