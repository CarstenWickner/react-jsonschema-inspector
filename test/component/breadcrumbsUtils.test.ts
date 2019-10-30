import { createBreadcrumbBuilder } from "../../src/component/breadcrumbsUtils";
import { JsonSchema } from "../../src/model/JsonSchema";
import { JsonSchemaGroup } from "../../src/model/JsonSchemaGroup";
import { RenderOptionsColumn, RenderItemsColumn } from "../../src/component/InspectorTypes";

describe("createBreadcrumbBuilder()", () => {
    const simpleSchema = new JsonSchemaGroup().with(new JsonSchema({ title: "value" }, {}));
    describe("with default options", () => {
        const buildBreadcrumb = createBreadcrumbBuilder({});
        it.each`
            name          | index | expected
            ${"root"}     | ${0}  | ${"root"}
            ${"non root"} | ${1}  | ${".non root"}
        `("$name item", ({ name, index, expected }) => {
            const column: RenderItemsColumn = {
                items: { [name as string]: simpleSchema },
                selectedItem: name as string,
                onSelect: (): void => {}
            };
            expect(buildBreadcrumb(column, index as number)).toBe(expected);
        });
        it("skipping option selection", () => {
            const column: RenderOptionsColumn = {
                options: {
                    options: [{}, {}]
                },
                selectedItem: [1],
                contextGroup: new JsonSchemaGroup(),
                onSelect: (): void => {}
            };
            expect(buildBreadcrumb(column, 1)).toBe(null);
        });
    });
    describe("with custom options", () => {
        const buildBreadcrumb = createBreadcrumbBuilder({
            prefix: "//",
            separator: "/",
            skipSeparator: (selectedItem) => selectedItem === "without-separator",
            mutateName: (selectedItem) => (selectedItem === "null" ? null : selectedItem.replace(/\s/g, "-"))
        });
        it.each`
            type          | name                   | index | expected
            ${"simple"}   | ${"root"}              | ${0}  | ${"//root"}
            ${"simple"}   | ${"non root"}          | ${1}  | ${"/non-root"}
            ${"simple"}   | ${"without separator"} | ${1}  | ${"without-separator"}
            ${"skipping"} | ${"null"}              | ${1}  | ${null}
        `("$type $name item", ({ name, index, expected }) => {
            const column: RenderItemsColumn = {
                items: { [name as string]: simpleSchema },
                selectedItem: name as string,
                onSelect: (): void => {}
            };
            expect(buildBreadcrumb(column, index as number)).toBe(expected);
        });
        it("skipping option selection", () => {
            const column: RenderOptionsColumn = {
                options: {
                    options: [{}, {}]
                },
                selectedItem: [1],
                contextGroup: new JsonSchemaGroup(),
                onSelect: (): void => {}
            };
            expect(buildBreadcrumb(column, 1)).toBe(null);
        });
    });
});
