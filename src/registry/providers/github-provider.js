import { BaseProvider } from './base-provider.js';

/**
 * GitHub registry provider
 */
export class GitHubProvider extends BaseProvider {
  constructor() {
    super('github');
    this.baseUrl = "https://raw.githubusercontent.com/bhaveshsinghal95182/logos/main/registry/components";
  }

  /**
   * Load components from GitHub
   * @returns {Promise<void>}
   */
  async loadComponents() {
    if (this.isLoaded) return;

    try {
      const response = await fetch(`${this.baseUrl}/index.json`);
      if (!response.ok) {
        throw new Error(`GitHub API responded with ${response.status}`);
      }

      const data = await response.json();
      
      for (const componentName of data.components) {
        this.components.set(componentName, {
          name: componentName,
          filePath: `${this.baseUrl}/${componentName}.svg`,
          content: null, // Will be loaded on-demand
          size: 0, // Unknown until loaded
          lastModified: new Date().toISOString(),
          source: 'github'
        });
      }

      this.isLoaded = true;
      console.log(`📦 Loaded ${data.components.length} components from GitHub`);
      
    } catch (error) {
      console.warn(`⚠️  Failed to load from GitHub: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load a single component from GitHub
   * @param {string} name - Component name
   * @param {Object} metadata - Component metadata (optional)
   * @returns {Promise<Object|null>}
   */
  async loadSingleComponent(name, metadata = null) {
    try {
      const componentUrl = metadata?.filePath || `${this.baseUrl}/${name}.svg`;
      const response = await fetch(componentUrl);
      
      if (response.ok) {
        const content = await response.text();
        const component = {
          name,
          filePath: componentUrl,
          content,
          size: Buffer.byteLength(content, 'utf8'),
          lastModified: new Date().toISOString(),
          source: 'github',
          ...(metadata || {})
        };
        
        this.components.set(name, component);
        return component;
      } else {
        console.warn(`⚠️  Component '${name}' not found on GitHub (${response.status})`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to load ${name} from GitHub:`, error.message);
    }
    
    return null;
  }
}
