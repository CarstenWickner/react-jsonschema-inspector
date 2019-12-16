import * as React from "react";
import classNames from "classnames";

import { JsonSchemaGroup } from "../model/JsonSchemaGroup";
import { hasSchemaGroupNestedItems } from "./renderDataUtils";
import { isDefined } from "../model/utils";
import { InspectorProps, RenderColumn } from "./InspectorTypes";

export const InspectorItem: React.FunctionComponent<{
    name: string;
    schemaGroup: JsonSchemaGroup;
    optionIndexes?: Array<number>;
    selected?: boolean;
    matchesFilter?: boolean;
    renderContent?: InspectorProps["renderItemContent"];
    onSelect: RenderColumn["onSelect"];
}> = ({ name, schemaGroup, optionIndexes, selected, matchesFilter, onSelect, renderContent }): React.ReactElement => {
    const hasNestedItems = hasSchemaGroupNestedItems(schemaGroup, optionIndexes);
    return (
        <div
            className={classNames({
                "jsonschema-inspector-item": true,
                "has-nested-items": hasNestedItems,
                selected,
                "matching-filter": matchesFilter,
                "not-matching-filter": isDefined(matchesFilter) && !matchesFilter
            })}
            onClick={onSelect}
            onFocus={onSelect}
            tabIndex={0}
        >
            {renderContent &&
                renderContent({
                    name,
                    hasNestedItems,
                    selected: !!selected,
                    schemaGroup,
                    optionIndexes
                })}
            {!renderContent && (
                <div className="jsonschema-inspector-item-content">
                    <span className="jsonschema-inspector-item-name">{name}</span>
                    <span className="jsonschema-inspector-item-icon" />
                </div>
            )}
        </div>
    );
};
