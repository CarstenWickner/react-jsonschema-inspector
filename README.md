# React JSON Schema Inspector

Introducing a component for viewing/traversing (complex) JSON Schemas for the sake of documentation and potentially assisting users of a DSL in finding particular information in a custom data model.

## Demo

Check out the Storybook under: [https://carstenwickner.github.io/react-jsonschema-inspector](https://carstenwickner.github.io/react-jsonschema-inspector)

## Compatibility

This component is compatible with JSON Schema Draft 7.
It is also backwards-compatible with Drafts 4 and 6.

### Structural Properties

| Property | Support | Description |
| --- | --- |--- |
| `$schema` | :white_medium_square: | *ignored* (assumed to be compatible to JSON Schema Draft 4, 6 or 7) |
| `$id` | :ballot_box_with_check: | allowed as sub-schema reference in `$ref` (as per Draft 6 and 7), but not displayed |
| `id` | :ballot_box_with_check: | allowed as sub-schema reference in `$ref` (as per Draft 4), but not displayed |
| `$ref` | :ballot_box_with_check: | used to look-up re-usable sub-schemas transparently (supporting `#` as root schema reference as well as `#/definitions/<name-of-definition>` or the respective `$id`/`id` value from within the `definition`), but not displayed |
| `definitions`| :ballot_box_with_check: | used to provide re-usable sub-schemas that are being referenced via `$ref`, but not displayed |
| `properties`| :ballot_box_with_check: | used to populate the whole structure to be traversed |
| `additionalProperties` | :white_medium_square: | *ignored* |
| `patternProperties` | :white_medium_square: | *ignored* |
| `items`| :ballot_box_with_check: | used to look-up `properties` of single kind of items in an array; however if `items` is an array of multiple sub-schemas they are being *ignored* |
| `additionalItems`| :ballot_box_with_check: | used to look-up `properties` of kind of items in an array if `ìtems` is not present or defined as an array (which is +not+ supported itself), otherwise `additionalItems` are being ignored |
| `allOf` | :ballot_box_with_check: | but used to combine sub-schemas transparently, i.e. not displayed |
| `anyOf` | :white_medium_square: | *ignored* |
| `oneOf` | :white_medium_square: | *ignored* |
| `not` | :white_medium_square: | *ignored* |
| `contains` | :white_medium_square: | *ignored* |
| `dependencies` | :white_medium_square: | *ignored* |
| `if` | :white_medium_square: | *ignored* |
| `then` | :white_medium_square: | *ignored* |
| `else` | :white_medium_square: | *ignored* |

### Non-Structural Properties

| Property | Support | Description |
| --- | --- |--- |
| `title` | :ballot_box_with_check: | displayed in default "Details" form |
| `description` | :ballot_box_with_check: | displayed in default "Details" form |
| `examples` | :ballot_box_with_check: | displayed in default "Details" form (without further formatting) |
| `default` | :ballot_box_with_check: | displayed in default "Details" form (without further formatting) |
| `type` | :ballot_box_with_check: | displayed in default "Details" form |
| `enum` | :ballot_box_with_check: | displayed in default "Details" form (without further formatting) |
| `const` | :ballot_box_with_check: | displayed in default "Details" form (without further formatting) |
| `minLength` | :ballot_box_with_check: | displayed in default "Details" form |
| `maxLength` | :ballot_box_with_check: | displayed in default "Details" form |
| `pattern` | :ballot_box_with_check: | displayed in default "Details" form |
| `format` | :ballot_box_with_check: | displayed in default "Details" form (without further explanations) |
| `multipleOf` | :ballot_box_with_check: | displayed in default "Details" form |
| `minimum` | :ballot_box_with_check: | displayed in default "Details" form |
| `exclusiveMinimum` | :ballot_box_with_check: | displayed in default "Details" form (both as `number` per Draft 6 and 7 and `boolean` per Draft 4) |
| `maximum` | :ballot_box_with_check: | displayed in default "Details" form |
| `exclusiveMaximum` | :ballot_box_with_check: | displayed in default "Details" form (both as `number` per Draft 6 and 7 and `boolean` per Draft 4) |
| `required` | :ballot_box_with_check: | displayed in default "Details" form (i.e. +not+ on the individual items per default) |
| `minItems` | :ballot_box_with_check: | displayed in default "Details" form |
| `maxItems` | :ballot_box_with_check: | displayed in default "Details" form |
| `uniqueItems` | :ballot_box_with_check: | displayed in default "Details" form |
| `propertyNames` | :white_medium_square: | *ignored* |
| `minProperties` | :white_medium_square: | *ignored* |
| `maxProperties` | :white_medium_square: | *ignored* |


## Usage

### Installation from NPM

```shell
npm i react-jsonschema-inspector
```

### React Component Props

| Prop | Description |
| --- | --- |
| `schemas` (required) | Object: keys will be displayed in the root column, the values are expected to be independent JSON Schema definitions (compatible to Draft 4, 6 or 7) |
| `defaultSelectedItems` | Array of strings: each referring to the name of the selected item in the respective column (i.e. the first entry in this array should match one key in the `schemas` object) |
| `onSelect` | Function: call-back being invoked after the selection changed. Receives three parameters: (1) the change event, (2) the selection - as per the `defaultSelectedItems`, (3) an object with two properties: "columnData" and "refTargets" |
| `renderItemContent` | Function: custom render function for name of single property/sub-schema in a column. Receives one parameter: object with the following properties: "name", "hasNestedItems", "selected", "schema", "refTargets" |
| `renderSelectionDetails` | Function: custom render function for the "Details" block on the right for the single property/sub-schema being selected. Receives one parameter: object with the following properties: "itemSchema", "columnData", "refTargets", "selectionColumnIndex" |
| `renderEmptyDetails` | Function: custom render function for the "Details" block on the right if nothing is selected yet. Receives one parameter: object with the following property: "rootColumnSchemas" (i.e. what was provided as `schemas` prop)

## TODOs (work in progress)

- Separate view component from JSON Schema related logic
- Introduce unit tests
- support `anyOf`
- support `oneOf`
- support `if`/`then`/`else`
- Introduce search functionality in header (after determining how search results could be displayed)
- Add breadcrumbs-like summary in footer
- Improve performance (e.g. by using lodash chaining)
