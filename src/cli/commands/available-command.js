import chalk from "chalk";

/**
 * Handle the available command
 */
export class AvailableCommandHandler {
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Execute the available command
   * @param {Object} parsed - Parsed command arguments
   * @returns {Promise<void>}
   */
  async execute(parsed) {
    const { flags } = parsed;

    const available = await this.registry.getAvailableComponents();
    const stats = await this.registry.getStats();
    
    console.log(chalk.blue("🎨 Available components in registry:"));
    console.log(chalk.gray(`Total: ${stats.totalComponents} components (${stats.source})`));
    
    if (flags.category) {
      await this.showByCategory(flags.category);
    } else if (flags.search) {
      await this.showBySearch(flags.search);
    } else {
      this.showAll(available);
    }
  }

  /**
   * Show components by category
   * @param {string} category - Category name
   * @returns {Promise<void>}
   */
  async showByCategory(category) {
    const categoryComponents = await this.registry.getComponentsByCategory(category);
    console.log(chalk.yellow(`\n📁 Components in '${category}' category:`));
    categoryComponents.forEach(comp => {
      console.log(chalk.cyan(`   • ${comp}`));
    });
  }

  /**
   * Show components by search
   * @param {string} search - Search query
   * @returns {Promise<void>}
   */
  async showBySearch(search) {
    const searchResults = await this.registry.searchComponents(search);
    console.log(chalk.yellow(`\n🔍 Components matching '${search}':`));
    searchResults.forEach(comp => {
      console.log(chalk.cyan(`   • ${comp}`));
    });
  }

  /**
   * Show all components (limited)
   * @param {string[]} available - Available component names
   */
  showAll(available) {
    // Show first 20 components
    available.slice(0, 20).forEach(comp => {
      console.log(chalk.cyan(`   • ${comp}`));
    });
    
    if (available.length > 20) {
      console.log(chalk.gray(`   ... and ${available.length - 20} more`));
      console.log(chalk.gray(`\nUse --search or --category to filter results`));
    }
  }
}
