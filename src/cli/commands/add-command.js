import chalk from "chalk";
import { ComponentGenerator } from '../utils/component-generator.js';
import { UserInterface } from '../utils/user-interface.js';

/**
 * Handle the add command
 */
export class AddCommandHandler {
  constructor(registry, fileSystem) {
    this.registry = registry;
    this.fileSystem = fileSystem;
  }

  /**
   * Execute the add command
   * @param {Object} parsed - Parsed command arguments
   * @returns {Promise<void>}
   */
  async execute(parsed) {
    const { flags } = parsed;
    let components = [...parsed.components];

    // Configure registry source
    this.configureRegistrySource(flags);

    // Handle special flags for component selection
    components = await this.resolveComponents(components, flags);

    // Validate components exist
    const missingComponents = await this.validateComponents(components);
    if (missingComponents.length > 0) {
      const available = await this.registry.getAvailableComponents();
      UserInterface.showComponentsNotFound(missingComponents, available);
      return;
    }

    // Determine language preference
    const isTypeScript = await this.resolveLanguage(flags);
    if (isTypeScript === null) return; // User cancelled or invalid input

    // Create components
    await this.createComponents(components, isTypeScript, flags.force);
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
   * Resolve component list based on flags
   * @param {string[]} components - Initial component list
   * @param {Object} flags - Command flags
   * @returns {Promise<string[]>} Resolved component list
   */
  async resolveComponents(components, flags) {
    // Handle --category flag
    if (flags.category) {
      const categoryComponents = await this.registry.getComponentsByCategory(flags.category);
      console.log(chalk.blue(`📦 Adding ${categoryComponents.length} components from '${flags.category}' category...`));
      return categoryComponents;
    }

    // Handle --search flag
    if (flags.search) {
      const searchResults = await this.registry.searchComponents(flags.search);
      if (searchResults.length === 0) {
        console.log(chalk.red(`❌ No components found matching '${flags.search}'`));
        return [];
      }
      console.log(chalk.blue(`🔍 Found ${searchResults.length} components matching '${flags.search}'...`));
      return searchResults;
    }

    // Handle --all flag
    if (flags.all) {
      const allComponents = await this.registry.getAvailableComponents();
      console.log(chalk.blue(`📦 Adding all ${allComponents.length} available components...`));
      return allComponents;
    }

    // Validate we have components to work with
    if (components.length === 0) {
      this.showUsageError();
      return [];
    }

    return components;
  }

  /**
   * Validate that all components exist in registry
   * @param {string[]} components - Component names to validate
   * @returns {Promise<string[]>} Missing component names
   */
  async validateComponents(components) {
    const missingComponents = [];
    for (const componentName of components) {
      if (!(await this.registry.hasComponent(componentName))) {
        missingComponents.push(componentName);
      }
    }
    return missingComponents;
  }

  /**
   * Resolve language preference from flags or user input
   * @param {Object} flags - Command flags
   * @returns {Promise<boolean|null>} TypeScript preference or null if cancelled
   */
  async resolveLanguage(flags) {
    if (flags.tsx) {
      return true;
    } else if (flags.jsx) {
      return false;
    } else {
      // Fallback to prompt
      const language = await UserInterface.promptUser(chalk.blue("🔧 Choose language (jsx/tsx): "));
      if (!['jsx', 'tsx'].includes(language.toLowerCase())) {
        console.log(chalk.red("❌ Error: Please choose either 'jsx' or 'tsx'."));
        return null;
      }
      return language.toLowerCase() === 'tsx';
    }
  }

  /**
   * Create all components
   * @param {string[]} components - Component names
   * @param {boolean} isTypeScript - Whether to create TypeScript components
   * @param {boolean} force - Whether to force overwrite existing files
   * @returns {Promise<void>}
   */
  async createComponents(components, isTypeScript, force) {
    const fileExtension = isTypeScript ? 'tsx' : 'jsx';
    let successfulCreations = 0;

    UserInterface.showCreationProgress(components.length, isTypeScript);

    for (const componentName of components) {
      const success = await this.createSingleComponent(componentName, isTypeScript, force);
      if (success) {
        successfulCreations++;
      }
    }

    // Show final summary
    const tracking = this.fileSystem.loadTracking();
    UserInterface.showSummary(successfulCreations, components.length, tracking.logos.length);
  }

  /**
   * Create a single component
   * @param {string} componentName - Component name
   * @param {boolean} isTypeScript - Whether to create TypeScript component
   * @param {boolean} force - Whether to force overwrite
   * @returns {Promise<boolean>} Success status
   */
  async createSingleComponent(componentName, isTypeScript, force) {
    const fileExtension = isTypeScript ? 'tsx' : 'jsx';

    // Check if file exists and handle force flag
    if (this.fileSystem.componentExists(componentName, fileExtension) && !force) {
      UserInterface.showFileExists(componentName, fileExtension);
      return false;
    }

    // Get component from registry
    const component = await this.registry.getComponent(componentName);
    if (!component) {
      console.log(chalk.red(`❌ Component '${componentName}' not found in registry.`));
      return false;
    }

    const svgContent = component.content;
    const componentContent = ComponentGenerator.generate(componentName, svgContent, isTypeScript);

    // Write component file
    const success = this.fileSystem.writeComponent(componentName, componentContent, fileExtension);
    
    if (success) {
      // Add to tracking
      const componentFile = `components/logos/${componentName}.${fileExtension}`;
      this.fileSystem.addLogoToTracking(componentName, fileExtension, componentFile);
      
      UserInterface.showCreationSuccess(componentName, fileExtension, force);
      return true;
    }

    return false;
  }

  /**
   * Show usage error for add command
   */
  showUsageError() {
    console.log(chalk.red("❌ Error: Please provide component name(s) or use --all."));
    console.log(chalk.cyan("💡 Usage: add <component-name> [component-name...] [--tsx|--jsx] [--force]"));
    console.log(chalk.gray("   Examples:"));
    console.log(chalk.gray("     add vercel --tsx"));
    console.log(chalk.gray("     add vercel next --jsx"));
    console.log(chalk.gray("     add --all --tsx"));
    console.log(chalk.gray("     add --svgl discord --tsx"));
    console.log(chalk.gray("     add --category framework --tsx"));
    console.log(chalk.gray("     add --search react --jsx"));
  }
}
