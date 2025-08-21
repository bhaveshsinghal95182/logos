import { BaseProvider } from './base-provider.js';

/**
 * SVGL registry provider
 */
export class SvglProvider extends BaseProvider {
  constructor() {
    super('svgl');
    this.baseUrl = "https://api.svgl.app";
  }

  /**
   * Load components from SVGL API
   * @returns {Promise<void>}
   */
  async loadComponents() {
    if (this.isLoaded) return;

    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`SVGL API responded with ${response.status}`);
      }
      
      const svgData = await response.json();
      
      // Process SVGL components
      for (const svg of svgData) {
        const name = this.normalizeComponentName(svg.title);
        
        // Handle different route formats (string or theme object)
        const svgUrl = this.extractSvgUrl(svg.route);
        if (!svgUrl) continue; // Skip if no valid route
        
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

      this.isLoaded = true;
      console.log(`📦 Loaded ${svgData.length} components from SVGL`);
      
    } catch (error) {
      console.warn(`⚠️  Failed to load from SVGL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load a single component from SVGL
   * @param {string} name - Component name
   * @param {Object} metadata - Component metadata (optional)
   * @returns {Promise<Object|null>}
   */
  async loadSingleComponent(name, metadata = null) {
    try {
      const svgUrl = metadata?.filePath;
      if (!svgUrl) return null;

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
   * Normalize component name for consistency
   * @param {string} title - Original title
   * @returns {string} Normalized name
   */
  normalizeComponentName(title) {
    return title.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Extract SVG URL from route (handle both string and object formats)
   * @param {string|Object} route - Route data
   * @returns {string|null} SVG URL
   */
  extractSvgUrl(route) {
    if (typeof route === 'string') {
      return route;
    } else if (route && route.light) {
      return route.light; // Default to light theme
    }
    return null;
  }
}
