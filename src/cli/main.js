#!/usr/bin/env node

import { ArgumentParser } from './utils/argument-parser.js';
import { FileSystemUtils } from './utils/file-system.js';
import { UserInterface } from './utils/user-interface.js';
import { LogoRegistry } from '../registry/registry.js';
import { AddCommandHandler } from './commands/add-command.js';
import { AvailableCommandHandler } from './commands/available-command.js';
import { CategoriesCommandHandler } from './commands/categories-command.js';
import { ListCommandHandler } from './commands/list-command.js';

/**
 * Main CLI application class
 */
class CLI {
  constructor() {
    this.args = process.argv.slice(2);
    this.cwd = process.cwd();
    this.registry = new LogoRegistry();
    this.fileSystem = new FileSystemUtils(this.cwd);
    
    // Initialize command handlers
    this.commands = {
      add: new AddCommandHandler(this.registry, this.fileSystem),
      available: new AvailableCommandHandler(this.registry),
      categories: new CategoriesCommandHandler(this.registry),
      list: new ListCommandHandler(this.fileSystem)
    };
  }

  /**
   * Run the CLI application
   * @returns {Promise<void>}
   */
  async run() {
    try {
      // Show working directory
      UserInterface.showWorkingDirectory(this.cwd);

      // Parse arguments
      const parser = new ArgumentParser(this.args);
      const parsed = parser.parse();

      // Validate arguments
      const validation = parser.validate(parsed);
      if (!validation.isValid) {
        validation.errors.forEach(error => UserInterface.showError(error));
        return;
      }

      // Execute command
      await this.executeCommand(parsed);

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Execute the appropriate command
   * @param {Object} parsed - Parsed command arguments
   * @returns {Promise<void>}
   */
  async executeCommand(parsed) {
    const { command } = parsed;

    switch (command) {
      case 'add':
        await this.commands.add.execute(parsed);
        break;

      case 'list':
        await this.commands.list.execute();
        break;

      case 'available':
        await this.commands.available.execute(parsed);
        break;

      case 'categories':
        await this.commands.categories.execute(parsed);
        break;

      case 'help':
      case '--help':
      case '-h':
        UserInterface.showHelp();
        break;

      default:
        if (!command) {
          UserInterface.showHelp();
        } else {
          UserInterface.showError(`Unknown command: ${command}`);
          UserInterface.showInfo("Use 'help' to see available commands");
        }
        break;
    }
  }

  /**
   * Handle application errors
   * @param {Error} error - Error to handle
   */
  handleError(error) {
    console.error('💥 An error occurred:', error.message);
    
    console.log('\n🔍 Debug info:');
    console.log(`   Current directory: ${this.cwd}`);
    console.log(`   Node version: ${process.version}`);
    console.log(`   Platform: ${process.platform}`);
    
    if (process.env.DEBUG) {
      console.error('\nFull stack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the CLI
const cli = new CLI();
cli.run();
