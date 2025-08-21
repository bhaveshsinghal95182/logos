import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { GitHubProvider } from './providers/github-provider.js';
import { SvglProvider } from './providers/svgl-provider.js';
import { LocalProvider } from './providers/local-provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Refactored registry class with provider pattern
 */
export class LogoRegistry {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.registrySource = 'github';
    this.useSvgl = false;
    this.useGithub = true;
    
    this.initializeProviders();
    this.loadComponentIndex();
  }

  /**
   * Initialize all providers
   */
  initializeProviders() {
    // GitHub provider
    this.providers.set('github', new GitHubProvider());
    
    // SVGL provider
    this.providers.set('svgl', new SvglProvider());
    
    // Local provider (fallback)
    const componentsDir = join(__dirname, "components");
    this.providers.set('local', new LocalProvider(componentsDir));
  }

  /**
   * Load pre-generated component index if available
   */
  loadComponentIndex() {
    try {
      const indexPath = join(__dirname, "component-index.json");
      const indexContent = readFileSync(indexPath, 'utf-8');
      this.componentIndex = JSON.parse(indexContent);
    } catch (error) {
      console.warn("⚠️  Component index not found, falling back to API");
      this.componentIndex = null;
    }
  }

  /**
   * Get the active provider based on current settings
   * @returns {BaseProvider}
   */
  getActiveProvider() {
    if (this.registrySource === 'svgl' || this.useSvgl) {
      return this.providers.get('svgl');
    } else if (this.useGithub) {
      return this.providers.get('github');
    } else {
      return this.providers.get('local');
    }
  }

  /**
   * Load components from active provider
   * @returns {Promise<void>}
   */
  async loadComponents() {
    const provider = this.getActiveProvider();
    await provider.loadComponents();
  }

  /**
   * Get component by name
   * @param {string} name - Component name
   * @returns {Promise<Object|null>}
   */
  async getComponent(name) {
    const provider = this.getActiveProvider();
    
    // Check if already loaded
    if (provider.hasComponent(name)) {
      const component = provider.getComponent(name);
      // If content is null (metadata only), load the actual content
      if (component && component.content === null) {
        return await provider.loadSingleComponent(name, component);
      }
      return component;
    }
    
    // Lazy load single component
    return await provider.loadSingleComponent(name);
  }

  /**
   * Check if component exists
   * @param {string} name - Component name
   * @returns {Promise<boolean>}
   */
  async hasComponent(name) {
    const provider = this.getActiveProvider();
    
    // Force loading if not already loaded
    if (!provider.isLoaded) {
      await provider.loadComponents();
    }
    
    // Quick check if already loaded
    if (provider.hasComponent(name)) {
      return true;
    }
    
    // For SVGL and GitHub, if component exists in metadata but content not loaded,
    // it still means the component exists
    return false;
  }

  /**
   * Get all available component names
   * @returns {Promise<string[]>}
   */
  async getAvailableComponents() {
    const provider = this.getActiveProvider();
    
    // Force loading if we want SVGL and haven't loaded yet
    if (this.registrySource === 'svgl' && !provider.isLoaded) {
      await provider.loadComponents();
      return provider.getComponentNames();
    }
    
    // Use bundled index for GitHub registry only
    if (this.componentIndex && this.registrySource !== 'svgl') {
      return this.componentIndex.components.map(comp => comp.name).sort();
    }
    
    // Fallback to loading all components
    await provider.loadComponents();
    return provider.getComponentNames();
  }

  /**
   * Get multiple components
   * @param {string[]} names - Component names
   * @returns {Promise<Object[]>}
   */
  async getComponents(names) {
    const components = [];
    for (const name of names) {
      const component = await this.getComponent(name);
      if (component) {
        components.push(component);
      }
    }
    return components;
  }

  /**
   * Search components
   * @param {string} query - Search query
   * @returns {Promise<string[]>}
   */
  async searchComponents(query) {
    const provider = this.getActiveProvider();
    await provider.loadComponents();
    return provider.searchComponents(query);
  }

  /**
   * Get components by category
   * @param {string} category - Category name
   * @returns {Promise<string[]>}
   */
  async getComponentsByCategory(category) {
    const provider = this.getActiveProvider();
    await provider.loadComponents();
    return provider.getComponentsByCategory(category);
  }

  /**
   * Get all categories
   * @returns {Promise<Object[]>}
   */
  async getCategories() {
    const provider = this.getActiveProvider();
    await provider.loadComponents();
    return provider.getCategories();
  }

  /**
   * Get registry statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    const provider = this.getActiveProvider();
    await provider.loadComponents();
    
    return {
      totalComponents: provider.getComponentsCount(),
      source: this.componentIndex && this.registrySource !== 'svgl' ? 'bundled-index' : provider.name,
      registrySource: this.registrySource,
      provider: provider.name
    };
  }
}
