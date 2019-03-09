import createBreadcrumbBuilder from "../src/breadcrumbsUtils";
import JsonSchema from "../src/JsonSchema";

describe("createBreadcrumbBuilder()", () => {
    const simpleSchema = new JsonSchema({ title: "value" });
    const arraySchema = new JsonSchema({
        items: { title: "value" }
    });
    const nestedArraySchema = new JsonSchema({
        items: {
            items: {
                items: {
                    title: "value"
                }
            }
        }
    });
    describe("with default options", () => {
        const buildBreadcrumb = createBreadcrumbBuilder({});
        it.each`
                type              | schema               | name          | index | trailingSelection | expected
                ${"simple"}       | ${simpleSchema}      | ${"root"}     | ${0}  | ${true}           | ${"root"}
                ${"simple"}       | ${simpleSchema}      | ${"root"}     | ${0}  | ${false}          | ${"root"}
                ${"array"}        | ${arraySchema}       | ${"root"}     | ${0}  | ${true}           | ${"root"}
                ${"array"}        | ${arraySchema}       | ${"root"}     | ${0}  | ${false}          | ${"root[0]"}
                ${"nested array"} | ${nestedArraySchema} | ${"root"}     | ${0}  | ${true}           | ${"root"}
                ${"nested array"} | ${nestedArraySchema} | ${"root"}     | ${0}  | ${false}          | ${"root[0][0][0]"}
                ${"simple"}       | ${simpleSchema}      | ${"non root"} | ${1}  | ${true}           | ${".non root"}
                ${"simple"}       | ${simpleSchema}      | ${"non root"} | ${1}  | ${false}          | ${".non root"}
                ${"array"}        | ${arraySchema}       | ${"non root"} | ${1}  | ${true}           | ${".non root"}
                ${"array"}        | ${arraySchema}       | ${"non root"} | ${1}  | ${false}          | ${".non root[0]"}
                ${"nested array"} | ${nestedArraySchema} | ${"non root"} | ${1}  | ${true}           | ${".non root"}
                ${"nested array"} | ${nestedArraySchema} | ${"non root"} | ${1}  | ${false}          | ${".non root[0][0][0]"}
            `("$type $name item (when trailing: $trailingSelection)", (parameters) => {
            const {
                schema, name, index, trailingSelection, expected
            } = parameters;
            const column = {
                items: { [name]: schema },
                selectedItem: name,
                trailingSelection
            };
            expect(buildBreadcrumb(column, index)).toBe(expected);
        });
    });
    describe("with custom options", () => {
        const buildBreadcrumb = createBreadcrumbBuilder({
            prefix: "//",
            separator: "/",
            arrayItemAccessor: "[@index=0]",
            mutateName: selectedItem => (selectedItem === "null" ? null : selectedItem.replace(/\s/g, "-"))
        });
        it.each`
                type              | schema               | name          | index | trailingSelection | expected
                ${"simple"}       | ${simpleSchema}      | ${"root"}     | ${0}  | ${true}           | ${"//root"}
                ${"simple"}       | ${simpleSchema}      | ${"root"}     | ${0}  | ${false}          | ${"//root"}
                ${"array"}        | ${arraySchema}       | ${"root"}     | ${0}  | ${true}           | ${"//root"}
                ${"array"}        | ${arraySchema}       | ${"root"}     | ${0}  | ${false}          | ${"//root[@index=0]"}
                ${"nested array"} | ${nestedArraySchema} | ${"root"}     | ${0}  | ${true}           | ${"//root"}
                ${"nested array"} | ${nestedArraySchema} | ${"root"}     | ${0}  | ${false}          | ${"//root[@index=0][@index=0][@index=0]"}
                ${"simple"}       | ${simpleSchema}      | ${"non root"} | ${1}  | ${true}           | ${"/non-root"}
                ${"simple"}       | ${simpleSchema}      | ${"non root"} | ${1}  | ${false}          | ${"/non-root"}
                ${"array"}        | ${arraySchema}       | ${"non root"} | ${1}  | ${true}           | ${"/non-root"}
                ${"array"}        | ${arraySchema}       | ${"non root"} | ${1}  | ${false}          | ${"/non-root[@index=0]"}
                ${"nested array"} | ${nestedArraySchema} | ${"non root"} | ${1}  | ${true}           | ${"/non-root"}
                ${"nested array"} | ${nestedArraySchema} | ${"non root"} | ${1}  | ${false}          | ${"/non-root[@index=0][@index=0][@index=0]"}
                ${"skipping"}     | ${simpleSchema}      | ${"null"}     | ${1}  | ${true}           | ${null}
                ${"skipping"}     | ${simpleSchema}      | ${"null"}     | ${1}  | ${false}          | ${null}
            `("$type $name item (when trailing: $trailingSelection)", (parameters) => {
            const {
                schema, name, index, trailingSelection, expected
            } = parameters;
            const column = {
                items: { [name]: schema },
                selectedItem: name,
                trailingSelection
            };
            expect(buildBreadcrumb(column, index)).toBe(expected);
        });
    });
});
