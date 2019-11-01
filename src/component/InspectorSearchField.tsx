import * as React from "react";

export const InspectorSearchField: React.FunctionComponent<{
    searchFilter: string;
    onSearchFilterChange: (newFilterValue: string) => void;
    placeholder?: string;
}> = ({ searchFilter, onSearchFilterChange, placeholder = "Search" }): React.ReactElement => (
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
