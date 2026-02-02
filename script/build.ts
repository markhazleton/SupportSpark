/* eslint-disable no-console */
// Build script needs console output for progress reporting
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
    .replace(
      '<script type="module" src="/src/main.tsx"></script>',
      '<script type="module" src="/site.js"></script>'
    )
    .replace("</head>", '    <link rel="stylesheet" href="/site.css">\n  </head>');
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

  // === DATA DIRECTORY SETUP (T076-T078) ===
  console.log("\nSetting up data directory structure...");
  await mkdir("dist/data/conversations", { recursive: true });

  // Copy or create initial data files
  const dataFiles = ["users.json", "supporters.json", "quotes.json"];
  for (const file of dataFiles) {
    try {
      await copyFile(`data/${file}`, `dist/data/${file}`);
      console.log(`  ✓ Copied data/${file}`);
    } catch {
      // Create empty array if file doesn't exist
      await writeFile(`dist/data/${file}`, "[]", "utf-8");
      console.log(`  ✓ Created empty data/${file}`);
    }
  }

  // Initialize conversations metadata
  await writeFile(
    "dist/data/conversations/meta.json",
    JSON.stringify({ lastConversationId: 0 }, null, 2),
    "utf-8"
  );
  console.log("  ✓ Initialized conversations/meta.json");

  await writeFile("dist/data/conversations/index.json", "[]", "utf-8");
  console.log("  ✓ Initialized conversations/index.json");

  // === WEB.CONFIG VALIDATION (T079) ===
  console.log("\nValidating web.config...");
  try {
    const webConfig = await readFile("dist/web.config", "utf-8");

    // Check for required iisnode handler
    if (!webConfig.includes('<add name="iisnode"')) {
      console.warn("  ⚠️  Warning: web.config missing iisnode handler configuration");
    } else {
      console.log("  ✓ iisnode handler found");
    }

    // Check for correct entry point
    if (!webConfig.includes('path="index.cjs"') && !webConfig.includes("index.cjs")) {
      console.warn("  ⚠️  Warning: web.config may not reference correct entry point (index.cjs)");
    } else {
      console.log("  ✓ Entry point reference found");
    }

    // Check for URL rewrite rules
    if (!webConfig.includes("<rewrite>")) {
      console.warn("  ⚠️  Warning: web.config missing URL rewrite rules");
    } else {
      console.log("  ✓ URL rewrite rules found");
    }

    console.log("\n✅ Build and validation complete!");
  } catch (err) {
    console.error("\n❌ web.config validation failed:", err);
    console.log("IIS deployment may not work correctly");
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
