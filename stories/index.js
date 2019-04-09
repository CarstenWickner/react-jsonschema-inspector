import React from "react";
import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { withInfo } from "@storybook/addon-info";
import {
    array as knobsArray, boolean as knobsBoolean, object as knobsObject, text as knobsText, withKnobs
} from "@storybook/addon-knobs";

import Inspector from "../src/component/Inspector";
import { getFieldValueFromSchemaGroup } from "../src/model/schemaUtils";

import metaSchema from "./schema-meta.json";
import hyperMetaSchema from "./schema-hyper-meta.json";
import linksMetaSchema from "./schema-links-meta.json";
import personSchema from "./schema-person.json";
import shopSelectionSchema from "./schema-shop-selection.json";

storiesOf("Inspector", module)
    .addDecorator(withInfo({
        inline: true,
        header: false,
        maxPropsIntoLine: 1,
        maxPropArrayLength: 5
    }))
    .addDecorator(withKnobs)
    .add("show-case", () => (
        <Inspector
            schemas={{
                "Meta Core JSON Schema": { $ref: "http://json-schema.org/draft-07/schema#" },
                "Meta Hyper JSON Schema": { $ref: "http://json-schema.org/draft-07/hyper-schema#" },
                "Meta Links JSON Schema": { $ref: "http://json-schema.org/draft-07/links#" }
            }}
            referenceSchemas={[metaSchema, hyperMetaSchema, linksMetaSchema]}
            searchOptions={{
                fields: ["title", "description"]
            }}
            buildArrayProperties={(arrayItemSchema, arraySchemaGroup, optionIndexes) => ({
                "[0]": arrayItemSchema,
                length: {
                    title: "Number of Items",
                    type: "number",
                    minValue: getFieldValueFromSchemaGroup(arraySchemaGroup, "minItems",
                        (a, b) => {
                            if (b === undefined) {
                                return a;
                            }
                            if (a === undefined) {
                                return b;
                            }
                            return Math.min(a, b);
                        }, 0, null, optionIndexes)
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
    ))
    .add("with custom breadcrumbs", () => (
        <Inspector
            schemas={{
                "Meta Core JSON Schema": { $ref: "http://json-schema.org/draft-07/schema#" },
                "Meta Hyper JSON Schema": { $ref: "http://json-schema.org/draft-07/hyper-schema#" },
                "Meta Links JSON Schema": { $ref: "http://json-schema.org/draft-07/links#" }
            }}
            referenceSchemas={[metaSchema, hyperMetaSchema, linksMetaSchema]}
            defaultSelectedItems={["Meta Hyper JSON Schema", "allOf"]}
            breadcrumbs={{
                prefix: knobsText("Prefix", "Selection: "),
                separator: knobsText("Separator", "/"),
                preventNavigation: knobsBoolean("Prevent Navigation (via double-click)", false)
            }}
            onSelect={action("onSelect")}
        />
    ))
    .add("with custom Details and no breadcrumbs", () => (
        <Inspector
            schemas={knobsObject("Schemas", {
                Shop: shopSelectionSchema
            })}
            defaultSelectedItems={["Shop", "vegetables"]}
            breadcrumbs={null}
            renderSelectionDetails={({ itemSchemaGroup, columnData, selectionColumnIndex }) => (
                <div style={{ padding: "1em", backgroundColor: "#80cbc4" }}>
                    <h3>Custom Details</h3>
                    <p>
                        {getFieldValueFromSchemaGroup(itemSchemaGroup, "description")}
                    </p>
                    <h4>Selection Path</h4>
                    <code style={{ wordBreak: "break-word" }}>
                        {`//${columnData
                            .filter((_column, index) => index <= selectionColumnIndex)
                            .map(column => column.selectedItem)
                            .join("/")}`}
                    </code>
                </div>
            )}
            onSelect={action("onSelect")}
        />
    ))
    .add("with custom Items", () => (
        <Inspector
            schemas={{
                Person: personSchema,
                Shop: shopSelectionSchema
            }}
            defaultSelectedItems={["Person", "friends", "friends"]}
            renderItemContent={({
                name, hasNestedItems, selected, focused
            }) => {
                const styles = {
                    backgroundColor: (focused && "#005b4f") || (selected && "#a5d6a7") || "#e8f5e9",
                    color: (focused && "white") || "black"
                };
                return (
                    <div className="jsonschema-inspector-item-content" style={styles}>
                        <span className="jsonschema-inspector-item-name">{(hasNestedItems ? "\u25A0 " : "\u25A1 ") + name}</span>
                    </div>
                );
            }}
            onSelect={action("onSelect")}
        />
    ))
    .add("with search", () => (
        <Inspector
            schemas={{
                Person: personSchema,
                Shop: shopSelectionSchema
            }}
            defaultSelectedItems={["Person", "friends", "friends"]}
            searchOptions={{
                fields: knobsArray("Search Fields", ["title", "description"]),
                inputPlaceholder: knobsText("Input Placeholder", "Find in Title or Description…")
            }}
            onSelect={action("onSelect")}
        />
    ));
