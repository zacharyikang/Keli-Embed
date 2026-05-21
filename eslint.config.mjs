import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "next-env.d.ts",
  ]),
  {
    files: ["lib/srs/**", "lib/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "react*",
            "next*",
            "@supabase/*",
            "@/*/app/**",
            "@/*/components/**",
            "@/*/lib/storage/**",
            "@/*/lib/services/**",
            "@/*/lib/auth/**",
          ],
        },
      ],
    },
  },
  {
    files: ["lib/storage/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "react*",
            "next*",
            "@/*/lib/services/**",
            "@/*/lib/srs/**",
            "@/*/lib/auth/**",
            "@/*/app/**",
            "@/*/components/**",
          ],
        },
      ],
    },
  },
  {
    files: ["lib/services/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "react*",
            "next*",
            "@/*/lib/storage/supabase/**",
            "@/*/lib/storage/local/**",
            "@/*/lib/auth/**",
            "@/*/app/**",
            "@/*/components/**",
            "@supabase/*",
            "next/headers",
            "next/server",
          ],
        },
      ],
    },
  },
  {
    files: ["components/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@/*/lib/storage/**",
            "@/*/lib/services/**",
            "@/*/lib/srs/**",
            "@/*/lib/auth/**",
          ],
        },
      ],
    },
  },
  {
    files: ["tests/**"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;
