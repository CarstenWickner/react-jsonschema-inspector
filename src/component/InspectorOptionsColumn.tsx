import * as React from "react";
import classNames from "classnames";
import isDeepEqual from "lodash.isequal";

import { InspectorItem } from "./InspectorItem";
import { InspectorProps, RenderOptionsColumn } from "./InspectorTypes";
import { RenderOptions } from "../types/RenderOptions";

export class InspectorOptionsColumn extends React.Component<{
    contextGroup: RenderOptionsColumn["contextGroup"];
    options: RenderOptionsColumn["options"];
    selectedItem?: RenderOptionsColumn["selectedItem"];
    filteredItems?: RenderOptionsColumn["filteredItems"];
    trailingSelection?: RenderOptionsColumn["trailingSelection"];
    renderItemContent?: InspectorProps["renderItemContent"];
    onSelect: RenderOptionsColumn["onSelect"];
}> {
    static defaultOptionNameForIndex = (optionIndexes: Array<number>): string => `Option ${optionIndexes.map((index) => index + 1).join("-")}`;

    renderSingleOption(optionIndexes: Array<number>, name: string): React.ReactElement {
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

    renderGroupOfOptions({ groupTitle, options, optionNameForIndex }: RenderOptions, parentOptionIndexes: Array<number> = []): React.ReactElement {
        return (
            <>
                {groupTitle && (
                    <div key="group-title" className="optional-group-title">
                        <span>{groupTitle}</span>
                    </div>
                )}
                <ul key="list-of-options">
                    {options &&
                        options.map((optionOrNestedGroup, index) => {
                            const optionIndexes = parentOptionIndexes.concat([index]);
                            return (
                                <li key={JSON.stringify(optionIndexes)}>
                                    {optionOrNestedGroup.options && this.renderGroupOfOptions(optionOrNestedGroup, optionIndexes)}
                                    {!optionOrNestedGroup.options &&
                                        this.renderSingleOption(
                                            optionIndexes,
                                            (optionNameForIndex && optionNameForIndex(optionIndexes)) ||
                                                InspectorOptionsColumn.defaultOptionNameForIndex(optionIndexes)
                                        )}
                                </li>
                            );
                        })}
                </ul>
            </>
        );
    }

    render(): React.ReactElement {
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
}
