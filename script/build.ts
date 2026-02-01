import { build as esbuild } from "esbuild";
import { rm, readFile, writeFile, mkdir, copyFile } from "fs/promises";
import { execSync } from "child_process";
import path from "path";

const allowlist = [
  "date-fns",
  "express",
  "express-session",
  "memorystore",
  "nanoid",
  "passport",
  "passport-local",
  "uuid",
  "zod",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });
  await mkdir("dist/public", { recursive: true });

  // Build CSS first with Tailwind CLI
  console.log("Building client CSS (site.css)...");
  execSync("npx tailwindcss -i client/src/index.css -o dist/public/site.css --minify", {
    stdio: "inherit",
  });

  console.log("Building client JS (site.js)...");
  await esbuild({
    entryPoints: ["client/src/main.tsx"],
    bundle: true,
    minify: true,
    format: "esm",
    target: ["es2020"],
    outfile: "dist/public/site.js",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    jsx: "automatic",
    loader: {
      ".tsx": "tsx",
      ".ts": "ts",
      ".js": "js",
      ".jsx": "jsx",
      ".css": "empty",
      ".png": "file",
      ".jpg": "file",
      ".svg": "file",
      ".gif": "file",
    },
    alias: {
      "@": path.resolve(process.cwd(), "client/src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
    logLevel: "info",
  });

  console.log("Copying index.html...");
  const indexHtml = await readFile("client/index.html", "utf-8");
  const prodHtml = indexHtml
    .replace('<script type="module" src="/src/main.tsx"></script>', '<script type="module" src="/site.js"></script>')
    .replace('</head>', '    <link rel="stylesheet" href="/site.css">\n  </head>');
  await writeFile("dist/public/index.html", prodHtml);

  // Copy favicon if exists
  try {
    await copyFile("client/public/favicon.png", "dist/public/favicon.png");
  } catch {
    console.log("No favicon found, skipping...");
  }

  // Copy web.config for IIS deployment
  console.log("Copying web.config for IIS...");
  try {
    await copyFile("web.config", "dist/web.config");
  } catch {
    console.log("No web.config found, skipping...");
  }

  console.log("Building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("Build complete! Output in dist/");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
