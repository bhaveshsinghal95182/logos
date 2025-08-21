import { writeFileSync } from "fs";

/**
 * Pre-publish script to generate component index for fast lookups
 */
async function generateComponentIndex() {
  console.log("🔍 Generating component index...");
  
  const apiUrl = "https://api.github.com/repos/bhaveshsinghal95182/logos/contents/registry/components";
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }
    
    const files = await response.json();
    const svgFiles = files.filter(file => file.name.endsWith('.svg'));
    
    // Create component index with metadata
    const componentIndex = {
      metadata: {
        total: svgFiles.length,
        generated: new Date().toISOString(),
        repository: "bhaveshsinghal95182/logos",
        branch: "main"
      },
      components: svgFiles.map(file => ({
        name: file.name.replace('.svg', ''),
        size: file.size,
        downloadUrl: file.download_url,
        sha: file.sha
      }))
    };
    
    // Write index to src directory (will be included in npm package)
    const indexPath = "./src/registry/component-index.json";
    writeFileSync(indexPath, JSON.stringify(componentIndex, null, 2));
    
    console.log(`✅ Generated index with ${componentIndex.components.length} components`);
    console.log(`📦 Saved to: ${indexPath}`);
    
    // Log components for verification
    componentIndex.components.forEach(comp => {
      console.log(`   • ${comp.name} (${comp.size} bytes)`);
    });
    
  } catch (error) {
    console.error("❌ Failed to generate component index:", error.message);
    process.exit(1);
  }
}

generateComponentIndex();
