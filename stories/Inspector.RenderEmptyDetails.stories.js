import React from "react";
import "./style-overrides.css";

import { Inspector } from "../src/index";

import metaSchema from "./schema-meta.json";
import hyperMetaSchema from "./schema-hyper-meta.json";
import linksMetaSchema from "./schema-links-meta.json";

export default {
    title: "Inspector (renderEmptyDetails)",
    component: Inspector
};

export const withEmptyDetailsDisplay = () => (
    <Inspector
        schemas={{
            "Meta Core JSON Schema": { $ref: "http://json-schema.org/draft-07/schema#" },
            "Meta Hyper JSON Schema": { $ref: "http://json-schema.org/draft-07/hyper-schema#" },
            "Meta Links JSON Schema": { $ref: "http://json-schema.org/draft-07/links#" }
        }}
        referenceSchemas={[metaSchema, hyperMetaSchema, linksMetaSchema]}
        renderEmptyDetails={({ rootColumnSchemas }) => (
            <div style={{ padding: "0.5em 1em 0", backgroundColor: "#80cbc4", height: "100%" }}>
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
    />
);
withEmptyDetailsDisplay.story = { name: "with display for empty selection" };
