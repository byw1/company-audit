import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * The prep boundary. Prep content (talk track, gaps, pushback, who's who) may
 * only be imported by the prep route, the prep components, the prep loader
 * and the scripts that verify it. Everything else is public code, and public
 * code reaches prep through exactly one door: <PrepLayer>, a server component
 * that renders nothing unless the server has decided this request is the prep
 * view.
 *
 * Three layers enforce it, so one mistake can't leak:
 *   1. this rule (catches the import at lint time),
 *   2. `import "server-only"` in content/prep.ts (fails the build if it ever
 *      reaches a client bundle),
 *   3. `npm run verify:share` (crawls the built site and every JS chunk).
 */
const PREP_MODULES = [
  "@/content/prep",
  "@/content/prep.*",
  "**/content/prep",
  "**/content/prep.*",
  "@/lib/prep",
  "@/lib/prep/*",
  "**/lib/prep/*",
  "@/lib/schema/prep",
  "**/lib/schema/prep",
  "@/components/prep/*",
  "**/components/prep/*",
  "!@/components/prep/PrepLayer",
];

const config = [
  {
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts", ".lighthouseci/**", ".verify/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: PREP_MODULES,
              message:
                "Prep content is private. Public code may only render <PrepLayer> from @/components/prep/PrepLayer; see CLAUDE.md → 'The prep boundary'.",
            },
          ],
        },
      ],
      // Logos are local files with known sizes; next/image adds nothing here.
      "@next/next/no-img-element": "off",
    },
  },
  {
    // The only places allowed to touch prep.
    files: [
      "app/prep/**",
      "components/prep/**",
      "lib/prep/**",
      "lib/schema/prep.ts",
      "content/prep.ts",
      "scripts/**",
    ],
    rules: { "no-restricted-imports": "off" },
  },
];
export default config;
