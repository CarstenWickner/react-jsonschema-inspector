import React from "react";
import { action } from "@storybook/addon-actions";
import "./style-overrides.css";

import { Inspector, getMaximumFieldValueFromSchemaGroup } from "../src/index";

import metaSchema from "./schema-meta.json";
import hyperMetaSchema from "./schema-hyper-meta.json";
import linksMetaSchema from "./schema-links-meta.json";

export default {
    title: "Inspector",
    component: Inspector
};

export const showCase = () => (
    <Inspector
        schemas={{
            "Meta Core JSON Schema": { $ref: "http://json-schema.org/draft-07/schema#" },
            "Meta Hyper JSON Schema": { $ref: "http://json-schema.org/draft-07/hyper-schema#" },
            "Meta Links JSON Schema": { $ref: "http://json-schema.org/draft-07/links#" }
        }}
        referenceSchemas={[metaSchema, hyperMetaSchema, linksMetaSchema]}
        searchOptions={{
            fields: ["title", "description"],
            byPropertyName: true
        }}
        buildArrayProperties={(arrayItemSchema, arraySchemaGroup, optionIndexes) => ({
            "[0]": arrayItemSchema,
            length: {
                title: "Number of Items",
                type: "number",
                minimum: getMaximumFieldValueFromSchemaGroup(arraySchemaGroup, "minItems", 0, optionIndexes)
            }
        })}
        renderEmptyDetails={({ rootColumnSchemas }) => (
            <div style={{ padding: "0.5em 1em 0" }}>
                <h3>JSON Schema Inspector</h3>
                <p>
                    {`Just click on one of the ${Object.keys(rootColumnSchemas).length} schema titles
                        on the left side in order to traverse their nested properties
                        – but don't get lost in the circular references.`}
                </p>
                <img
                    src="https://raw.githubusercontent.com/CarstenWickner/react-jsonschema-inspector/master/logo.svg?sanitize=true"
                    alt="JSON Schema Inspector Logo"
                    style={{ width: "70%", margin: "0 15%" }}
                />
            </div>
        )}
        onSelect={action("onSelect")}
    />
);
showCase.story = { name: "show-case" };
