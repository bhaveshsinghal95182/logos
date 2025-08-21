/**
 * Command line argument parser
 */
export class ArgumentParser {
  constructor(args) {
    this.args = args;
  }

  /**
   * Parse command line arguments into structured format
   * @returns {Object} Parsed arguments with command, components, and flags
   */
  parse() {
    const parsed = {
      command: this.args[0],
      components: [],
      flags: {
        tsx: false,
        jsx: false,
        force: false,
        all: false,
        category: null,
        search: null,
      },
    };

    for (let i = 1; i < this.args.length; i++) {
      const arg = this.args[i];

      switch (arg) {
        case "--tsx":
          parsed.flags.tsx = true;
          break;
        case "--jsx":
          parsed.flags.jsx = true;
          break;
        case "--force":
        case "-f":
          parsed.flags.force = true;
          break;
        case "--all":
        case "-a":
          parsed.flags.all = true;
          break;
        case "--category":
        case "-c":
          if (i + 1 < this.args.length) {
            parsed.flags.category = this.args[++i];
          } else {
            parsed.flags.category = null; // will trigger validation error
          }
          break;
        case "--search":
        case "-s":
          parsed.flags.search = this.args[++i];
          break;
        default:
          if (!arg.startsWith("-")) {
            parsed.components.push(arg);
          }
          break;
      }
    }

    return parsed;
  }

  /**
   * Validate parsed arguments
   * @param {Object} parsed - Parsed arguments
   * @returns {Object} Validation result with isValid and errors
   */
  validate(parsed) {
    const errors = [];

    // Check for conflicting language flags
    if (parsed.flags.tsx && parsed.flags.jsx) {
      errors.push("Cannot use both --tsx and --jsx flags");
    }

    // Check for required arguments based on command
    if (
      parsed.command === "add" &&
      parsed.components.length === 0 &&
      !parsed.flags.all &&
      !parsed.flags.category &&
      !parsed.flags.search
    ) {
      errors.push(
        "Add command requires component names or --all/--category/--search flags"
      );
    }

    // Check for category argument
    if (
      parsed.flags.category !== null &&
      typeof parsed.flags.category !== "string"
    ) {
      errors.push("--category flag requires a value");
    }

    // Check for search argument
    if (
      parsed.flags.search !== null &&
      typeof parsed.flags.search !== "string"
    ) {
      errors.push("--search flag requires a value");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
