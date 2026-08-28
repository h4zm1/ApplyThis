// Simple build script that copies ApplyThis/ to dist-dev/ or dist-prod/
// and replaces config placeholders with actual values
//
// Usage:
//   node build.js dev   → builds to dist-dev/ with localhost URLs
//   node build.js prod  → builds to dist-prod/ with production URLs

const fs = require("fs");
const path = require("path");

// ============================================================
//          URLS
// ============================================================
const configs = {
  dev: {
    "%%API_BASE%%": "http://localhost:3000/api",
    "%%APP_URL%%": "http://localhost:5173",
  },
  prod: {
    "%%API_BASE%%": "https://hazmimosbah.com/applythis/api",
    "%%APP_URL%%": "https://hazmimosbah.com/applythis",
  },
};

// ============================================================
// read build target from command line argument
// node build.js dev  or  node build.js prod
// ============================================================
const target = process.argv[2];

if (!target || !configs[target]) {
  console.error("usage: node build.js [dev|prod]");
  process.exit(1);
}

const replacements = configs[target];
const srcDir = path.join(__dirname, "src");
const outDir = path.join(__dirname, `dist-${target}`);

console.log(`building ${target} version => ${outDir}`);

// ============================================================
// for each file: if it's a JS file, replace placeholders
// if it's anything else (images, html, css), just copy it as is
// ============================================================
function copyDir(src, dest) {
  // create destination folder if it doesn't exist
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // recurse into subfolder
      copyDir(srcPath, destPath);
    } else {
      // read file content
      let content = fs.readFileSync(srcPath, "utf8");

      // only do placeholder replacement in JS files
      if (entry.name.endsWith(".js")) {
        Object.entries(replacements).forEach(([placeholder, value]) => {
          // replaceAll to catch all occurrences in same file
          content = content.replaceAll(placeholder, value);
        });
      }

      // write to destination
      fs.writeFileSync(destPath, content);
    }
  }
}

// ============================================================
// clean old dist folder before building
// ============================================================
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true });
  console.log(`cleaned old ${outDir}`);
}

// run the copy
copyDir(srcDir, outDir);

console.log(`**Done**`);