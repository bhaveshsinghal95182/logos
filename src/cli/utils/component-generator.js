/**
 * React component generator utility
 */
export class ComponentGenerator {
  /**
   * Generate React component content from SVG
   * @param {string} componentName - Component name
   * @param {string} svgContent - SVG content
   * @param {boolean} isTypeScript - Whether to generate TypeScript
   * @returns {string} Generated component content
   */
  static generate(componentName, svgContent, isTypeScript) {
    const componentClassName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
    
    // Clean SVG content for React/JSX compatibility
    const cleanedSvg = this.cleanSvgContent(svgContent);
    
    return isTypeScript 
      ? this.generateTypeScriptComponent(componentClassName, cleanedSvg)
      : this.generateJavaScriptComponent(componentClassName, cleanedSvg);
  }

  /**
   * Clean SVG content for React/JSX compatibility
   * @param {string} svgContent - Raw SVG content
   * @returns {string} Cleaned SVG content
   */
  static cleanSvgContent(svgContent) {
    return svgContent
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
  }

  /**
   * Generate TypeScript component
   * @param {string} componentClassName - Component class name
   * @param {string} cleanedSvg - Cleaned SVG content
   * @returns {string} TypeScript component
   */
  static generateTypeScriptComponent(componentClassName, cleanedSvg) {
    return `import React from 'react';

interface ${componentClassName}LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export default function ${componentClassName}Logo({ className, width = 24, height = 24 }: ${componentClassName}LogoProps) {
  return (
    ${cleanedSvg.replace('<svg', `<svg className={className} width={width} height={height}`)}
  );
}`;
  }

  /**
   * Generate JavaScript component
   * @param {string} componentClassName - Component class name
   * @param {string} cleanedSvg - Cleaned SVG content
   * @returns {string} JavaScript component
   */
  static generateJavaScriptComponent(componentClassName, cleanedSvg) {
    return `import React from 'react';

export default function ${componentClassName}Logo({ className, width = 24, height = 24 }) {
  return (
    ${cleanedSvg.replace('<svg', `<svg className={className} width={width} height={height}`)}
  );
}`;
  }
}
