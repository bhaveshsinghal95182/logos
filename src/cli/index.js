import { existsSync, writeFileSync, mkdirSync, readFileSync } from "fs";
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
      all: false
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
  
  return isTypeScript 
    ? `import React from 'react';

interface ${componentClassName}LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export default function ${componentClassName}Logo({ className, width = 24, height = 24 }: ${componentClassName}LogoProps) {
  return (
    ${svgContent.replace('<svg', `<svg className={className} width={width} height={height}`)}
  );
}`
    : `import React from 'react';

export default function ${componentClassName}Logo({ className, width = 24, height = 24 }) {
  return (
    ${svgContent.replace('<svg', `<svg className={className} width={width} height={height}`)}
  );
}`;
}

/**
 * Create a single component
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

  writeFileSync(componentFile, componentContent);
  
  // Add to tracking
  addLogoToTracking(componentName, fileExtension, componentFile);
  
  const icon = force ? '🔄' : '✨';
  const action = force ? 'Updated' : 'Created';
  console.log(chalk.green(`${icon} ${action} '${componentName}.${fileExtension}' in 'components/logos/'`));
  
  return true;
}

/**
 * Handle add command
 */
async function handleAddCommand(parsed) {
  let { components } = parsed;
  const { flags } = parsed;

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
    available.forEach(comp => console.log(chalk.cyan(`   • ${comp}`)));
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
 * Handle available command
 */
async function handleAvailableCommand() {
  const available = await registry.getAvailableComponents();
  const stats = await registry.getStats();
  
  console.log(chalk.blue("🎨 Available components in registry:"));
  console.log(chalk.gray(`Total: ${stats.totalComponents} components (${stats.source})`));
  
  available.forEach(comp => {
    console.log(chalk.cyan(`   • ${comp}`));
  });
}

/**
 * Show help
 */
function showHelp() {
  console.log(chalk.blue("📦 Logos CLI"));
  console.log(chalk.white("\n🔧 Commands:"));
  console.log(chalk.cyan("   add <name...>     ") + chalk.gray("Add logo component(s)"));
  console.log(chalk.cyan("   list              ") + chalk.gray("List logos in project"));
  console.log(chalk.cyan("   available         ") + chalk.gray("List available components"));
  
  console.log(chalk.white("\n⚡ Flags:"));
  console.log(chalk.cyan("   --tsx             ") + chalk.gray("Create TypeScript components"));
  console.log(chalk.cyan("   --jsx             ") + chalk.gray("Create JavaScript components"));
  console.log(chalk.cyan("   --force, -f       ") + chalk.gray("Overwrite existing files"));
  console.log(chalk.cyan("   --all, -a         ") + chalk.gray("Add all available components"));
  
  console.log(chalk.white("\n🌟 Examples:"));
  console.log(chalk.gray("   logos add vercel --tsx"));
  console.log(chalk.gray("   logos add vercel next --jsx --force"));
  console.log(chalk.gray("   logos add --all --tsx"));
  console.log(chalk.gray("   logos list"));
  console.log(chalk.gray("   logos available"));
}

/**
 * Main function
 */
async function main() {
  const parsed = parseArgs();

  // Ensure directories exist
  if (!existsSync(componentsDir)) {
    console.log(chalk.yellow("⚡ Creating 'components/' folder..."));
    mkdirSync(componentsDir, { recursive: true });
  }

  if (!existsSync(logosDir)) {
    console.log(chalk.yellow("⚡ Creating 'logos/' folder..."));
    mkdirSync(logosDir, { recursive: true });
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
        await handleAvailableCommand();
        break;
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error(chalk.red("💥 An error occurred:"), error.message);
  }
  
  rl.close();
}

main().catch(console.error);
