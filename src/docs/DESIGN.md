# Gaia Design System & Principles

## Table of Contents

1. [Overview](#overview)
2. [Core Design Principles](#core-design-principles)
3. [Visual Language](#visual-language)
4. [Responsive Design](#responsive-design)
5. [Accessibility](#accessibility)
6. [Component Design](#component-design)
7. [Mobile-Specific Guidelines](#mobile-specific-guidelines)
8. [Apple Platform Guidelines](#apple-platform-guidelines)

## Overview

The Gaia design system is built on a Discord-inspired dark theme that prioritizes readability, usability, and a cohesive visual experience across different device sizes. This document outlines the key design principles, visual elements, and guidelines for maintaining a consistent look and feel throughout the application.

## Core Design Principles

### 1. Clarity

- Clear visual hierarchy with distinct sections
- Focused UI with minimal distractions
- Intuitive navigation patterns
- Well-defined interactive elements

### 2. Consistency

- Uniform visual language across components
- Predictable interaction patterns
- Standardized spacing and layout
- Consistent typography and iconography

### 3. Efficiency

- Quick access to core functionality
- Streamlined workflows
- Reduced cognitive load
- Minimal steps to complete tasks

### 4. Flexibility

- Adaptable layouts for different screen sizes
- Customizable interfaces for different user needs
- Support for different use contexts (casual, professional)
- Extensible design patterns

## Visual Language

### Color System

Our color system is based on a Discord-like dark theme with carefully defined colors for different purposes:

#### Primary Colors

- **Background**: `--discord-primary: #36393f` - Main application background
- **Secondary Background**: `--discord-secondary: #2f3136` - Secondary elements, sidebars
- **Tertiary Background**: `--discord-tertiary: #202225` - Borders, dividers, subtle elements
- **Accent**: `--discord-accent: #5865f2` - Primary action buttons, selected states
- **Accent Hover**: `--discord-accent-hover: #4752c4` - Hover state for accent elements

#### Text Colors

- **Primary Text**: `--text-normal: #dcddde` - Main body text
- **Secondary Text**: `--text-muted: #a3a6aa` - Less important text, timestamps, metadata
- **Link Text**: `--text-link: #00aff4` - Hyperlinks

#### Interactive Elements

- **Normal**: `--interactive-normal: #b9bbbe` - Default state
- **Hover**: `--interactive-hover: #dcddde` - Hover state
- **Active**: `--interactive-active: #fff` - Active/pressed state
- **Muted**: `--interactive-muted: #4f5660` - Disabled or inactive elements

#### Status Colors

- **Success/Online**: `--status-green: #3ba55c` - Success messages, online status
- **Warning**: `--status-yellow: #faa61a` - Warning messages, alerts
- **Error/Danger**: `--status-red: #ed4245` - Error messages, destructive actions
- **Special**: `--status-purple: #9b59b6` - Special indicators, premium features

### Typography

- **Primary Font**: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif
- **Code Font**: 'Consolas', 'Monaco', 'Courier New', monospace

#### Font Size Scale

- Base font size: 16px
- Scale ratio: 1.2 (minor third)

#### Text Styles

- **Headings**: Bold, slightly larger than body text
- **Body**: Regular weight, high contrast for readability
- **UI Elements**: Medium weight for buttons and interactive elements
- **Metadata**: Smaller size, lower contrast for secondary information

### Spacing System

We use a consistent spacing scale to create harmonious layouts:

- **Extra Small**: `--spacing-xs: 4px` - Minimal separation, icon padding
- **Small**: `--spacing-sm: 8px` - Compact elements, icon margins
- **Medium**: `--spacing-md: 16px` - Standard separation between related elements
- **Large**: `--spacing-lg: 24px` - Separation between distinct sections
- **Extra Large**: `--spacing-xl: 32px` - Major section divisions

### Elevation (Shadows)

Shadow levels create visual hierarchy and depth:

- **Low**: `--elevation-low` - Subtle separation for cards and containers
- **Medium**: `--elevation-medium` - Modals, popovers, dropdowns
- **High**: `--elevation-high` - Important dialogs, focused UI elements

## Responsive Design

Gaia is designed to work seamlessly across different screen sizes through a mobile-first approach.

### Breakpoints

- **Small**: Up to 480px (Mobile phones)
- **Medium**: 481px to 768px (Tablets and large phones)
- **Large**: 769px to 1024px (Small laptops)
- **Extra Large**: 1025px and above (Desktops and large laptops)

### Layout Approach

- Fluid grid system with percentage-based widths
- Flexbox for component layouts
- CSS Grid for complex page structures
- Responsive spacing that scales with screen size

### Responsive Behavior

- **Mobile**: Single column layout, collapsed sidebar, simplified UI
- **Tablet**: Two-column layout where appropriate, expandable sidebar
- **Desktop**: Multi-column layout, persistent sidebar, expanded functionality

## Accessibility

Accessibility is a core part of our design system:

- Color contrast ratios meet WCAG AA standards (4.5:1 for normal text)
- Interactive elements have clear focus states
- Semantic HTML with appropriate ARIA attributes
- Keyboard navigability throughout the application
- Screen reader friendly implementation

## Component Design

### Common Components

#### 1. Buttons

- **Primary**: Filled with accent color, high contrast
- **Secondary**: Outlined or subtle background
- **Tertiary**: Text-only for less important actions
- **Destructive**: Red background for destructive actions

#### 2. Input Fields

- Clear focus states
- Visible labels
- Validation feedback
- Consistent padding and sizing

#### 3. Cards

- Subtle elevation
- Consistent padding
- Clear content hierarchy
- Optional interactive states

#### 4. Modals & Dialogs

- Center of attention with backdrop
- Clear action buttons
- Dismissible via various methods (button, escape key, outside click)
- Mobile-optimized sizing

#### 5. Navigation

- Clear current state indicators
- Consistent interaction patterns
- Scalable for different screen sizes
- Keyboard accessible

## Mobile-Specific Guidelines

### Touch Targets

- Minimum touch target size of 44×44 points
- Adequate spacing between interactive elements
- Larger hit areas for primary actions

### Gestures

- Swipe for common actions (navigation, dismissal)
- Pull to refresh for content updates
- Pinch to zoom for images and content when appropriate
- Long press for secondary actions

### Interface Adaptations

- Bottom-aligned key actions for thumb reachability
- Simplified navigation models
- Reduced information density
- Context-appropriate keyboards for input fields

### Performance Considerations

- Optimized image sizes
- Reduced animation complexity
- Efficient rendering techniques
- Bandwidth-conscious resource loading

## Apple Platform Guidelines

When deploying to Apple platforms, these additional guidelines apply:

### iOS/iPadOS

- Respect safe areas (notches, home indicator)
- Implement native-feeling momentum scrolling
- Use SF Pro or SF Pro Display fonts for system alignment
- Follow iOS gesture conventions

#### iOS-Specific CSS

```css
/* Enable momentum scrolling */
.scrollable-container {
  -webkit-overflow-scrolling: touch;
}

/* Respect safe areas */
.main-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### macOS

- Support keyboard shortcuts
- Implement hover states
- Design for both trackpad and mouse interaction
- Consider menu bar integration when appropriate

### Animations and Transitions

- Natural, physics-based animations
- Quick response to user input
- Purposeful motion that guides attention
- Respect reduced motion preferences

---

This design system is a living document that will evolve alongside the Gaia application. Designers and developers should use these guidelines to create consistent, accessible, and delightful user experiences across all platforms and devices.