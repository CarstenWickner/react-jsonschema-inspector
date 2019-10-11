import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import { uglify } from "rollup-plugin-uglify";

import packageJSON from "./package.json";

const input = "./src/index.js";
const external = [
    // ensure peer dependencies are declared as externals
    ...Object.keys(packageJSON.peerDependencies),
    // same for actual dependencies, to allow for dependency resolution/de-duplication by consumers
    ...Object.keys(packageJSON.dependencies)
];
const postcssOptions = {
    extract: false,
    extensions: [".scss"],
    minimize: true
};
const babelOptions = {
    exclude: "node_modules/**"
};

export default [
    // CommonJS
    {
        input,
        output: {
            file: packageJSON.main,
            format: "cjs"
        },
        external,
        plugins: [
            // collect styles from SCSS, minimise them and include them in the JS module (i.e. not as separate .css file)
            postcss(postcssOptions),
            // transpile for compatibility
            babel(babelOptions),
            // resolve dependencies that are ES modules
            resolve(),
            // resolve dependencies that are (legacy) CommonJS modules
            commonjs(),
            // minify to reduce size
            uglify()
        ]
    },
    // ES Module
    {
        input,
        output: {
            file: packageJSON.module,
            format: "es",
            exports: "named"
        },
        external,
        plugins: [
            // collect styles from SCSS, minimise them and include them in the JS module (i.e. not as separate .css file)
            postcss(postcssOptions),
            // transpile for compatibility
            babel(babelOptions),
            // resolve dependencies that are ES modules
            resolve(),
            // resolve dependencies that are (legacy) CommonJS modules
            commonjs(),
            // discard unused parts of the code
            terser()
        ]
    }
];
