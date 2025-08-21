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
    this.svglBaseUrl = "https://api.svgl.app";
    this.useGithub = true;
    this.useSvgl = false; // Set to true to use SVGL as source
    this.registrySource = 'github'; // 'github', 'svgl', or 'both'
  }

  /**
   * Load all SVG components from GitHub or SVGL (optimized for npx)
   */
  async loadComponents() {
    if (this.isLoaded) return;

    try {
      if (this.registrySource === 'both') {
        await Promise.all([
          this.loadFromGithub(),
          this.loadFromSvgl()
        ]);
      } else if (this.registrySource === 'svgl' || this.useSvgl) {
        await this.loadFromSvgl();
      } else if (this.useGithub) {
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
   * Load components from SVGL API
   */
  async loadFromSvgl() {
    try {
      const response = await fetch(this.svglBaseUrl);
      if (!response.ok) {
        throw new Error(`SVGL API responded with ${response.status}`);
      }
      
      const svgData = await response.json();
      
      // Process SVGL components
      for (const svg of svgData) {
        const name = svg.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        // Handle different route formats (string or theme object)
        let svgUrl;
        if (typeof svg.route === 'string') {
          svgUrl = svg.route;
        } else if (svg.route && svg.route.light) {
          svgUrl = svg.route.light; // Default to light theme
        } else {
          continue; // Skip if no valid route
        }
        
        // We don't download the SVG content here for performance
        // It will be loaded on-demand
        this.components.set(name, {
          name,
          title: svg.title,
          category: Array.isArray(svg.category) ? svg.category : [svg.category],
          filePath: svgUrl,
          content: null, // Will be loaded on-demand
          size: 0, // Unknown until loaded
          lastModified: new Date().toISOString(),
          source: 'svgl',
          brandUrl: svg.url,
          id: svg.id,
          hasThemes: typeof svg.route === 'object',
          darkRoute: svg.route?.dark || null
        });
      }
      
      console.log(`📦 Loaded ${svgData.length} components from SVGL`);
      
    } catch (error) {
      console.error('❌ Failed to load from SVGL:', error.message);
      // Fallback to GitHub if SVGL fails
      if (this.useGithub) {
        await this.loadFromGithub();
      }
    }
  }
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
   * Load a single component on-demand (supports both GitHub and SVGL)
   * @param {string} name - Component name
   * @returns {Promise<Object|null>} Component data or null if not found
   */
  async loadSingleComponent(name) {
    // Check if we have component metadata (from SVGL or GitHub index)
    const metadata = this.components.get(name);
    
    if (metadata && metadata.source === 'svgl') {
      return await this.loadSvglComponent(name, metadata);
    } else if (metadata && metadata.source === 'github') {
      return await this.loadGithubComponent(name, metadata);
    } else {
      // Fallback: try GitHub direct
      return await this.loadGithubComponent(name);
    }
  }

  /**
   * Load component from SVGL
   */
  async loadSvglComponent(name, metadata) {
    try {
      const svgUrl = metadata.filePath;
      const response = await fetch(svgUrl);
      
      if (response.ok) {
        const content = await response.text();
        const component = {
          ...metadata,
          content,
          size: Buffer.byteLength(content, 'utf8'),
          lastModified: new Date().toISOString()
        };
        
        this.components.set(name, component);
        return component;
      }
    } catch (error) {
      console.warn(`⚠️  Failed to load ${name} from SVGL:`, error.message);
    }
    
    return null;
  }

  /**
   * Load component from GitHub
   */
  async loadGithubComponent(name, metadata = null) {
    // Try to get download URL from bundled index first
    let downloadUrl = `${this.githubBaseUrl}/${name}.svg`;
    
    if (componentIndex) {
      const indexEntry = componentIndex.components.find(comp => comp.name === name);
      if (indexEntry) {
        downloadUrl = indexEntry.downloadUrl;
      } else if (!metadata) {
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
          title: name.charAt(0).toUpperCase() + name.slice(1),
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
      const component = this.components.get(name);
      // If content is null (SVGL metadata only), load the actual content
      if (component && component.content === null) {
        return await this.loadSingleComponent(name);
      }
      return component;
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
   * Get all available component names (supports SVGL and bundled index)
   * @returns {Promise<string[]>} Array of component names
   */
  async getAvailableComponents() {
    // Force loading if we want SVGL and haven't loaded yet
    if (this.registrySource === 'svgl' && !this.isLoaded) {
      await this.loadComponents();
      return Array.from(this.components.keys()).sort();
    }
    
    // Use bundled index for GitHub registry only
    if (componentIndex && this.registrySource !== 'svgl') {
      return componentIndex.components.map(comp => comp.name).sort();
    }
    
    // Fallback to loading all components
    await this.loadComponents();
    return Array.from(this.components.keys()).sort();
  }

  /**
   * Check if a component exists (enhanced for SVGL)
   * @param {string} name - Component name
   * @returns {Promise<boolean>}
   */
  async hasComponent(name) {
    // Quick check if already loaded
    if (this.components.has(name)) {
      return true;
    }
    
    // For SVGL, load components first to check
    if (this.registrySource === 'svgl') {
      await this.loadComponents();
      return this.components.has(name);
    }
    
    // Instant check from bundled index (GitHub only)
    if (componentIndex && this.registrySource !== 'svgl') {
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
   * Search components by name, category, or pattern (enhanced with SVGL)
   * @param {string} pattern - Search pattern
   * @returns {Promise<string[]>} Matching component names
   */
  async searchComponents(pattern) {
    await this.loadComponents();
    
    const regex = new RegExp(pattern, 'i');
    const matches = [];
    
    this.components.forEach((component, name) => {
      // Search by name
      if (regex.test(name) || regex.test(component.title || '')) {
        matches.push(name);
        return;
      }
      
      // Search by category (for SVGL components)
      if (component.category && Array.isArray(component.category)) {
        if (component.category.some(cat => regex.test(cat))) {
          matches.push(name);
        }
      }
    });
    
    return matches.sort();
  }

  /**
   * Get components by category (SVGL feature)
   * @param {string} category - Category name
   * @returns {Promise<string[]>} Component names in category
   */
  async getComponentsByCategory(category) {
    await this.loadComponents();
    
    const matches = [];
    this.components.forEach((component, name) => {
      if (component.category && Array.isArray(component.category)) {
        if (component.category.some(cat => cat.toLowerCase() === category.toLowerCase())) {
          matches.push(name);
        }
      }
    });
    
    return matches.sort();
  }

  /**
   * Get all categories (SVGL feature)
   * @returns {Promise<Object[]>} Categories with counts
   */
  async getCategories() {
    await this.loadComponents();
    
    const categoryCount = new Map();
    
    this.components.forEach((component) => {
      if (component.category && Array.isArray(component.category)) {
        component.category.forEach(cat => {
          categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
        });
      }
    });
    
    return Array.from(categoryCount.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
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

// Backward compatibility - export new refactored registry
import { LogoRegistry } from './registry.js';

// Create and export registry instance
const registry = new LogoRegistry();

export default registry;
export { LogoRegistry };
