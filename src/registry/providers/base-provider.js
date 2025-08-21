/**
 * Base class for registry providers
 */
export class BaseProvider {
  constructor(name) {
    this.name = name;
    this.components = new Map();
    this.isLoaded = false;
  }

  /**
   * Load components from the provider source
   * @abstract
   * @returns {Promise<void>}
   */
  async loadComponents() {
    throw new Error('loadComponents method must be implemented by subclass');
  }

  /**
   * Load a single component by name
   * @abstract
   * @param {string} name - Component name
   * @returns {Promise<Object|null>}
   */
  async loadSingleComponent(name) {
    throw new Error('loadSingleComponent method must be implemented by subclass');
  }

  /**
   * Check if component exists
   * @param {string} name - Component name
   * @returns {boolean}
   */
  hasComponent(name) {
    return this.components.has(name);
  }

  /**
   * Get component by name
   * @param {string} name - Component name
   * @returns {Object|null}
   */
  getComponent(name) {
    return this.components.get(name) || null;
  }

  /**
   * Get all component names
   * @returns {string[]}
   */
  getComponentNames() {
    return Array.from(this.components.keys()).sort();
  }

  /**
   * Get components count
   * @returns {number}
   */
  getComponentsCount() {
    return this.components.size;
  }

  /**
   * Search components by name
   * @param {string} query - Search query
   * @returns {string[]}
   */
  searchComponents(query) {
    const searchTerm = query.toLowerCase();
    return this.getComponentNames().filter(name => 
      name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get components by category (base implementation)
   * @param {string} category - Category name
   * @returns {string[]}
   */
  getComponentsByCategory(category) {
    return this.getComponentNames().filter(name => {
      const component = this.getComponent(name);
      return component?.category?.includes(category);
    });
  }

  /**
   * Get all categories
   * @returns {Object} Categories with component counts
   */
  getCategories() {
    const categories = new Map();
    
    for (const [name, component] of this.components) {
      if (component.category) {
        const categoryList = Array.isArray(component.category) 
          ? component.category 
          : [component.category];
        
        for (const cat of categoryList) {
          if (!categories.has(cat)) {
            categories.set(cat, []);
          }
          categories.get(cat).push(name);
        }
      }
    }
    
    // Convert to sorted array of objects
    return Array.from(categories.entries())
      .map(([name, components]) => ({ name, count: components.length }))
      .sort((a, b) => b.count - a.count);
  }
}
