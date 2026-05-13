import { describe, it, expect } from "vitest";
import { generateSitemap } from "../../../scripts/gen-sitemap.mjs";

describe("generateSitemap", () => {
  it("contains root url with priority 1.0", () => {
    const xml = generateSitemap("https://bidtolist.com");
    expect(xml).toContain("<loc>https://bidtolist.com/</loc>");
    expect(xml).toContain("<priority>1.0</priority>");
  });

  it("contains agents/browse url", () => {
    const xml = generateSitemap("https://bidtolist.com");
    expect(xml).toContain("<loc>https://bidtolist.com/agents/browse</loc>");
    expect(xml).toContain("<priority>0.8</priority>");
  });

  it("respects custom base url", () => {
    const xml = generateSitemap("https://staging.bidtolist.com");
    expect(xml).toContain("https://staging.bidtolist.com/");
  });

  it("produces valid xml envelope", () => {
    const xml = generateSitemap();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<urlset");
    expect(xml).toContain("</urlset>");
  });

  it("strips trailing slash from base url", () => {
    const xml = generateSitemap("https://bidtolist.com/");
    expect(xml).not.toContain("https://bidtolist.com//");
  });
});
