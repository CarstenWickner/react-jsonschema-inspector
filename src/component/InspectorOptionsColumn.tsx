import * as PropTypes from "prop-types";
import * as React from "react";
import classNames from "classnames";
import isDeepEqual from "lodash.isequal";

import { InspectorItem } from "./InspectorItem";
import { RenderOptionsColumnPropTypeShape } from "./renderDataUtils";
import { InspectorProps, RenderOptionsColumn } from "./InspectorTypes";
import { RenderOptions } from "../types/RenderOptions";

interface OptionsColumnDefaultProps {
    selectedItem: RenderOptionsColumn["selectedItem"];
    filteredItems: RenderOptionsColumn["filteredItems"];
    trailingSelection: RenderOptionsColumn["trailingSelection"];
    renderItemContent: InspectorProps["renderItemContent"];
}

interface OptionsColumnProps extends OptionsColumnDefaultProps {
    contextGroup: RenderOptionsColumn["contextGroup"];
    options: RenderOptionsColumn["options"];
    onSelect: RenderOptionsColumn["onSelect"];
}

export class InspectorOptionsColumn extends React.Component<OptionsColumnProps> {
    static defaultOptionNameForIndex = (optionIndexes: Array<number>): string => `Option ${optionIndexes.map((index) => index + 1).join("-")}`;

    renderSingleOption(optionIndexes: Array<number>, name: string): React.ReactNode {
        const { contextGroup, selectedItem, filteredItems, renderItemContent, onSelect } = this.props;
        return (
            <InspectorItem
                name={name}
                schemaGroup={contextGroup}
                optionIndexes={optionIndexes}
                selected={isDeepEqual(optionIndexes, selectedItem)}
                matchesFilter={filteredItems ? filteredItems.some((filteredOption) => isDeepEqual(filteredOption, optionIndexes)) : undefined}
                onSelect={(event): void => onSelect(event, optionIndexes)}
                renderContent={renderItemContent}
            />
        );
    }

    renderGroupOfOptions(
        { groupTitle, options, optionNameForIndex = InspectorOptionsColumn.defaultOptionNameForIndex }: RenderOptions,
        parentOptionIndexes: Array<number> = []
    ): React.ReactNode {
        return (
            <>
                {groupTitle && (
                    <div key="group-title" className="optional-group-title">
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

    render(): React.ReactNode {
        const { options, selectedItem, trailingSelection, onSelect } = this.props;
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
        ...RenderOptionsColumnPropTypeShape,
        renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
    };

    static defaultProps: OptionsColumnDefaultProps = {
        selectedItem: null,
        trailingSelection: false,
        filteredItems: null,
        renderItemContent: null
    };
}
