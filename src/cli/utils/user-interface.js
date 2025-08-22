import * as readline from "readline";
import chalk from "chalk";

/**
 * User interface utilities for prompts and console output
 */
export class UserInterface {
  /**
   * Prompt user for input
   * @param {string} question - Question to ask
   * @returns {Promise<string>} User input
   */
  static async promptUser(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  /**
   * Display help information
   */
  static showHelp() {
    console.log(chalk.blue("📦 Company Logos CLI"));
    console.log();
    console.log(chalk.green("🔧 Commands:"));
    console.log("   add <name...>     Add logo component(s)");
    console.log("   list              List logos in project");
    console.log("   available         List available components");
    console.log("   categories        List component categories");
    console.log();
    console.log(chalk.green("⚡ Flags:"));
    console.log("   --tsx             Create TypeScript components");
    console.log("   --jsx             Create JavaScript components");
    console.log("   --force, -f       Overwrite existing files");
    console.log("   --all, -a         Add all available components");
    console.log("   --category, -c    Filter by category");
    console.log("   --search, -s      Search components");
    console.log();
    console.log(chalk.green("🌟 Examples:"));
    console.log("   company-logos add vercel --tsx");
    console.log("   company-logos add discord --jsx");
    console.log("   company-logos add --category framework --tsx");
    console.log("   company-logos add --search react --jsx");
    console.log("   company-logos available");
    console.log("   company-logos categories");
  }

  /**
   * Show working directory information
   * @param {string} cwd - Current working directory
   */
  static showWorkingDirectory(cwd) {
    console.log(chalk.blue(`📁 Working in: ${cwd}`));
  }

  /**
   * Show creation progress
   * @param {number} count - Number of components to create
   * @param {boolean} isTypeScript - Whether creating TypeScript components
   * @param {string} projectType - Project type (vue, react, solid, astro)
   */
  static showCreationProgress(count, isTypeScript, projectType = 'react') {
    let lang;
    switch (projectType) {
      case 'vue':
        lang = 'Vue';
        break;
      case 'solid':
        lang = isTypeScript ? 'Solid TSX' : 'Solid JSX';
        break;
      case 'astro':
        lang = isTypeScript ? 'Astro TSX' : 'Astro JSX';
        break;
      case 'react':
      default:
        lang = isTypeScript ? 'React TSX' : 'React JSX';
        break;
    }
    console.log(chalk.blue(`🚀 Creating ${count} component(s) as ${lang}...`));
  }

  /**
   * Show creation success
   * @param {string} componentName - Component name
   * @param {string} extension - File extension
   * @param {boolean} force - Whether it was forced update
   */
  static showCreationSuccess(componentName, extension, force = false) {
    const icon = force ? '🔄' : '✨';
    const action = force ? 'Updated' : 'Created';
    console.log(chalk.green(`${icon} ${action} '${componentName}.${extension}' in 'components/logos/'`));
  }

  /**
   * Show file exists warning
   * @param {string} componentName - Component name
   * @param {string} extension - File extension
   */
  static showFileExists(componentName, extension) {
    console.log(chalk.blue(`⏭️  '${componentName}.${extension}' already exists. Use --force to overwrite.`));
  }

  /**
   * Show final summary
   * @param {number} successful - Number of successful creations
   * @param {number} total - Total number attempted
   * @param {number} totalLogos - Total logos in project
   */
  static showSummary(successful, total, totalLogos) {
    if (successful === total) {
      console.log(chalk.green(`\n✅ Successfully created ${successful}/${total} components`));
    } else {
      console.log(chalk.yellow(`\n⚠️  Created ${successful}/${total} components`));
    }
    console.log(chalk.blue(`📊 Total logos in project: ${totalLogos}`));
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  static showError(message) {
    console.log(chalk.red(`❌ ${message}`));
  }

  /**
   * Show warning message
   * @param {string} message - Warning message
   */
  static showWarning(message) {
    console.log(chalk.yellow(`⚠️  ${message}`));
  }

  /**
   * Show info message
   * @param {string} message - Info message
   */
  static showInfo(message) {
    console.log(chalk.blue(`ℹ️  ${message}`));
  }

  /**
   * Show components not found error
   * @param {string[]} missingComponents - Missing component names
   * @param {string[]} availableComponents - Available component names
   */
  static showComponentsNotFound(missingComponents, availableComponents) {
    console.log(chalk.red(`❌ Components not found: ${missingComponents.join(', ')}`));
    console.log(chalk.blue("📋 Available components:"));
    
    const displayCount = Math.min(availableComponents.length, 10);
    for (let i = 0; i < displayCount; i++) {
      console.log(chalk.cyan(`   • ${availableComponents[i]}`));
    }
    
    if (availableComponents.length > 10) {
      console.log(chalk.gray(`   ... and ${availableComponents.length - 10} more`));
    }
  }
}
