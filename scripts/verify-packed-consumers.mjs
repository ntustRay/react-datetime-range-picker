import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const packageName = "@ntustray/react-datetime-range-picker";
const repositoryRoot = resolve(import.meta.dirname, "..");
const npmCli = process.env.npm_execpath;
const scratchRoot = mkdtempSync(join(tmpdir(), "dtrp-consumers-"));
const artifactDirectory = join(scratchRoot, "artifacts");

if (npmCli === undefined) {
  throw new Error(
    "Run this verification through the npm test:consumers script.",
  );
}

function runNpm(arguments_, cwd) {
  execFileSync(process.execPath, [npmCli, ...arguments_], {
    cwd,
    stdio: "inherit",
  });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function createTarball() {
  mkdirSync(artifactDirectory);
  const output = execFileSync(
    process.execPath,
    [npmCli, "pack", "--pack-destination", artifactDirectory, "--json"],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  const result = JSON.parse(output);
  const filename = result[0]?.filename;
  if (typeof filename !== "string") {
    throw new Error("npm pack did not report a tarball filename.");
  }
  return join(artifactDirectory, filename);
}

function copyFixture(name) {
  const source = join(repositoryRoot, "fixtures", name);
  const target = join(scratchRoot, name);
  cpSync(source, target, {
    recursive: true,
    filter: (path) => !["node_modules", "dist"].includes(basename(path)),
  });
  cpSync(
    join(repositoryRoot, "fixtures", "ssr-smoke.mjs"),
    join(target, "ssr-smoke.mjs"),
  );
  return target;
}

function pointFixtureAtTarball(fixture, tarball) {
  const packagePath = join(fixture, "package.json");
  const manifest = readJson(packagePath);
  manifest.dependencies[packageName] = `file:${tarball.replaceAll("\\", "/")}`;
  writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function collectInstalledVersions(tree, dependencyName, versions = new Set()) {
  const dependency = tree.dependencies?.[dependencyName];
  if (typeof dependency?.version === "string") versions.add(dependency.version);
  for (const child of Object.values(tree.dependencies ?? {})) {
    collectInstalledVersions(child, dependencyName, versions);
  }
  return versions;
}

function verifySingleReactCopy(fixture, expectedMajor) {
  const output = execFileSync(
    process.execPath,
    [npmCli, "ls", "react", "react-dom", "--all", "--json"],
    { cwd: fixture, encoding: "utf8" },
  );
  const tree = JSON.parse(output);
  for (const dependencyName of ["react", "react-dom"]) {
    const versions = collectInstalledVersions(tree, dependencyName);
    if (
      versions.size !== 1 ||
      ![...versions][0]?.startsWith(`${expectedMajor}.`)
    ) {
      throw new Error(
        `${dependencyName} should resolve to one React ${expectedMajor} version; found ${[
          ...versions,
        ].join(", ")}.`,
      );
    }
  }
}

function verifyPackageSurface(fixture) {
  const installedRoot = join(
    fixture,
    "node_modules",
    "@ntustray",
    "react-datetime-range-picker",
  );
  const manifest = readJson(join(installedRoot, "package.json"));
  if (
    manifest.type !== "module" ||
    manifest.exports?.["."]?.require !== undefined
  ) {
    throw new Error("The packed package must advertise only its ESM entry.");
  }
  if (Object.keys(manifest.dependencies ?? {}).length > 0) {
    throw new Error("The packed package must not require runtime polyfills.");
  }
  if (!existsSync(join(installedRoot, "dist", "styles.css"))) {
    throw new Error(
      "The documented CSS export is missing from the packed package.",
    );
  }
  const sourceMap = readJson(
    join(installedRoot, "dist", "internal", "normalize-timestamp.mjs.map"),
  );
  if (
    !sourceMap.sources?.some((source) => source.includes("../src/")) ||
    !sourceMap.sourcesContent?.some((source) => source.length > 0)
  ) {
    throw new Error(
      "The JavaScript source map does not point to packaged source content.",
    );
  }
}

function verifyViteOutput(fixture) {
  const assets = readdirSync(join(fixture, "dist", "assets"));
  if (!assets.some((asset) => asset.endsWith(".css"))) {
    throw new Error("The Vite consumer did not emit the imported package CSS.");
  }
  if (!assets.some((asset) => asset.endsWith(".js"))) {
    throw new Error("The Vite consumer did not emit a JavaScript bundle.");
  }
}

function verifyTreeShakenUtility(fixture) {
  const output = readFileSync(
    join(fixture, "utility-dist", "utility-consumer.js"),
    "utf8",
  );
  for (const excludedText of [
    "dtrp-popover",
    "react/jsx-runtime",
    "Select date and time range",
  ]) {
    if (output.includes(excludedText)) {
      throw new Error(
        `The utility-only bundle retained unused picker code: ${excludedText}.`,
      );
    }
  }
}

const tarball = createTarball();

for (const fixtureDefinition of [
  { name: "react18", major: 18, vite: false },
  { name: "react19", major: 19, vite: true },
]) {
  const fixture = copyFixture(fixtureDefinition.name);
  pointFixtureAtTarball(fixture, tarball);
  runNpm(["install"], fixture);
  runNpm(["run", "typecheck"], fixture);
  execFileSync(process.execPath, ["ssr-smoke.mjs"], {
    cwd: fixture,
    stdio: "inherit",
  });
  verifySingleReactCopy(fixture, fixtureDefinition.major);
  verifyPackageSurface(fixture);
  if (fixtureDefinition.vite) {
    runNpm(["run", "build"], fixture);
    verifyViteOutput(fixture);
    runNpm(["run", "build:utility"], fixture);
    verifyTreeShakenUtility(fixture);
  }
}

console.log(
  `Packed consumer verification passed. Scratch files: ${scratchRoot}`,
);
