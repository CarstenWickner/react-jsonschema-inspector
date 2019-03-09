# React JSON Schema Inspector

[![Build Status][travis-ci-image]][travis-ci-url]
[![Coverage Status][coverage-image]][coverage-url]
[![dependencies Status][david-dm-dep-image]][david-dm-dep-url]
[![peerDependencies Status][david-dm-peerDep-image]][david-dm-peerDep-url]

Introducing a component for viewing/traversing (complex) JSON Schemas for the sake of documentation and potentially assisting users of a DSL in finding particular information in a custom data model.

![Logo][main-logo-image]

## Demo

Have a look at the [![Storybook][storybook-image]][storybook-url]

Or try it out and [![Edit on CodeSandbox][codesandbox-image]][codesandbox-url]

## Usage

### Installation from NPM

```shell
npm i react-jsonschema-inspector
```

### React Component Props

| Prop | Description |
| --- | --- |
| `schemas` (required) | Object: keys will be displayed in the root column, the values are expected to be independent JSON Schema definitions (compatible to Draft 4, 6 or 7) |
| `referenceSchemas` | Array of objects: the entries are expected to be JSON Schema definitions with an absolute URI as `$id`/`id` (compatible to Draft 4, 6 or 7). These schemas will not be shown on the root column, but are used to resolve URI `$ref`erences in any of the displayed `schemas` or in another entry of the `referenceSchemas` |
| `defaultSelectedItems` | Array of strings: each referring to the name of the selected item in the respective column (i.e. the first entry in this array should match one key in the `schemas` object) |
| `onSelect` | Function: call-back being invoked after the selection changed. Receives two parameters: (1) the selection - as per the `defaultSelectedItems`, (2) an object containing the "columnData" - the full render information for all visible columns |
| `breadcrumbs` | Object: enabling the definition of options for the breadcrumbs feature in the footer (can be disabled by setting to `null`) |
| `breadcrumbs.prefix` | String: to be shown in front of the root selection (e.g. "//" or "./") – defaults to `""` |
| `breadcrumbs.separator` | String: to be shown in front of any non-root selection (e.g. "/") – defaults to `"."` |
| `breadcrumbs.arrayItemAccessor` | String: to be appended for any non-trailing selection that is an array (e.g. ".get(0)") – defaults to `"[0]"` |
| `breadcrumbs.mutateName` | Function: expecting two inputs: (1) the selected item's name, (2) the full information for the respective column and (3) the index of the respective column; a column's breadcrumb can be skipped by returning `null` |
| `breadcrumbs.preventNavigation` | Boolean: set to `true` in order to turn-off the default behaviour of discarding any following selections when double-clicking on a breadcrumbs item |
| `searchOptions` | Object: enabling the definition of options for the search/filter feature in the header (is disabled by default) – either `searchOptions.fields` or `searchOptions.filterBy` needs to be specified to enable it. the component itself will take care of looking-up sub-schemas (e.g. in `properties`) and also respects `$ref`-erences and has no problem with circular references. |
| `searchOptions.fields`| Array of strings: each referring to the name of a text field in a JSON Schema (e.g. `["title", "description"]`) in which to search/filter – this applies a case-insensitive contains() check on each of the given fields |
| `searchOptions.filterBy` | Function: overrides the default search logic based on `searchOptions.fields`. Input is a raw JSON Schema (i.e. as plain object), output is expected to be a `boolean` indicating whether an immediate match was found |
| `searchOptions.inputPlaceholder` | String: for setting the input hint in the search field. This defaults to `"Search"`. |
| `searchOptions.debounceWait` | Number indicating the delay in milliseconds between the last change to the search term being entered and it actually being applied. This defaults to `200` but may be increased when used with exceptionally large schemas and you experience performance issues. Please refer to the documentation on [`lodash.debounce`](https://lodash.com/docs/4.17.11#debounce). |
| `searchOptions.debounceMaxWait` | Number indicating the maximum delay in milliseconds after the search term was changed. This defaults to `500`. Please refer to the documentation on [`lodash.debounce`](https://lodash.com/docs/4.17.11#debounce). |
| `renderItemContent` | Function: custom render function for name of single property/sub-schema in a column. Receives one parameter: object with the following properties: "name", "hasNestedItems", "selected", "schema" |
| `renderSelectionDetails` | Function: custom render function for the "Details" block on the right for the single property/sub-schema being selected. Receives one parameter: object with the following properties: "itemSchema", "columnData", "selectionColumnIndex" |
| `renderEmptyDetails` | Function: custom render function for the "Details" block on the right if nothing is selected yet. Receives one parameter, which is an object with the "rootColumnSchemas" property, which holds the array of top-level schemas (as derived from the `schemas` prop and augmented by any given `referenceSchemas`)


## Compatibility

This component is compatible with JSON Schema Draft 7.
It is also backwards-compatible with Drafts 4 and 6.

### Structural Properties

| Property | Support | Description |
| --- | --- |--- |
| `$schema` | - | *ignored* (assumed to be compatible to JSON Schema Draft 4, 6 or 7) |
| `$id` | Yes | allowed as sub-schema reference in `$ref` (as per Draft 6 and 7), but not displayed; *ignored* if specified anywhere but in the root schema or inside an entry in `definitions` |
| `id` | Yes | allowed as sub-schema reference in `$ref` (as per Draft 4), but not displayed; *ignored* if specified anywhere but in the root schema or inside an entry in `definitions` or if `$id` is present |
| `$ref` | Yes | used to look-up re-usable sub-schemas transparently (i.e. not displayed), supporting:<ul><li>`#` or the root `$id`/`id` value as root schema references,</li><li>`#/definitions/<name-of-definition>` or the respective `$id`/`id` value from within the `definitions` for sub-schemas,</li><li>absolute URIs are supported as long as those separate schemas are provided via the `referenceSchemas` prop (and their respective root `$id`/`id` matches the given `$ref`)</li><li>absolute URIs ending with `#/definitions/<name-of-definition>` are also supported via the `referenceSchemas` prop</li></ul> |
| `definitions`| Yes | used to provide re-usable sub-schemas that are being referenced via `$ref` (only in the respective root schemas) |
| `properties`| Yes | used to populate the whole structure to be traversed |
| `required` | Yes | used to add empty `properties` to structure if they are not also mentioned in `properties` directly |
| `additionalProperties` | - | *ignored* |
| `patternProperties` | - | *ignored* |
| `items`| Partially | used to look-up `properties` of single kind of items in an array; however if `items` is an array of multiple sub-schemas they are being *ignored* |
| `additionalItems`| Yes | used to look-up `properties` of kind of items in an array if `ìtems` is not present or defined as an array (which is not supported itself), otherwise `additionalItems` are being *ignored* |
| `allOf` | Yes | used to combine sub-schemas transparently |
| `anyOf` | - | *ignored* |
| `oneOf` | - | *ignored* |
| `not` | - | *ignored* |
| `contains` | - | *ignored* |
| `dependencies` | - | *ignored* |
| `if` | - | *ignored* |
| `then` | - | *ignored* |
| `else` | - | *ignored* |

### Non-Structural Properties (shown in default "Details" form)

| Property | Support | Comment |
| --- | --- |--- |
| `title` | Yes |  |
| `description` | Yes | |
| `examples` | Yes | without further formatting |
| `default` | Yes | without further formatting |
| `type` | Yes |  |
| `enum` | Yes | without further formatting |
| `const` | Yes | without further formatting |
| `minLength` | Yes |  |
| `maxLength` | Yes |  |
| `pattern` | Yes |  |
| `format` | Yes | without further explanations |
| `multipleOf` | Yes |  |
| `minimum` | Yes |  |
| `exclusiveMinimum` | Yes | supported both as `number` per Draft 6 and 7 and `boolean` per Draft 4 |
| `maximum` | Yes |  |
| `exclusiveMaximum` | Yes | supported both as `number` per Draft 6 and 7 and `boolean` per Draft 4 |
| `required` | Yes | not on the individual items per default |
| `minItems` | Yes |  |
| `maxItems` | Yes |  |
| `uniqueItems` | Yes |  |
| `propertyNames` | - | *ignored* |
| `minProperties` | - | *ignored* |
| `maxProperties` | - | *ignored* |


## Ideas

- support `oneOf` (if there is a nice/consistent way to do so)
- support `anyOf` (if there is a nice/consistent way to do so)


[main-logo-image]: https://raw.githubusercontent.com/CarstenWickner/react-jsonschema-inspector/master/logo.svg?sanitize=true
[travis-ci-image]: https://travis-ci.org/CarstenWickner/react-jsonschema-inspector.svg
[travis-ci-url]: https://travis-ci.org/CarstenWickner/react-jsonschema-inspector
[coverage-image]: https://coveralls.io/repos/github/CarstenWickner/react-jsonschema-inspector/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/CarstenWickner/react-jsonschema-inspector?branch=master
[david-dm-dep-image]: https://david-dm.org/CarstenWickner/react-jsonschema-inspector/status.svg
[david-dm-dep-url]: https://david-dm.org/CarstenWickner/react-jsonschema-inspector
[david-dm-peerDep-image]: https://david-dm.org/CarstenWickner/react-jsonschema-inspector/peer-status.svg
[david-dm-peerDep-url]: https://david-dm.org/CarstenWickner/react-jsonschema-inspector?type=peer
[storybook-image]: https://raw.githubusercontent.com/storybooks/storybook/next/docs/src/design/homepage/storybook-logo.svg?sanitize=true
[storybook-url]: https://carstenwickner.github.io/react-jsonschema-inspector
[codesandbox-image]: https://codesandbox.io/static/img/play-codesandbox.svg
[codesandbox-url]: https://codesandbox.io/s/4x9jn9yzx4?fontsize=13&hidenavigation=1
