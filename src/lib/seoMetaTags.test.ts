import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

function getMetaContent(
  attributeName: "name" | "property",
  attributeValue: string,
): string | null {
  const attrFirst = new RegExp(
    `<meta\\s+[^>]*${attributeName}=["']${attributeValue}["'][^>]*content=["']([^"']+)["'][^>]*\\/?>`,
    "i",
  );
  const contentFirst = new RegExp(
    `<meta\\s+[^>]*content=["']([^"']+)["'][^>]*${attributeName}=["']${attributeValue}["'][^>]*\\/?>`,
    "i",
  );

  return attrFirst.exec(indexHtml)?.[1] ?? contentFirst.exec(indexHtml)?.[1] ?? null;
}

describe("index.html SEO metadata", () => {
  it("defines canonical, Open Graph, and Twitter meta tags", () => {
    expect(indexHtml).toMatch(
      /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']https:\/\/admirable-marzipan-f2cfa1\.netlify\.app\/["'][^>]*\/?>/i,
    );

    expect(getMetaContent("property", "og:title")).toBeTruthy();
    expect(getMetaContent("property", "og:description")).toBeTruthy();
    expect(getMetaContent("property", "og:type")).toBe("website");
    expect(getMetaContent("property", "og:url")).toBe(
      "https://admirable-marzipan-f2cfa1.netlify.app/",
    );
    expect(getMetaContent("property", "og:site_name")).toBe("Stillgarden");
    expect(getMetaContent("property", "og:image")).toBe(
      "https://admirable-marzipan-f2cfa1.netlify.app/favicon.svg",
    );

    expect(getMetaContent("name", "twitter:card")).toBe("summary");
    expect(getMetaContent("name", "twitter:title")).toBeTruthy();
    expect(getMetaContent("name", "twitter:description")).toBeTruthy();
    expect(getMetaContent("name", "twitter:image")).toBe(
      "https://admirable-marzipan-f2cfa1.netlify.app/favicon.svg",
    );
  });
});
