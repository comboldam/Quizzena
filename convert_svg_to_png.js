const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const INPUT_FOLDER = './country_silhouettes';
const OUTPUT_WIDTH = 800; // px
const OUTPUT_HEIGHT = 600; // px

// Convert single SVG to PNG
async function convertSVG(svgPath) {
  try {
    const filename = path.basename(svgPath, '.svg');
    const pngPath = path.join(INPUT_FOLDER, `${filename}.png`);
    
    // Read SVG and convert to PNG
    await sharp(svgPath)
      .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .png()
      .toFile(pngPath);
    
    // Delete the original SVG file
    await fs.remove(svgPath);
    
    console.log(`✅ ${filename}.svg → ${filename}.png`);
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${path.basename(svgPath)} - ${error.message}`);
    return false;
  }
}

// Main function
async function convertAll() {
  console.log('🎨 Starting SVG → PNG conversion...\n');
  
  // Get all SVG files
  const files = await fs.readdir(INPUT_FOLDER);
  const svgFiles = files.filter(file => file.endsWith('.svg'));
  
  if (svgFiles.length === 0) {
    console.log('⚠️  No SVG files found in', INPUT_FOLDER);
    return;
  }
  
  console.log(`📊 Found ${svgFiles.length} SVG files\n`);
  
  let success = 0;
  let failed = 0;
  
  // Convert each file
  for (const svgFile of svgFiles) {
    const svgPath = path.join(INPUT_FOLDER, svgFile);
    const result = await convertSVG(svgPath);
    
    if (result) {
      success++;
    } else {
      failed++;
    }
  }
  
  console.log('\n🎉 Conversion Complete!');
  console.log(`✅ Converted: ${success} files`);
  console.log(`❌ Failed: ${failed} files`);
  console.log(`\n📁 PNG files saved to: ${INPUT_FOLDER}/`);
  console.log(`📏 Size: ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}px`);
  console.log(`\n🗑️  Original SVG files have been deleted`);
  console.log('\n🚀 Next: Update your game with Claude Code!');
}

// Run
convertAll().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});