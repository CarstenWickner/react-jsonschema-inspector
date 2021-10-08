import * as React from "react";

import { JsonSchema } from "../model/JsonSchema";
import { JsonSchemaGroup } from "../model/JsonSchemaGroup";

import { RawJsonSchema, KeysOfRawJsonSchemaStringValues } from "../types/RawJsonSchema";
import { ParserConfig } from "../types/ParserConfig";
import { RenderOptions } from "../types/RenderOptions";

export interface InspectorDefaultProps {
    /**
     * Array of additional JSON Schemas that may be referenced by entries in `schemas` but are not shown (on the root level) themselves.
     */
    referenceSchemas?: Array<RawJsonSchema>;
    /**
     * Flag indicating whether the root column should be hidden in case of `schemas` containing only a single item.
     */
    hideSingleRootItem?: boolean;
    /**
     * Array of (default) selected items – each item representing the selection in one displayed column.
     */
    defaultSelectedItems?: Array<string | Array<number>>;
    /**
     * Options for the traversing/parsing of JSON schemas. Defining how optional parts of a schema should be represented.
     */
    parserConfig?: ParserConfig;
    /**
     * Function accepting a `JsonSchema` instance representing an array's declared type of items and returning an object listing the available
     * properties to offer. The default, providing access to the array's items, is: `arrayItemSchema => ({ "[0]": arrayItemSchema })`
     * Provided inputs are (1) a `JsonSchema` representing the declared type of array items, (2) a `JsonSchemaGroup` representing the surrounding
     * array's type, (3) an `Array.<number>` indicating the 'optionIndexes' selected in the array (i.e. #2), which may be undefined.
     * The expected values of the expected object being returned may be either `JsonSchema`, plain/raw json schema definitions, or a mix of them.
     * E.g. `arrayItemSchema => ({ "[0]": arrayItemSchema, "length": { type: "number" } })` is valid here as well.
     */
    buildArrayProperties?: (
        // declared type of the array's items
        schema: JsonSchema,
        // schema group representing the array
        schemaGroup: JsonSchemaGroup,
        // selected optionIndexes in the array's JsonSchemaGroup (if it contains options)
        optionIndexes?: Array<number>
    ) => Record<string, JsonSchema | RawJsonSchema>;
    /**
     * Options for the breadcrumbs feature shown in the footer – set to `null` to turn it off.
     * - "prefix": Text to show in front of root level selection, e.g. "//" or "./"
     * - "separator": Text to add between the selected item names from adjacent columns, e.g. "." or "/"
     * - "skipSeparator": Function to identify breadcrumb names that should not be prepended with a "separator"
     * - "mutateName": Function to derive the selected item's representation in the breadcrumbs from their name
     * - "preventNavigation": Flag indicating whether double-clicking an item should preserve subsequent selections, otherwise they are discarded
     * - "renderItem": Custom render function for a single breadcrumb item
     * - "renderTrailingContent": Custom render function for adding extra elements (e.g. a "Copy to Clipboard" button) after the breadcrumbs
     */
    breadcrumbs?: null | {
        /*
         * Text to show in front of root level selection, e.g. "//" or "./"
         */
        prefix?: string;
        /*
         * Text to add between the selected item names from adjacent columns, e.g. "." or "/"
         */
        separator?: string;
        /*
         * Function to identify breadcrumb names that should not be prepended with a "separator"
         */
        skipSeparator?: (name: string, column: RenderColumn, index: number) => boolean;
        /*
         * Function to derive the selected item's representation in the breadcrumbs from their name
         */
        mutateName?: (selectedItem: string, column: RenderColumn, index: number) => undefined | null | string;
        /*
         * Flag indicating whether double-clicking an item should preserve subsequent selections, otherwise they are discarded
         */
        preventNavigation?: boolean;
        /*
         * Custom render function for a single breadcrumb item.
         */
        renderItem?: (props: { breadcrumbText: string; hasNestedItems: boolean; column: RenderColumn; index: number }) => React.ReactElement;
        /*
         * Custom render function for adding extra elements (e.g. a "Copy to Clipboard" button) after the breadcrumbs.
         */
        renderTrailingContent?: (props: { breadcrumbTexts: Array<string>; columnData: Array<RenderColumn> }) => React.ReactElement | undefined;
    };
    /**
     * Options for the search input shown in the header and its impact on the displayed columns – set to `null` to turn it off.
     * - "byPropertyName": Flag indicating whether property names should be considered when searching/filtering
     * - "fields": Array of strings: each referring to a textual field in a JSON Schema (e.g. `["title", "description"]`) in which to search
     * - "filterBy": Custom search/filter logic, if present: overriding behaviour based on "fields"
     * - "inputPlaceholder": Hint text to display in the search input field (defaults to "Search")
     * - "debounceWait": Number indicating the delay in milliseconds since the last change to the search term before applying it. Default: `200`.
     * - "debounceMaxWait": Number indicating the maximum delay in milliseconds before a newly entered search is being applied. Default: `500`.
     */
    searchOptions?: null | {
        byPropertyName?: boolean;
        fields?: Array<KeysOfRawJsonSchemaStringValues>;
        filterBy?: (enteredSearchFilter: string | null) => undefined | ((rawSchema: RawJsonSchema) => boolean);
        inputPlaceholder?: string;
        debounceWait?: number;
        debounceMaxWait?: number;
    };
    /**
     * Callback to invoke after the selection changed.
     * Expects two inputs:
     * 1. the string-array of selected items
     * 2. object containing a "columnData" key, holding the full render information for all columns (except for currently applied search/filter)
     */
    onSelect?: (
        newSelection: Array<string | Array<number>>,
        newRenderData: { columnData: Array<RenderColumn> },
        breadcrumbsTexts?: Array<string>
    ) => void;
    /**
     * Custom render function for the header tool-bar (to the left of the search field).
     */
    renderHeaderToolBar?: (props: { columnData: Array<RenderColumn> }) => React.ReactElement | undefined;
    /**
     * Custom render function for the search field.
     */
    renderSearchInput?: (props: {
        searchFilter: string;
        placeholder: string;
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    }) => React.ReactElement;
    /**
     * Custom render function for the content of a single item in a column.
     * Expects a single object as input with the following keys:
     * - "name": providing the name of the respective item
     * - "hasNestedItems": flag indicating whether selecting this item may display another column with further options to the right
     * - "selected": flag indicating whether the item is currently selected
     * - "schemaGroup": the full `JsonSchemaGroup` associated with the item
     */
    renderItemContent?: (props: {
        name: string;
        hasNestedItems: boolean;
        selected: boolean;
        schemaGroup: JsonSchemaGroup;
        optionIndexes?: Array<number>;
    }) => React.ReactElement;
    /**
     * Custom render function for the details block on the right (only used if there is an actual selection).
     * Expects a single object as input with the following keys:
     * - "itemSchemaGroup": the full `JsonSchemaGroup` associated with the currently selected trailing item (i.e. right-most selection)
     * - "columnData": the full render information for all columns
     * - "selectionColumnIndex": indicating the index of the right-most column containing a selected item (for convenient use of "columnData")
     * - "optionIndexes": in case of an optional path being selected
     */
    renderSelectionDetails?: (props: {
        itemSchemaGroup: JsonSchemaGroup;
        columnData: Array<RenderColumn>;
        selectionColumnIndex: number;
        optionIndexes?: Array<number>;
    }) => React.ReactElement | undefined;
    /**
     * Custom render function for the details block on the right (only used if there is no selection).
     * Expects a single object as input with the following key:
     * - "rootColumnSchemas": the full render information for the root column (since there is no selection, there are no other columns)
     */
    renderEmptyDetails?: (props: { rootColumnSchemas: Record<string, JsonSchemaGroup> }) => React.ReactElement | undefined;
}

export interface InspectorProps extends InspectorDefaultProps {
    /**
     * Object containing names of root level items (as keys) each associated with their respective JSON Schema (as values).
     */
    schemas: Record<string, RawJsonSchema>;
}

interface RenderColumnDetails {
    trailingSelection?: boolean;
    onSelect: (event: React.SyntheticEvent, selectedItem?: string | Array<number>) => void;
}

export interface RenderItemsColumn extends RenderColumnDetails {
    items: Record<string, JsonSchemaGroup>;
    selectedItem?: string;
    filteredItems?: Array<string>;
}

export interface RenderOptionsColumn extends RenderColumnDetails {
    options: RenderOptions;
    contextGroup: JsonSchemaGroup;
    selectedItem?: Array<number>;
    filteredItems?: Array<Array<number>>;
}

export type RenderColumn = RenderItemsColumn | RenderOptionsColumn;
