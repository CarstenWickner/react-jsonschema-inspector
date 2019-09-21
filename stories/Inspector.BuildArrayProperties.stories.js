import React from "react";
import "./style-overrides.css";

import { Inspector, getMaximumFieldValueFromSchemaGroup } from "../src/index";

import personSchema from "./schema-person.json";
import shopSelectionSchema from "./schema-shop-selection.json";

export default {
    title: "Inspector (buildArrayProperties)",
    component: Inspector
};

export const defaultArrayProperties = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Person", "friends"]}
        // the default props (i.e. same as if you leave them out)
        buildArrayProperties={arrayItemSchema => ({ "[0]": arrayItemSchema })}
    />
);
defaultArrayProperties.story = { name: "default" };

export const additionalArrayProperties = () => (
    <Inspector
        schemas={{
            Person: personSchema,
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Person", "friends"]}
        // the default props (i.e. same as if you leave them out)
        buildArrayProperties={(arrayItemSchema, arraySchemaGroup, optionIndexes) => ({
            "get(0)": arrayItemSchema,
            "size()": {
                title: "Number of Items",
                type: "number",
                // getMaximumFieldValueFromSchemaGroup() is one of the helper functions exported alongside the <Inspector>
                minimum: getMaximumFieldValueFromSchemaGroup(arraySchemaGroup, "minItems", 0, optionIndexes)
            }
        })}
    />
);
additionalArrayProperties.story = { name: "with additional properties" };
