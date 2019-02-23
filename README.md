# React JSON Schema Inspector

Introducing a component for viewing/traversing (complex) JSON Schemas for the sake of documentation and potentially assisting users of a DSL in finding particular information in a custom data model.

## Demo

Check out the Storybook under: [https://carstenwickner.github.io/react-jsonschema-inspector](https://carstenwickner.github.io/react-jsonschema-inspector)

## Compatibility

This component is compatible with JSON Schema Draft 7.
It is also backwards-compatible with Drafts 4 and 6.

### Structural Properties

| Property | Support |
| --- | --- |
| `$schema` | [ ] *ignored* (assumed to be compatible to JSON Schema Draft 4, 6 or 7) |
| `$id` | [x] allowed as sub-schema reference in `$ref` (as per Draft 6 and 7), but not displayed |
| `id` | [x] allowed as sub-schema reference in `$ref` (as per Draft 4), but not displayed |
| `$ref` | [x] used to look-up re-usable sub-schemas transparently (supporting `#` as root schema reference as well as `#/definitions/<name-of-definition>` or the respective `$id`/`id` value from within the `definition`), but not displayed |
| `definitions`| [x] used to provide re-usable sub-schemas that are being referenced via `$ref`, but not displayed |
| `properties`| [x] used to populate the whole structure to be traversed |
| `additionalProperties` | *ignored* |
| `patternProperties` | *ignored* |
| `items`| [x] used to look-up `properties` of single kind of items in an array; however if `items` is an array of multiple sub-schemas they are being *ignored* |
| `additionalItems`| [x] used to look-up `properties` of kind of items in an array if `ìtems` is not present or defined as an array (which is +not+ supported itself), otherwise `additionalItems` are being ignored |
| `allOf` | [x] but used to combine sub-schemas transparently, i.e. not displayed |
| `anyOf` | [ ] *ignored* |
| `oneOf` | [ ] *ignored* |
| `not` | [ ] *ignored* |
| `contains` | [ ] *ignored* |
| `dependencies` | [ ] *ignored* |
| `if` | [ ] *ignored* |
| `then` | [ ] *ignored* |
| `else` | [ ] *ignored* |

### Non-Structural Properties

| Property | Support |
| --- | --- |
| `title` | [x] displayed in default "Details" form |
| `description` | [x] displayed in default "Details" form |
| `examples` | [x] displayed in default "Details" form (without further formatting) |
| `default` | [x] displayed in default "Details" form (without further formatting) |
| `type` | [x] displayed in default "Details" form |
| `enum` | [x] displayed in default "Details" form (without further formatting) |
| `const` | [x] displayed in default "Details" form (without further formatting) |
| `minLength` | [x] displayed in default "Details" form |
| `maxLength` | [x] displayed in default "Details" form |
| `pattern` | [x] displayed in default "Details" form |
| `format` | [x] displayed in default "Details" form (without further explanations) |
| `multipleOf` | [x] displayed in default "Details" form |
| `minimum` | [x] displayed in default "Details" form |
| `exclusiveMinimum` | [x] displayed in default "Details" form (both as `number` per Draft 6 and 7 and `boolean` per Draft 4) |
| `maximum` | [x] displayed in default "Details" form |
| `exclusiveMaximum` | [x] displayed in default "Details" form (both as `number` per Draft 6 and 7 and `boolean` per Draft 4) |
| `required` | [x] displayed in default "Details" form (i.e. +not+ on the individual items per default) |
| `minItems` | [x] displayed in default "Details" form |
| `maxItems` | [x] displayed in default "Details" form |
| `uniqueItems` | [x] displayed in default "Details" form |
| `propertyNames` | [ ] *ignored* |
| `minProperties` | [ ] *ignored* |
| `maxProperties` | [ ] *ignored* |


## Usage

### Installation from NPM

```shell
npm i react-jsonschema-inspector
```

### React Component Props

| Prop | Description |
| --- | --- |
/** allow multiple independent root schemas to inspect */
| `schemas` (required) | Object: keys will be displayed in the root column, the values are expected to be independent JSON Schema definitions (compatible to Draft 4, 6 or 7) |
| `defaultSelectedItems` | Array of strings: each referring to the name of the selected item in the respective column (i.e. the first entry in this array should match one key in the `schemas` object) |
| `onSelect` | Function: call-back being invoked after the selection changed. Receives three parameters: (1) the change event, (2) the selection - as per the `defaultSelectedItems`, (3) an object with two properties: "columnData" and "refTargets" |
/** func({ string: name, boolean: hasNestedItems, boolean: selected, JsonSchema: schema, refTargets }) */
| `renderItemContent` | Function: custom render function for name of single property/sub-schema in a column. Receives one parameter: object with the following properties: "name", "hasNestedItems", "selected", "schema", "refTargets" |
| `renderSelectionDetails` | Function: custom render function for the "Details" block on the right for the single property/sub-schema being selected. Receives one parameter: object with the following properties: "itemSchema", "columnData", "refTargets", "selectionColumnIndex" |
/** func({ rootColumnSchemas }) */
| `renderEmptyDetails` | Function: custom render function for the "Details" block on the right if nothing is selected yet. Receives one parameter: object with the following property: "rootColumnSchemas" (i.e. what was provided as `schemas` prop)

## TODOs (work in progress)

- support `anyOf`
- support `oneOf`
- support `if`/`then`/`else`
- Separate view component from JSON Schema related logic
- Introduce unit tests
- Introduce search functionality in header (after determining how search results could be displayed)
- Add breadcrumbs-like summary in footer
- Improve performance (e.g. by using lodash chaining)
