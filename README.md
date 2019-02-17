# React JSON Schema Inspector (react-jsonschema-inspector)

Introducing a component for viewing/traversing (complex) JSON Schemas for the sake of documentation and potentially assisting users of a DSL in finding particular information in a custom data model.

## Demo

Check out the Storybook under: [https://carstenwickner.github.io/react-jsonschema-inspector](https://carstenwickner.github.io/react-jsonschema-inspector)

## Work in Progress

- [x] Allow traversing basic JSON Schema structure
- [x] Display detail information about selected node
- [x] Introduce demo/gh-pages (e.g. using storybook)
- [x] Auto-scroll to right when new column is being displayed
- [x] Avoid auto-scroll to left when last column is being hidden (e.g. when switching between items in one column where only one has children)
- [x] Allow custom rendering of detail information
- [x] Allow custom rendering of individual items
- [x] Align default styles with macOS Finder
- [ ] Expose onSelect function
- [ ] Introduce unit tests
- [ ] Cater for building component as library
- [ ] Introduce search functionality in header (after determining how search results could be displayed)
- [ ] Add breadcrumbs like summary in footer
- [ ] Improve performance (e.g. by using lodash chaining)
