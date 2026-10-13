const { test } = require("node:test");
const assert = require("node:assert/strict");
const { publicConfiguration } = require("./configure-environment");

test("browser configuration excludes server secrets and uses local defaults", () => {
  const config = publicConfiguration({
    APPWRITE_API_KEY: "server-only",
    OPENAI_KEY: "server-only",
  });
  assert.equal(config.zethoApiEndpoint, "http://localhost:3000/");
  assert.equal(config.firebase.apiKey, "");
  assert.equal(JSON.stringify(config).includes("server-only"), false);
});

test("public values are serialized as data, including quotes", () => {
  const config = publicConfiguration({
    PUBLIC_APPWRITE_PROJECT: "project'with-quote",
  });
  assert.equal(
    JSON.parse(JSON.stringify(config)).appwriteProject,
    "project'with-quote",
  );
});

test("rejects executable schemes and credentials in URLs", () => {
  for (const PUBLIC_API_URL of [
    "javascript:alert(1)",
    "https://user:password@example.org/",
  ]) {
    assert.throws(() => publicConfiguration({ PUBLIC_API_URL }));
  }
});


test("deployment builds require explicit endpoints and project", () => {
  assert.throws(
    () => publicConfiguration({ ZETHO_REQUIRE_PUBLIC_CONFIG: "1" }),
    /Missing deployment configuration: PUBLIC_APP_URL, PUBLIC_API_URL, PUBLIC_APPWRITE_ENDPOINT, PUBLIC_APPWRITE_PROJECT/,
  );
  const config = publicConfiguration({
    ZETHO_REQUIRE_PUBLIC_CONFIG: "1",
    PUBLIC_APP_URL: "https://example.org/",
    PUBLIC_API_URL: "https://api.example.org/",
    PUBLIC_APPWRITE_ENDPOINT: "https://appwrite.example.org/v1",
    PUBLIC_APPWRITE_PROJECT: "my-project",
  });
  assert.equal(config.appwriteProject, "my-project");
  assert.equal(config.zethoApiEndpoint, "https://api.example.org/");
  assert.equal("ZETHO_REQUIRE_PUBLIC_CONFIG" in config, false);
});
