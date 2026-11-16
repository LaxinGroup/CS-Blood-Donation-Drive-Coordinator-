import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // the design-taste-frontend kit, vendored as plain files (never edited by hand)
    "public/assets/**",
    // the skill's working files (checker profiles, deal history)
    ".taste-skill/**",
  ]),
]);

export default eslintConfig;
