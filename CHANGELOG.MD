# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
