import * as PropTypes from "prop-types";
import * as React from "react";

import { InspectorColumn } from "./InspectorColumn";
import { InspectorOptionsColumn } from "./InspectorOptionsColumn";
import { ColumnDataPropType } from "./renderDataUtils";
import { InspectorProps, RenderItemsColumn, RenderOptionsColumn } from "./InspectorTypes";

interface ColViewDefaultProps {
    appendEmptyColumn: boolean;
    renderItemContent: InspectorProps["renderItemContent"];
}

export interface ColViewProps extends ColViewDefaultProps {
    columnData: Array<RenderItemsColumn | RenderOptionsColumn>;
}

export class InspectorColView extends React.Component<ColViewProps> {
    private colViewContainerRef: React.RefObject<HTMLDivElement>;

    constructor(props: ColViewProps) {
        super(props);
        this.colViewContainerRef = React.createRef();
    }

    componentDidUpdate(prevProps: ColViewProps): void {
        const previousColumnCount = prevProps.columnData.length + (prevProps.appendEmptyColumn ? 1 : 0);
        const { columnData, appendEmptyColumn } = this.props;
        const currentColumnCount = columnData.length + (appendEmptyColumn ? 1 : 0);
        if (previousColumnCount < currentColumnCount) {
            // auto-scroll to the far right if an additional column was added
            this.colViewContainerRef.current.scrollLeft = this.colViewContainerRef.current.scrollWidth;
        }
    }

    render(): React.ReactNode {
        const { columnData, appendEmptyColumn, renderItemContent } = this.props;
        return (
            <div className="jsonschema-inspector-colview" ref={this.colViewContainerRef} tabIndex={-1}>
                {columnData.map((singleColumnData, index) => {
                    const { selectedItem, trailingSelection, filteredItems, onSelect } = singleColumnData;
                    if ((singleColumnData as RenderItemsColumn).items) {
                        return (
                            <InspectorColumn
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
                {appendEmptyColumn && <div className="jsonschema-inspector-column-placeholder" />}
            </div>
        );
    }

    static propTypes = {
        columnData: ColumnDataPropType.isRequired,
        appendEmptyColumn: PropTypes.bool,
        renderItemContent: PropTypes.func // func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema })
    };

    static defaultProps: ColViewDefaultProps = {
        appendEmptyColumn: false,
        renderItemContent: null
    };
}
