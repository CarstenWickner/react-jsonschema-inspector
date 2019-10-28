import * as PropTypes from "prop-types";
import * as React from "react";
import classNames from "classnames";

import { InspectorItem } from "./InspectorItem";
import { RenderItemsColumnPropTypeShape } from "./renderDataUtils";
import { InspectorProps, RenderItemsColumn } from "../types/Inspector";

interface ColumnDefaultProps {
    selectedItem: RenderItemsColumn["selectedItem"];
    filteredItems: RenderItemsColumn["filteredItems"];
    trailingSelection: RenderItemsColumn["trailingSelection"];
    renderItemContent: InspectorProps["renderItemContent"];
}

export class InspectorColumn extends React.Component<
    {
        items: RenderItemsColumn["items"];
        onSelect: RenderItemsColumn["onSelect"];
    } & ColumnDefaultProps
> {
    render(): React.ReactNode {
        const { items, selectedItem, filteredItems, trailingSelection, onSelect, renderItemContent } = this.props;
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
                {Object.keys(items)
                    .sort()
                    .map((name) => (
                        <InspectorItem
                            key={name}
                            name={name}
                            schemaGroup={items[name]}
                            selected={name === selectedItem}
                            matchesFilter={filteredItems ? filteredItems.includes(name) : undefined}
                            onSelect={(event): void => onSelect(event, name)}
                            renderContent={renderItemContent}
                        />
                    ))}
            </div>
        );
    }

    static propTypes = {
        ...RenderItemsColumnPropTypeShape,
        renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
    };

    static defaultProps: ColumnDefaultProps = {
        selectedItem: null,
        filteredItems: null,
        trailingSelection: false,
        renderItemContent: null
    };
}
