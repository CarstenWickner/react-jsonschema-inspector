import * as PropTypes from "prop-types";
import * as React from "react";
import classNames from "classnames";
import isDeepEqual from "lodash.isequal";

import { InspectorItem } from "./InspectorItem";
import { getColumnDataPropTypeShape } from "./renderDataUtils";
import { JsonSchemaGroup } from "../model/JsonSchemaGroup";
import { RenderItemContentFunction, RenderOptions, RenderColumnOnSelectFunction } from "../types/Inspector";

const columnDataPropTypeShape = getColumnDataPropTypeShape(true);

interface OptionsColumnDefaultProps {
    selectedItem: Array<number>,
    filteredItems: Array<Array<number>>,
    trailingSelection: boolean,
    renderItemContent: RenderItemContentFunction
}

interface OptionsColumnProps extends OptionsColumnDefaultProps {
    contextGroup: JsonSchemaGroup,
    options: RenderOptions,
    onSelect: RenderColumnOnSelectFunction
}

export class InspectorOptionsColumn extends React.Component<OptionsColumnProps> {
    static defaultOptionNameForIndex = (optionIndexes: Array<number>) => `Option ${optionIndexes.map((index) => index + 1).join("-")}`;

    renderSingleOption(optionIndexes: Array<number>, name: string) {
        const {
            contextGroup, selectedItem, filteredItems, renderItemContent, onSelect
        } = this.props;
        return (
            <InspectorItem
                name={name}
                schemaGroup={contextGroup}
                optionIndexes={optionIndexes}
                selected={isDeepEqual(optionIndexes, selectedItem)}
                matchesFilter={filteredItems ? filteredItems.some((filteredOption) => isDeepEqual(filteredOption, optionIndexes)) : undefined}
                onSelect={(event) => onSelect(event, optionIndexes)}
                renderContent={renderItemContent}
            />
        );
    }

    renderGroupOfOptions({
        groupTitle,
        options,
        optionNameForIndex = InspectorOptionsColumn.defaultOptionNameForIndex
    }: RenderOptions, parentOptionIndexes: Array<number> = []) {
        return (
            <>
                {groupTitle && (
                    <div
                        key="group-title"
                        className="optional-group-title"
                    >
                        <span>{groupTitle}</span>
                    </div>
                )}
                <ul key="list-of-options">
                    {options.map((optionOrNestedGroup, index) => {
                        const optionIndexes = parentOptionIndexes.concat([index]);
                        return (
                            <li key={JSON.stringify(optionIndexes)}>
                                {optionOrNestedGroup.options && this.renderGroupOfOptions(optionOrNestedGroup, optionIndexes)}
                                {!optionOrNestedGroup.options && this.renderSingleOption(optionIndexes, optionNameForIndex(optionIndexes))}
                            </li>
                        );
                    })}
                </ul>
            </>
        );
    }

    render() {
        const {
            options, selectedItem, trailingSelection, onSelect
        } = this.props;
        return (
            <div
                className={classNames({
                    "jsonschema-inspector-column": true,
                    "optional-groups": true,
                    "with-selection": selectedItem,
                    "trailing-selection": trailingSelection
                })}
                onClick={onSelect}
                role="presentation"
                tabIndex={-1}
            >
                {this.renderGroupOfOptions(options)}
            </div>
        );
    }

    static propTypes = {
        options: columnDataPropTypeShape.options.isRequired,
        // eslint-disable-next-line react/require-default-props
        contextGroup: columnDataPropTypeShape.contextGroup,
        selectedItem: PropTypes.arrayOf(PropTypes.number),
        filteredItems: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
        trailingSelection: columnDataPropTypeShape.trailingSelection,
        onSelect: columnDataPropTypeShape.onSelect,
        renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
    };

    static defaultProps: OptionsColumnDefaultProps = {
        selectedItem: null,
        trailingSelection: false,
        filteredItems: null,
        renderItemContent: null
    };
}
