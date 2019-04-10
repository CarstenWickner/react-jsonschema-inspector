import PropTypes from "prop-types";
import React, { Component } from "react";
import classNames from "classnames";
import isDeepEqual from "lodash.isequal";

import InspectorItem from "./InspectorItem";
import { getColumnDataPropTypeShape } from "./renderDataUtils";

class InspectorOptionsColumn extends Component {
    static defaultOptionNameForIndex(optionIndexes) {
        return `Option ${optionIndexes.map(index => index + 1).join("-")}`;
    }

    renderSingleOption(optionIndexes, name) {
        const {
            contextGroup, selectedItem, filteredItems, renderItemContent, onSelect
        } = this.props;
        return (
            <InspectorItem
                name={name}
                schemaGroup={contextGroup}
                optionIndexes={optionIndexes}
                selected={isDeepEqual(optionIndexes, selectedItem)}
                matchesFilter={filteredItems ? filteredItems.some(filteredOption => isDeepEqual(filteredOption, optionIndexes)) : undefined}
                onSelect={event => onSelect(event, optionIndexes)}
                renderContent={renderItemContent}
            />
        );
    }

    renderGroupOfOptions({ groupTitle, options, optionNameForIndex = InspectorOptionsColumn.defaultOptionNameForIndex }, parentOptionIndexes = []) {
        return [
            groupTitle && (
                <span
                    key="group-title"
                    className="optional-group-title"
                >
                    {groupTitle}
                </span>
            ),
            (
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
            )
        ];
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
}

const columnDataPropTypeShape = getColumnDataPropTypeShape(false);
InspectorOptionsColumn.propTypes = {
    options: columnDataPropTypeShape.options.isRequired,
    // eslint-disable-next-line react/require-default-props
    contextGroup: columnDataPropTypeShape.contextGroup,
    selectedItem: PropTypes.arrayOf(PropTypes.number),
    filteredItems: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    trailingSelection: columnDataPropTypeShape.trailingSelection,
    onSelect: columnDataPropTypeShape.onSelect.isRequired,
    renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
};
InspectorOptionsColumn.defaultProps = {
    selectedItem: null,
    trailingSelection: false,
    filteredItems: null,
    renderItemContent: null
};

export default InspectorOptionsColumn;
