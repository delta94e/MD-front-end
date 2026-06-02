import { readFile, readdir, writeFile, mkdir } from "fs/promises";
import { join, basename, extname } from "path";
import * as cheerio from "cheerio";

// --- Quoted-Printable Decoder ---

function decodeQuotedPrintableBuffer(buffer: Buffer): string {
  const bytes: number[] = [];
  let i = 0;

  while (i < buffer.length) {
    const byte = buffer[i];

    if (byte === 0x3d && i + 2 < buffer.length) {
      // Check for =XX hex sequence
      const hex1 = buffer[i + 1];
      const hex2 = buffer[i + 2];

      if (isHexDigit(hex1) && isHexDigit(hex2)) {
        bytes.push(parseInt(String.fromCharCode(hex1, hex2), 16));
        i += 3;
        continue;
      }

      // Check for soft line break =\r\n or =\n
      if (hex1 === 0x0d && hex2 === 0x0a) {
        i += 3; // Skip =\r\n
        continue;
      }
      if (hex1 === 0x0a) {
        i += 2; // Skip =\n
        continue;
      }
    }

    bytes.push(byte);
    i++;
  }

  return Buffer.from(bytes).toString("utf-8");
}

function isHexDigit(byte: number): boolean {
  return (
    (byte >= 0x30 && byte <= 0x39) || // 0-9
    (byte >= 0x41 && byte <= 0x46) || // A-F
    (byte >= 0x61 && byte <= 0x66)    // a-f
  );
}

// --- MHTML Parser ---

function extractHtmlFromMhtml(filePath: string, content: Buffer): string {
  // Extract boundary from the buffer
  const contentStr = content.toString("latin1"); // Use latin1 to preserve bytes
  const boundaryMatch = contentStr.match(/boundary="([^"]+)"/);
  if (!boundaryMatch) {
    throw new Error("Could not find MHTML boundary");
  }
  const boundary = boundaryMatch[1];

  // Find the HTML part using Buffer operations
  const htmlMarker = Buffer.from("Content-Type: text/html");
  const htmlStart = content.indexOf(htmlMarker);

  if (htmlStart === -1) {
    throw new Error("Could not find HTML part in MHTML");
  }

  // Find the blank line after headers (\r\n\r\n or \n\n)
  let bodyStart = content.indexOf(Buffer.from("\r\n\r\n"), htmlStart);
  if (bodyStart !== -1) {
    bodyStart += 4;
  } else {
    bodyStart = content.indexOf(Buffer.from("\n\n"), htmlStart);
    if (bodyStart !== -1) {
      bodyStart += 2;
    } else {
      throw new Error("Could not find HTML body start");
    }
  }

  // Find the next boundary
  const boundaryBuf = Buffer.from(`--${boundary}`);
  let bodyEnd = content.indexOf(boundaryBuf, bodyStart);
  if (bodyEnd === -1) {
    bodyEnd = content.length;
  }

  // Extract the HTML body as buffer
  const htmlBody = content.subarray(bodyStart, bodyEnd);

  // Decode quoted-printable
  return decodeQuotedPrintableBuffer(htmlBody);
}

// --- Title Extraction ---

function extractTitle($: cheerio.CheerioAPI): string {
  // From <title> tag
  const titleTag = $("title").text().trim();
  if (titleTag && titleTag !== "Claude") {
    return titleTag.replace(/\s*-\s*Claude\s*$/, "").trim();
  }

  // Fallback: first h1 in claude response
  const firstH1 = $(".font-claude-response h1").first().text().trim();
  if (firstH1) return firstH1;

  // Fallback: first h2
  const firstH2 = $(".font-claude-response h2").first().text().trim();
  if (firstH2) return firstH2;

  return "Untitled Conversation";
}

// --- HTML to Markdown Conversion ---

function elementToMarkdown($: cheerio.CheerioAPI, el: cheerio.Element): string {
  const $el = $(el);
  const tag = el.type === "tag" ? el.name : "";

  switch (tag) {
    case "h1":
      return `\n# ${$el.text().trim()}\n\n`;
    case "h2":
      return `\n## ${$el.text().trim()}\n\n`;
    case "h3":
      return `\n### ${$el.text().trim()}\n\n`;
    case "h4":
      return `\n#### ${$el.text().trim()}\n\n`;
    case "h5":
      return `\n##### ${$el.text().trim()}\n\n`;
    case "h6":
      return `\n###### ${$el.text().trim()}\n\n`;
    case "p": {
      const text = inlineToMarkdown($, $el);
      return text.trim() ? `\n${text.trim()}\n\n` : "";
    }
    case "pre": {
      const $code = $el.find("code");
      let lang = "";
      if ($code.length) {
        const classes = $code.attr("class") || "";
        const langMatch = classes.match(/language-(\w+)/);
        if (langMatch) lang = langMatch[1];
      }
      const code = $code.length ? $code.text() : $el.text();
      return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
    }
    case "code": {
      if ($el.parent().prop("tagName")?.toLowerCase() === "pre") return "";
      return `\`${$el.text()}\``;
    }
    case "ul": {
      const items = $el
        .find("> li")
        .map((_, li) => {
          const text = inlineToMarkdown($, $(li));
          return `- ${text.trim()}`;
        })
        .get();
      return `\n${items.join("\n")}\n\n`;
    }
    case "ol": {
      const items = $el
        .find("> li")
        .map((i, li) => {
          const text = inlineToMarkdown($, $(li));
          return `${i + 1}. ${text.trim()}`;
        })
        .get();
      return `\n${items.join("\n")}\n\n`;
    }
    case "blockquote": {
      const inner = childrenToMarkdown($, $el);
      const quoted = inner
        .split("\n")
        .map((line) => (line.trim() ? `> ${line}` : ">"))
        .join("\n");
      return `\n${quoted}\n\n`;
    }
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
        const colCount = rows[0].split("|").filter(Boolean).length;
        rows.splice(1, 0, `| ${Array(colCount).fill("---").join(" | ")} |`);
      }
      return `\n${rows.join("\n")}\n\n`;
    }
    case "br":
      return "\n";
    case "hr":
      return "\n---\n\n";
    case "div":
    case "section":
    case "article":
    case "span":
      return childrenToMarkdown($, $el);
    case "strong":
    case "b":
      return `**${$el.text().trim()}**`;
    case "em":
    case "i":
      return `*${$el.text().trim()}*`;
    case "del":
    case "s":
      return `~~${$el.text().trim()}~~`;
    default:
      return "";
  }
}

function inlineToMarkdown($: cheerio.CheerioAPI, $el: cheerio.Cheerio<cheerio.AnyNode>): string {
  let result = "";
  $el.contents().each((_, node) => {
    if (node.type === "text") {
      result += $(node).text();
    } else if (node.type === "tag") {
      const tag = node.name;
      const $node = $(node);
      if (tag === "strong" || tag === "b") {
        result += `**${$node.text().trim()}**`;
      } else if (tag === "em" || tag === "i") {
        result += `*${$node.text().trim()}*`;
      } else if (tag === "code") {
        result += `\`${$node.text()}\``;
      } else if (tag === "a") {
        const href = $node.attr("href") || "";
        const text = $node.text().trim();
        result += text ? `[${text}](${href})` : "";
      } else if (tag === "br") {
        result += "\n";
      } else {
        result += $node.text();
      }
    }
  });
  return result;
}

function childrenToMarkdown($: cheerio.CheerioAPI, $el: cheerio.Cheerio<cheerio.AnyNode>): string {
  let result = "";
  $el.children().each((_, child) => {
    result += elementToMarkdown($, child);
  });
  return result;
}

// --- Message Extraction ---

interface Message {
  role: "user" | "claude";
  content: string;
}

function extractMessages($: cheerio.CheerioAPI): Message[] {
  const messages: Message[] = [];

  // Find all message containers in order
  // User messages: [data-testid="user-message"] or [data-testid="human-message"]
  // Claude messages: [data-is-streaming] or .font-claude-response or .font-claude-message

  const body = $("body");

  // Collect all user and claude message elements with their DOM positions
  const elements: Array<{ el: cheerio.Cheerio<cheerio.AnyNode>; role: "user" | "claude" }> = [];

  // Find user messages
  body.find('[data-testid="user-message"], [data-testid="human-message"]').each((_, el) => {
    elements.push({ el: $(el), role: "user" });
  });

  // Find claude responses - try multiple selectors
  body.find('[data-is-streaming]').each((_, el) => {
    const $el = $(el);
    // Check if this has a claude response/message child
    const hasClaudeChild = $el.find('.font-claude-response, .font-claude-message').length > 0;
    if (hasClaudeChild) {
      elements.push({ el: $el, role: "claude" });
    }
  });

  // Also find .font-claude-response and .font-claude-message
  body.find('.font-claude-response, .font-claude-message').each((_, el) => {
    // Avoid duplicates - check if this element or its parent is already added
    const $el = $(el);
    const isDuplicate = elements.some((e) => {
      return e.role === "claude" && (e.el.is($el) || e.el.find($el).length > 0 || $el.find(e.el).length > 0);
    });
    if (!isDuplicate) {
      elements.push({ el: $el, role: "claude" });
    }
  });

  // Extract content from each element
  for (const { el, role } of elements) {
    if (role === "user") {
      // Clean user message - extract only the message content, not UI elements
      const text = extractUserMessageContent($, el);
      if (text) {
        messages.push({ role: "user", content: text });
      }
    } else {
      // For claude responses, find the actual content container
      let $contentEl = el;

      // If this is a parent container (has data-is-streaming), find the claude response inside
      if (el.attr("data-is-streaming") !== undefined) {
        const claudeResp = el.find('.font-claude-response, .font-claude-message').first();
        if (claudeResp.length) {
          $contentEl = claudeResp;
        }
      }

      const content = extractClaudeContent($, $contentEl);
      if (content.trim()) {
        messages.push({ role: "claude", content });
      }
    }
  }

  // Fallback: if still no messages, try the conversation container approach
  if (messages.length === 0) {
    const conversationContainer = body.find('[class*="flex"][class*="flex-col"]').last();

    if (conversationContainer.length) {
      conversationContainer.children().each((_, turnEl) => {
        const $turn = $(turnEl);

        const userMsg = $turn.find('[data-testid="user-message"], [data-testid="human-message"]');
        if (userMsg.length) {
          const text = extractUserMessageContent($, userMsg);
          if (text) messages.push({ role: "user", content: text });
        }

        const claudeResp = $turn.find('[data-is-streaming], .font-claude-response, .font-claude-message');
        if (claudeResp.length) {
          const content = extractClaudeContent($, claudeResp);
          if (content.trim()) messages.push({ role: "claude", content });
        }
      });
    }
  }

  return messages;
}

function extractUserMessageContent(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<cheerio.AnyNode>
): string {
  // Remove UI elements that shouldn't be in the message
  const $clone = $el.clone();
  $clone.find('[class*="copy"], [class*="button"], [class*="toolbar"], [class*="action"]').remove();
  $clone.find('button').remove();

  // Get text content, cleaning up extra whitespace
  let text = $clone.text().trim();

  // Remove common UI artifacts
  text = text
    .replace(/jsExperience AI code assistant/g, "")
    .replace(/Code Interpretation/g, "")
    .replace(/Copy code/g, "")
    .replace(/Show thinking/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

function extractClaudeContent(
  $: cheerio.CheerioAPI,
  $container: cheerio.Cheerio<cheerio.AnyNode>
): string {
  // Get HTML and re-parse to create a clean copy
  const html = $container.html() || "";
  const $copy = cheerio.load(html);

  // Remove thinking blocks - multiple patterns
  // Pattern 1: Collapsible sections with border and font-ui
  $copy('.border-border-300.font-ui').remove();
  $copy('button[class*="border"]').closest('.flex.flex-col').remove();

  // Pattern 2: Thinking blocks with specific class patterns
  $copy('[class*="thinking"]').remove();
  $copy('[class*="Thinking"]').remove();

  // Pattern 3: Blocks with "thinking" or "Show thinking" text in buttons
  $copy('button').each((_, btn) => {
    const btnText = $copy(btn).text().toLowerCase();
    if (btnText.includes('thinking') || btnText.includes('show thinking')) {
      $copy(btn).closest('.flex.flex-col, .border').remove();
    }
  });

  // Pattern 4: Remove collapsed/expanded thinking sections
  $copy('[data-testid="thinking-block"]').remove();

  // Pattern 5: Remove divs with border-border-300 class (thinking blocks)
  $copy('body').children('div').each((_, el) => {
    const $el = $copy(el);
    const classes = $el.attr("class") || "";
    if (classes.includes("border-border-300") && classes.includes("font-ui")) {
      $el.remove();
    }
  });

  // Find the actual content grid
  const grids = $copy('.grid-cols-1.grid');

  if (grids.length) {
    let allContent = "";
    grids.each((_, grid) => {
      const gridContent = childrenToMarkdown($copy, $copy(grid));
      if (gridContent.trim()) {
        allContent += gridContent;
      }
    });
    if (allContent.trim()) {
      return allContent;
    }
    return childrenToMarkdown($copy, grids.last());
  }

  // Fallback: convert the whole container
  let result = "";
  $copy('body').children().each((_, child) => {
    const $child = $copy(child);
    const text = $child.text().trim();
    if (text) {
      result += childrenToMarkdown($copy, $child);
    }
  });

  return result;
}

// --- Filename Sanitization ---

function sanitizeFilename(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, "") // Remove invalid chars
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\./g, ".") // Keep dots
    .trim()
    .substring(0, 100) // Limit length
    .replace(/\.$/, ""); // Remove trailing dot
}

// --- Main ---

async function main() {
  const inputDir = join(process.cwd(), "docs", "DOC FE");
  const outputDir = join(process.cwd(), "docs", "claude-conversations");

  await mkdir(outputDir, { recursive: true });

  const files = await readdir(inputDir);
  const mhtmlFiles = files.filter((f) => extname(f).toLowerCase() === ".mhtml");

  console.log(`Found ${mhtmlFiles.length} MHTML files`);
  console.log(`Output directory: ${outputDir}\n`);

  let success = 0;
  let failed = 0;

  for (const file of mhtmlFiles) {
    const filePath = join(inputDir, file);
    console.log(`Processing: ${file}`);

    try {
      const content = await readFile(filePath);
      const html = extractHtmlFromMhtml(filePath, content);
      const $ = cheerio.load(html);

      // Extract title
      const title = extractTitle($);
      console.log(`  Title: ${title}`);

      // Extract messages
      const messages = extractMessages($);
      console.log(`  Messages: ${messages.length}`);

      if (messages.length === 0) {
        console.log(`  WARNING: No messages found, skipping`);
        failed++;
        continue;
      }

      // Build markdown
      let markdown = `# ${title}\n\n`;

      for (const msg of messages) {
        if (msg.role === "user") {
          markdown += `## You\n\n${msg.content}\n\n`;
        } else {
          markdown += `## Claude\n\n${msg.content}\n\n`;
        }
      }

      // Clean up excessive newlines
      markdown = markdown
        .replace(/\n{4,}/g, "\n\n\n")
        .replace(/[ \t]+$/gm, "")
        .trim() + "\n";

      // Write output
      const outFilename = sanitizeFilename(title) + ".md";
      const outPath = join(outputDir, outFilename);
      await writeFile(outPath, markdown, "utf-8");

      console.log(`  Output: ${outFilename}`);
      success++;
    } catch (err) {
      console.error(`  ERROR: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
  console.log(`Output directory: ${outputDir}`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
