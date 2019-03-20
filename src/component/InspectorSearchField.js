import PropTypes from "prop-types";
import React from "react";

const InspectorSearchField = (props) => {
    const { searchFilter, onSearchFilterChange, placeholder } = props;
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

InspectorSearchField.propTypes = {
    searchFilter: PropTypes.string.isRequired,
    onSearchFilterChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string
};

InspectorSearchField.defaultProps = {
    placeholder: "Search"
};

export default InspectorSearchField;
