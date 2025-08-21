import chalk from "chalk";

/**
 * Handle the categories command
 */
export class CategoriesCommandHandler {
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Execute the categories command
   * @param {Object} parsed - Parsed command arguments
   * @returns {Promise<void>}
   */
  async execute(parsed) {
    const { flags } = parsed;
    
    // Configure registry source
    this.configureRegistrySource(flags);

    const categories = await this.registry.getCategories();
    
    if (categories.length === 0) {
      console.log(chalk.yellow("⚠️  No categories found in registry"));
      return;
    }

    console.log(chalk.blue("📁 Available categories:"));
    
    // Show top categories
    const topCategories = categories.slice(0, 15);
    topCategories.forEach(category => {
      console.log(chalk.cyan(`   • ${category.name} (${category.count} components)`));
    });
    
    if (categories.length > 15) {
      console.log(chalk.gray(`   ... and ${categories.length - 15} more categories`));
    }

    this.showUsageExamples();
  }

  /**
   * Configure registry source based on flags
   * @param {Object} flags - Command flags
   */
  configureRegistrySource(flags) {
    if (flags.svgl) {
      this.registry.registrySource = 'svgl';
      this.registry.useSvgl = true;
      this.registry.useGithub = false;
    }
  }

  /**
   * Show usage examples
   */
  showUsageExamples() {
    console.log(chalk.blue("\n💡 Usage examples:"));
    console.log(chalk.gray("   add --category framework --tsx"));
    console.log(chalk.gray("   available --category software"));
  }
}
