import * as React from "react";
import classNames from "classnames";

import { InspectorItem } from "./InspectorItem";
import { InspectorProps, RenderItemsColumn } from "./InspectorTypes";

export const InspectorColumn: React.FunctionComponent<{
    items: RenderItemsColumn["items"];
    onSelect: RenderItemsColumn["onSelect"];
    selectedItem?: RenderItemsColumn["selectedItem"];
    filteredItems?: RenderItemsColumn["filteredItems"];
    trailingSelection?: RenderItemsColumn["trailingSelection"];
    renderItemContent?: InspectorProps["renderItemContent"];
}> = ({ items, selectedItem, filteredItems, trailingSelection, onSelect, renderItemContent }): React.ReactElement => (
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
