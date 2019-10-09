import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import external from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

import packageJSON from "./package.json";

export default [
    {
        input: "./src/index.js",
        output: {
            file: packageJSON.main,
            format: "es",
            exports: "named"
        },
        plugins: [
            // ensure peer dependencies are declared as externals
            external(),
            // collect styles from SCSS, minimise them and include them in the JS module (i.e. not as separate .css file)
            postcss({
                extract: false,
                extensions: [".scss"],
                minimize: true
            }),
            // transpile for compatibility
            babel({
                exclude: "node_modules/**"
            }),
            // resolve dependencies that are ES modules
            resolve(),
            // resolve dependencies that are (legacy) CommonJS modules
            commonjs(),
            // discard unused parts of the code
            terser()
        ]
    }
];
