#!/usr/bin/env bun
import { registry } from './src/core/registry.js';
import * as path from 'path';

const pythonFixtures = [
  'fixtures/test-python-uv',
  'fixtures/test-python-poetry',
  'fixtures/test-python-pipenv',
  'fixtures/test-python-pip',
];

for (const fixture of pythonFixtures) {
  const result = await registry.detect(path.resolve(fixture));

  if (result.found) {
    console.log(`✅ ${fixture.split('/').pop()?.toUpperCase()}`);
    console.log(`   Manager: ${result.packageInfo!.packageManager}`);
    console.log(`   Scripts: ${result.packageInfo!.scripts.length}`);
  } else {
    console.log(`❌ ${fixture} - Not detected`);
  }
}
