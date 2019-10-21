import * as PropTypes from "prop-types";
import * as React from "react";
import classNames from "classnames";

import { InspectorItem } from "./InspectorItem";
import { getColumnDataPropTypeShape } from "./renderDataUtils";
import { JsonSchemaGroup } from "../model/JsonSchemaGroup";
import { RenderItemContentFunction, RenderColumnOnSelectFunction } from "../types/Inspector";

const {
    items: itemsPropType,
    onSelect: onSelectPropType
} = getColumnDataPropTypeShape(true);

interface ColumnDefaultProps {
    selectedItem: string,
    filteredItems: Array<string>,
    trailingSelection: boolean,
    renderItemContent: RenderItemContentFunction
}

interface ColumnProps extends ColumnDefaultProps {
    items: { [key: string]: JsonSchemaGroup },
    onSelect: RenderColumnOnSelectFunction
}

export class InspectorColumn extends React.Component<ColumnProps> {
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
    
    static defaultProps: ColumnDefaultProps = {
        selectedItem: null,
        filteredItems: null,
        trailingSelection: false,
        renderItemContent: null
    };
}
