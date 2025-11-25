# CSS Variables Pattern Examples

**Document Version**: 1.0  
**Created**: August 25, 2025  
**Project**: JetSetGo Child App Template  
**Purpose**: Comprehensive examples of common UI patterns using the CSS Variables system

## Table of Contents

1. [Overview](#overview)
2. [Button Patterns](#button-patterns)
3. [Form Element Patterns](#form-element-patterns)
4. [Card and Layout Patterns](#card-and-layout-patterns)
5. [Status and Badge Patterns](#status-and-badge-patterns)
6. [Navigation Patterns](#navigation-patterns)
7. [Modal and Overlay Patterns](#modal-and-overlay-patterns)
8. [Data Display Patterns](#data-display-patterns)
9. [Loading and State Patterns](#loading-and-state-patterns)
10. [Responsive Patterns](#responsive-patterns)

---

## Overview

This document provides comprehensive examples of common UI patterns implemented using the CSS Variables system. Each pattern demonstrates proper usage of wrapper variables, custom app variables, and fallbacks.

### Pattern Structure

Each pattern includes:
- **CSS Implementation**: Complete CSS using variables
- **React Component Example**: TypeScript React component
- **Usage Example**: How to use the component
- **Accessibility Notes**: WCAG compliance considerations
- **Variations**: Different states and variants

---

## Button Patterns

### Primary Action Button

**Use Case**: Main call-to-action buttons, form submissions, primary navigation

**CSS Implementation**:
```css
.btn-primary {
  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--jetsetgo-template-button-min-width, 64px);
  height: var(--height-button, 2.5rem);
  padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
  
  /* Typography */
  font-family: var(--font-family-base, 'Inter', sans-serif);
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  text-decoration: none;
  
  /* Appearance */
  background-color: var(--color-primary-600, #2563eb);
  color: var(--color-white, #ffffff);
  border: none;
  border-radius: var(--radius-md, 0.375rem);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  
  /* Interactions */
  cursor: pointer;
  transition: var(--transition-fast, all 150ms ease);
  
  /* States */
  &:hover {
    background-color: var(--color-primary-700, #1d4ed8);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  }
  
  &:active {
    background-color: var(--color-primary-800, #1e40af);
    transform: translateY(1px);
  }
  
  &:focus-visible {
    outline: var(--focus-ringWidth, 2px) solid var(--focus-borderColor, #3b82f6);
    outline-offset: var(--focus-ringOffset, 2px);
  }
  
  &:disabled {
    background-color: var(--color-gray-300, #d1d5db);
    color: var(--color-gray-500, #6b7280);
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
}
```

**React Component**:
```tsx
import React from 'react';
import { cn } from '../utils/cn';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  loading?: boolean;
}

export function PrimaryButton({ 
  children, 
  onClick, 
  disabled = false,
  type = 'button',
  className,
  loading = false
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn('btn-primary', className)}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
```

**Usage Examples**:
```tsx
// Basic usage
<PrimaryButton onClick={() => console.log('Clicked')}>
  Save Changes
</PrimaryButton>

// With loading state
<PrimaryButton loading={isSubmitting} type="submit">
  {isSubmitting ? 'Saving...' : 'Save'}
</PrimaryButton>

// Disabled state
<PrimaryButton disabled={!formValid}>
  Submit Form
</PrimaryButton>
```

### Secondary Button

**CSS Implementation**:
```css
.btn-secondary {
  /* Inherit base button styles */
  @apply btn-primary;
  
  /* Override appearance */
  background-color: transparent;
  color: var(--color-primary-600, #2563eb);
  border: 1px solid var(--color-primary-600, #2563eb);
  box-shadow: none;
  
  &:hover {
    background-color: var(--color-primary-50, #eff6ff);
    border-color: var(--color-primary-700, #1d4ed8);
    color: var(--color-primary-700, #1d4ed8);
    box-shadow: none;
  }
  
  &:active {
    background-color: var(--color-primary-100, #dbeafe);
  }
  
  &:disabled {
    background-color: transparent;
    border-color: var(--color-gray-300, #d1d5db);
    color: var(--color-gray-400, #9ca3af);
  }
}
```

### Button Size Variants

**CSS Implementation**:
```css
.btn-sm {
  height: var(--height-button-sm, 2rem);
  padding: var(--spacing-1, 0.25rem) var(--spacing-3, 0.75rem);
  font-size: var(--text-xs, 0.75rem);
  min-width: calc(var(--jetsetgo-template-button-min-width, 64px) * 0.8);
}

.btn-lg {
  height: var(--height-button-lg, 3rem);
  padding: var(--spacing-3, 0.75rem) var(--spacing-6, 1.5rem);
  font-size: var(--text-base, 1rem);
  min-width: calc(var(--jetsetgo-template-button-min-width, 64px) * 1.5);
}
```

---

## Form Element Patterns

### Input Field with Label

**CSS Implementation**:
```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2, 0.5rem);
}

.form-label {
  font-family: var(--font-family-base, 'Inter', sans-serif);
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text, #111827);
}

.form-label.required::after {
  content: ' *';
  color: var(--color-error-600, #dc2626);
}

.form-input {
  width: 100%;
  height: var(--height-input, 2.5rem);
  padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
  
  /* Typography */
  font-family: var(--font-family-base, 'Inter', sans-serif);
  font-size: var(--text-sm, 0.875rem);
  color: var(--color-text, #111827);
  
  /* Appearance */
  background-color: var(--input-background, #ffffff);
  border: 1px solid var(--input-borderColor, #d1d5db);
  border-radius: var(--radius-md, 0.375rem);
  
  /* Interactions */
  transition: var(--transition-fast, all 150ms ease);
  
  &::placeholder {
    color: var(--input-placeholderColor, #9ca3af);
  }
  
  &:focus {
    outline: none;
    border-color: var(--focus-borderColor, #3b82f6);
    box-shadow: 0 0 0 var(--focus-ringWidth, 2px) 
                color-mix(in srgb, var(--focus-shadowColor, #3b82f6) 25%, transparent);
  }
  
  &:disabled {
    background-color: var(--input-disabledBackground, #f3f4f6);
    color: var(--input-disabledColor, #6b7280);
    cursor: not-allowed;
  }
  
  &.error {
    border-color: var(--color-error-600, #dc2626);
    &:focus {
      border-color: var(--color-error-600, #dc2626);
      box-shadow: 0 0 0 var(--focus-ringWidth, 2px) 
                  color-mix(in srgb, var(--color-error-600, #dc2626) 25%, transparent);
    }
  }
  
  &.success {
    border-color: var(--color-success-600, #059669);
    &:focus {
      border-color: var(--color-success-600, #059669);
      box-shadow: 0 0 0 var(--focus-ringWidth, 2px) 
                  color-mix(in srgb, var(--color-success-600, #059669) 25%, transparent);
    }
  }
}

.form-help-text {
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-text-secondary, #6b7280);
  margin-top: var(--spacing-1, 0.25rem);
}

.form-error-text {
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-error-600, #dc2626);
  margin-top: var(--spacing-1, 0.25rem);
  display: flex;
  align-items: center;
  gap: var(--spacing-1, 0.25rem);
}
```

**React Component**:
```tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}

export function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  className
}: FormInputProps) {
  return (
    <div className={cn('form-group', className)}>
      <label 
        htmlFor={name} 
        className={cn('form-label', required && 'required')}
      >
        {label}
      </label>
      
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cn(
          'form-input',
          error && 'error',
          !error && value && 'success'
        )}
        aria-describedby={
          error ? `${name}-error` : helpText ? `${name}-help` : undefined
        }
        aria-invalid={!!error}
      />
      
      {error && (
        <div id={`${name}-error`} className="form-error-text" role="alert">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div id={`${name}-help`} className="form-help-text">
          {helpText}
        </div>
      )}
    </div>
  );
}
```

### Select Dropdown

**CSS Implementation**:
```css
.form-select {
  @apply form-input;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right var(--spacing-2, 0.5rem) center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  appearance: none;
  padding-right: calc(var(--spacing-8, 2rem) + var(--spacing-2, 0.5rem));
}
```

---

## Card and Layout Patterns

### Basic Card Component

**CSS Implementation**:
```css
.card {
  background-color: var(--color-background, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-lg, 0.5rem);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  overflow: hidden;
  transition: var(--transition-fast, all 150ms ease);
  
  &:hover {
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  }
}

.card-header {
  padding: var(--jetsetgo-template-card-padding, 1.5rem);
  border-bottom: 1px solid var(--color-border-secondary, #f3f4f6);
  background-color: var(--color-gray-50, #f9fafb);
}

.card-title {
  margin: 0;
  font-family: var(--font-family-heading, 'Inter', sans-serif);
  font-size: var(--text-lg, 1.125rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text, #111827);
}

.card-body {
  padding: var(--jetsetgo-template-card-padding, 1.5rem);
}

.card-footer {
  padding: var(--jetsetgo-template-card-padding, 1.5rem);
  border-top: 1px solid var(--color-border-secondary, #f3f4f6);
  background-color: var(--color-gray-50, #f9fafb);
  display: flex;
  align-items: center;
  gap: var(--spacing-3, 0.75rem);
}
```

**React Component**:
```tsx
import React from 'react';
import { cn } from '../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className, hover = true }: CardProps) {
  return (
    <div className={cn('card', !hover && 'hover:shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('card-header', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, as = 'h3' }: CardTitleProps) {
  const Component = as;
  return (
    <Component className={cn('card-title', className)}>
      {children}
    </Component>
  );
}

export function CardBody({ children, className }: CardBodyProps) {
  return (
    <div className={cn('card-body', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('card-footer', className)}>
      {children}
    </div>
  );
}
```

**Usage Example**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>User Profile</CardTitle>
  </CardHeader>
  <CardBody>
    <p>User information and details go here.</p>
  </CardBody>
  <CardFooter>
    <PrimaryButton>Edit Profile</PrimaryButton>
    <SecondaryButton>View History</SecondaryButton>
  </CardFooter>
</Card>
```

---

## Status and Badge Patterns

### Status Badge Component

**CSS Implementation**:
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1, 0.25rem);
  padding: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
  border-radius: var(--radius-full, 9999px);
  font-family: var(--font-family-base, 'Inter', sans-serif);
  font-size: var(--text-xs, 0.75rem);
  font-weight: var(--font-weight-medium, 500);
  line-height: 1;
  white-space: nowrap;
}

.badge-success {
  color: var(--color-success-800, #065f46);
  background-color: color-mix(in srgb, var(--color-success-600, #059669) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-success-600, #059669) 25%, transparent);
}

.badge-warning {
  color: var(--color-warning-800, #92400e);
  background-color: color-mix(in srgb, var(--color-warning-500, #f59e0b) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-warning-500, #f59e0b) 25%, transparent);
}

.badge-error {
  color: var(--color-error-800, #991b1b);
  background-color: color-mix(in srgb, var(--color-error-600, #dc2626) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-error-600, #dc2626) 25%, transparent);
}

.badge-info {
  color: var(--color-info-800, #1e40af);
  background-color: color-mix(in srgb, var(--color-info-600, #2563eb) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-info-600, #2563eb) 25%, transparent);
}

.badge-processing {
  color: var(--jetsetgo-template-status-processing, #9333ea);
  background-color: color-mix(in srgb, var(--jetsetgo-template-status-processing, #9333ea) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--jetsetgo-template-status-processing, #9333ea) 25%, transparent);
}

.badge-queued {
  color: var(--jetsetgo-template-status-queued, #ca8a04);
  background-color: color-mix(in srgb, var(--jetsetgo-template-status-queued, #ca8a04) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--jetsetgo-template-status-queued, #ca8a04) 25%, transparent);
}
```

**React Component**:
```tsx
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, Clock, Loader } from 'lucide-react';
import { cn } from '../utils/cn';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'processing' | 'queued';

interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
  showIcon?: boolean;
  className?: string;
}

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  processing: Loader,
  queued: Clock,
};

export function Badge({ 
  children, 
  variant, 
  showIcon = true, 
  className 
}: BadgeProps) {
  const Icon = iconMap[variant];
  
  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {showIcon && (
        <Icon 
          size={12} 
          className={variant === 'processing' ? 'animate-spin' : ''} 
        />
      )}
      {children}
    </span>
  );
}
```

**Usage Examples**:
```tsx
// Status indicators
<Badge variant="success">Completed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="processing">Processing</Badge>
<Badge variant="queued">Queued</Badge>

// Without icons
<Badge variant="info" showIcon={false}>
  3 items
</Badge>
```

---

## Modal and Overlay Patterns

### Modal Dialog

**CSS Implementation**:
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: color-mix(in srgb, var(--color-gray-900, #111827) 50%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4, 1rem);
  z-index: 50;
}

.modal-content {
  background-color: var(--color-background, #ffffff);
  border-radius: var(--radius-lg, 0.5rem);
  box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
  width: 100%;
  max-width: var(--container-md, 28rem);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: var(--spacing-6, 1.5rem);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  margin: 0;
  font-family: var(--font-family-heading, 'Inter', sans-serif);
  font-size: var(--text-lg, 1.125rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text, #111827);
}

.modal-close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--spacing-8, 2rem);
  height: var(--spacing-8, 2rem);
  border: none;
  background: none;
  border-radius: var(--radius-md, 0.375rem);
  color: var(--color-text-secondary, #6b7280);
  cursor: pointer;
  transition: var(--transition-fast, all 150ms ease);
  
  &:hover {
    background-color: var(--color-gray-100, #f3f4f6);
    color: var(--color-text, #111827);
  }
  
  &:focus-visible {
    outline: var(--focus-ringWidth, 2px) solid var(--focus-borderColor, #3b82f6);
    outline-offset: var(--focus-ringOffset, 2px);
  }
}

.modal-body {
  padding: var(--spacing-6, 1.5rem);
}

.modal-footer {
  padding: var(--spacing-6, 1.5rem);
  border-top: 1px solid var(--color-border, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-3, 0.75rem);
}
```

**React Component**:
```tsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={cn('modal-content', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ModalHeader({ children, onClose, className }: ModalHeaderProps) {
  return (
    <div className={cn('modal-header', className)}>
      <h2 className="modal-title">{children}</h2>
      <button
        className="modal-close-button"
        onClick={onClose}
        aria-label="Close modal"
      >
        <X size={20} />
      </button>
    </div>
  );
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('modal-body', className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('modal-footer', className)}>
      {children}
    </div>
  );
}
```

**Usage Example**:
```tsx
function ExampleModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <PrimaryButton onClick={() => setIsOpen(true)}>
        Open Modal
      </PrimaryButton>
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader onClose={() => setIsOpen(false)}>
          Confirm Action
        </ModalHeader>
        <ModalBody>
          <p>Are you sure you want to delete this item?</p>
        </ModalBody>
        <ModalFooter>
          <SecondaryButton onClick={() => setIsOpen(false)}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={() => {
            // Handle delete
            setIsOpen(false);
          }}>
            Delete
          </PrimaryButton>
        </ModalFooter>
      </Modal>
    </>
  );
}
```

---

## Loading and State Patterns

### Loading Spinner

**CSS Implementation**:
```css
.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid color-mix(in srgb, var(--color-primary-600, #2563eb) 25%, transparent);
  border-top: 2px solid var(--color-primary-600, #2563eb);
  border-radius: var(--radius-full, 9999px);
  animation: spin var(--animation-duration, 1s) linear infinite;
}

.loading-spinner-lg {
  width: 2rem;
  height: 2rem;
  border-width: 3px;
}

.loading-spinner-sm {
  width: 0.75rem;
  height: 0.75rem;
  border-width: 1.5px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
    border: 2px solid var(--color-primary-600, #2563eb);
    border-top: 2px solid transparent;
  }
}
```

**React Component**:
```tsx
import React from 'react';
import { cn } from '../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div 
      className={cn(
        'loading-spinner',
        size === 'sm' && 'loading-spinner-sm',
        size === 'lg' && 'loading-spinner-lg',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
```

### Empty State

**CSS Implementation**:
```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-12, 3rem) var(--spacing-6, 1.5rem);
  text-align: center;
}

.empty-state-icon {
  width: 3rem;
  height: 3rem;
  color: var(--color-text-tertiary, #9ca3af);
  margin-bottom: var(--spacing-4, 1rem);
}

.empty-state-title {
  font-family: var(--font-family-heading, 'Inter', sans-serif);
  font-size: var(--text-lg, 1.125rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text, #111827);
  margin: 0 0 var(--spacing-2, 0.5rem) 0;
}

.empty-state-description {
  font-size: var(--text-sm, 0.875rem);
  color: var(--color-text-secondary, #6b7280);
  margin: 0 0 var(--spacing-6, 1.5rem) 0;
  max-width: 28rem;
}

.empty-state-actions {
  display: flex;
  gap: var(--spacing-3, 0.75rem);
  flex-wrap: wrap;
  justify-content: center;
}
```

**React Component**:
```tsx
import React from 'react';
import { cn } from '../utils/cn';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  actions, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('empty-state', className)}>
      <div className="empty-state-icon">
        {icon}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actions && (
        <div className="empty-state-actions">
          {actions}
        </div>
      )}
    </div>
  );
}
```

---

## Responsive Patterns

### Responsive Grid

**CSS Implementation**:
```css
.responsive-grid {
  display: grid;
  gap: var(--spacing-6, 1.5rem);
  grid-template-columns: 1fr;
  
  /* Tablet */
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* Desktop */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  /* Large Desktop */
  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.responsive-grid-auto-fit {
  display: grid;
  gap: var(--spacing-6, 1.5rem);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

### Responsive Container

**CSS Implementation**:
```css
.responsive-container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--spacing-4, 1rem);
  padding-right: var(--spacing-4, 1rem);
  
  /* Small screens */
  max-width: 100%;
  
  /* Tablet */
  @media (min-width: 640px) {
    max-width: 640px;
  }
  
  /* Desktop */
  @media (min-width: 768px) {
    max-width: 768px;
    padding-left: var(--spacing-6, 1.5rem);
    padding-right: var(--spacing-6, 1.5rem);
  }
  
  /* Large Desktop */
  @media (min-width: 1024px) {
    max-width: 1024px;
  }
  
  /* Extra Large */
  @media (min-width: 1280px) {
    max-width: 1280px;
    padding-left: var(--spacing-8, 2rem);
    padding-right: var(--spacing-8, 2rem);
  }
}
```

---

## Accessibility Patterns

### Focus Management

**CSS Implementation**:
```css
/* Enhanced focus styles using CSS variables */
.focus-enhanced {
  &:focus-visible {
    outline: var(--focus-ringWidth, 2px) solid var(--focus-borderColor, #3b82f6);
    outline-offset: var(--focus-ringOffset, 2px);
    border-radius: var(--radius-md, 0.375rem);
  }
}

/* Skip link for keyboard navigation */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-background, #ffffff);
  color: var(--color-text, #111827);
  padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  text-decoration: none;
  z-index: 100;
  
  &:focus {
    top: 6px;
  }
}
```

### Screen Reader Support

**CSS Implementation**:
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## Usage Guidelines

### Best Practices

1. **Always use CSS variables for colors, spacing, and typography**
2. **Provide appropriate fallbacks for all variables**
3. **Test components in both embedded and standalone modes**
4. **Consider accessibility in all patterns**
5. **Use semantic HTML elements**
6. **Implement proper focus management**

### Performance Considerations

1. **Use CSS variables efficiently** - avoid excessive nesting
2. **Leverage browser caching** - consistent variable usage
3. **Optimize for critical rendering path** - inline critical CSS variables

### Browser Compatibility

All patterns are tested and compatible with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

**Document Maintenance**: This document should be updated when new patterns are created or existing patterns are modified. Last updated: August 25, 2025.