import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the components directory path
const componentsDir = join(__dirname, "components");

/**
 * Registry class for managing logo components
 */
class LogoRegistry {
  constructor() {
    this.components = new Map();
    this.isLoaded = false;
    this.githubBaseUrl = "https://raw.githubusercontent.com/your-repo/logos/main/registry/components";
    this.useGithub = false; // Set to true when you want to use GitHub
  }

  /**
   * Load all SVG components from the components directory or GitHub
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
   * Load components from local file system
   */
  async loadFromLocal() {
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
  }

  /**
   * Load components from GitHub
   */
  async loadFromGithub() {
    // First, get the list of components (you'd need an index endpoint)
    const componentNames = ['vercel', 'next']; // This would come from an API call
    
    for (const name of componentNames) {
      const url = `${this.githubBaseUrl}/${name}.svg`;
      try {
        const response = await fetch(url);
        if (response.ok) {
          const content = await response.text();
          this.components.set(name, {
            name,
            filePath: url,
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