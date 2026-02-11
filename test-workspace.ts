#!/usr/bin/env bun
/**
 * Simple test script to demonstrate workspace detection
 * without requiring interactive stdin
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

  const { packageInfo } = result;
  console.log(`\n✅ Found: ${packageInfo!.name}`);
  console.log(`   Location: ${packageInfo!.path.replace('/package.json', '')}`);
  console.log(`   Package Manager: ${packageInfo!.packageManager}`);

  if (packageInfo!.workspace?.isWorkspace) {
    const ws = packageInfo!.workspace;
    console.log(`\n🏢 Workspace Detected!`);
    console.log(`   Workspace Name: ${ws.workspaceName}`);
    console.log(`   Workspace Root: ${ws.workspaceRoot}`);
    console.log(`   Relative Path: ${ws.relativePath}`);
  } else {
    console.log(`\n📦 Standalone Package (not in workspace)`);
  }

  console.log(`\n📜 Scripts (${packageInfo!.scripts.length}):`);
  packageInfo!.scripts.forEach((script) => {
    console.log(`   - ${script.name}`);
  });
}

// Test different locations
const testCases = [
  process.cwd(), // Current directory (wami project itself)
  './fixtures/test-monorepo', // Monorepo root
  './fixtures/test-monorepo/packages/app-a', // Workspace package A
  './fixtures/test-monorepo/packages/app-b', // Workspace package B
];

for (const testCase of testCases) {
  await test(testCase);
}

console.log(`\n${'='.repeat(60)}\n`);
