import React from "react";
import "./style-overrides.css";

import { Inspector } from "../src/index";

import personSchema from "./schema-person.json";
import shopSelectionSchema from "./schema-shop-selection.json";

export default {
    title: "Inspector (parserConfig)",
    component: Inspector
};

export const defaultParserConfig = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Shop", "inventory", "[0]"]}
        // the default props (i.e. same as if you leave them out)
        parserConfig={{
            anyOf: {
                groupTitle: "any of",
                optionNameForIndex: (optionIndexes) => `Option ${optionIndexes.map((index) => index + 1).join("-")}`
            },
            oneOf: {
                groupTitle: "one of",
                optionNameForIndex: (optionIndexes) => `Option ${optionIndexes.map((index) => index + 1).join("-")}`
            }
        }}
    />
);
defaultParserConfig.story = { name: "default" };

export const groupTitles = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Shop", "inventory", "[0]"]}
        // customise/translate title above optional parts of a schema
        parserConfig={{
            anyOf: {
                groupTitle: "at least one of:"
            },
            oneOf: {
                groupTitle: "exactly one of:"
            }
        }}
    />
);
groupTitles.story = { name: "with custom group titles" };

export const optionNames = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Shop", "inventory", "[0]"]}
        // ideally, these functions should be declared separately to avoid unnecessary re-rendering
        parserConfig={{
            anyOf: {
                optionNameForIndex: (optionIndexes) => `– ${optionIndexes.map((index) => String.fromCharCode(65 + index)).join(".")}`
            },
            oneOf: {
                optionNameForIndex: (optionIndexes) => `- ${optionIndexes.map((index) => String.fromCharCode(65 + index)).join(".")}`
            }
        }}
    />
);
optionNames.story = { name: "with custom option names" };
