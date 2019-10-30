import * as PropTypes from "prop-types";
import * as React from "react";
import classNames from "classnames";

import { JsonSchemaGroup } from "../model/JsonSchemaGroup";
import { hasSchemaGroupNestedItems } from "./renderDataUtils";
import { isDefined } from "../model/utils";
import { InspectorProps, RenderColumn } from "./InspectorTypes";

interface ItemDefaultProps {
    optionIndexes?: Array<number>;
    selected: boolean;
    matchesFilter?: boolean;
    renderContent: InspectorProps["renderItemContent"];
}

interface ItemProps extends ItemDefaultProps {
    name: string;
    schemaGroup: JsonSchemaGroup;
    onSelect: RenderColumn["onSelect"];
}

export class InspectorItem extends React.Component<ItemProps> {
    render(): React.ReactNode {
        const { name, schemaGroup, optionIndexes, selected, matchesFilter, onSelect, renderContent } = this.props;
        const hasNestedItems = hasSchemaGroupNestedItems(schemaGroup, optionIndexes);
        return (
            <button
                type="button"
                className={classNames({
                    "jsonschema-inspector-item": true,
                    "has-nested-items": hasNestedItems,
                    selected,
                    "matching-filter": matchesFilter,
                    "not-matching-filter": isDefined(matchesFilter) && !matchesFilter
                })}
                onClick={onSelect}
                onFocus={onSelect}
            >
                {renderContent &&
                    renderContent({
                        name,
                        hasNestedItems,
                        selected,
                        schemaGroup,
                        optionIndexes
                    })}
                {!renderContent && (
                    <div className="jsonschema-inspector-item-content">
                        <span className="jsonschema-inspector-item-name">{name}</span>
                        <span className="jsonschema-inspector-item-icon" />
                    </div>
                )}
            </button>
        );
    }

    static propTypes = {
        name: PropTypes.string.isRequired,
        schemaGroup: PropTypes.instanceOf(JsonSchemaGroup).isRequired,
        optionIndexes: PropTypes.arrayOf(PropTypes.number),
        selected: PropTypes.bool,
        matchesFilter: PropTypes.bool,
        onSelect: PropTypes.func.isRequired, // func(SyntheticEvent: event)
        renderContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
    };

    static defaultProps: ItemDefaultProps = {
        optionIndexes: undefined,
        selected: false,
        matchesFilter: undefined,
        renderContent: undefined
    };
}
