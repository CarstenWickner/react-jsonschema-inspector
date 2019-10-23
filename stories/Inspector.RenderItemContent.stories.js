import React from "react";
import { action } from "@storybook/addon-actions";
import "./style-overrides.css";

import { Inspector, getCommonFieldValuesFromSchemaGroup } from "../src/index";

import personSchema from "./schema-person.json";
import shopSelectionSchema from "./schema-shop-selection.json";

export default {
    title: "Inspector (renderItemContent)",
    component: Inspector
};

export const customItems = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Person", "friends"]}
        renderItemContent={(parameters) => {
            const { name, hasNestedItems, selected, schemaGroup, optionIndexes } = parameters;
            // getCommonFieldValuesFromSchemaGroup() is one of the helper functions provided alongside the <Inspector>
            const type = getCommonFieldValuesFromSchemaGroup(schemaGroup, "type", undefined, optionIndexes);
            const isArray = type === "array" || (Array.isArray(type) && type.includes("array"));
            const styles = {
                backgroundColor: selected ? "#a5d6a7" : "#e8f5e9",
                color: "black"
            };
            return (
                <div className="jsonschema-inspector-item-content" style={styles}>
                    <span className="jsonschema-inspector-item-name">{(hasNestedItems ? "\u25A0 " : "\u25A1 ") + name + (isArray ? "[]" : "")}</span>
                </div>
            );
        }}
        onSelect={action("onSelect")}
    />
);
customItems.story = { name: "with custom items" };
