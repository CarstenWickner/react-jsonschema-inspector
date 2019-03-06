import PropTypes from "prop-types";
import React from "react";
import classNames from "classnames";

import JsonSchema from "./JsonSchema";
import InspectorItem from "./InspectorItem";

const InspectorColumn = ({
    items, selectedItem, trailingSelection, filteredItems, onSelect, renderItemContent
}) => (
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
        {Object.keys(items).sort().map((name) => {
            const selected = name === selectedItem;
            const matchesFilter = filteredItems ? filteredItems.includes(name) : undefined;
            return (
                <InspectorItem
                    key={name}
                    name={name}
                    schema={items[name]}
                    selected={selected}
                    matchesFilter={matchesFilter}
                    onSelect={event => onSelect(event, name)}
                    renderContent={renderItemContent}
                />
            );
        })}
    </div>
);

InspectorColumn.propTypes = {
    items: PropTypes.objectOf(PropTypes.instanceOf(JsonSchema)).isRequired,
    selectedItem: ({ items, selectedItem }) => {
        if (selectedItem !== undefined && selectedItem !== null) {
            if (typeof selectedItem !== "string") {
                return new Error("`selectedItem` is not a `string`");
            }
            if (!items[selectedItem]) {
                return new Error("`selectedItem` is not part of `items`");
            }
        }
        // assume all ok
        return null;
    },
    trailingSelection: ({ selectedItem, trailingSelection }) => {
        if (trailingSelection && !selectedItem) {
            return new Error("`trailingSelection` is true while there is no `selectedItem`");
        }
        return null;
    },
    filteredItems: ({ items, filteredItems }) => {
        if (filteredItems !== undefined && filteredItems !== null) {
            if (!Array.isArray(filteredItems)) {
                return new Error("`filteredItems` is not an `array`");
            }
            if (filteredItems.some(singleItem => !items[singleItem])) {
                return new Error("`filteredItems` are not all part of `items`");
            }
        }
        return null;
    },
    onSelect: PropTypes.func.isRequired, // func(SyntheticEvent: event, string: name)
    renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
};

InspectorColumn.defaultProps = {
    selectedItem: null,
    trailingSelection: false,
    filteredItems: null,
    renderItemContent: null
};

export default InspectorColumn;
