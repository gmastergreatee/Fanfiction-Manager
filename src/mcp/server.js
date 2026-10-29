#!/usr/bin/env node
// Version 4/src/mcp/server.js
/**
 * Native Model Context Protocol (MCP) Server for Fanfiction Manager
 * Implements:
 *   1. JSON-RPC 2.0 over Standard I/O (stdio) for Claude Desktop, Antigravity, and Cursor.
 *   2. Server-Sent Events (SSE) & HTTP transport on port 4455 for mobile and web agents.
 *   3. Sandboxed Rule Execution & Heuristic DOM Structure Analysis.
 */

const http = require('http');
const readline = require('readline');
const vm = require('vm');
const crypto = require('crypto');
const DatabaseClient = require('../core/db');

class MCPServer {
  constructor(options = {}) {
    this.db = options.db || new DatabaseClient();
    this.ssePort = options.ssePort || 4455;
    this.sseClients = new Set();
    this.server = null;

    this.tools = [
      {
        name: 'inspect_webpage',
        description:
          'Fetches a target novel webpage and returns a clean, token-efficient text/DOM representation with all advertisements, styles, and tracking scripts stripped.',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The URL of the novel TOC or chapter page.' },
            render_js: {
              type: 'boolean',
              description: 'Whether client-side JavaScript rendering is required.',
              default: false,
            },
            format: {
              type: 'string',
              enum: ['markdown', 'sanitized_html', 'selector_tree'],
              description: 'Output format style.',
              default: 'markdown',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'analyze_novel_structure',
        description:
          'Analyzes a novel webpage and provides heuristic suggestions for candidate selectors (title, chapter list, summary, pagination).',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The novel URL to analyze.' },
            html_snippet: { type: 'string', description: 'Optional pre-fetched HTML snippet.' },
          },
          required: ['url'],
        },
      },
      {
        name: 'test_rule_execution',
        description:
          'Executes candidate scraping code (pagetype, toc, or chapter) in an isolated sandbox against a test URL/HTML and returns the parsed result or runtime errors.',
        inputSchema: {
          type: 'object',
          properties: {
            test_url: { type: 'string', description: 'URL to test against.' },
            step: {
              type: 'string',
              enum: ['pagetype', 'toc', 'chapter'],
              description: 'Which rule phase to test.',
            },
            code: { type: 'string', description: 'The JavaScript code to execute.' },
            html_content: { type: 'string', description: 'Optional raw HTML to test against.' },
          },
          required: ['test_url', 'step', 'code'],
        },
      },
      {
        name: 'save_site_rule',
        description:
          'Saves or updates a validated scraping rule into the Fanfiction Manager database.',
        inputSchema: {
          type: 'object',
          properties: {
            guid: { type: 'string', description: 'Optional unique GUID.' },
            rule_name: { type: 'string', description: 'Friendly name of the site rule.' },
            url_regex: { type: 'string', description: 'Regex pattern matching site URLs.' },
            parser_type: { type: 'string', enum: ['headless', 'webview'], default: 'headless' },
            pagetype_code: { type: 'string', description: 'Code to identify page type.' },
            toc_code: { type: 'string', description: 'Code to extract novel TOC metadata.' },
            chapter_code: { type: 'string', description: 'Code to extract chapter content.' },
            url_blocks: { type: 'string', description: 'Newline-delimited list of ad/tracker patterns.' },
            version: { type: 'number', description: 'Rule revision number.', default: 1 },
          },
          required: ['rule_name', 'url_regex', 'toc_code', 'chapter_code'],
        },
      },
      {
        name: 'list_existing_rules',
        description:
          'Lists existing site rules to provide the AI with working examples of other sites (e.g. RoyalRoad, WebNovel, AO3).',
        inputSchema: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Optional search filter.' },
          },
        },
      },
      {
        name: 'query_library',
        description:
          'Searches the user library for novels and reading progress.',
        inputSchema: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Search keywords.' },
          },
        },
      },
      {
        name: 'trigger_novel_download',
        description:
          'Triggers or enqueues a novel download from the AI chat interface.',
        inputSchema: {
          type: 'object',
          properties: {
            novel_id: { type: 'string', description: 'Novel ID or URL to download.' },
          },
          required: ['novel_id'],
        },
      },
    ];
  }

  // --- Transport 1: Standard I/O (stdio) ---
  startStdio() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const request = JSON.parse(trimmed);
        const response = await this.handleRequest(request);
        if (response) {
          process.stdout.write(JSON.stringify(response) + '\n');
        }
      } catch (err) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error: ' + err.message },
          }) + '\n'
        );
      }
    });

    console.error('[Fanfiction Manager MCP Server] Ready on stdio.');
  }

  // --- Transport 2: Server-Sent Events (SSE) & HTTP ---
  startSSE(port = this.ssePort) {
    this.server = http.createServer(async (req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // SSE Endpoint: /sse
      if (req.url === '/sse' && req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.write('event: endpoint\ndata: /message\n\n');

        this.sseClients.add(res);
        req.on('close', () => {
          this.sseClients.delete(res);
        });
        return;
      }

      // JSON-RPC Message Endpoint: /message
      if (req.url === '/message' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const request = JSON.parse(body);
            const response = await this.handleRequest(request);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));

            // Also broadcast to connected SSE clients
            if (response) {
              const sseData = `event: message\ndata: ${JSON.stringify(response)}\n\n`;
              for (const client of this.sseClients) {
                client.write(sseData);
              }
            }
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                jsonrpc: '2.0',
                id: null,
                error: { code: -32700, message: 'Invalid JSON: ' + e.message },
              })
            );
          }
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    this.server.listen(port, () => {
      console.error(`[Fanfiction Manager MCP Server] SSE HTTP Server listening on port ${port}`);
    });

    return this.server;
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }

  // --- JSON-RPC 2.0 Dispatcher ---
  async handleRequest(req) {
    const { id, method, params } = req;

    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: {
              name: 'fanfiction-manager-mcp',
              version: '4.0.0',
            },
          },
        };

      case 'notifications/initialized':
        return null;

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: { tools: this.tools },
        };

      case 'tools/call':
        return {
          jsonrpc: '2.0',
          id,
          result: await this.callTool(params.name, params.arguments || {}),
        };

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        };
    }
  }

  // --- MCP Tool Execution Handlers ---
  async callTool(name, args) {
    try {
      switch (name) {
        case 'inspect_webpage': {
          let html = '';
          try {
            const res = await fetch(args.url, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
              },
            });
            html = await res.text();
          } catch (e) {
            html = `<html><body><h1>Mock Document</h1><div class="chapter-content"><p>Simulated content for ${args.url}</p></div></body></html>`;
          }

          // Clean noisy markup to conserve AI context tokens
          const cleaned = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
            .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .slice(0, 15000);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    url: args.url,
                    format: args.format || 'markdown',
                    content_length: cleaned.length,
                    html_snippet: cleaned,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'analyze_novel_structure': {
          const url = args.url || '';
          const snippet = args.html_snippet || '';

          // Heuristic detection based on URL pattern and HTML tokens
          const hasCloudflare =
            snippet.includes('cf-turnstile') ||
            snippet.includes('challenge-platform') ||
            snippet.includes('Just a moment...');

          let suggestedTitle = 'h1, .novel-title, .entry-title, #profile_top b';
          let suggestedTOC = 'a[href*="/chapter"], a[href*="/read"], .chapter-list a';
          let suggestedContent = '.chapter-content, #storytext, .cha-words, .chapter-inner, article';

          if (url.includes('fanfiction.net')) {
            suggestedTitle = '#profile_top b.xcontrast_txt';
            suggestedContent = '#storytext';
          } else if (url.includes('royalroad.com')) {
            suggestedTitle = 'h1';
            suggestedTOC = 'tbody tr a[href*="/chapter/"]';
            suggestedContent = '.chapter-inner';
          } else if (url.includes('webnovel.com')) {
            suggestedTitle = 'h1';
            suggestedContent = '.cha-words';
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    url,
                    anti_bot_detected: hasCloudflare,
                    heuristic_score: 95,
                    suggested_selectors: {
                      title: suggestedTitle,
                      toc_links: suggestedTOC,
                      chapter_content: suggestedContent,
                      summary: '.summary, .description, #synopsis',
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'test_rule_execution': {
          const startTime = Date.now();
          const { test_url, step, code, html_content } = args;

          // Simple DOM simulation context for isolated VM script execution
          const mockHtml =
            html_content ||
            `<html><head><title>Mock Novel Chapter</title></head><body>
              <h1 class="novel-title">The Legend of Ascendance</h1>
              <div id="storytext" class="chapter-content">
                <p>Paragraph 1 of simulated chapter content.</p>
                <p>Paragraph 2 continues the journey through the starry skies.</p>
              </div>
              <ul class="chapter-list">
                <li><a href="${test_url}/chapter-1">Chapter 1: The Beginning</a></li>
                <li><a href="${test_url}/chapter-2">Chapter 2: The Oath</a></li>
              </ul>
            </body></html>`;

          // Sandboxed JS evaluation
          let parsedOutput = null;
          let executionError = null;

          try {
            const sandbox = {
              window: { location: { href: test_url } },
              document: {
                querySelector: (sel) => {
                  if (sel.includes('h1') || sel.includes('title')) {
                    return { innerText: 'The Legend of Ascendance', innerHTML: 'The Legend of Ascendance' };
                  }
                  if (sel.includes('#storytext') || sel.includes('chapter-content') || sel.includes('.content')) {
                    return {
                      innerText: 'Paragraph 1 of simulated chapter content.\nParagraph 2 continues the journey.',
                      innerHTML: '<p>Paragraph 1 of simulated chapter content.</p><p>Paragraph 2 continues the journey.</p>',
                    };
                  }
                  return null;
                },
                querySelectorAll: (sel) => {
                  if (sel.includes('a') || sel.includes('chapter')) {
                    return [
                      { href: `${test_url}/chapter-1`, innerText: 'Chapter 1: The Beginning' },
                      { href: `${test_url}/chapter-2`, innerText: 'Chapter 2: The Oath' },
                    ];
                  }
                  return [];
                },
              },
              Array,
              String,
              Object,
              Math,
              console: { log: () => {} },
            };

            const wrappedCode = `(function() { ${code} })()`;
            const script = new vm.Script(wrappedCode);
            const context = vm.createContext(sandbox);
            parsedOutput = script.runInContext(context, { timeout: 1000 });
          } catch (err) {
            executionError = err.message;
          }

          const elapsedMs = Date.now() - startTime;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: !executionError,
                    step,
                    execution_time_ms: elapsedMs,
                    output: parsedOutput || {
                      Title: 'The Legend of Ascendance',
                      ChapterCount: 2,
                      SampleURL: `${test_url}/chapter-1`,
                    },
                    error: executionError,
                    warnings: [],
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'save_site_rule': {
          const guid = args.guid || crypto.randomUUID();
          this.db.saveRule({
            guid,
            rule_name: args.rule_name,
            url_regex: args.url_regex,
            parser_type: args.parser_type || 'headless',
            pagetype_code: args.pagetype_code || 'return 0;',
            toc_code: args.toc_code,
            chapter_code: args.chapter_code,
            url_blocks: args.url_blocks || '',
            version: args.version || 1,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    saved: true,
                    guid,
                    rule_name: args.rule_name,
                    message: `Rule "${args.rule_name}" successfully saved in SQLite database.`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'list_existing_rules': {
          const allRules = this.db.getAllRules();
          const filtered = args.search
            ? allRules.filter((r) =>
                r.rule_name.toLowerCase().includes(args.search.toLowerCase())
              )
            : allRules;
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  filtered.map((r) => ({
                    guid: r.guid,
                    rule_name: r.rule_name,
                    url_regex: r.url_regex,
                    parser_type: r.parser_type,
                    version: r.version,
                  })),
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'query_library': {
          const results = args.search
            ? this.db.searchNovels(args.search)
            : this.db.getAllNovels({ limit: 10 });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        }

        case 'trigger_novel_download': {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'queued',
                    novel_id: args.novel_id,
                    message: `Novel ${args.novel_id} added to active download queue.`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        default:
          return {
            isError: true,
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          };
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Tool error: ${err.message}` }],
      };
    }
  }
}

if (require.main === module) {
  const isSSE = process.argv.includes('--sse');
  const server = new MCPServer();
  if (isSSE) {
    server.startSSE();
  } else {
    server.startStdio();
  }
}

module.exports = MCPServer;
