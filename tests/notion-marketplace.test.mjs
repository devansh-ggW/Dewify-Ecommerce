import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

test("Notion marketplace shows only the real release status", () => {
  const html = read("notion-templates.html");
  const script = read("notion-marketplace.js");

  assert.match(html, /No released templates yet\./);
  assert.match(html, /No Notion templates are published yet\./);
  assert.match(html, /Only completed workspaces/);
  assert.doesNotMatch(html, /ntTemplateGrid|ntBundleGrid|DEMO PREVIEW|Featured templates|Curated collections/);
  assert.doesNotMatch(script, /makeWorkspacePreview|Demo listing|DEMO PREVIEW|Preview listing/);
  assert.equal(exists("notion-catalog.js"), false);
});

test("Unpublished template routes cannot claim a product is available", () => {
  const template = read("notion-template.html");
  const bundle = read("notion-bundle.html");
  const script = read("notion-marketplace.js");

  assert.match(template, /This template is not published/);
  assert.match(bundle, /This collection is not published/);
  assert.match(script, /showUnpublishedTemplate/);
  assert.match(script, /showUnpublishedBundle/);
  assert.doesNotMatch(template + bundle, /Loading template preview|Loading bundle preview|Get this template|Buy now/);
  for (const file of ["notion-templates.html", "notion-template.html", "notion-bundle.html"]) {
    const html = read(file);
    assert.match(html, /notion-templates\.css/);
    assert.match(html, /notion-marketplace\.js/);
    assert.doesNotMatch(html, /notion-catalog\.js/);
  }
});

test("Notion menu remains functional on desktop and mobile layouts", () => {
  const source = read("notion-marketplace.js");
  for (const token of ["ntMenuToggle", "ntMobileNav", "aria-expanded", "addEventListener"]) {
    assert.ok(source.includes(token), "missing menu behavior: " + token);
  }
});

test("Storefront pages link to the Notion release status", () => {
  const pages = [
    "index.html", "products.html", "categories.html", "faq.html", "how-it-works.html",
    "ai-money-arc.html", "creator-arsenal-1000.html", "creator-bundle-500.html",
    "creator-crate-100.html", "creator-stash-700.html", "creator-vault-300.html",
    "eboox-100.html", "webble-100.html", "webble-300.html", "webble-500.html", "webble-700.html"
  ];
  for (const file of pages) {
    const html = read(file);
    const header = html.match(/<header[\s\S]*?<\/header>/)?.[0] || "";
    const footer = html.match(/<div class="footer-links">[\s\S]*?<\/div>/)?.[0] || "";
    assert.match(header, /href="notion-templates\.html"/, file + ": header link");
    assert.match(footer, /href="notion-templates\.html"/, file + ": footer link");
  }
});

test("Configured products and visible product cards match exactly", () => {
  const config = read("config.js");
  const products = read("products.html");
  const configuredIds = [...config.matchAll(/\{id:"([^"]+)"/g)].map((match) => match[1]).sort();
  const visibleIds = [...products.matchAll(/data-price-product="([^"]+)"/g)].map((match) => match[1]).sort();

  assert.equal(configuredIds.length, 11);
  assert.deepEqual(visibleIds, configuredIds);
  for (const id of configuredIds) assert.ok(exists(id + ".html"), "missing product page: " + id);
});

test("Every configured customer download file exists in the repository", () => {
  const config = read("config.js");
  const files = [...config.matchAll(/downloadUrl:"([^"]+)"/g)].map((match) => decodeURIComponent(match[1]));

  assert.equal(files.length, 11);
  for (const file of files) assert.ok(exists(file), "missing customer download: " + file);
});

test("Product pages disclose the public static download limitation", () => {
  const productIds = [...read("config.js").matchAll(/\{id:"([^"]+)"/g)].map((match) => match[1]);
  const disclosure = "not protected by account based access";

  assert.ok(read("products.html").toLowerCase().includes(disclosure));
  for (const id of productIds) {
    const html = read(id + ".html").toLowerCase();
    assert.ok(html.includes(disclosure), id + ": missing download disclosure");
  }
});

test("Product pages and checkout scripts have no old price or fake lock labels", () => {
  const ids = [...read("config.js").matchAll(/\{id:"([^"]+)"/g)].map((match) => match[1]);
  const staleCopy = /Local price|Loading local price|DOWNLOAD LOCKED|Pay to unlock|download is unlocked|DEMO PREVIEW/;

  assert.doesNotMatch(read("config.js"), staleCopy);
  assert.doesNotMatch(read("products.html"), staleCopy);

  for (const id of ids) assert.doesNotMatch(read(id + ".html"), staleCopy, id + ": stale product copy");

  const scripts = [
    "digital.js", "creator-arsenal-1000.js", "creator-bundle-500.js",
    "creator-crate-100.js", "creator-stash-700.js", "creator-vault-300.js",
    "eboox-100.js", "webble-100.js", "webble-300.js", "webble-500.js", "webble-700.js"
  ];
  for (const file of scripts) assert.doesNotMatch(read(file), staleCopy, file + ": stale checkout copy");
});

test("Website example previews disclose nonfunctional contact forms", () => {
  const previewScript = read("template-previews.js");
  assert.match(previewScript, /sample websites, not live businesses/);
  assert.match(previewScript, /Contact forms do not send messages/);
  assert.doesNotMatch(previewScript, /fully working|<span>LIVE<\/span>/);

  const checks = [
    ["template-previews/01-aurora-house/contact.html", "No request was sent."],
    ["template-previews/03-solstice/contact.html", "No reservation was sent."],
    ["template-previews/04-orbital/contact.html", "No message was sent."]
  ];
  for (const [file, message] of checks) assert.ok(read(file).includes(message), file + ": missing honest form status");
  assert.doesNotMatch(read("template-previews/03-solstice/contact.html"), /pretend the concierge/);
});

test("Fake admin order data and unused legacy storefront scripts are removed", () => {
  const admin = read("admin.html");
  assert.match(admin, /Order management[\s\S]*is not connected/);
  assert.match(admin, /No order counts or revenue figures are being displayed as real data/);
  assert.doesNotMatch(admin, /loginForm|resetData|Cloud ready|TOTAL ORDERS|demoOrders/);

  for (const file of ["admin.js", "admin.css", "app.js", "product-details.js"]) {
    assert.equal(exists(file), false, file + " should not remain");
  }
});

test("Customer pages include the shared starfield assets", () => {
  const pages = [
    "404.html", "ai-money-arc.html", "categories.html",
    "creator-arsenal-1000.html", "creator-bundle-500.html", "creator-crate-100.html",
    "creator-stash-700.html", "creator-vault-300.html", "eboox-100.html", "faq.html",
    "how-it-works.html", "index.html", "notion-bundle.html", "notion-template.html",
    "notion-templates.html", "privacy.html", "products.html", "refund-policy.html",
    "terms.html", "webble-100.html", "webble-300.html", "webble-500.html", "webble-700.html"
  ];
  for (const file of pages) {
    const html = read(file);
    assert.match(html, /<canvas[^>]*id="starfield"/i, file + ": starfield canvas");
    assert.match(html, /<script[^>]+src="stars\.js(?:\?[^"]*)?"/i, file + ": starfield script");
  }
});

test("Homepage describes Notion release status honestly", () => {
  const html = read("index.html");
  assert.match(html, /View template status/);
  assert.match(html, /View release status/);
  assert.ok(html.includes('class="home-template-promo container"'));
  assert.match(html, /working duplication link will be listed/);
});

test("Notion page retains its light marketplace stylesheet", () => {
  const css = read("notion-templates.css");
  const stars = read("stars.css");
  assert.ok(css.includes(".nt-page"));
  assert.match(stars, /body\.nt-page #starfield/);
  assert.match(stars, /mix-blend-mode:multiply/);
});
