import PropTypes from "prop-types";
import React, { Component } from "react";

class InspectorSearchField extends Component<{
    searchFilter: string,
    onSearchFilterChange: (newFilterValue: string) => void,
    placeholder: string
}> {
    render() {
        const {
            searchFilter, onSearchFilterChange, placeholder
        } = this.props;
        return (
            <div className="jsonschema-inspector-search">
                <input
                    type="search"
                    className="jsonschema-inspector-search-input"
                    value={searchFilter}
                    placeholder={placeholder}
                    onChange={(event) => {
                        event.stopPropagation();
                        onSearchFilterChange(event.target.value);
                    }}
                />
            </div>
        );
    };

    static propTypes = {
        searchFilter: PropTypes.string.isRequired,
        onSearchFilterChange: PropTypes.func.isRequired,
        placeholder: PropTypes.string
    };

    static defaultProps = {
        placeholder: "Search"
    };
}

export default InspectorSearchField;
