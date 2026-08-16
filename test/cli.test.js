const { test } = require("node:test");
const assert = require("node:assert");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const CLI = path.join(__dirname, "..", "bin", "cli.js");
const pkg = require("../package.json");

test("--version prints the package version", () => {
  const out = execFileSync(process.execPath, [CLI, "--version"], {
    encoding: "utf8",
  }).trim();
  assert.strictEqual(out, pkg.version);
});

test("--help prints usage and exits successfully", () => {
  const out = execFileSync(process.execPath, [CLI, "--help"], { encoding: "utf8" });
  assert.match(out, /Usage:/);
  assert.match(out, /--yes/);
});

test("cli.js has valid syntax", () => {
  execFileSync(process.execPath, ["--check", CLI]);
});

test("invalid project name is rejected", () => {
  assert.throws(
    () => execFileSync(process.execPath, [CLI, "bad name"], { encoding: "utf8" }),
    /Invalid project name/,
  );
});