import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { BaseProvider } from './base-provider.js';

/**
 * Local file system registry provider
 */
export class LocalProvider extends BaseProvider {
  constructor(componentsDir) {
    super('local');
    this.componentsDir = componentsDir;
  }

  /**
   * Load components from local file system
   * @returns {Promise<void>}
   */
  async loadComponents() {
    if (this.isLoaded) return;

    try {
      const files = readdirSync(this.componentsDir);
      
      for (const file of files) {
        if (file.endsWith('.svg')) {
          const name = file.replace('.svg', '');
          const filePath = join(this.componentsDir, file);
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

      this.isLoaded = true;
      console.log(`📦 Loaded ${this.components.size} components from local files`);
      
    } catch (error) {
      console.warn('⚠️  Local registry not available (expected in npm package)');
      throw error;
    }
  }

  /**
   * Load a single component from local file system
   * @param {string} name - Component name
   * @returns {Promise<Object|null>}
   */
  async loadSingleComponent(name) {
    try {
      const filePath = join(this.componentsDir, `${name}.svg`);
      const content = readFileSync(filePath, 'utf-8');
      
      const component = {
        name,
        filePath,
        content,
        size: Buffer.byteLength(content, 'utf8'),
        lastModified: new Date().toISOString(),
        source: 'local'
      };
      
      this.components.set(name, component);
      return component;
      
    } catch (error) {
      console.warn(`⚠️  Failed to load ${name} from local files:`, error.message);
      return null;
    }
  }
}
