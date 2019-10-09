import createBreadcrumbBuilder from "../../src/model/breadcrumbsUtils";
import JsonSchema from "../../src/model/JsonSchema";

describe("createBreadcrumbBuilder()", () => {
    const simpleSchema = new JsonSchema({ title: "value" });
    describe("with default options", () => {
        const buildBreadcrumb = createBreadcrumbBuilder({});
        it.each`
                name          | index | expected
                ${"root"}     | ${0}  | ${"root"}
                ${"non root"} | ${1}  | ${".non root"}
            `("$name item", ({ name, index, expected }) => {
            const column = {
                items: { [name]: simpleSchema },
                selectedItem: name
            };
            expect(buildBreadcrumb(column, index)).toBe(expected);
        });
        it("skipping option selection", () => {
            const column = {
                options: [[0], [1]],
                selectedItem: [1]
            };
            expect(buildBreadcrumb(column, 1)).toBe(null);
        });
    });
    describe("with custom options", () => {
        const buildBreadcrumb = createBreadcrumbBuilder({
            prefix: "//",
            separator: "/",
            skipSeparator: (selectedItem) => (selectedItem === "without-separator"),
            mutateName: (selectedItem) => (selectedItem === "null" ? null : selectedItem.replace(/\s/g, "-"))
        });
        it.each`
                type          | name                   | index | expected
                ${"simple"}   | ${"root"}              | ${0}  | ${"//root"}
                ${"simple"}   | ${"non root"}          | ${1}  | ${"/non-root"}
                ${"simple"}   | ${"without separator"} | ${1}  | ${"without-separator"}
                ${"skipping"} | ${"null"}              | ${1}  | ${null}
            `("$type $name item", ({ name, index, expected }) => {
            const column = {
                items: { [name]: simpleSchema },
                selectedItem: name
            };
            expect(buildBreadcrumb(column, index)).toBe(expected);
        });
        it("skipping option selection", () => {
            const column = {
                options: [[0], [1]],
                selectedItem: [1]
            };
            expect(buildBreadcrumb(column, 1)).toBe(null);
        });
    });
});
