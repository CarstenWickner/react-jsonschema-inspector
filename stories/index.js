import React from "react";
import { storiesOf } from "@storybook/react";
import { withInfo } from "@storybook/addon-info";

import Inspector from "../src/Inspector";

import metaSchema from "./schema-meta.json";
import personSchema from "./schema-person.json";
import shopSelectionSchema from "./schema-shop-selection.json";

storiesOf("Inspector", module)
    .addDecorator(withInfo({
        inline: true,
        header: false,
        maxPropsIntoLine: 1,
        maxPropArrayLength: 5,
        propTablesExclude: [Inspector]
    }))
    .add("show-case", () => (
        <Inspector
            schemas={{
                "Meta Core JSON Schema": metaSchema,
                Shop: shopSelectionSchema
            }}
            defaultSelectedItems={["Meta Core JSON Schema", "allOf", "$schema"]}
            renderEmptyDetails={({ rootColumnSchemas }) => (
                <div style={{ padding: "1em" }}>
                    <h3>JSON Schema Inspector</h3>
                    <p>
                        {`Just click on "${Object.keys(rootColumnSchemas)[0]}"
                          on the left side in order to traverse its nested properties
                          – but beware of its circular references.`}
                    </p>
                    <img
                        src="https://raw.githubusercontent.com/CarstenWickner/react-jsonschema-inspector/master/logo.svg"
                        alt="JSON Schema Inspector Logo"
                        style={{ width: "80%", margin: "0 10%" }}
                    />
                </div>
            )}
        />
    ))
    .add("with custom Details and no breadcrumbs", () => (
        <Inspector
            schemas={{
                Person: personSchema,
                Shop: shopSelectionSchema
            }}
            defaultSelectedItems={["Shop", "vegetables"]}
            breadcrumbs={null}
            renderSelectionDetails={({ itemSchema, columnData, selectionColumnIndex }) => (
                <div style={{ padding: "1em", backgroundColor: "#80cbc4" }}>
                    <h3>Custom Details</h3>
                    <p>
                        {itemSchema.description}
                    </p>
                    <h4>Selection Path</h4>
                    <code>
                        {`//${columnData
                            .filter((_column, index) => index <= selectionColumnIndex)
                            .map(column => column.selectedItem)
                            .join("/")}`}
                    </code>
                </div>
            )}
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
                    color: (focused ? "white" : "black")
                };
                return (
                    <div className="jsonschema-inspector-item-content" style={styles}>
                        <span className="jsonschema-inspector-item-name">{(hasNestedItems ? "\u25A0 " : "\u25A1 ") + name}</span>
                    </div>
                );
            }}
        />
    ));
