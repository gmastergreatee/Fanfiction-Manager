// Version 4/tests/test-phase4-extended-mcp-epub.js
/**
 * Test Suite for Phase 4: Extended Features, MCP Server, EPUB Exporter, & Remote Rule Sync
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const DatabaseClient = require('../src/core/db');
const MCPServer = require('../src/mcp/server');
const { EpubExporter } = require('../src/core/epub');
const RuleSyncManager = require('../src/core/rule-sync');
const RuleStudioService = require('../src/rule-studio/rule-studio-service');

async function runPhase4Tests() {
  console.log('🧪 Running Phase 4: MCP Server, EPUB Exporter, & Extended Features Test Suite...\n');

  const testDbPath = path.join(__dirname, 'test_phase4_db.sqlite');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  const db = new DatabaseClient(testDbPath);

  // --- 1. Test Model Context Protocol (MCP) Server (JSON-RPC & SSE) ---
  console.log('  1. Testing Native MCP Server (JSON-RPC 2.0 & SSE HTTP Transport)...');
  const mcpPort = 4499;
  const mcpServer = new MCPServer({ db, ssePort: mcpPort });
  const sseHttp = mcpServer.startSSE(mcpPort);

  // Wait for server to bind
  await new Promise((res) => setTimeout(res, 80));

  // Test initialize JSON-RPC
  const initRes = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {},
  });
  assert.strictEqual(initRes.result.serverInfo.name, 'fanfiction-manager-mcp');
  assert.strictEqual(initRes.result.protocolVersion, '2024-11-05');

  // Test tools/list
  const toolsRes = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  });
  const toolNames = toolsRes.result.tools.map((t) => t.name);
  assert.ok(toolNames.includes('inspect_webpage'));
  assert.ok(toolNames.includes('analyze_novel_structure'));
  assert.ok(toolNames.includes('test_rule_execution'));
  assert.ok(toolNames.includes('save_site_rule'));
  assert.ok(toolNames.includes('list_existing_rules'));
  assert.ok(toolNames.includes('query_library'));

  // Test tools/call: analyze_novel_structure
  const analyzeRes = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'analyze_novel_structure',
      arguments: {
        url: 'https://royalroad.com/fiction/1234/test-story',
        html_snippet: '<h1>Test Title</h1><div class="chapter-inner"><p>Text</p></div>',
      },
    },
  });
  const analysisData = JSON.parse(analyzeRes.result.content[0].text);
  assert.strictEqual(analysisData.heuristic_score, 95);
  assert.ok(analysisData.suggested_selectors.title.includes('h1'));

  // Test tools/call: test_rule_execution
  const testExecRes = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'test_rule_execution',
      arguments: {
        test_url: 'https://example.com/fiction/1',
        step: 'toc',
        code: `const title = document.querySelector('h1').innerText; return { Title: title, ChapterCount: 2 };`,
      },
    },
  });
  const execData = JSON.parse(testExecRes.result.content[0].text);
  assert.strictEqual(execData.success, true);
  assert.strictEqual(execData.output.Title, 'The Legend of Ascendance');

  // Test tools/call: save_site_rule
  const saveRuleRes = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'save_site_rule',
      arguments: {
        rule_name: 'MCP Generated Fiction Site',
        url_regex: 'mcp-test\\.com\\/.*',
        toc_code: 'return { Title: "MCP Title" };',
        chapter_code: 'return [{ title: "Ch 1", content: "..." }];',
      },
    },
  });
  const saveOutput = JSON.parse(saveRuleRes.result.content[0].text);
  assert.strictEqual(saveOutput.saved, true);

  // Verify saved in SQLite database
  const savedInDb = db.getAllRules().find((r) => r.rule_name === 'MCP Generated Fiction Site');
  assert.ok(savedInDb, 'Rule saved via MCP must exist in SQLite database');

  // Test SSE HTTP /message endpoint
  const httpMessageResponse = await new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'list_existing_rules', arguments: {} },
    });
    const req = http.request(
      `http://127.0.0.1:${mcpPort}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => resolve(JSON.parse(buf)));
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  assert.strictEqual(httpMessageResponse.id, 6);
  mcpServer.stop();
  console.log('  ✅ Native MCP Server (JSON-RPC & SSE) fully verified.');

  // --- 2. Test EPUB Exporter ---
  console.log('  2. Testing Built-in EPUB Exporter (Pure Node.js Zip & XML Spec)...');
  const exporter = new EpubExporter();
  const sampleNovel = {
    id: 'novel-epub-test-01',
    title: 'The Starlight Chronicle',
    author: 'A. E. Vance',
    summary: 'Across the galactic rim, ancient civilizations awaken from slumber.',
  };

  const sampleChapters = [
    {
      chapter_index: 1,
      title: 'Chapter 1: The Nebula Beacon',
      content_html: '<p>The navigational array hummed softly in the silence of deep space.</p><p>Commander Ray looked upon the shifting cosmic dust with steady eyes.</p>',
      is_downloaded: true,
    },
    {
      chapter_index: 2,
      title: 'Chapter 2: Signals in the Dark',
      content_html: '<p>Anomalous radio frequencies surged through the primary sensor grid.</p><p>"Brace for translation," the navigator warned.</p>',
      is_downloaded: true,
    },
  ];

  const epubBuffer = exporter.generateEpub(sampleNovel, sampleChapters);
  assert.ok(Buffer.isBuffer(epubBuffer), 'Output must be a binary Buffer');
  assert.ok(epubBuffer.length > 500, 'EPUB file must contain valid payload');

  // Verify Zip Signature: PK\x03\x04 (0x04034b50)
  assert.strictEqual(epubBuffer.readUInt32LE(0), 0x04034b50, 'Magic bytes must match ZIP standard');

  // Verify uncompressed mimetype as first entry
  const mimetypeSlice = epubBuffer.toString('utf8', 30, 30 + 8);
  assert.strictEqual(mimetypeSlice, 'mimetype', 'First zip entry must be mimetype');
  assert.ok(epubBuffer.toString('utf8').includes('application/epub+zip'), 'mimetype content verified');

  // Verify OPF metadata manifest, TOC, and chapters are indexed in zip headers
  const epubString = epubBuffer.toString('utf8');
  assert.ok(epubString.includes('OEBPS/content.opf'), 'content.opf must exist in package');
  assert.ok(epubString.includes('OEBPS/chapter_1.xhtml'), 'chapter_1.xhtml must exist');
  assert.ok(epubString.includes('OEBPS/chapter_2.xhtml'), 'chapter_2.xhtml must exist');
  assert.ok(epubString.includes('OEBPS/toc.ncx'), 'toc.ncx navigation must exist');
  assert.ok(epubString.includes('META-INF/container.xml'), 'container.xml must exist');

  // Test exportToFile
  const testEpubOut = path.join(__dirname, 'test_output.epub');
  const exportRes = exporter.exportToFile(sampleNovel, sampleChapters, testEpubOut);
  assert.strictEqual(exportRes.success, true);
  assert.ok(fs.existsSync(testEpubOut));
  fs.unlinkSync(testEpubOut);

  console.log(`  ✅ EPUB Exporter verified (${epubBuffer.length} bytes generated with valid OEBPS container).`);

  // --- 3. Test Remote Rule Sync Engine ---
  console.log('  3. Testing Remote Rule Sync & Version Comparison Engine...');
  const syncManager = new RuleSyncManager({ db });

  const remoteRuleCatalog = [
    {
      guid: 'fanfiction-net-official',
      rule_name: 'FanFiction.net',
      url_regex: 'fanfiction\\.net\\/s\\/.*',
      version: 7, // Higher version to trigger update
      toc_code: 'return { Title: "Updated FFN" };',
      chapter_code: 'return [{ content: "FFN Ch" }];',
    },
    {
      guid: 'brand-new-site-guid',
      rule_name: 'Brand New Site',
      url_regex: 'newsite\\.com\\/.*',
      version: 1, // Brand new rule to trigger addition
      toc_code: 'return { Title: "New Site" };',
      chapter_code: 'return [{ content: "New Ch" }];',
    },
  ];

  const syncReport = await syncManager.syncRules(remoteRuleCatalog);
  assert.strictEqual(syncReport.checked, 2);
  assert.ok(syncReport.added >= 1, 'Should add brand new rule');

  const syncedRule = db.getAllRules().find((r) => r.guid === 'brand-new-site-guid');
  assert.ok(syncedRule, 'Brand new rule must be inserted into database');
  assert.strictEqual(syncedRule.rule_name, 'Brand New Site');

  console.log('  ✅ Remote Rule Sync & schema merging verified.');

  // --- 4. Test Rule Studio Visual Picker Compiler ---
  console.log('  4. Testing Rule Studio Visual Picker Selector Compiler...');
  const studioService = new RuleStudioService({ db });
  const compiled = studioService.compileVisualSelectorsToRule('https://lightnovelworld.com', {
    title: 'h1.novel-name',
    cover: '.book-cover img',
    chapters: '.chapter-list a',
    content: '#chapter-text',
  });

  assert.strictEqual(compiled.rule_name, 'Lightnovelworld.com');
  assert.ok(compiled.toc_code.includes('h1.novel-name'));
  assert.ok(compiled.chapter_code.includes('#chapter-text'));
  assert.ok(compiled.url_regex.includes('lightnovelworld\\.com'));

  console.log('  ✅ Visual Picker selector compiler verified.');

  // Clean up
  db.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  console.log('\n🎉 ALL PHASE 4 TESTS PASSED! 100% SUCCESS.\n');
}

if (require.main === module) {
  runPhase4Tests().catch((err) => {
    console.error('❌ Phase 4 Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { runPhase4Tests };
