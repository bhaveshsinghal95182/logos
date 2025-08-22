/**
 * Component generator utility for multiple frameworks
 */
export class ComponentGenerator {
  /**
   * Generate component content from SVG based on project type
   * @param {string} componentName - Component name
   * @param {string} svgContent - SVG content
   * @param {string} projectType - Project type (vue, react, solid, astro)
   * @param {boolean} isTypeScript - Whether to generate TypeScript (for JSX frameworks)
   * @returns {string} Generated component content
   */
  static generate(componentName, svgContent, projectType, isTypeScript = false) {
    const componentClassName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
    
    switch (projectType) {
      case 'vue':
        return this.generateVueComponent(componentClassName, svgContent);
      case 'react':
      case 'solid':
      case 'astro':
      default:
        // Clean SVG content for React/JSX compatibility
        const cleanedSvg = this.cleanSvgContent(svgContent);
        return isTypeScript 
          ? this.generateTypeScriptComponent(componentClassName, cleanedSvg)
          : this.generateJavaScriptComponent(componentClassName, cleanedSvg);
    }
  }

  /**
   * Generate Vue component
   * @param {string} componentClassName - Component class name
   * @param {string} svgContent - Raw SVG content
   * @returns {string} Vue component
   */
  static generateVueComponent(componentClassName, svgContent) {
    // Clean SVG for Vue (less aggressive than JSX cleaning)
    const cleanedSvg = svgContent
      .replace(/<\?xml[^>]*\?>\s*/i, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();

    return `<template>
  <div class="logo-container" :class="className" :style="{ width: width, height: height }">
    ${cleanedSvg}
  </div>
</template>

<script setup>
defineProps({
  className: {
    type: String,
    default: ''
  },
  width: {
    type: [Number, String],
    default: 24
  },
  height: {
    type: [Number, String],
    default: 24
  }
})
</script>

<style scoped>
.logo-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.logo-container svg {
  width: 100%;
  height: 100%;
}
</style>`;
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
