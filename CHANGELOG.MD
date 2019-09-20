# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- enabling search by matching property name, via new `searchOptions.byPropertyName` prop

### Changed
- enabling new `searchOptions.byPropertyName` prop in default `searchOptions`
- providing `column` object and column `index` as additional parameter to `breadcrumbs.skipSeparator` function (i.e. same input as for `breadcrumbs.mutateName`)
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
