import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the components directory path - now pointing to GitHub since local registry won't be in npm package
const componentsDir = join(__dirname, "components");

// Import pre-generated component index (bundled in npm package)
let componentIndex = null;
try {
  const indexPath = join(__dirname, "component-index.json");
  const indexContent = readFileSync(indexPath, 'utf-8');
  componentIndex = JSON.parse(indexContent);
} catch (error) {
  console.warn("⚠️  Component index not found, falling back to GitHub API");
}

/**
 * Registry class for managing logo components
 */
class LogoRegistry {
  constructor() {
    this.components = new Map();
    this.isLoaded = false;
    this.githubBaseUrl = "https://raw.githubusercontent.com/bhaveshsinghal95182/logos/main/registry/components";
    this.useGithub = true;
  }

  /**
   * Load all SVG components from GitHub (optimized for npx)
   */
  async loadComponents() {
    if (this.isLoaded) return;

    try {
      if (this.useGithub) {
        await this.loadFromGithub();
      } else {
        await this.loadFromLocal();
      }
      
      this.isLoaded = true;
      console.log(`✨ Loaded ${this.components.size} components into registry`);
    } catch (error) {
      console.error('❌ Error loading components:', error.message);
    }
  }

  /**
   * Load components from local file system (fallback only)
   */
  async loadFromLocal() {
    try {
      const files = readdirSync(componentsDir);
      
      for (const file of files) {
        if (file.endsWith('.svg')) {
          const name = file.replace('.svg', '');
          const filePath = join(componentsDir, file);
          const content = readFileSync(filePath, 'utf-8');
          
          this.components.set(name, {
            name,
            filePath,
            content,
            size: Buffer.byteLength(content, 'utf8'),
            lastModified: new Date().toISOString(),
            source: 'local'
          });
        }
      }
    } catch (error) {
      console.warn('⚠️  Local registry not available (expected in npm package)');
    }
  }

  /**
   * Load components from GitHub with parallel downloads
   */
  async loadFromGithub() {
    // Get the list of available components from the GitHub API
    const apiUrl = "https://api.github.com/repos/bhaveshsinghal95182/logos/contents/registry/components";
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`GitHub API responded with ${response.status}`);
      }
      
      const files = await response.json();
      const svgFiles = files.filter(file => file.name.endsWith('.svg'));
      
      // Parallel download all SVG files
      const downloadPromises = svgFiles.map(async (file) => {
        const name = file.name.replace('.svg', '');
        const downloadUrl = file.download_url;
        
        try {
          const svgResponse = await fetch(downloadUrl);
          if (svgResponse.ok) {
            const content = await svgResponse.text();
            return {
              name,
              component: {
                name,
                filePath: downloadUrl,
                content,
                size: Buffer.byteLength(content, 'utf8'),
                lastModified: new Date().toISOString(),
                source: 'github'
              }
            };
          }
        } catch (error) {
          console.warn(`⚠️  Failed to load ${name} from GitHub:`, error.message);
          return null;
        }
      });

      // Wait for all downloads to complete
      const results = await Promise.allSettled(downloadPromises);
      
      // Process successful downloads
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          const { name, component } = result.value;
          this.components.set(name, component);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to fetch component list from GitHub:', error.message);
      // Fallback to local if GitHub fails
      await this.loadFromLocal();
    }
  }

  /**
   * Load a single component on-demand (optimized for npx)
   * @param {string} name - Component name
   * @returns {Promise<Object|null>} Component data or null if not found
   */
  async loadSingleComponent(name) {
    // Try to get download URL from bundled index first
    let downloadUrl = `${this.githubBaseUrl}/${name}.svg`;
    
    if (componentIndex) {
      const indexEntry = componentIndex.components.find(comp => comp.name === name);
      if (indexEntry) {
        downloadUrl = indexEntry.downloadUrl;
      } else {
        console.warn(`⚠️  Component '${name}' not found in index`);
        return null;
      }
    }
    
    try {
      const response = await fetch(downloadUrl);
      if (response.ok) {
        const content = await response.text();
        const component = {
          name,
          filePath: downloadUrl,
          content,
          size: Buffer.byteLength(content, 'utf8'),
          lastModified: new Date().toISOString(),
          source: 'github'
        };
        
        this.components.set(name, component);
        return component;
      }
    } catch (error) {
      console.warn(`⚠️  Failed to load ${name} from GitHub:`, error.message);
    }
    
    return null;
  }

  /**
   * Get a component by name with lazy loading
   * @param {string} name - Component name
   * @returns {Promise<Object|null>} Component data or null if not found
   */
  async getComponent(name) {
    // Check if already loaded
    if (this.components.has(name)) {
      return this.components.get(name);
    }
    
    // Lazy load single component
    return await this.loadSingleComponent(name);
  }

  /**
   * Check if a component exists (lazy check)
   * @param {string} name - Component name
   * @returns {Promise<boolean>}
   */
  async hasComponent(name) {
    // Quick check if already loaded
    if (this.components.has(name)) {
      return true;
    }
    
    // Lazy load to verify existence
    const component = await this.loadSingleComponent(name);
    return component !== null;
  }

  /**
   * Get all available component names (instant lookup from bundled index)
   * @returns {Promise<string[]>} Array of component names
   */
  async getAvailableComponents() {
    // Use bundled index for instant lookup
    if (componentIndex) {
      return componentIndex.components.map(comp => comp.name).sort();
    }
    
    // Fallback to loading all components
    await this.loadComponents();
    return Array.from(this.components.keys()).sort();
  }

  /**
   * Check if a component exists (instant check from bundled index)
   * @param {string} name - Component name
   * @returns {Promise<boolean>}
   */
  async hasComponent(name) {
    // Quick check if already loaded
    if (this.components.has(name)) {
      return true;
    }
    
    // Instant check from bundled index
    if (componentIndex) {
      return componentIndex.components.some(comp => comp.name === name);
    }
    
    // Fallback: lazy load to verify existence
    const component = await this.loadSingleComponent(name);
    return component !== null;
  }

  /**
   * Get multiple components at once
   * @param {string[]} names - Array of component names
   * @returns {Promise<Object[]>} Array of component data
   */
  async getComponents(names) {
    await this.loadComponents();
    return names.map(name => this.components.get(name)).filter(Boolean);
  }

  /**
   * Get all components
   * @returns {Promise<Object[]>} Array of all component data
   */
  async getAllComponents() {
    await this.loadComponents();
    return Array.from(this.components.values());
  }

  /**
   * Get registry statistics (enhanced with bundled index)
   * @returns {Promise<Object>} Registry stats
   */
  async getStats() {
    // Use bundled index for instant stats
    if (componentIndex) {
      const totalSize = componentIndex.components.reduce((sum, comp) => sum + comp.size, 0);
      return {
        totalComponents: componentIndex.components.length,
        totalSize: totalSize,
        averageSize: componentIndex.components.length > 0 
          ? Math.round(totalSize / componentIndex.components.length)
          : 0,
        lastUpdated: componentIndex.metadata.generated,
        source: 'bundled-index',
        repository: componentIndex.metadata.repository
      };
    }
    
    // Fallback to loading components
    await this.loadComponents();
    const components = Array.from(this.components.values());
    return {
      totalComponents: components.length,
      totalSize: components.reduce((sum, comp) => sum + comp.size, 0),
      averageSize: components.length > 0 
        ? Math.round(components.reduce((sum, comp) => sum + comp.size, 0) / components.length)
        : 0,
      lastUpdated: new Date().toISOString(),
      source: this.useGithub ? 'github' : 'local'
    };
  }

  /**
   * Search components by name pattern
   * @param {string} pattern - Search pattern
   * @returns {Promise<string[]>} Matching component names
   */
  async searchComponents(pattern) {
    const available = await this.getAvailableComponents();
    const regex = new RegExp(pattern, 'i');
    return available.filter(name => regex.test(name));
  }

  /**
   * Export registry data as JSON
   * @returns {Promise<Object>} Registry data
   */
  async exportData() {
    const stats = await this.getStats();
    const data = {
      metadata: stats,
      components: {}
    };

    this.components.forEach((component, name) => {
      data.components[name] = {
        name: component.name,
        size: component.size,
        lastModified: component.lastModified,
        source: component.source
      };
    });

    return data;
  }
}

// Create and export registry instance
const registry = new LogoRegistry();

export default registry;
export { LogoRegistry };
