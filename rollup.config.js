import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import external from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import { uglify } from "rollup-plugin-uglify";

import packageJSON from "./package.json";

const input = "./src/index.js";
const babelPluginOptions = {
    exclude: "node_modules/**"
};
const postcssPluginOptions = {
    extract: false,
    extensions: [".scss"]
};
const minifyExtension = pathToFile => pathToFile.replace(/\.js$/, ".min.js");

export default [
    // CommonJS
    {
        input,
        output: {
            file: packageJSON.main,
            format: "cjs",
            sourcemap: true
        },
        plugins: [
            external(),
            postcss(postcssPluginOptions),
            babel(babelPluginOptions),
            resolve(),
            commonjs()
        ]
    },
    // CommonJS (min)
    {
        input,
        output: {
            file: minifyExtension(packageJSON.main),
            format: "cjs"
        },
        plugins: [
            external(),
            postcss({
                ...postcssPluginOptions,
                minimize: true
            }),
            babel(babelPluginOptions),
            resolve(),
            commonjs(),
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
        plugins: [
            external(),
            postcss(postcssPluginOptions),
            babel(babelPluginOptions),
            resolve(),
            commonjs()
        ]
    },
    // ES Module (min)
    {
        input,
        output: {
            file: minifyExtension(packageJSON.module),
            format: "es",
            exports: "named"
        },
        plugins: [
            external(),
            postcss({
                ...postcssPluginOptions,
                minimize: true
            }),
            babel(babelPluginOptions),
            resolve(),
            commonjs(),
            terser()
        ]
    }
];
