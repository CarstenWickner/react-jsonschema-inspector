import PropTypes from "prop-types";
import React, { Component } from "react";
import classNames from "classnames";

import InspectorItem from "./InspectorItem";
import { getColumnDataPropTypeShape } from "./renderDataUtils";
import { RenderItemContentFunction, RenderColumnOnSelectFunction } from "../types/Inspector";
import JsonSchemaGroup from "../model/JsonSchemaGroup";

const {
    items: itemsPropType,
    onSelect: onSelectPropType
} = getColumnDataPropTypeShape(true);

class InspectorColumn extends Component<{
    items: { [key: string]: JsonSchemaGroup },
    selectedItem?: string,
    filteredItems?: Array<string>,
    trailingSelection?: boolean,
    onSelect: RenderColumnOnSelectFunction,
    renderItemContent: RenderItemContentFunction
}> {
    render() {
        const {
            items, selectedItem, filteredItems, trailingSelection, onSelect, renderItemContent
        } = this.props;
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
                {Object.keys(items).sort().map((name) => (
                    <InspectorItem
                        key={name}
                        name={name}
                        schemaGroup={items[name]}
                        selected={name === selectedItem}
                        matchesFilter={filteredItems ? filteredItems.includes(name) : undefined}
                        onSelect={(event) => onSelect(event, name)}
                        renderContent={renderItemContent}
                    />
                ))}
            </div>
        );
    };

    static propTypes = {
        items: itemsPropType.isRequired,
        selectedItem: PropTypes.string,
        filteredItems: PropTypes.arrayOf(PropTypes.string),
        trailingSelection: PropTypes.bool,
        onSelect: onSelectPropType,
        renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
    };
    
    static defaultProps = {
        selectedItem: null,
        filteredItems: null,
        trailingSelection: false,
        renderItemContent: null
    };
}

export default InspectorColumn;
