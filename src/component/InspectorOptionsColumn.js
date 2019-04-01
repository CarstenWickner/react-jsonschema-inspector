import PropTypes from "prop-types";
import React from "react";
import classNames from "classnames";
import isDeepEqual from "lodash.isequal";

import InspectorItem from "./InspectorItem";
import { getColumnDataPropTypeShape } from "./renderDataUtils";

import { getIndexPermutationsForOptions } from "../model/schemaUtils";

const InspectorOptionsColumn = (props) => {
    const {
        options, contextGroup, selectedItem, filteredItems, trailingSelection, renderItemContent, onSelect
    } = props;
    return (
        <div
            className={classNames({
                "jsonschema-inspector-column": true,
                "with-selection": selectedItem,
                "trailing-selection": trailingSelection
            })}
            onClick={onSelect}
            role="presentation"
            tabIndex={-1}
        >
            {getIndexPermutationsForOptions(options).map(optionIndexes => (
                <InspectorItem
                    key={JSON.stringify(optionIndexes)}
                    identifier={`Option ${1 + optionIndexes[optionIndexes.length - 1]}`}
                    schemaGroup={contextGroup}
                    optionIndexes={optionIndexes}
                    selected={isDeepEqual(optionIndexes, selectedItem)}
                    matchesFilter={filteredItems ? filteredItems.some(filteredOption => isDeepEqual(filteredOption, optionIndexes)) : undefined}
                    onSelect={event => onSelect(event, optionIndexes)}
                    renderContent={renderItemContent}
                />
            ))}
        </div>
    );
};

const columnDataPropTypeShape = getColumnDataPropTypeShape(false);
InspectorOptionsColumn.propTypes = {
    options: columnDataPropTypeShape.options.isRequired,
    // eslint-disable-next-line react/require-default-props
    contextGroup: columnDataPropTypeShape.contextGroup,
    selectedItem: PropTypes.arrayOf(PropTypes.number),
    filteredItems: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    trailingSelection: columnDataPropTypeShape.trailingSelection,
    onSelect: columnDataPropTypeShape.onSelect.isRequired,
    renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
};
InspectorOptionsColumn.defaultProps = {
    selectedItem: null,
    trailingSelection: false,
    filteredItems: null,
    renderItemContent: null
};

export default InspectorOptionsColumn;
