import postcss from "rollup-plugin-postcss";
import { terser } from "rollup-plugin-terser";
import typescript from "@wessberg/rollup-plugin-ts";

import packageJSON from "./package.json";

export default [
    // CommonJS
    {
        input: "./src/index.ts",
        output: [
            {
                file: packageJSON.main,
                format: "cjs",
                sourcemap: true
            },
            {
                file: packageJSON.module,
                format: "es",
                exports: "named",
                sourcemap: true
            }
        ],
        external: [
            // ensure peer dependencies are declared as externals
            ...Object.keys(packageJSON.peerDependencies),
            // same for actual dependencies, to allow for dependency resolution/de-duplication by consumers
            ...Object.keys(packageJSON.dependencies)
        ],
        plugins: [
            // collect styles from SCSS, minimise them and include them in the JS module (i.e. not as separate .css file)
            postcss({
                extract: false,
                extensions: [".scss"],
                minimize: true
            }),
            // compile typescript into vanilla javascript and produce a single .d.ts file
            typescript({}),
            // discard unused parts of the code
            terser()
        ]
    }
];
