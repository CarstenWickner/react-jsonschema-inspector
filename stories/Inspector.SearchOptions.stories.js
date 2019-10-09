import React from "react";
import "./style-overrides.css";

import { Inspector } from "../src/index";

import personSchema from "./schema-person.json";
import shopSelectionSchema from "./schema-shop-selection.json";

export default {
    title: "Inspector (searchOptions)",
    component: Inspector
};

export const defaultSearch = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Shop", "inventory", "[0]"]}
        // these are the default props (i.e. same as if you leave them out)
        searchOptions={{
            // consider the item names (as they are being shown)
            byPropertyName: true,
            // consider the "title" and "description" fields in the respective JSON Schema definitions
            fields: ["title", "description"]
        }}
    />
);
defaultSearch.story = { name: "default" };

export const onlyByPropertyName = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Shop", "inventory", "[0]"]}
        searchOptions={{
            byPropertyName: true
        }}
    />
);
onlyByPropertyName.story = { name: "in property names" };

export const bySchemaField = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Shop", "inventory", "[0]"]}
        searchOptions={{
            fields: ["description", "type"]
        }}
    />
);
bySchemaField.story = { name: "in schema fields" };

export const perCustomLogic = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Shop", "inventory", "[0]"]}
        searchOptions={{
            // filtering by defined JSON schema fields – should ideally declare returned inner function separately
            filterBy: (enteredSearchValue) => (rawSchema) => rawSchema[enteredSearchValue] !== undefined
        }}
    />
);
perCustomLogic.story = { name: "per custom logic" };

export const withCustomPlaceholder = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Shop", "inventory", "[0]"]}
        searchOptions={{
            fields: [],
            inputPlaceholder: "Enter something to search…",
            byPropertyName: true
        }}
    />
);
withCustomPlaceholder.story = { name: "with custom placeholder" };

export const withCustomDebounceDelay = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Shop", "inventory", "[0]"]}
        searchOptions={{
            byPropertyName: true,
            // default: 200ms debounce while search term is being entered
            debounceWait: 100,
            // default: 500ms maximum debounce wait time until search is being triggered if term is still being entered
            debounceMaxWait: 100
        }}
    />
);
withCustomDebounceDelay.story = { name: "with custom debounce" };

export const disabled = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Shop", "inventory", "[0]"]}
        // set to null to disable search completely
        searchOptions={null}
    />
);
disabled.story = { name: "disabled" };
