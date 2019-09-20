import React from "react";
import "./style-overrides.css";

import { Inspector } from "../src/index";

import metaSchema from "./schema-meta.json";
import hyperMetaSchema from "./schema-hyper-meta.json";
import linksMetaSchema from "./schema-links-meta.json";

export default {
    title: "Inspector/Breadcrumbs",
    component: Inspector
};

export const defaultBreadcrumbs = () => (
    <Inspector
        schemas={{
            "Meta Core JSON Schema": { $ref: "http://json-schema.org/draft-07/schema#" },
            "Meta Hyper JSON Schema": { $ref: "http://json-schema.org/draft-07/hyper-schema#" },
            "Meta Links JSON Schema": { $ref: "http://json-schema.org/draft-07/links#" }
        }}
        referenceSchemas={[metaSchema, hyperMetaSchema, linksMetaSchema]}
        defaultSelectedItems={["Meta Hyper JSON Schema", "contains"]}
    />
);
defaultBreadcrumbs.story = { name: "default" };

export const breadcrumbsPrefix = () => (
    <Inspector
        schemas={{
            "Meta Core JSON Schema": { $ref: "http://json-schema.org/draft-07/schema#" },
            "Meta Hyper JSON Schema": { $ref: "http://json-schema.org/draft-07/hyper-schema#" },
            "Meta Links JSON Schema": { $ref: "http://json-schema.org/draft-07/links#" }
        }}
        referenceSchemas={[metaSchema, hyperMetaSchema, linksMetaSchema]}
        defaultSelectedItems={["Meta Hyper JSON Schema", "contains"]}
        breadcrumbs={{
            // prefix is only shown in front of the root selection
            prefix: "Selection: "
        }}
    />
);
breadcrumbsPrefix.story = { name: "with prefix" };

export const breadcrumbsCustomSeparator = () => (
    <Inspector
        schemas={{
            "Meta Core JSON Schema": { $ref: "http://json-schema.org/draft-07/schema#" },
            "Meta Hyper JSON Schema": { $ref: "http://json-schema.org/draft-07/hyper-schema#" },
            "Meta Links JSON Schema": { $ref: "http://json-schema.org/draft-07/links#" }
        }}
        referenceSchemas={[metaSchema, hyperMetaSchema, linksMetaSchema]}
        defaultSelectedItems={["Meta Hyper JSON Schema", "contains"]}
        breadcrumbs={{
            separator: "/"
        }}
    />
);
breadcrumbsCustomSeparator.story = { name: "with custom separator" };

export const breadcrumbsSkippedSeparator = () => (
    <Inspector
        schemas={{
            "Meta Core JSON Schema": { $ref: "http://json-schema.org/draft-07/schema#" },
            "Meta Hyper JSON Schema": { $ref: "http://json-schema.org/draft-07/hyper-schema#" },
            "Meta Links JSON Schema": { $ref: "http://json-schema.org/draft-07/links#" }
        }}
        referenceSchemas={[metaSchema, hyperMetaSchema, linksMetaSchema]}
        defaultSelectedItems={["Meta Hyper JSON Schema", "contains"]}
        breadcrumbs={{
            // this is actually the default skipSeparator function
            skipSeparator: fieldName => (fieldName === "[0]")
        }}
    />
);
breadcrumbsSkippedSeparator.story = { name: "with optional separator" };

export const breadcrumbsMultipleSeparators = () => (
    <Inspector
        schemas={{
            "Meta Core JSON Schema": { $ref: "http://json-schema.org/draft-07/schema#" },
            "Meta Hyper JSON Schema": { $ref: "http://json-schema.org/draft-07/hyper-schema#" },
            "Meta Links JSON Schema": { $ref: "http://json-schema.org/draft-07/links#" }
        }}
        referenceSchemas={[metaSchema, hyperMetaSchema, linksMetaSchema]}
        defaultSelectedItems={["Meta Hyper JSON Schema", "contains", "allOf", "[0]"]}
        breadcrumbs={{
            skipSeparator: (fieldName, _column, index) => (fieldName === "[0]" || index % 2 === 0),
            mutateName: (fieldName, _column, index) => fieldName && `${index === 0 || index % 2 ? "" : "/"}${fieldName}`
        }}
    />
);
breadcrumbsMultipleSeparators.story = { name: "with multiple different separators" };

export const breadcrumbsNotShowingRootSelection = () => (
    <Inspector
        schemas={{
            "Meta Core JSON Schema": { $ref: "http://json-schema.org/draft-07/schema#" },
            "Meta Hyper JSON Schema": { $ref: "http://json-schema.org/draft-07/hyper-schema#" },
            "Meta Links JSON Schema": { $ref: "http://json-schema.org/draft-07/links#" }
        }}
        referenceSchemas={[metaSchema, hyperMetaSchema, linksMetaSchema]}
        defaultSelectedItems={["Meta Hyper JSON Schema", "contains", "allOf", "[0]"]}
        breadcrumbs={{
            // avoid leading separator (in addition to default ignoring of "[0]")
            skipSeparator: (fieldName, _column, index) => (fieldName === "[0]" || index === 1),
            // returning a falsy value skips the breadcrumbs item (here: for the root selection)
            mutateName: (fieldName, _column, index) => index > 0 && fieldName
        }}
    />
);
breadcrumbsNotShowingRootSelection.story = { name: "not showing root selection" };

export const breadcrumbsNoNavigation = () => (
    <Inspector
        schemas={{
            "Meta Core JSON Schema": { $ref: "http://json-schema.org/draft-07/schema#" },
            "Meta Hyper JSON Schema": { $ref: "http://json-schema.org/draft-07/hyper-schema#" },
            "Meta Links JSON Schema": { $ref: "http://json-schema.org/draft-07/links#" }
        }}
        referenceSchemas={[metaSchema, hyperMetaSchema, linksMetaSchema]}
        defaultSelectedItems={["Meta Hyper JSON Schema", "contains"]}
        breadcrumbs={{
            // if this is NOT set to true, double-clicking on an item in the breadcrumbs changes the current selection
            preventNavigation: true
        }}
    />
);
breadcrumbsNoNavigation.story = { name: "without navigation on double-click" };

export const disabledBreadcrumbs = () => (
    <Inspector
        schemas={{
            "Meta Core JSON Schema": { $ref: "http://json-schema.org/draft-07/schema#" },
            "Meta Hyper JSON Schema": { $ref: "http://json-schema.org/draft-07/hyper-schema#" },
            "Meta Links JSON Schema": { $ref: "http://json-schema.org/draft-07/links#" }
        }}
        referenceSchemas={[metaSchema, hyperMetaSchema, linksMetaSchema]}
        defaultSelectedItems={["Meta Hyper JSON Schema", "contains"]}
        // set to null to disable breadcrumbs completely
        breadcrumbs={null}
    />
);
disabledBreadcrumbs.story = { name: "disabled" };