# React JSON Schema Inspector

[![npm version][npm-image]][npm-url] [![Coverage Status][coverage-image]][coverage-url] ![Maintained? Yes][maintained-image]  
![typescript][typescript-image]

![Logo][main-logo-image]

Introducing a component for viewing/traversing (complex) JSON Schemas for the sake of documentation and potentially assisting users of a domain-specific model in finding a particular piece of information.

The component is expressly not intended for visualising the whole of a JSON Schema (there are already quite a few JSON Schema Viewer components out there doing a great job at that). A possible use-case is inside an application that allows its users to define business rules or other kinds of expressions (e.g. within decision tables) while providing rather complex data structures as input which may also be subject to frequent changes – both good reasons why you wouldn't want to maintain a separate documentation of the all of the available fields. And the majority of generated forms of documentation (e.g. JSDoc, JavaDoc, etc.) may be too big/technical for your users.

At the same time, there are a number of tools that automatically generate schema definitions from your code. Taking these automatically generated schemas, the JSON Schema Inspector component allows your users to iterate through the data structure (if they know roughly where to look) or even search through the whole structure to find the particular piece of information they are looking for. All the while showing the path to the selected field as breadcrumbs underneath, allowing your users to simply copy-paste it into their business rule/expression.

## Demo

Have a look at the [Storybook][storybook-url]

Or try it out and [![Edit on CodeSandbox][codesandbox-image]][codesandbox-url]

## Usage

### Installation from NPM

```shell
npm i react-jsonschema-inspector
```

### React Component Props of `<Inspector>`

| Prop | Description |
| --- | --- |
| `schemas` (required) | Object: keys will be displayed in the root column, the values are expected to be independent JSON Schema definitions (compatible to Draft 6, 7 or 2019-09) |
| `referenceSchemas` | Array of objects: the entries are expected to be JSON Schema definitions with an absolute URI as `$id` (compatible to Draft 6, 7 or 2019-09). These schemas will not be shown on the root column, but are used to resolve URI `$ref`-erences in any of the displayed `schemas` or in another entry of the `referenceSchemas` |
| `hideSingleRootItem` | Boolean: flag indicating whether the properties of the single entry in the given `schemas` properties should be listed in the root column – in case of multiple entries in `schemas` this is being ignored |
| `defaultSelectedItems` | Array of strings: each referring to the name of the selected item in the respective column (i.e. the first entry in this array should match one key in the `schemas` object) |
| `onSelect` | Function: call-back being invoked after the selection changed. Receives two parameters: (1) the selection - as per the `defaultSelectedItems`, (2) an object containing the "columnData" - the full render information for all visible columns |
| `buildArrayProperties` | Function: accepting a `JsonSchema` instance representing an array's declared type of items and returning an object listing the available properties to offer with either `JsonSchema` or raw JSON Schemas as values. The default, providing access to the array's items, is: `arrayItemSchema => ({ "[0]": arrayItemSchema })` |
| `parserConfig` | Object: enabling the inclusion/exclusion of optional parts of a JSON Schema – both for the inclusion of properties and their attributes as well as in the search. |
| `parserConfig.anyOf` | Object: specifying details of the inclusion of JSON Schema parts wrapped in `anyOf`. |
| `parserConfig.anyOf.groupTitle` | String: alternative title to show in option selection column – defaults to `"any of"` |
| `parserConfig.anyOf.optionNameForIndex` | Function: providing the name/label to show for a single option – defaults to ``(optionIndexes) => `Option ${optionIndexes.map(index => index + 1).join("-")}` ``, resulting in e.g. "Option 1", "Option 2-1", "Option 3" |
| `parserConfig.oneOf` | Object: specifying details of the inclusion of JSON Schema parts wrapped in `oneOf`. |
| `parserConfig.oneOf.groupTitle` | String: alternative title to show in option selection column – defaults to `"one of"` |
| `parserConfig.oneOf.optionNameForIndex` | Function: providing the name/label to show for a single option – defaults to ``(optionIndexes) => `Option ${optionIndexes.map(index => index + 1).join("-")}` ``, resulting in e.g. "Option 1", "Option 2-1", "Option 3" |
| `breadcrumbs` | Object: enabling the definition of options for the breadcrumbs feature in the footer (can be disabled by setting to `null`) |
| `breadcrumbs.prefix` | String: to be shown in front of the root selection (e.g. "//" or "./") – defaults to `""` |
| `breadcrumbs.separator` | String: to be shown in front of any non-root selection (e.g. "/") – defaults to `"."` |
| `breadcrumbs.skipSeparator` | Function: expecting a `JsonSchema` as input and should return an object containing `JsonSchema` or raw JSON Schemas as values – defaults to excluding `"[0]"` |
| `breadcrumbs.mutateName` | Function: expecting the following inputs: (1) the selected item's name, (2) the full information for the respective column and (3) the index of the respective column; a column's breadcrumb can be skipped by returning `null` |
| `breadcrumbs.preventNavigation` | Boolean: set to `true` in order to turn-off the default behaviour of discarding any following selections when double-clicking on a breadcrumbs item |
| `searchOptions` | Object: enabling the definition of options for the search/filter feature in the header (is disabled by default) – either `searchOptions.fields` or `searchOptions.filterBy` needs to be specified to enable it. the component itself will take care of looking-up sub-schemas (e.g. in `properties`) and also respects `$ref`-erences and has no problem with circular references. |
| `searchOptions.fields`| Array of strings: each referring to the name of a text field in a JSON Schema (e.g. `["title", "description"]`) in which to search/filter – this applies a case-insensitive contains() check on each of the given fields |
| `searchOptions.filterBy` | Function: overrides the default search logic based on `searchOptions.fields`. Input is a raw JSON Schema (i.e. as plain object), output is expected to be a `boolean` indicating whether an immediate match was found |
| `searchOptions.byPropertyName` | Boolean: toggle to enable/disable additional filter option besides `fields`/`filterBy`, checking for case-insensitive (partial) matches on property names. |
| `searchOptions.inputPlaceholder` | String: for setting the input hint in the search field. This defaults to `"Search"`. |
| `searchOptions.debounceWait` | Number indicating the delay in milliseconds between the last change to the search term being entered and it actually being applied. This defaults to `200` but may be increased when used with exceptionally large schemas and you experience performance issues. Please refer to the documentation on [`lodash.debounce`](https://lodash.com/docs/4.17.11#debounce). |
| `searchOptions.debounceMaxWait` | Number indicating the maximum delay in milliseconds after the search term was changed. This defaults to `500`. Please refer to the documentation on [`lodash.debounce`](https://lodash.com/docs/4.17.11#debounce). |
| `renderHeaderToolBar` | Function: custom render function for additional header tool-bar besides search input. Receives one parameter: object with a: "columnData" property |
| `renderSearchInput` | Function: custom render function for the search input. Receives one parameter: object with the following properties: "searchFilter", "placeholder", "onChange" |
| `renderItemContent` | Function: custom render function for name of single property/sub-schema in a column. Receives one parameter: object with the following properties: "name", "hasNestedItems", "selected", "schemaGroup" |
| `renderSelectionDetails` | Function: custom render function for the "Details" block on the right for the single property/sub-schema being selected. Receives one parameter: object with the following properties: "itemSchemaGroup", "columnData", "selectionColumnIndex", "optionIndexes" |
| `renderEmptyDetails` | Function: custom render function for the "Details" block on the right if nothing is selected yet. Receives one parameter, which is an object with the "rootColumnSchemas" property, which holds the array of top-level schemas (as derived from the `schemas` prop and augmented by any given `referenceSchemas`)

### Additional Helper Functions

Besides the main `<Inspector>` component, there are additional named helper functions being provided in the scope of this library:
- `getFieldValueArrayFromSchemaGroup()` – listing all values of the targeted field in an array (skipping `undefined` and `null` values)
- `getCommonFieldValuesFromSchemaGroup()` – listing only those values of the targeted field in an array that are included in all occurrences of the field not being `undefined` or `null`
- `getMinimumFieldValueFromSchemaGroup()` – expecting numeric values in the targeted field and returning the single lowest value (ignoring `undefined` and `null` values)
- `getMaximumFieldValueFromSchemaGroup()` – expecting numeric values in the targeted field and returning the single highest value (ignoring `undefined` and `null` values)

All four of these are intended to be used within props enabling the customisation of an `<Inspector>` instance, e.g. in `onSelect`, `buildArrayProperties`, `breadcrumbs.mutateName`, `renderItemContent`, `renderSelectionDetails`, `renderEmptyDetails`.
All four helper functions expect the same input parameters:
1. `schemaGroup` – a group object representing a single schema with all its parts, as provided to the various call-back functions mentioned above
2. `fieldName` – textual name of the targeted field in the schema (group), e.g. `"title"`, `"maximum"`, `"minLength"`
3. `defaultValue` – value to return if there is no value for the targeted field; or as initial/base value for the `Array.reduce()` being performed for the encountered values
4. `optionIndexes` – only provided if the `schemaGroup` contains optional parts (i.e. `anyOf`/`oneOf`); used to identify the particular optional path within the `anyOf`/`oneOf` part(s) – this is also provided in one way or another in those call-back functions listed above

As output, the respective helper functions either return a single value or – in case of multiple values – an array.


## Compatibility

This component supports JSON Schema Draft 2019-09.
It is also backwards-compatible with Drafts 4, 6 and 7.

Please refer to the more detailed listing below regarding particular keywords.

### Structural Properties

| Property | Support | Description |
| --- | --- |--- |
| `$schema` | - | *ignored* (assumed to be compatible to JSON Schema Draft 6, 7 or 2019-09) |
| `$vocabulary` | - | *ignored* |
| `$id` | Yes | allowed as sub-schema reference in `$ref` or as source for the base URI to prepend to a non-fragment `$ref` (as per Draft 6 upwards), but not displayed; *ignored* if specified anywhere but in the root schema or inside an entry in `$defs`/`definitions` |
| `id` | - | *ignored* (as of release 5.0.0) |
| `$anchor` | Yes | allowed as sub-schema reference in `$ref` (as per Draft 2019-09) when preceded by `#`, but not displayed; *ignored* if specified anywhere but in the root schema or inside an entry in `$defs`/`definitions` |
| `$ref` | Yes | used to look-up re-usable sub-schemas transparently (i.e. not displayed), supporting:<ul><li>`#` or the root `$id`/`id` value as root schema references,</li><li>`#/$defs/<name-of-definition>`/`#/definitions/<name-of-definition>` or the respective `$id`/`id` value from within the `$defs`/`definitions` for sub-schemas,</li><li>absolute URIs are supported as long as those separate schemas are provided via the `referenceSchemas` prop (and their respective root `$id`/`id` matches the given `$ref`)</li><li>absolute URIs ending with `#/$defs/<name-of-definition>`/`#/definitions/<name-of-definition>` or `#<anchor>` are also supported via the `referenceSchemas` prop</li></ul> |
| `$recursiveAnchor` | - | *ignored* |
| `$recursiveRef` | Partially | treated as alias for `$ref` but not yet for advanced scenarios involving `$recursiveAnchor` (as per Draft 2019-09) |
| `$defs`| Yes | used to provide re-usable sub-schemas that are being referenced via `$ref` (only in the respective root schemas) (as per Draft 2019-09) |
| `definitions`| Yes | used to provide re-usable sub-schemas that are being referenced via `$ref` (only in the respective root schemas) (as per Draft 6 or 7) |
| `properties`| Yes | used to populate the whole structure to be traversed |
| `required` | Yes | used to add empty `properties` to structure if they are not also mentioned in `properties` directly |
| `additionalProperties` | - | *ignored* |
| `patternProperties` | - | *ignored* |
| `propertyNames` | - | *ignored* |
| `unevaluatedProperties` | - | *ignored* |
| `items`| Partially | used to look-up `properties` of single kind of items in an array; however if `items` is an array of multiple sub-schemas they are being *ignored* |
| `additionalItems`| Yes | used to look-up `properties` of kind of items in an array if `items` is not present or defined as an array (which is not supported itself), otherwise `additionalItems` are being *ignored* |
| `unevaluatedItems` | - | *ignored* |
| `allOf` | Yes | used to combine sub-schemas transparently |
| `anyOf` | Yes | used to combine sub-schemas |
| `oneOf` | Yes | used to combine sub-schemas |
| `not` | - | *ignored* |
| `contains` | - | *ignored* |
| `dependencies` | - | *ignored* |
| `dependentSchemas` | - | *ignored* |
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
| `exclusiveMinimum` | Yes | supported both as `number` per Draft 6 upwards and `boolean` per Draft 4 |
| `maximum` | Yes |  |
| `exclusiveMaximum` | Yes | supported both as `number` per Draft 6 upwards and `boolean` per Draft 4 |
| `required` | Yes | not on the individual items per default |
| `dependentRequired` | - | *ignored* |
| `minItems` | Yes |  |
| `maxItems` | Yes |  |
| `uniqueItems` | Yes |  |
| `minContains` | - | *ignored* |
| `maxContains` | - | *ignored* |
| `minProperties` | - | *ignored* |
| `maxProperties` | - | *ignored* |



[main-logo-image]: https://raw.githubusercontent.com/CarstenWickner/react-jsonschema-inspector/master/logo.svg?sanitize=true
[npm-image]: https://badge.fury.io/js/react-jsonschema-inspector.svg
[npm-url]: https://www.npmjs.com/package/react-jsonschema-inspector
[coverage-image]: https://coveralls.io/repos/github/CarstenWickner/react-jsonschema-inspector/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/CarstenWickner/react-jsonschema-inspector?branch=master
[maintained-image]: https://img.shields.io/badge/Maintained%3F-yes-green.svg
[typescript-image]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[storybook-url]: https://CarstenWickner.github.io/react-jsonschema-inspector/?path=/docs/inspector--show-case
[codesandbox-image]: https://codesandbox.io/static/img/play-codesandbox.svg
[codesandbox-url]: https://codesandbox.io/s/4x9jn9yzx4?fontsize=13&hidenavigation=1
