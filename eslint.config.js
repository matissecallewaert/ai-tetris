export default [
    {
        ignores: ["node_modules/**"]
    },
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                Blob: "readonly",
                Chart: "readonly",
                clearInterval: "readonly",
                document: "readonly",
                fetch: "readonly",
                FileReader: "readonly",
                localStorage: "readonly",
                navigator: "readonly",
                queueMicrotask: "readonly",
                self: "readonly",
                setInterval: "readonly",
                setTimeout: "readonly",
                URL: "readonly",
                window: "readonly",
                Worker: "readonly"
            }
        },
        rules: {
            camelcase: "error",
            "max-depth": ["error", 4],
            "no-undef": "error",
            "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
            "no-var": "error",
            "prefer-const": "error",
            complexity: ["warn", 12]
        }
    },
    {
        files: ["tests/**/*.js"],
        languageOptions: {
            globals: {
                process: "readonly"
            }
        }
    },
    {
        files: ["scripts/modules/sound.js", "scripts/translator.js"],
        rules: {
            "no-unused-vars": ["warn", { "args": "none" }],
            "prefer-const": "warn"
        }
    }
];
