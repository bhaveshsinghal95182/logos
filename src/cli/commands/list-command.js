import chalk from "chalk";

/**
 * Handle the list command
 */
export class ListCommandHandler {
  constructor(fileSystem) {
    this.fileSystem = fileSystem;
  }

  /**
   * Execute the list command
   * @returns {Promise<void>}
   */
  async execute() {
    const tracking = this.fileSystem.loadTracking();
    
    if (tracking.logos.length === 0) {
      console.log(chalk.yellow("📦 No logos found in your project"));
      console.log(chalk.gray("💡 Use 'add' command to add some logos"));
      return;
    }

    console.log(chalk.blue(`📦 Logos in your project (${tracking.logos.length}):`));
    console.log();

    tracking.logos.forEach((logo, index) => {
      const formattedDate = new Date(logo.createdAt).toLocaleDateString();
      console.log(chalk.cyan(`${index + 1}. ${logo.name}`));
      console.log(chalk.gray(`   File: ${logo.file}`));
      console.log(chalk.gray(`   Created: ${formattedDate}`));
      if (index < tracking.logos.length - 1) {
        console.log();
      }
    });
  }
}
