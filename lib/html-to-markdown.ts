import * as cheerio from "cheerio";

const REMOVE_SELECTORS = [
  "script",
  "style",
  "nav",
  "footer",
  "header",
  "aside",
  ".ad",
  ".ads",
  ".advertisement",
  ".sidebar",
  ".comment",
  ".comments",
  ".related",
  ".recommended",
  ".newsletter",
  ".subscription",
  ".popup",
  ".modal",
  '[role="banner"]',
  '[role="navigation"]',
  '[role="complementary"]',
  '[class*="cookie"]',
  '[class*="consent"]',
];

const CAPTCHA_SELECTORS = [
  "#captcha",
  ".g-recaptcha",
  ".h-captcha",
  '[class*="captcha"]',
  '[id*="captcha"]',
  ".cf-browser-verification",
  "#challenge-running",
  '[data-sitekey]',
];

export function detectCaptcha(html: string): boolean {
  const $ = cheerio.load(html);
  return CAPTCHA_SELECTORS.some((sel) => $(sel).length > 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function elementToMarkdown($: cheerio.CheerioAPI, el: any): string {
  const $el = $(el);
  const tag = el.type === "tag" ? el.name : "";

  switch (tag) {
    case "h1":
      return `\n# ${$el.text().trim()}\n`;
    case "h2":
      return `\n## ${$el.text().trim()}\n`;
    case "h3":
      return `\n### ${$el.text().trim()}\n`;
    case "h4":
      return `\n#### ${$el.text().trim()}\n`;
    case "h5":
      return `\n##### ${$el.text().trim()}\n`;
    case "h6":
      return `\n###### ${$el.text().trim()}\n`;
    case "p":
      return `\n${$el.text().trim()}\n`;
    case "pre": {
      const code = $el.find("code").length ? $el.find("code").text() : $el.text();
      return `\n\`\`\`\n${code.trim()}\n\`\`\`\n`;
    }
    case "code": {
      if ($el.parent().prop("tagName")?.toLowerCase() === "pre") return "";
      return `\`${$el.text()}\``;
    }
    case "ul": {
      const items = $el
        .find("li")
        .map((_, li) => `- ${$(li).text().trim()}`)
        .get();
      return `\n${items.join("\n")}\n`;
    }
    case "ol": {
      const items = $el
        .find("li")
        .map((i, li) => `${i + 1}. ${$(li).text().trim()}`)
        .get();
      return `\n${items.join("\n")}\n`;
    }
    case "blockquote":
      return `\n> ${$el.text().trim()}\n`;
    case "a": {
      const href = $el.attr("href") || "";
      const text = $el.text().trim();
      return text ? `[${text}](${href})` : "";
    }
    case "img": {
      const alt = $el.attr("alt") || "";
      const src = $el.attr("src") || "";
      return src ? `![${alt}](${src})` : "";
    }
    case "table": {
      const rows = $el
        .find("tr")
        .map((_, tr) => {
          const cells = $(tr)
            .find("td, th")
            .map((__, cell) => $(cell).text().trim())
            .get();
          return `| ${cells.join(" | ")} |`;
        })
        .get();
      if (rows.length > 1) {
        rows.splice(1, 0, `| ${rows[0].split("|").filter(Boolean).map(() => "---").join(" | ")} |`);
      }
      return `\n${rows.join("\n")}\n`;
    }
    case "br":
      return "\n";
    case "hr":
      return "\n---\n";
    default:
      return "";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findMainContent($: cheerio.CheerioAPI): any {
  const article = $("article");
  if (article.length && article.text().trim().length > 200) return article;

  const main = $("main");
  if (main.length && main.text().trim().length > 200) return main;

  let bestDiv = $("body");
  let bestLength = 0;
  $("div").each((_, el) => {
    const text = $(el).text().trim().length;
    if (text > bestLength) {
      bestLength = text;
      bestDiv = $(el);
    }
  });

  return bestDiv;
}

export interface ExtractedContent {
  title: string;
  content: string;
  author?: string;
}

export function extractContent(html: string): ExtractedContent {
  const $ = cheerio.load(html);

  for (const sel of REMOVE_SELECTORS) {
    $(sel).remove();
  }

  const title =
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    "Untitled";

  const author =
    $('meta[name="author"]').attr("content") ||
    $('[rel="author"]').text().trim() ||
    undefined;

  const contentEl = findMainContent($);
  let markdown = "";

  contentEl.children().each((_: number, el: any) => {
    markdown += elementToMarkdown($, el);
  });

  markdown = markdown
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/^\s+/, "")
    .trim();

  return { title, content: markdown, author };
}
