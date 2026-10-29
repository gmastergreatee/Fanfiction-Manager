// Version 4/tests/test-rollback.js
/**
 * Test Suite: 3-Version Rollback Ring Buffer & Restoration
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const RollbackManager = require('../src/updater/rollback-manager');

async function testRollback() {
  console.log('🧪 Testing 3-Version Rollback Ring Buffer & Restoration...');

  const tempRoot = path.join(__dirname, 'temp_rollback_app');
  const tempSnapshots = path.join(tempRoot, 'v4_data', 'snapshots');
  fs.mkdirSync(tempRoot, { recursive: true });

  try {
    // Create mock app structure
    fs.writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ version: '4.0.0' }));
    fs.writeFileSync(path.join(tempRoot, 'main.js'), '// mock main v4.0.0');
    fs.mkdirSync(path.join(tempRoot, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, 'src', 'app.js'), '// app v4.0.0');

    const manager = new RollbackManager({
      appRoot: tempRoot,
      snapshotsDir: tempSnapshots,
    });

    // 1. Create 4 sequential snapshots (Simulating 4 update cycles)
    console.log('  Creating snapshot 1 (v4.0.0)...');
    await manager.createSnapshotBeforeUpdate('4.0.0');
    await new Promise((r) => setTimeout(r, 10));

    console.log('  Creating snapshot 2 (v4.0.1)...');
    fs.writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ version: '4.0.1' }));
    fs.writeFileSync(path.join(tempRoot, 'main.js'), '// mock main v4.0.1');
    await manager.createSnapshotBeforeUpdate('4.0.1');
    await new Promise((r) => setTimeout(r, 10));

    console.log('  Creating snapshot 3 (v4.0.2)...');
    fs.writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ version: '4.0.2' }));
    fs.writeFileSync(path.join(tempRoot, 'main.js'), '// mock main v4.0.2');
    await manager.createSnapshotBeforeUpdate('4.0.2');
    await new Promise((r) => setTimeout(r, 10));

    console.log('  Creating snapshot 4 (v4.0.3)...');
    fs.writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ version: '4.0.3' }));
    fs.writeFileSync(path.join(tempRoot, 'main.js'), '// mock main v4.0.3');
    await manager.createSnapshotBeforeUpdate('4.0.3');

    // 2. Verify ring buffer keeps exactly 3 snapshots
    const snapshots = manager.listSnapshots();
    assert.strictEqual(snapshots.length, 3, 'Ring buffer must contain exactly 3 snapshots');
    assert.strictEqual(snapshots[0].version, '4.0.3', 'Newest snapshot must be 4.0.3');
    assert.strictEqual(snapshots[1].version, '4.0.2', 'Second snapshot must be 4.0.2');
    assert.strictEqual(snapshots[2].version, '4.0.1', 'Third snapshot must be 4.0.1');
    assert(!snapshots.some((s) => s.version === '4.0.0'), 'Oldest snapshot (4.0.0) must be automatically pruned');

    // 3. Test Rollback to v4.0.1
    console.log('  Testing rollback to v4.0.1...');
    const targetSnapshot = snapshots[2];
    const rollbackResult = await manager.rollbackTo(targetSnapshot.id);

    assert.strictEqual(rollbackResult.success, true);
    assert.strictEqual(rollbackResult.rolledBackToVersion, '4.0.1');

    // Verify restored file contents
    const restoredPkg = JSON.parse(fs.readFileSync(path.join(tempRoot, 'package.json'), 'utf8'));
    assert.strictEqual(restoredPkg.version, '4.0.1', 'package.json must be restored to v4.0.1');

    const restoredMain = fs.readFileSync(path.join(tempRoot, 'main.js'), 'utf8');
    assert.strictEqual(restoredMain, '// mock main v4.0.1', 'main.js must be restored to v4.0.1');

    console.log('✅ ALL ROLLBACK TESTS PASSED!');
  } finally {
    try {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    } catch {}
  }
}

testRollback().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

