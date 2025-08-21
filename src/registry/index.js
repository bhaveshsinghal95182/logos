// Backward compatibility - export new refactored registry
import { LogoRegistry } from './registry.js';

// Create and export registry instance
const registry = new LogoRegistry();

export default registry;
export { LogoRegistry };
