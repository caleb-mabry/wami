#!/usr/bin/env bun
/**
 * Test script for Python detection
 */

import { registry } from './src/core/registry.js';

async function test(cwd: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing from: ${cwd}`);
  console.log('='.repeat(60));

  const result = await registry.detect(cwd);

  if (!result.found) {
    console.log('❌ No project found');
    return;
  }

  const { packageInfo, detector } = result;
  console.log(`\n✅ Found: ${packageInfo!.name}`);
  console.log(`   Ecosystem: ${detector!.name}`);
  console.log(`   Location: ${packageInfo!.path.replace(/\/(pyproject\.toml|package\.json|Pipfile|requirements\.txt)$/, '')}`);
  console.log(`   Package Manager: ${packageInfo!.packageManager}`);

  if (packageInfo!.workspace?.isWorkspace) {
    const ws = packageInfo!.workspace;
    console.log(`\n🏢 Workspace Detected!`);
    console.log(`   Workspace Name: ${ws.workspaceName}`);
    console.log(`   Workspace Root: ${ws.workspaceRoot}`);
    console.log(`   Relative Path: ${ws.relativePath}`);
  }

  console.log(`\n📜 Scripts (${packageInfo!.scripts.length}):`);
  packageInfo!.scripts.forEach((script) => {
    console.log(`   - ${script.name}: ${script.command}`);
  });

  console.log(`\n🚀 Example command:`);
  if (packageInfo!.scripts[0]) {
    const cmd = detector!.buildCommand(packageInfo!, packageInfo!.scripts[0].name);
    console.log(`   ${cmd}`);
  }
}

import * as path from 'path';

// Test different projects - use absolute paths
const testCases = [
  path.resolve('./fixtures/test-python-poetry'),  // Python Poetry project
  path.resolve('./fixtures/test-monorepo/packages/app-a'), // Node.js workspace
  process.cwd(), // Current directory (wami project - Node.js)
];

for (const testCase of testCases) {
  await test(testCase);
}

console.log(`\n${'='.repeat(60)}\n`);
