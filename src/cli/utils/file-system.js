import {
  existsSync,
  writeFileSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import chalk from "chalk";

/**
 * File system utilities for the CLI
 */
export class FileSystemUtils {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.srcDir = join(cwd, "src");
    this.componentsDir = join(this.srcDir, "components");
    this.logosDir = join(this.componentsDir, "logos");
    this.logosTrackingFile = join(cwd, "logos.json");
  }

  /**
   * Get the project type (vue, react, solid, astro, or unknown)
   * @returns {string}
   */
  getProjectType() {
    try {
      const packageJsonPath = join(this.cwd, "package.json");
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };
        
        // Check Vue first since it has its own file format
        if (dependencies.vue) {
          return "vue";
        }
        
        // Check other JSX-based frameworks
        if (dependencies.react || dependencies["react-dom"]) {
          return "react";
        }
        
        if (dependencies["solid-js"]) {
          return "solid";
        }
        
        if (dependencies.astro) {
          return "astro";
        }
      }

      // Check config files as fallback
      const configFiles = {
        "vue.config.js": "vue",
        "next.config.js": "react",
        "astro.config.mjs": "astro",
        "astro.config.js": "astro",
        "vite.config.js": "unknown", // Could be any framework
      };
      
      for (const [file, type] of Object.entries(configFiles)) {
        if (existsSync(join(this.cwd, file))) {
          return type;
        }
      }

      return "unknown";
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠️  Error checking project type: ${error.message}`)
      );
      return "unknown";
    }
  }

  /**
   * Check if the current directory is a supported project
   * @returns {boolean}
   */
  isSupportedProject() {
    const projectType = this.getProjectType();
    return ["vue", "react", "solid", "astro"].includes(projectType);
  }
  
  /**
   * Ensure directories exist
   */
  ensureDirectories() {
    if (!this.isSupportedProject()) {
      console.log(
        chalk.red(
            `❌ You are not in a valid React, SolidJS, Astro, or Vue project directory`
        )
      );
      return false;
    }

    if (!existsSync(this.componentsDir)) {
      console.log(chalk.yellow(`⚡ Creating 'components/' directory...`));
      mkdirSync(this.componentsDir, { recursive: true });
    }

    if (!existsSync(this.logosDir)) {
      console.log(chalk.yellow(`⚡ Creating 'logos/' folder...`));
      mkdirSync(this.logosDir, { recursive: true });
    }
    
    return true;
  }
  
  /**
   * Get the appropriate file extension for the project type
   * @param {boolean} isTypeScript - Whether to use TypeScript (only relevant for JSX-based frameworks)
   * @returns {string} File extension
   */
  getFileExtension(isTypeScript = false) {
    const projectType = this.getProjectType();
    
    if (projectType === "vue") {
      return "vue";
    }
    
    // For JSX-based frameworks (React, SolidJS, Astro)
    return isTypeScript ? "tsx" : "jsx";
  }

  /**
   * Check if file exists
   * @param {string} componentName - Component name
   * @param {string} extension - File extension
   * @returns {boolean}
   */
  componentExists(componentName, extension) {
    const componentFile = join(this.logosDir, `${componentName}.${extension}`);
    return existsSync(componentFile);
  }

  /**
   * Test write permissions to directory
   * @param {string} directory - Directory to test
   * @returns {boolean}
   */
  testWritePermissions(directory) {
    const testFile = join(directory, ".write-test");
    try {
      writeFileSync(testFile, "test");
      unlinkSync(testFile);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Write component file
   * @param {string} componentName - Component name
   * @param {string} content - File content
   * @param {string} extension - File extension
   * @returns {boolean}
   */
  writeComponent(componentName, content, extension) {
    try {
      this.ensureDirectories();

      // Test write permissions
      if (!this.testWritePermissions(this.logosDir)) {
        console.error(
          chalk.red(`❌ Permission denied: Cannot write to '${this.logosDir}'`)
        );
        console.log(
          chalk.yellow(
            `💡 Try running with elevated permissions or check directory ownership`
          )
        );
        return false;
      }

      const componentFile = join(
        this.logosDir,
        `${componentName}.${extension}`
      );
      writeFileSync(componentFile, content);
      return true;
    } catch (error) {
      console.error(
        chalk.red(`❌ Failed to write component: ${error.message}`)
      );

      if (error.code === "EACCES") {
        console.log(chalk.yellow(`💡 Permission denied. Try:`));
        console.log(chalk.gray(`   • Running from your project directory`));
        console.log(chalk.gray(`   • Checking directory permissions`));
        console.log(chalk.gray(`   • Using sudo (if necessary)`));
      } else if (error.code === "ENOENT") {
        console.log(
          chalk.yellow(
            `💡 Directory not found. Make sure you're in a valid project directory.`
          )
        );
      }

      return false;
    }
  }

  /**
   * Load tracking file
   * @returns {Object}
   */
  loadTracking() {
    try {
      if (existsSync(this.logosTrackingFile)) {
        const trackingContent = readFileSync(this.logosTrackingFile, "utf-8");
        return JSON.parse(trackingContent);
      }
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠️  Could not read tracking file: ${error.message}`)
      );
    }

    return { logos: [] };
  }

  /**
   * Save tracking file
   * @param {Object} tracking - Tracking data
   */
  saveTracking(tracking) {
    try {
      writeFileSync(this.logosTrackingFile, JSON.stringify(tracking, null, 2));
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠️  Could not update tracking file: ${error.message}`)
      );
    }
  }

  /**
   * Add logo to tracking
   * @param {string} componentName - Component name
   * @param {string} fileExtension - File extension
   * @param {string} componentFile - File path
   */
  addLogoToTracking(componentName, fileExtension, componentFile) {
    const tracking = this.loadTracking();

    // Remove existing entry if present
    tracking.logos = tracking.logos.filter(
      (logo) => logo.name !== componentName
    );

    // Add new entry
    tracking.logos.push({
      name: componentName,
      file: `components/logos/${componentName}.${fileExtension}`,
      createdAt: new Date().toISOString(),
    });

    this.saveTracking(tracking);
  }
}
