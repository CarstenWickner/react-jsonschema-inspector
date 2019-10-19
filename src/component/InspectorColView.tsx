import PropTypes from "prop-types";
import React, { Component } from "react";

import InspectorColumn from "./InspectorColumn";
import InspectorOptionsColumn from "./InspectorOptionsColumn";
import { getColumnDataPropTypeShape } from "./renderDataUtils";
import { RenderItemsColumn, RenderOptionsColumn, RenderItemContentFunction } from "../types/Inspector";

interface ColViewDefaultProps {
    appendEmptyColumn: boolean,
    renderItemContent: RenderItemContentFunction
};

interface ColViewProps extends ColViewDefaultProps {
    columnData: Array<RenderItemsColumn | RenderOptionsColumn>
};

class InspectorColView extends Component<ColViewProps> {
    private colViewContainerRef: React.RefObject<HTMLDivElement>;

    constructor(props: ColViewProps) {
        super(props);
        this.colViewContainerRef = React.createRef();
    }

    componentDidUpdate(prevProps: ColViewProps) {
        const previousColumnCount = prevProps.columnData.length + (prevProps.appendEmptyColumn ? 1 : 0);
        const { columnData, appendEmptyColumn } = this.props;
        const currentColumnCount = columnData.length + (appendEmptyColumn ? 1 : 0);
        if (previousColumnCount < currentColumnCount) {
            // auto-scroll to the far right if an additional column was added
            this.colViewContainerRef.current.scrollLeft = this.colViewContainerRef.current.scrollWidth;
        }
    }

    render() {
        const {
            columnData, appendEmptyColumn, renderItemContent
        } = this.props;
        return (
            <div
                className="jsonschema-inspector-colview"
                ref={this.colViewContainerRef}
                tabIndex={-1}
            >
                {columnData.map((singleColumnData, index) => {
                    const {
                        selectedItem, trailingSelection, filteredItems, onSelect
                    } = singleColumnData;
                    if ((singleColumnData as RenderItemsColumn).items) {
                        return (
                            <InspectorColumn
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
                                items={(singleColumnData as RenderItemsColumn).items}
                                selectedItem={selectedItem as string}
                                trailingSelection={trailingSelection}
                                filteredItems={filteredItems as Array<string>}
                                onSelect={onSelect}
                                renderItemContent={renderItemContent}
                            />
                        );
                    }
                    const { options, contextGroup } = singleColumnData as RenderOptionsColumn;
                    return (
                        <InspectorOptionsColumn
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            options={options}
                            contextGroup={contextGroup}
                            selectedItem={selectedItem as Array<number>}
                            trailingSelection={trailingSelection}
                            filteredItems={filteredItems as Array<Array<number>>}
                            onSelect={onSelect}
                            renderItemContent={renderItemContent}
                        />
                    );
                })}
                {appendEmptyColumn
                    && <div className="jsonschema-inspector-column-placeholder" />}
            </div>
        );
    }

    static propTypes = {
        columnData: PropTypes.arrayOf(PropTypes.shape(getColumnDataPropTypeShape(true))).isRequired,
        appendEmptyColumn: PropTypes.bool,
        renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
    };
    
    static defaultProps: ColViewDefaultProps = {
        appendEmptyColumn: false,
        renderItemContent: null
    };
}

export default InspectorColView;
