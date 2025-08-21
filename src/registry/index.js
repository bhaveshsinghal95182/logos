import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the components directory path - now pointing to GitHub since local registry won't be in npm package
const componentsDir = join(__dirname, "components");

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
   * Load all SVG components from GitHub (primary) or local fallback
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
   * Load components from GitHub
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
      
      for (const file of svgFiles) {
        const name = file.name.replace('.svg', '');
        const downloadUrl = file.download_url;
        
        try {
          const svgResponse = await fetch(downloadUrl);
          if (svgResponse.ok) {
            const content = await svgResponse.text();
            this.components.set(name, {
              name,
              filePath: downloadUrl,
              content,
              size: Buffer.byteLength(content, 'utf8'),
              lastModified: new Date().toISOString(),
              source: 'github'
            });
          }
        } catch (error) {
          console.warn(`⚠️  Failed to load ${name} from GitHub:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch component list from GitHub:', error.message);
      // Fallback to local if GitHub fails
      await this.loadFromLocal();
    }
  }

  /**
   * Get a component by name (async for GitHub support)
   * @param {string} name - Component name
   * @returns {Promise<Object|null>} Component data or null if not found
   */
  async getComponent(name) {
    await this.loadComponents();
    return this.components.get(name) || null;
  }

  /**
   * Check if a component exists
   * @param {string} name - Component name
   * @returns {Promise<boolean>}
   */
  async hasComponent(name) {
    await this.loadComponents();
    return this.components.has(name);
  }

  /**
   * Get all available component names
   * @returns {Promise<string[]>} Array of component names
   */
  async getAvailableComponents() {
    await this.loadComponents();
    return Array.from(this.components.keys()).sort();
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
   * Get registry statistics
   * @returns {Promise<Object>} Registry stats
   */
  async getStats() {
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
