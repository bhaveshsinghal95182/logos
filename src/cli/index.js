#!/usr/bin/env node

import { existsSync, writeFileSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";
import chalk from "chalk";
import * as readline from "readline";
import registry from "../registry/index.js";

const args = process.argv.slice(2);
const cwd = process.cwd();

const componentsDir = join(cwd, "components");
const logosDir = join(componentsDir, "logos");
const logosTrackingFile = join(cwd, "logos.json");

// Parse command line arguments
function parseArgs() {
  const parsed = {
    command: args[0],
    components: [],
    flags: {
      tsx: false,
      jsx: false,
      force: false,
      all: false,
      svgl: false,
      category: null,
      search: null
    }
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--tsx') {
      parsed.flags.tsx = true;
    } else if (arg === '--jsx') {
      parsed.flags.jsx = true;
    } else if (arg === '--force' || arg === '-f') {
      parsed.flags.force = true;
    } else if (arg === '--all' || arg === '-a') {
      parsed.flags.all = true;
    } else if (arg === '--svgl') {
      parsed.flags.svgl = true;
    } else if (arg === '--category' || arg === '-c') {
      parsed.flags.category = args[++i];
    } else if (arg === '--search' || arg === '-s') {
      parsed.flags.search = args[++i];
    } else if (!arg.startsWith('-')) {
      parsed.components.push(arg);
    }
  }

  return parsed;
}

// Create readline interface for fallback prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Load or create logos tracking file
 */
function loadLogosTracking() {
  if (existsSync(logosTrackingFile)) {
    try {
      const content = readFileSync(logosTrackingFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.log(chalk.yellow("⚠️  Warning: Could not parse logos.json, creating new one"));
    }
  }
  
  return {
    metadata: {
      totalLogos: 0,
      lastUpdated: new Date().toISOString(),
      projectPath: cwd
    },
    logos: {}
  };
}

/**
 * Save logos tracking file
 */
function saveLogosTracking(trackingData) {
  trackingData.metadata.lastUpdated = new Date().toISOString();
  writeFileSync(logosTrackingFile, JSON.stringify(trackingData, null, 2));
}

/**
 * Add logo to tracking
 */
function addLogoToTracking(componentName, fileExtension, filePath) {
  const tracking = loadLogosTracking();
  
  tracking.logos[componentName] = {
    name: componentName,
    extension: fileExtension,
    filePath: filePath,
    createdAt: new Date().toISOString(),
    isTypeScript: fileExtension === 'tsx'
  };
  
  tracking.metadata.totalLogos = Object.keys(tracking.logos).length;
  saveLogosTracking(tracking);
  
  return tracking;
}

/**
 * Generate component content
 */
function generateComponentContent(componentName, svgContent, isTypeScript) {
  const componentClassName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
  
  // Clean SVG content for React/JSX compatibility
  let cleanedSvg = svgContent
    // Remove XML declaration
    .replace(/<\?xml[^>]*\?>\s*/i, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Convert fill-rule to fillRule
    .replace(/fill-rule=/g, 'fillRule=')
    // Convert xmlns:xlink to xmlnsXlink
    .replace(/xmlns:xlink=/g, 'xmlnsXlink=')
    // Trim whitespace
    .trim();
  
  return isTypeScript 
    ? `import React from 'react';

interface ${componentClassName}LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export default function ${componentClassName}Logo({ className, width = 24, height = 24 }: ${componentClassName}LogoProps) {
  return (
    ${cleanedSvg.replace('<svg', `<svg className={className} width={width} height={height}`)}
  );
}`
    : `import React from 'react';

export default function ${componentClassName}Logo({ className, width = 24, height = 24 }) {
  return (
    ${cleanedSvg.replace('<svg', `<svg className={className} width={width} height={height}`)}
  );
}`;
}

/**
 * Create a single component with proper error handling
 */
async function createComponent(componentName, isTypeScript, force = false) {
  const fileExtension = isTypeScript ? 'tsx' : 'jsx';
  const componentFile = join(logosDir, `${componentName}.${fileExtension}`);

  // Check if file exists and handle force flag
  if (existsSync(componentFile) && !force) {
    console.log(chalk.blue(`⏭️  '${componentName}.${fileExtension}' already exists. Use --force to overwrite.`));
    return false;
  }

  // Get component from registry
  const component = await registry.getComponent(componentName);
  if (!component) {
    console.log(chalk.red(`❌ Component '${componentName}' not found in registry.`));
    return false;
  }

  const svgContent = component.content;
  const componentContent = generateComponentContent(componentName, svgContent, isTypeScript);

  try {
    // Check if we can write to the directory
    if (!existsSync(logosDir)) {
      console.log(chalk.yellow(`⚡ Creating 'components/logos/' directory...`));
      mkdirSync(logosDir, { recursive: true });
    }
    
    // Test write permissions
    const testFile = join(logosDir, '.write-test');
    try {
      writeFileSync(testFile, 'test');
      unlinkSync(testFile);
    } catch (permError) {
      console.error(chalk.red(`❌ Permission denied: Cannot write to '${logosDir}'`));
      console.log(chalk.yellow(`💡 Try running with elevated permissions or check directory ownership`));
      return false;
    }

    writeFileSync(componentFile, componentContent);
    
    // Add to tracking
    addLogoToTracking(componentName, fileExtension, componentFile);
    
    const icon = force ? '🔄' : '✨';
    const action = force ? 'Updated' : 'Created';
    console.log(chalk.green(`${icon} ${action} '${componentName}.${fileExtension}' in 'components/logos/'`));
    
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Failed to create component: ${error.message}`));
    
    if (error.code === 'EACCES') {
      console.log(chalk.yellow(`💡 Permission denied. Try:`));
      console.log(chalk.gray(`   • Running from your project directory`));
      console.log(chalk.gray(`   • Checking directory permissions`));
      console.log(chalk.gray(`   • Using sudo (if necessary)`));
    } else if (error.code === 'ENOENT') {
      console.log(chalk.yellow(`💡 Directory not found. Make sure you're in a valid project directory.`));
    }
    
    return false;
  }
}

/**
 * Handle add command with SVGL support
 */
async function handleAddCommand(parsed) {
  let { components } = parsed;
  const { flags } = parsed;

  // Configure registry source
  if (flags.svgl) {
    registry.registrySource = 'svgl';
    registry.useSvgl = true;
    registry.useGithub = false;
  }

  // Handle category filter
  if (flags.category) {
    const categoryComponents = await registry.getComponentsByCategory(flags.category);
    if (categoryComponents.length === 0) {
      console.log(chalk.red(`❌ No components found in category '${flags.category}'`));
      const categories = await registry.getCategories();
      console.log(chalk.yellow("📋 Available categories:"));
      categories.slice(0, 10).forEach(cat => {
        console.log(chalk.cyan(`   • ${cat.category} (${cat.total} components)`));
      });
      return;
    }
    components = categoryComponents;
    console.log(chalk.blue(`📦 Adding ${components.length} components from '${flags.category}' category...`));
  }

  // Handle search filter
  if (flags.search) {
    const searchResults = await registry.searchComponents(flags.search);
    if (searchResults.length === 0) {
      console.log(chalk.red(`❌ No components found matching '${flags.search}'`));
      return;
    }
    components = searchResults;
    console.log(chalk.blue(`🔍 Found ${components.length} components matching '${flags.search}'...`));
  }

  // Handle --all flag
  if (flags.all) {
    components = await registry.getAvailableComponents();
    console.log(chalk.blue(`📦 Adding all ${components.length} available components...`));
  }

  // If no components specified, show error
  if (components.length === 0) {
    console.log(chalk.red("❌ Error: Please provide component name(s) or use --all."));
    console.log(chalk.cyan("💡 Usage: add <component-name> [component-name...] [--tsx|--jsx] [--force]"));
    console.log(chalk.gray("   Examples:"));
    console.log(chalk.gray("     add vercel --tsx"));
    console.log(chalk.gray("     add vercel next --jsx"));
    console.log(chalk.gray("     add --all --tsx"));
    console.log(chalk.gray("     add --svgl discord --tsx"));
    console.log(chalk.gray("     add --category framework --tsx"));
    console.log(chalk.gray("     add --search react --jsx"));
    return;
  }

  // Determine language preference
  let isTypeScript;
  if (flags.tsx) {
    isTypeScript = true;
  } else if (flags.jsx) {
    isTypeScript = false;
  } else {
    // Fallback to prompt
    const language = await promptUser(chalk.blue("🔧 Choose language (jsx/tsx): "));
    if (!['jsx', 'tsx'].includes(language.toLowerCase())) {
      console.log(chalk.red("❌ Error: Please choose either 'jsx' or 'tsx'."));
      return;
    }
    isTypeScript = language.toLowerCase() === 'tsx';
  }

  // Validate all components exist first
  const missingComponents = [];
  for (const componentName of components) {
    if (!(await registry.hasComponent(componentName))) {
      missingComponents.push(componentName);
    }
  }

  if (missingComponents.length > 0) {
    console.log(chalk.red(`❌ Components not found: ${missingComponents.join(', ')}`));
    console.log(chalk.yellow("📋 Available components:"));
    const available = await registry.getAvailableComponents();
    available.slice(0, 10).forEach(comp => console.log(chalk.cyan(`   • ${comp}`)));
    if (available.length > 10) {
      console.log(chalk.gray(`   ... and ${available.length - 10} more`));
    }
    return;
  }

  // Create components
  let successCount = 0;
  const ext = isTypeScript ? 'tsx' : 'jsx';
  
  console.log(chalk.blue(`🚀 Creating ${components.length} component(s) as ${ext.toUpperCase()}...`));
  
  for (const componentName of components) {
    const success = await createComponent(componentName, isTypeScript, flags.force);
    if (success) successCount++;
  }

  // Show summary
  const tracking = loadLogosTracking();
  console.log(chalk.green(`\n✅ Successfully created ${successCount}/${components.length} components`));
  console.log(chalk.gray(`📊 Total logos in project: ${tracking.metadata.totalLogos}`));
}

/**
 * Handle list command
 */
function handleListCommand() {
  const tracking = loadLogosTracking();
  console.log(chalk.blue("📋 Logos in your project:"));
  console.log(chalk.gray(`Total: ${tracking.metadata.totalLogos}`));
  
  if (tracking.metadata.totalLogos > 0) {
    Object.values(tracking.logos).forEach(logo => {
      const icon = logo.isTypeScript ? "🔷" : "🔶";
      console.log(`   ${icon} ${logo.name}.${logo.extension}`);
    });
  } else {
    console.log(chalk.yellow("   No logos found. Use 'add <component-name>' to add some!"));
  }
}

/**
 * Handle available command with SVGL support
 */
async function handleAvailableCommand(parsed) {
  const { flags } = parsed;
  
  // Configure registry source
  if (flags.svgl) {
    registry.registrySource = 'svgl';
    registry.useSvgl = true;
    registry.useGithub = false;
  }
  
  const available = await registry.getAvailableComponents();
  const stats = await registry.getStats();
  
  console.log(chalk.blue("🎨 Available components in registry:"));
  console.log(chalk.gray(`Total: ${stats.totalComponents} components (${stats.source})`));
  
  if (flags.category) {
    const categoryComponents = await registry.getComponentsByCategory(flags.category);
    console.log(chalk.yellow(`\n📁 Components in '${flags.category}' category:`));
    categoryComponents.forEach(comp => {
      console.log(chalk.cyan(`   • ${comp}`));
    });
  } else if (flags.search) {
    const searchResults = await registry.searchComponents(flags.search);
    console.log(chalk.yellow(`\n🔍 Components matching '${flags.search}':`));
    searchResults.forEach(comp => {
      console.log(chalk.cyan(`   • ${comp}`));
    });
  } else {
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

/**
 * Handle categories command (SVGL feature)
 */
async function handleCategoriesCommand(parsed) {
  const { flags } = parsed;
  
  // Configure registry source
  if (flags.svgl) {
    registry.registrySource = 'svgl';
    registry.useSvgl = true;
    registry.useGithub = false;
  }
  
  const categories = await registry.getCategories();
  
  console.log(chalk.blue("📁 Available categories:"));
  categories.slice(0, 15).forEach(cat => {
    console.log(chalk.cyan(`   • ${cat.category} `) + chalk.gray(`(${cat.total} components)`));
  });
  
  if (categories.length > 15) {
    console.log(chalk.gray(`   ... and ${categories.length - 15} more categories`));
  }
  
  console.log(chalk.yellow("\n💡 Usage examples:"));
  console.log(chalk.gray("   add --category framework --tsx"));
  console.log(chalk.gray("   available --category software"));
}

/**
 * Show help with SVGL features
 */
function showHelp() {
  console.log(chalk.blue("📦 Company Logos CLI"));
  console.log(chalk.white("\n🔧 Commands:"));
  console.log(chalk.cyan("   add <name...>     ") + chalk.gray("Add logo component(s)"));
  console.log(chalk.cyan("   list              ") + chalk.gray("List logos in project"));
  console.log(chalk.cyan("   available         ") + chalk.gray("List available components"));
  console.log(chalk.cyan("   categories        ") + chalk.gray("List component categories"));
  
  console.log(chalk.white("\n⚡ Flags:"));
  console.log(chalk.cyan("   --tsx             ") + chalk.gray("Create TypeScript components"));
  console.log(chalk.cyan("   --jsx             ") + chalk.gray("Create JavaScript components"));
  console.log(chalk.cyan("   --force, -f       ") + chalk.gray("Overwrite existing files"));
  console.log(chalk.cyan("   --all, -a         ") + chalk.gray("Add all available components"));
  console.log(chalk.cyan("   --svgl            ") + chalk.gray("Use SVGL registry (500+ logos)"));
  console.log(chalk.cyan("   --category, -c    ") + chalk.gray("Filter by category"));
  console.log(chalk.cyan("   --search, -s      ") + chalk.gray("Search components"));
  
  console.log(chalk.white("\n🌟 Examples:"));
  console.log(chalk.gray("   company-logos add vercel --tsx"));
  console.log(chalk.gray("   company-logos add --svgl discord --jsx"));
  console.log(chalk.gray("   company-logos add --category framework --tsx"));
  console.log(chalk.gray("   company-logos add --search react --jsx"));
  console.log(chalk.gray("   company-logos available --svgl"));
  console.log(chalk.gray("   company-logos categories --svgl"));
}

/**
 * Main function
 */
async function main() {
  const parsed = parseArgs();

  // Validate we're in a suitable directory
  try {
    const currentDir = process.cwd();
    console.log(chalk.gray(`📁 Working in: ${currentDir}`));
  } catch (error) {
    console.error(chalk.red("❌ Cannot access current directory"));
    process.exit(1);
  }

  // Ensure directories exist with proper error handling
  try {
    if (!existsSync(componentsDir)) {
      console.log(chalk.yellow("⚡ Creating 'components/' folder..."));
      mkdirSync(componentsDir, { recursive: true });
    }

    if (!existsSync(logosDir)) {
      console.log(chalk.yellow("⚡ Creating 'logos/' folder..."));
      mkdirSync(logosDir, { recursive: true });
    }
  } catch (error) {
    console.error(chalk.red(`❌ Cannot create directories: ${error.message}`));
    
    if (error.code === 'EACCES') {
      console.log(chalk.yellow(`💡 Permission denied. Suggestions:`));
      console.log(chalk.gray(`   • Make sure you have write permissions to this directory`));
      console.log(chalk.gray(`   • Try running from your project root directory`));
      console.log(chalk.gray(`   • Check if the directory is read-only`));
    }
    
    process.exit(1);
  }

  try {
    switch (parsed.command) {
      case "add":
        await handleAddCommand(parsed);
        break;
      case "list":
        handleListCommand();
        break;
      case "available":
        await handleAvailableCommand(parsed);
        break;
      case "categories":
        await handleCategoriesCommand(parsed);
        break;
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error(chalk.red("💥 An error occurred:"), error.message);
    
    // Provide helpful debug info
    console.log(chalk.gray("\n🔍 Debug info:"));
    console.log(chalk.gray(`   Current directory: ${process.cwd()}`));
    console.log(chalk.gray(`   Node version: ${process.version}`));
    console.log(chalk.gray(`   Platform: ${process.platform}`));
    
    process.exit(1);
  }
  
  rl.close();
}

main().catch(console.error);
