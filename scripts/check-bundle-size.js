#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bundle size limits (in KB)
const LIMITS = {
  // Individual chunk limits
  CHUNK_MAX: 100, // Max size per chunk
  MAIN_BUNDLE_MAX: 200, // Main bundle max size
  
  // Total bundle limits
  TOTAL_JS_MAX: 500, // Total JS size
  TOTAL_GZIP_MAX: 150, // Total gzipped size
  
  // Performance budgets
  VENDOR_MAX: 300, // Vendor libraries max
  APP_CODE_MAX: 150, // Application code max
};

const DIST_DIR = path.join(__dirname, '..', 'dist', 'client', '_astro');

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function getGzipSize(filePath) {
  // Estimate gzip size (rough approximation)
  const content = fs.readFileSync(filePath, 'utf8');
  return Buffer.byteLength(content, 'utf8') * 0.3; // ~30% of original
}

function analyzeBundle() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  console.log('📊 Bundle Size Analysis');
  console.log('========================');

  const files = fs.readdirSync(DIST_DIR)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(DIST_DIR, file);
      const stats = fs.statSync(filePath);
      const gzipSize = getGzipSize(filePath);
      
      return {
        name: file,
        size: stats.size,
        gzipSize,
        path: filePath
      };
    })
    .sort((a, b) => b.size - a.size);

  let hasWarnings = false;
  let hasErrors = false;

  // Analyze individual files
  console.log('\n📦 Individual Chunks:');
  files.forEach(file => {
    const sizeKB = file.size / 1024;
    const gzipKB = file.gzipSize / 1024;
    
    let status = '✅';
    if (sizeKB > LIMITS.CHUNK_MAX) {
      status = '❌';
      hasErrors = true;
    } else if (sizeKB > LIMITS.CHUNK_MAX * 0.8) {
      status = '⚠️';
      hasWarnings = true;
    }
    
    console.log(`${status} ${file.name}: ${formatSize(file.size)} (${formatSize(file.gzipSize)} gzipped)`);
  });

  // Calculate totals
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalGzipSize = files.reduce((sum, file) => sum + file.gzipSize, 0);

  console.log('\n📊 Bundle Summary:');
  console.log(`📈 Total JS Size: ${formatSize(totalSize)}`);
  console.log(`🗜️  Total Gzipped: ${formatSize(totalGzipSize)}`);
  console.log(`📁 Number of chunks: ${files.length}`);

  // Check limits
  console.log('\n🎯 Performance Budget:');
  
  // Total size check
  const totalSizeStatus = totalSize / 1024 > LIMITS.TOTAL_JS_MAX ? '❌' : '✅';
  console.log(`${totalSizeStatus} Total JS: ${formatSize(totalSize)} / ${LIMITS.TOTAL_JS_MAX} KB`);
  
  // Gzipped size check
  const gzipStatus = totalGzipSize / 1024 > LIMITS.TOTAL_GZIP_MAX ? '❌' : '✅';
  console.log(`${gzipStatus} Gzipped: ${formatSize(totalGzipSize)} / ${LIMITS.TOTAL_GZIP_MAX} KB`);

  // Identify largest chunks
  console.log('\n🔍 Largest Chunks:');
  files.slice(0, 5).forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}: ${formatSize(file.size)}`);
  });

  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (totalSize / 1024 > LIMITS.TOTAL_JS_MAX) {
    console.log('🔹 Total bundle size exceeds limit. Consider:');
    console.log('   - Code splitting');
    console.log('   - Lazy loading components');
    console.log('   - Tree shaking optimization');
    hasErrors = true;
  }

  const largeChunks = files.filter(f => f.size / 1024 > LIMITS.CHUNK_MAX);
  if (largeChunks.length > 0) {
    console.log(`🔹 ${largeChunks.length} chunks exceed size limit. Consider splitting them.`);
    hasErrors = true;
  }

  if (files.length > 20) {
    console.log('🔹 Many chunks detected. Consider consolidating related code.');
    hasWarnings = true;
  }

  // Performance score
  const performanceScore = Math.max(0, 100 - (totalGzipSize / 1024 / LIMITS.TOTAL_GZIP_MAX * 100));
  console.log(`\n🏆 Performance Score: ${performanceScore.toFixed(0)}/100`);

  // Final status
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ Bundle size check FAILED');
    console.log('Run "npm run build:analyze" for detailed analysis');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Bundle size check PASSED with warnings');
  } else {
    console.log('✅ Bundle size check PASSED');
  }
}

try {
  analyzeBundle();
} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
}