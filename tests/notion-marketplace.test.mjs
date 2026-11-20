import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const context = { window: {} };
vm.runInNewContext(read("notion-catalog.js"), context, { filename: "notion-catalog.js" });
const catalog = context.window.DEWIFY_NOTION_CATALOG;
const expectedCategories = [
  "Business", "Creators", "Game Development", "Digital Sellers",
  "Productivity", "Student Life", "Personal Organization", "Freelancers"
];

test("catalogue contains the eight requested categories", () => {
  assert.deepEqual(Array.from(catalog.categories, (item) => item.name), expectedCategories);
});

test("template entries have unique IDs and slugs and clear demo status", () => {
  assert.equal(catalog.products.length, 8);
  assert.equal(new Set(catalog.products.map((item) => item.id)).size, catalog.products.length);
  assert.equal(new Set(catalog.products.map((item) => item.slug)).size, catalog.products.length);
  for (const item of catalog.products) {
    assert.ok(item.name && item.description && item.longDescription);
    assert.ok(expectedCategories.includes(item.category));
    assert.equal(item.demo, true);
    assert.equal(item.availability, "preview");
    assert.equal(item.price, null);
    assert.equal(item.paddlePriceId, "");
    assert.equal(item.notionDuplicateUrl, "");
    assert.ok(Array.isArray(item.features) && item.features.length);
    assert.ok(Array.isArray(item.includedResources) && item.includedResources.length);
  }
});

test("bundle entries are unique and only reference known templates", () => {
  assert.equal(catalog.bundles.length, 4);
  assert.equal(new Set(catalog.bundles.map((item) => item.slug)).size, catalog.bundles.length);
  const ids = new Set(catalog.products.map((item) => item.id));
  for (const bundle of catalog.bundles) {
    assert.equal(bundle.demo, true);
    assert.equal(bundle.availability, "preview");
    assert.equal(bundle.price, null);
    assert.ok(bundle.productIds.length >= 2);
    for (const id of bundle.productIds) assert.ok(ids.has(id), "bundle references missing product " + id);
  }
});

test("marketplace routes reference existing stylesheets and scripts", () => {
  for (const file of ["notion-templates.html", "notion-template.html", "notion-bundle.html"]) {
    const html = read(file);
    assert.match(html, /notion-templates\.css/);
    assert.match(html, /notion-catalog\.js/);
    assert.match(html, /notion-marketplace\.js/);
  }
  for (const file of ["assets/notion-hero-illustration.svg", "assets/notion-workspace-illustration.svg"]) {
    assert.match(read(file), /^<svg[\s\S]*<\/svg>\s*$/);
  }
});

test("existing storefront pages link to the marketplace in both navigation and footer", () => {
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

test("marketplace script includes core navigation/filter/detail actions", () => {
  const source = read("notion-marketplace.js");
  assert.match(source, /function applyFilters\(\)/);
  assert.match(source, /function renderTemplateDetail\(/);
  assert.match(source, /function renderBundleDetail\(/);
  assert.match(source, /function initMobileNavigation\(/);
  assert.match(source, /function initSearchAndCategories\(/);
  assert.match(source, /notion-template\.html\?slug=/);
  assert.match(source, /notion-bundle\.html\?slug=/);
});

test("every published HTML page includes the shared starfield canvas and animation", () => {
  const pages = [
    "404.html", "admin.html", "ai-money-arc.html", "categories.html",
    "creator-arsenal-1000.html", "creator-bundle-500.html", "creator-crate-100.html",
    "creator-stash-700.html", "creator-vault-300.html", "eboox-100.html", "faq.html",
    "how-it-works.html", "index.html", "notion-bundle.html", "notion-template.html",
    "notion-templates.html", "privacy.html", "products.html", "refund-policy.html",
    "terms.html", "webble-100.html", "webble-300.html", "webble-500.html", "webble-700.html"
  ];
  for (const file of pages) {
    const html = read(file);
    assert.match(html, /<canvas[^>]*id="starfield"/i, file + ": starfield canvas");
    assert.match(html, /<script[^>]+src="stars\.js(?:\?[^"]*)?"/i, file + ": starfield animation script");
  }
});

test("homepage features Notion templates with a hero CTA and a dedicated promo strip", () => {
  const html = read("index.html");
  assert.match(html, /class="button button-light" href="notion-templates\.html">Explore templates/);
  assert.match(html, /class="home-template-promo"/);
  assert.match(html, /href="notion-templates\.html">Browse templates/);
});

test("light marketplace stylesheet keeps stars visible but subtle", () => {
  const css = read("stars.css");
  assert.match(css, /body\.nt-page #starfield/);
  assert.match(css, /mix-blend-mode:multiply/);
});
