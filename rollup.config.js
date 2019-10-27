import commonjs from "rollup-plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";
import { uglify } from "rollup-plugin-uglify";

import packageJSON from "./package.json";

const input = "./src/index.ts";
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
const typescriptOptions = {
    // eslint-disable-next-line global-require
    typescript: require("typescript")
};

export default [
    // CommonJS
    {
        input,
        output: {
            file: packageJSON.main,
            format: "cjs",
            sourcemap: true
        },
        external,
        plugins: [
            // collect styles from SCSS, minimise them and include them in the JS module (i.e. not as separate .css file)
            postcss(postcssOptions),
            // compile typescript into vanilla javascript
            typescript({
                ...typescriptOptions,
                tsconfigOverride: {
                    compilerOptions: {
                        target: "es5"
                    }
                }
            }),
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
            exports: "named",
            sourcemap: true
        },
        external,
        plugins: [
            // collect styles from SCSS, minimise them and include them in the JS module (i.e. not as separate .css file)
            postcss(postcssOptions),
            // compile typescript into vanilla javascript
            typescript(typescriptOptions),
            // resolve dependencies that are ES modules
            resolve(),
            // resolve dependencies that are (legacy) CommonJS modules
            commonjs(),
            // discard unused parts of the code
            terser()
        ]
    }
];
