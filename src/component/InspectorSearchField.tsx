import * as PropTypes from "prop-types";
import * as React from "react";

export class InspectorSearchField extends React.Component<{
    searchFilter: string;
    onSearchFilterChange: (newFilterValue: string) => void;
    placeholder: string;
}> {
    render(): React.ReactNode {
        const { searchFilter, onSearchFilterChange, placeholder } = this.props;
        return (
            <div className="jsonschema-inspector-search">
                <input
                    type="search"
                    className="jsonschema-inspector-search-input"
                    value={searchFilter}
                    placeholder={placeholder}
                    onChange={(event): void => {
                        event.stopPropagation();
                        onSearchFilterChange(event.target.value);
                    }}
                />
            </div>
        );
    }

    static propTypes = {
        searchFilter: PropTypes.string.isRequired,
        onSearchFilterChange: PropTypes.func.isRequired,
        placeholder: PropTypes.string
    };

    static defaultProps = {
        placeholder: "Search"
    };
}
