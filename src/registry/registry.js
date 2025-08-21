import { SvglProvider } from './providers/svgl-provider.js';

/**
 * Refactored registry class with provider pattern
 */
export class LogoRegistry {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.registrySource = 'svgl';
    this.useSvgl = true;
    
    this.initializeProviders();
  }

  /**
   * Initialize all providers
   */
  initializeProviders() {
    // SVGL provider
    this.providers.set('svgl', new SvglProvider());
  }

  /**
   * Get the active provider - always returns SVGL for now
   * @returns {BaseProvider}
   */
  getActiveProvider() {
    return this.providers.get('svgl');
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
   * Get all available component names from SVGL
   * @returns {Promise<string[]>}
   */
  async getAvailableComponents() {
    const provider = this.getActiveProvider();
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
   * Get registry statistics from SVGL
   * @returns {Promise<Object>}
   */
  async getStats() {
    const provider = this.getActiveProvider();
    await provider.loadComponents();
    
    return {
      totalComponents: provider.getComponentsCount(),
      source: provider.name,
      registrySource: this.registrySource,
      provider: provider.name
    };
  }
}
