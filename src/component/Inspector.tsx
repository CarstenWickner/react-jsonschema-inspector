import * as PropTypes from "prop-types";
import * as React from "react";
import memoize from "memoize-one";
import debounce from "lodash.debounce";
import isDeepEqual from "lodash.isequal";
import { DebouncedFunc } from "lodash";

import "./Inspector.scss";

import { InspectorColView } from "./InspectorColView";
import { InspectorDetails } from "./InspectorDetails";
import { InspectorBreadcrumbs } from "./InspectorBreadcrumbs";
import { InspectorSearchField } from "./InspectorSearchField";
import { createRenderDataBuilder, createFilterFunctionForColumn } from "./renderDataUtils";

import { createBreadcrumbBuilder } from "./breadcrumbsUtils";
import { filteringByFields, filteringByPropertyName } from "../model/searchUtils";

import { InspectorDefaultProps, InspectorProps, RenderColumn, RenderItemsColumn, RenderOptionsColumn } from "./InspectorTypes";

export class Inspector extends React.Component<
    InspectorProps,
    {
        selectedItems: Array<string | Array<number>>;
        appendEmptyColumn: boolean;
        enteredSearchFilter: string;
        appliedSearchFilter: string;
    }
> {
    /**
     * Avoid constant/immediate re-rendering while the search filter is being entered by using debounce.
     * This is wrapped into memoize() to allow setting the wait times via props.
     *
     * @param {number} debounceWait - the number of milliseconds to delay before applying the new filter value
     * @param {number} debounceMaxWait - the maximum time the filter re-evaluation is allowed to be delayed before it's invoked
     * @returns {Function} return debounced function to set applied filter
     * @returns {string} return.value input parameter is the new search filter value to apply
     */
    debouncedApplySearchFilter = memoize(
        (debounceWait: number, debounceMaxWait: number): DebouncedFunc<(newSearchFilter: string) => void> =>
            debounce(
                (newSearchFilter: string) => {
                    this.setState({ appliedSearchFilter: newSearchFilter });
                },
                debounceWait,
                { maxWait: debounceMaxWait }
            )
    );

    constructor(props: InspectorProps) {
        super(props);
        const { defaultSelectedItems } = props;

        // the state should be kept minimal
        // the expensive logic is handled in getRenderDataForSelection()
        this.state = {
            selectedItems: defaultSelectedItems || [],
            appendEmptyColumn: false,
            enteredSearchFilter: "",
            appliedSearchFilter: ""
        };
    }

    /**
     * When the entered search filter changes, store it in the component state and trigger the debounced re-evaluation of the actual filtering
     *
     * @param {string} enteredSearchFilter - the newly entered search filter in its respective input field
     */
    onSearchFilterChange = (enteredSearchFilter: string): void => {
        this.setState({ enteredSearchFilter });
        const { searchOptions } = this.props;
        const { debounceWait = 200, debounceMaxWait = 500 } = searchOptions || {};
        this.debouncedApplySearchFilter(debounceWait, debounceMaxWait)(enteredSearchFilter);
    };

    /**
     * Create an onSelect function for a particular column.
     *
     * @param {number} columnIndex - the index of the column to create the onSelect function for
     * @returns {Function} return - the onSelect function to be used in that given column (for either setting or clearing its selection)
     * {*} return.param0.event - the originally triggered event (e.g. onClick, onDoubleClick, onKeyDown, etc.)
     * {string} return.param0.selectedItem - the item to select (or `null` to discard any selection in this column – and all subsequent ones)
     */
    onSelectInColumn =
        (columnIndex: number): RenderColumn["onSelect"] =>
        (event, selectedItem): void => {
            // the lowest child component accepting the click/selection event should consume it
            event.stopPropagation();
            const { selectedItems, appendEmptyColumn } = this.state;
            if (selectedItems.length === columnIndex && !selectedItem) {
                // click clearing selection in next column (where there was no selection yet)
                // i.e. no change = no need for any action
                return;
            }
            if (selectedItems.length === columnIndex + 1 && isDeepEqual(selectedItems[columnIndex], selectedItem)) {
                // click on current/last selection
                // i.e. no change = no need for any action
                return;
            }
            // shallow-copy array of item identifiers
            const newSelection = selectedItems.slice();
            // discard any extraneous columns
            newSelection.length = columnIndex;
            // add the new selection in the targeted column (i.e. at the end), if a particular item was selected
            if (selectedItem) {
                newSelection.push(selectedItem);
            }
            // need to look-up the currently displayed number of content columns
            // thanks to 'memoize', we just look-up the result of the previous evaluation
            const { schemas, referenceSchemas, hideSingleRootItem, parserConfig = {}, buildArrayProperties } = this.props;
            const oldColumnCount =
                (appendEmptyColumn ? 1 : 0) +
                this.getRenderDataForSelection(schemas, referenceSchemas, selectedItems, parserConfig, hideSingleRootItem, buildArrayProperties)
                    .columnData.length;
            // now we need to know what the number of content columns will be after changing the state
            // thanks to 'memoize', the subsequent render() call will just look-up the result of this evaluation
            const newRenderData = this.getRenderDataForSelection(
                schemas,
                referenceSchemas,
                newSelection,
                parserConfig,
                hideSingleRootItem,
                buildArrayProperties
            );
            const { columnData } = newRenderData;
            // update state to trigger re-rendering of the whole component
            this.setState(
                {
                    selectedItems: newSelection,
                    appendEmptyColumn: columnData.length < oldColumnCount
                },
                // due to the two-step process, the newRenderData will NOT include the filteredItems
                this.getSetStateCallbackOnSelect(newSelection, newRenderData)
            );
        };

    /**
     * @param {Array.<string|Array.<number>>} newSelection - updated "electedItems" value in state
     * @param {{columnData:Array.<RenderColumn>}} newRenderData - new complete render data derived from props and updated state
     * @param {Array.<RenderColumn>} newRenderData.columnData - list of updated columns being rendered
     * @returns {?Function} callback function for setState() being called as a result of an onSelect event
     */
    getSetStateCallbackOnSelect(
        newSelection: Array<string | Array<number>>,
        newRenderData: { columnData: Array<RenderColumn> }
    ): (() => void) | undefined {
        const { onSelect } = this.props;
        if (!onSelect) {
            return undefined;
        }
        const { columnData } = newRenderData;
        return (): void => onSelect(newSelection, newRenderData, this.collectBreadCrumbs(columnData));
    }

    /**
     * @param {Array.<RenderColumn>} columnData - complete render information for the separate columns
     * @returns {?Array.<string>} full breadcrumbs according to configuration and currently selected items
     */
    collectBreadCrumbs(columnData: Array<RenderColumn>): Array<string> | undefined {
        const { breadcrumbs: breadcrumbsOptions } = this.props;
        if (!breadcrumbsOptions) {
            return undefined;
        }
        return columnData.map(createBreadcrumbBuilder(breadcrumbsOptions)).filter((value: string | null) => value) as Array<string>;
    }

    /**
     * Collect the data to provide as props to the sub components.
     * Thanks to 'memoize', all this logic will only be executed again if the provided parameters changed.
     *
     * @param {object.<string, object>} schemas - object containing the top-level JsonSchema definitions as values
     * @param {?Array.<object>} referenceSchemas - additional schemas that may be referenced from within main "schemas"
     * @param {?Array.<string>} selectedItems - array of strings identifying the selected properties per column
     * @param {boolean} hideSingleRootItem - flag indicating whether the root column should be hidden in case of a single item in the root `schemas`
     * @param {object} parserConfig - configuration affecting how the JSON schemas are being traversed/parsed
     * @param {Function} buildArrayProperties - function to derive the properties to list for an array, based on a given `JsonSchema` of the items
     * @returns {object} return - wrapper object for the column data (for the sake of future extensibility)
     * {Array.<object>} return.columnData - collected/prepared data for rendering
     * {?object.<string, JsonSchemaGroup>} return.columnData[].items - named schemas to list in the respective column
     * {?object} return.columnData[].options - representation of a schema's hierarchy in case of optionals being included
     * {?JsonSchemaGroup} return.columnData[].contextGroup - the schema group containing the `options`
     * {?string} return.columnData[].selectedItem - name of the currently selected item (may be null)
     * {?boolean} return.columnData[].trailingSelection - flag indicating whether this column's selection is the last
     * {Function} return.columnData[].onSelect - callback expecting an event and the name of the selected item in that column as parameters
     */
    getRenderDataForSelection = memoize(createRenderDataBuilder(this.onSelectInColumn), isDeepEqual);

    /**
     * Provide setter for a single entry in the standard columnData array to set or clear its list of `filteredItems` according to the given
     * `searchOptions` (prop) and entered `searchFilter` value (from search input field).
     * Thanks to 'memoize', exactly one set of previous search results will be preserved if the options and filter value are unchanged.
     *
     * @param {?object} searchOptions - prop containing various options for steering search behaviour
     * @param {?Function} searchOptions.filterBy - custom filter function to apply (expecting the `searchFilter` as input)
     * @param {?Array.<string>} searchOptions.fields - alternative to `filterBy`, generating a filter function checking the listed fields' contents
     * @param {?boolean} searchOptions.byPropertyName - addition to `fields`/`filterBy`, whether to consider matching property names
     * @param {?string} searchFilter - entered value from the search input field to filter by
     * @returns {Function} return - function to apply for setting/clearing the `filteredItems` in an entry of the 'columnData' array
     * {object} return.param0 - entry of the 'columnData' array to set/clear the `filteredItems` in
     */
    setFilteredItemsForColumn = memoize((searchOptions: InspectorProps["searchOptions"], searchFilter: string) => {
        if (searchOptions && searchFilter) {
            // search feature is enabled
            const { filterBy, fields, byPropertyName } = searchOptions;
            // if `filterBy` is defined, `fields` are being ignored
            const flatSchemaFilterFunction = filterBy ? filterBy(searchFilter) : fields ? filteringByFields(fields, searchFilter) : undefined;
            const propertyNameFilterFunction = byPropertyName ? filteringByPropertyName(searchFilter) : undefined;
            if (flatSchemaFilterFunction || propertyNameFilterFunction) {
                // search feature is being used, so we set the filteredItems accordingly
                const getFilteredItemsForColumn = createFilterFunctionForColumn(flatSchemaFilterFunction, propertyNameFilterFunction);
                return (column: RenderItemsColumn | RenderOptionsColumn): void => {
                    column.filteredItems = getFilteredItemsForColumn(column);
                };
            }
        }
        // if the search feature is disabled or currently unused, we should ensure that there are no left-over filteredItems
        return (column: RenderItemsColumn | RenderOptionsColumn): void => {
            delete column.filteredItems;
        };
    }, isDeepEqual);

    render(): React.ReactElement {
        const {
            schemas,
            referenceSchemas,
            hideSingleRootItem,
            parserConfig = {},
            buildArrayProperties,
            searchOptions,
            breadcrumbs,
            renderHeaderToolBar,
            renderSearchInput,
            renderItemContent,
            renderSelectionDetails,
            renderEmptyDetails
        } = this.props;
        const { selectedItems, appendEmptyColumn, enteredSearchFilter, appliedSearchFilter } = this.state;
        const renderDataForSelection = this.getRenderDataForSelection(
            schemas,
            referenceSchemas,
            selectedItems,
            parserConfig,
            hideSingleRootItem,
            buildArrayProperties
        );
        const { columnData } = renderDataForSelection;
        // apply search filter if enabled or clear (potentially left-over) search results
        columnData.forEach(this.setFilteredItemsForColumn(searchOptions, appliedSearchFilter));
        const searchFeatureEnabled =
            searchOptions && (searchOptions.byPropertyName || (searchOptions.fields && searchOptions.fields.length) || searchOptions.filterBy);
        const shouldShowHeaderToolBar = renderHeaderToolBar || searchFeatureEnabled;
        return (
            <div className="jsonschema-inspector">
                {shouldShowHeaderToolBar && (
                    <div className="jsonschema-inspector-header">
                        {searchFeatureEnabled && searchOptions && (
                            <InspectorSearchField
                                searchFilter={enteredSearchFilter}
                                onSearchFilterChange={this.onSearchFilterChange}
                                placeholder={searchOptions.inputPlaceholder}
                                renderSearchInput={renderSearchInput}
                            />
                        )}
                        {renderHeaderToolBar && <div className="jsonschema-inspector-toolbar">{renderHeaderToolBar(renderDataForSelection)}</div>}
                    </div>
                )}
                <div className="jsonschema-inspector-body">
                    <InspectorColView columnData={columnData} appendEmptyColumn={appendEmptyColumn} renderItemContent={renderItemContent} />
                    <InspectorDetails
                        columnData={columnData}
                        renderSelectionDetails={renderSelectionDetails}
                        renderEmptyDetails={renderEmptyDetails}
                    />
                </div>
                {breadcrumbs && (
                    <div className="jsonschema-inspector-footer">
                        <InspectorBreadcrumbs columnData={columnData} breadcrumbsOptions={breadcrumbs} />
                    </div>
                )}
            </div>
        );
    }

    static propTypes = {
        schemas: PropTypes.objectOf(PropTypes.object).isRequired,
        referenceSchemas: PropTypes.arrayOf(PropTypes.object),
        hideSingleRootItem: PropTypes.bool,
        defaultSelectedItems: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.number)])),
        parserConfig: PropTypes.shape({
            anyOf: PropTypes.shape({
                groupTitle: PropTypes.string,
                optionNameForIndex: PropTypes.func
            }),
            oneOf: PropTypes.shape({
                groupTitle: PropTypes.string,
                optionNameForIndex: PropTypes.func
            })
        }),
        buildArrayProperties: PropTypes.func,
        breadcrumbs: PropTypes.shape({
            prefix: PropTypes.string,
            separator: PropTypes.string,
            skipSeparator: PropTypes.func,
            mutateName: PropTypes.func,
            preventNavigation: PropTypes.bool,
            renderItem: PropTypes.func,
            renderTrailingContent: PropTypes.func
        }),
        searchOptions: PropTypes.shape({
            byPropertyName: PropTypes.bool,
            fields: PropTypes.arrayOf(PropTypes.string),
            filterBy: PropTypes.func,
            inputPlaceholder: PropTypes.string,
            debounceWait: PropTypes.number,
            debounceMaxWait: PropTypes.number
        }),
        onSelect: PropTypes.func,
        renderHeaderToolBar: PropTypes.func,
        renderSearchInput: PropTypes.func,
        renderItemContent: PropTypes.func,
        renderSelectionDetails: PropTypes.func,
        renderEmptyDetails: PropTypes.func
    };

    static defaultProps: InspectorDefaultProps = {
        referenceSchemas: [],
        hideSingleRootItem: false,
        defaultSelectedItems: [],
        parserConfig: {},
        buildArrayProperties: undefined,
        breadcrumbs: {
            skipSeparator: (fieldName: string): boolean => fieldName === "[0]"
        },
        searchOptions: {
            byPropertyName: true,
            fields: ["title", "description"]
        },
        onSelect: undefined,
        renderHeaderToolBar: undefined,
        renderSearchInput: undefined,
        renderItemContent: undefined,
        renderSelectionDetails: undefined,
        renderEmptyDetails: undefined
    };
}
