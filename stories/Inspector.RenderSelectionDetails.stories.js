import React from "react";
import { action } from "@storybook/addon-actions";
import "./style-overrides.css";

import { Inspector, getFieldValueArrayFromSchemaGroup } from "../src/index";

import shopSelectionSchema from "./schema-shop-selection.json";

export default {
    title: "Inspector (renderSelectionDetails)",
    component: Inspector
};

export const selectionDetails = () => (
    <Inspector
        schemas={{
            Shop: shopSelectionSchema
        }}
        defaultSelectedItems={["Shop", "inventory"]}
        renderSelectionDetails={(parameters) => {
            const { itemSchemaGroup, columnData, selectionColumnIndex, optionIndexes } = parameters;
            return (
                <div style={{ padding: "1em", backgroundColor: "#80cbc4", height: "100%" }}>
                    <h3>Custom Details</h3>
                    <p>{getFieldValueArrayFromSchemaGroup(itemSchemaGroup, "description", null, optionIndexes)}</p>
                    <h4>Selection</h4>
                    <p>
                        {selectionColumnIndex === 0 && `The root ${columnData[0].selectedItem}`}
                        {selectionColumnIndex > 0 &&
                            `${columnData[selectionColumnIndex].selectedItem} of ${columnData[selectionColumnIndex - 1].selectedItem}`}
                    </p>
                </div>
            );
        }}
        onSelect={action("onSelect")}
    />
);
selectionDetails.story = { name: "with custom details display" };
