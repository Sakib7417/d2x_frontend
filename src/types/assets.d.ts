/**
 * Ambient declarations for non-code imports.
 *
 * WHY THIS IS NEEDED
 * ------------------
 * Next ships declarations for `*.module.css` (CSS Modules) in
 * `next/types/global.d.ts`, but deliberately none for plain `*.css`. It gets
 * away with that because `tsc` does not type-check side-effecting imports by
 * default, so `import "./globals.css"` resolves to nothing and is ignored.
 *
 * That default is fragile. Enabling `noUncheckedSideEffectImports`, or using an
 * editor/TS-server configuration that checks side-effect imports, immediately
 * produces:
 *
 *   Cannot find module or type declarations for side-effect import
 *   of './globals.css'
 *
 * Declaring the modules explicitly makes the project correct under either
 * setting, instead of depending on a compiler default that Next's own source
 * notes can be overridden.
 *
 * The `*.module.*` declarations are intentionally omitted — Next already
 * provides those, and redeclaring them here would shadow its typed
 * `{ readonly [key: string]: string }` class map with something weaker.
 */

declare module "*.css";
declare module "*.scss";
declare module "*.sass";

declare module "*.svg" {
  import type { FC, SVGProps } from "react";
  const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
