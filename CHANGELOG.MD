# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- Updating a number of dev dependencies including TypeScript (resulting in slight changes in type definitions)
- Dropping support for JSON Schema Draft 4 (mainly ignoring `"id"` properties in favour of `"$id"`)

### Fixed
- Handling of `allOf` containing multiple `oneOf` and/or `anyOf` entries

## [4.4.1] - 2019-12-17
### Fixed
- Add vertical spacing for breadcrumbs wrapping over multiple lines

## [4.4.0] - 2019-12-16
### Changed
- Compatibility: replace `<button>` tags for items in columns with focusable `<div>` tags
- Compatibility: replace css `clip-path` usage for nested-item indicator with css shape from borders
- Compatibility: replace css `clip-path` usage for leading breadcrumbs icon with css shape from borders
- Compatibility: replace css `clip-path` usage for breadcrumbs items with css shape from borders

## [4.3.0] - 2019-12-12
### Added
- Draft 2019-09: basic support for `$recursiveRef` as an alias for `$ref` (not yet covering advanced use cases)
- Derive base URI from `$id` when looking-up sub-schemas via their `$ref`

### Fixed
- Exported type definitions should include the main `<Inspector>` component and its props
- Include type definition for Draft 2019-09 for expected props
- Borders of "Details" block should not be shown if there is no selection and no `renderEmptyDetails` prop was provided
- Borders of "Details" block should not be shown if there is no selection and `renderEmptyDetails` returns no content to be shown
- Borders of "Details" block should not be shown if there is a selection and `renderSelectionDetails` returns no content to be shown

## [4.2.0] - 2019-12-04
### Added
- Draft 2019-09: support `$defs` as alternative to `definitions` keyword
- Draft 2019-09: include other keywords alongside `$ref`
- Draft 2019-09: support `$anchor` keyword as `$ref` target
- Draft 2019-09: explicitly document unsupported keywords
- introduce `hideSingleRootItem` prop for displaying only a single schema's properties

## [4.1.0] - 2019-11-26
### Added
- allow for addition of tool-bar items in the header besides the search input via `renderHeaderToolBar` prop

### Fixed
- height of breadcrumb items should not grow with custom trailing content

## [4.0.1] - 2019-11-01
### Fixed
- ignore non-`string` values when searching by `fields`

### Removed
- run-time proptype validation for JSON Schemas (now only at compile-time through TypeScript)
- proptype validations for internal (i.e. not exported) components

## [4.0.0] - 2019-10-28
### Changed
- introduce TypeScript
- changed expected parameters for `breadcrumbs.renderItem` prop to a single object with named attributes
- changed expected parameters for `breadcrumbs.renderTrailingContent` prop to a single object with named attributes

## [3.1.0] - 2019-10-11
### Changed
- declare all dependencies as external to allow tree-shaking by consumers

### Fixed
- declaration of ES module in package.json
- provide CommonJS output as fall-back

## [3.0.0] - 2019-10-09
### Changed
- use rollup instead of webpack for generating bundle
- provide ES module instead of CommonJS bundle
- reduced bundle size

## [2.3.0] - 2019-10-05
### Added
- allow for custom rendering of breadcrumbs item via `breadcrumbs.renderItem` function
- allow for rendering additional content in breadcrumbs via `breadcrumbs.renderTrailingContent` function

### Fixed
- fix uncoloured gap on selected item that does not have nested items (introduced in 2.2.0)

## [2.2.0] - 2019-09-22
### Added
- enabling search by matching property name, via new `searchOptions.byPropertyName` prop
- providing `column` object and column `index` as additional parameter to `breadcrumbs.skipSeparator` function (i.e. same input as for `breadcrumbs.mutateName`)
- providing `optionIndexes` as additional parameter to `renderItemContent` prop function

### Changed
- enabling new `searchOptions.byPropertyName` prop in default `searchOptions`
- style-fix: let long item names break over multiple lines within a column
- style-fix: disable the "outline" on `column` and `colview` (they were only shown in some browsers)
- style-fix: make nested-item indicator white (instead of grey) on currently selected (blue) item

## [2.1.0] - 2019-05-01
### Added
- exporting helper function `getFieldValueArrayFromSchemaGroup()`
- exporting helper function `getCommonFieldValuesFromSchemaGroup()`
- exporting helper function `getMaximumFieldValueFromSchemaGroup()`
- exporting helper function `getMinimumFieldValueFromSchemaGroup()`

### Changed
- not including `anyOf` or `oneOf` in `<Inspector>` prop `parserConfig` no longer hides the respective schema parts (always including everything)

### Removed
- "type" property in `<Inspector>` prop `parserConfig.anyOf`/`parserConfig.oneOf` (i.e. always "asAdditionalColumn" behaviour from now on)
- undocumented export of helper function `getFieldValueFromSchemaGroup()`, one of the four new helper functions should be used instead

## [2.0.1] - 2019-04-24
### Changed
- values displayed in (default) Details Form now respect the validation logic behind `allOf` by not simply listing all values for the same field, but rather semantically combining/merging them
- `"type"` contains only those common/intersecting values if it appears multiple times
- `"minimum"`/`"minLength"`/`"minItems"` show the maximum value if there are multiple occurrences of the respective field
- `"maximum"`/`"maxLength"`/`"maxItems"` show the minimum value if there are multiple occurrences of the respective field
- `"const"`/`"enum"` are used interchangeably for either a single or multiple allowed values

## [2.0.0] - 2019-04-12
### Added
- general support for `anyOf` and `oneOf`
- `anyOf`/`oneOf` may be included or excluded depending on the respective fields with the same name in the `parserConfig` prop
- can determine the way of inclusion for `anyOf`/`oneOf` via the respective `type` field of value `likeAllOf` or `asAdditionalColumn` in the `parserConfig` prop
- introduction of explicit (configurable/customisable) column for accessing an array's items and/or other properties

### Changed
- named export of `<Inspector>` component (instead of default export)

### Removed
- default export of main component

## [1.2.1] - 2019-03-18
### Changed
- configuration of npm bundle; thereby reducing size of release package

## [1.2.0] - 2019-03-09
### Added
- allow to mutate the name of a selected item when including it in breadcrumbs (e.g. to sanitise it)
- allow skipping a breadcrumb (e.g. omitting the root schema selection)
- include breadcrumbs as array parameter in `onSelect` call-back

## [1.1.0] - 2019-03-08
### Added
- offering free-text search input in the top right corner
- allow defining custom search function (based on a single raw schema – handling of sub-schemas is transparent)
- allow alternative configuration of field names to search in, e.g. `["title", "description"]`

## [1.0.0] - 2019-03-03
- initial implementation

[Unreleased]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v4.4.1...Unreleased
[4.4.1]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v4.4.0...v4.4.1
[4.4.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v4.3.0...v4.4.0
[4.3.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v4.2.0...v4.3.0
[4.2.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v4.0.1...v4.1.0
[4.0.1]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v3.1.0...v4.0.0
[3.1.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v2.3.0...v3.0.0
[2.3.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v1.2.1...v2.0.0
[1.2.1]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/CarstenWickner/react-jsonschema-inspector/releases/tag/v1.0.0
