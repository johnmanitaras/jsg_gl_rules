/**
 * SearchableDropdown Component
 *
 * A custom, accessible dropdown with search functionality.
 * Features:
 * - Type-ahead search filtering
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Loading state with spinner
 * - Empty state handling
 * - Error state display
 * - ARIA accessibility support
 * - Click outside to close
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Search, Loader2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownOption {
  id: number | string;
  label: string;
  subtitle?: string;
  group?: string;
}

interface SearchableDropdownProps {
  id: string;
  options: DropdownOption[];
  value: number | string | null;
  onChange: (value: number | string | null) => void;
  placeholder?: string;
  isLoading?: boolean;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  'aria-describedby'?: string;
}

export function SearchableDropdown({
  id,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  isLoading = false,
  error,
  disabled = false,
  required = false,
  label,
  'aria-describedby': ariaDescribedBy,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Get the currently selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.id === value) || null;
  }, [options, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options;
    }

    const query = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.subtitle && opt.subtitle.toLowerCase().includes(query)) ||
        (opt.group && opt.group.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  // Group options if they have group property
  const groupedOptions = useMemo(() => {
    const hasGroups = filteredOptions.some((opt) => opt.group);
    if (!hasGroups) {
      return { ungrouped: filteredOptions };
    }

    return filteredOptions.reduce((acc, opt) => {
      const group = opt.group || 'Other';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(opt);
      return acc;
    }, {} as Record<string, DropdownOption[]>);
  }, [filteredOptions]);

  // Flat list of options for keyboard navigation
  const flatOptions = useMemo(() => {
    const groups = Object.keys(groupedOptions);
    return groups.flatMap((group) => groupedOptions[group]);
  }, [groupedOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      const highlightedItem = items[highlightedIndex];
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredOptions]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled || isLoading) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < flatOptions.length - 1 ? prev + 1 : prev
            );
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          }
          break;

        case 'Enter':
          event.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            const option = flatOptions[highlightedIndex];
            if (option) {
              onChange(option.id);
              setIsOpen(false);
              setSearchQuery('');
              setHighlightedIndex(-1);
            }
          } else if (!isOpen) {
            setIsOpen(true);
          }
          break;

        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
          setHighlightedIndex(-1);
          break;

        case 'Tab':
          if (isOpen) {
            setIsOpen(false);
            setSearchQuery('');
            setHighlightedIndex(-1);
          }
          break;
      }
    },
    [disabled, isLoading, isOpen, flatOptions, highlightedIndex, onChange]
  );

  // Handle option selection
  const handleSelectOption = useCallback(
    (option: DropdownOption) => {
      onChange(option.id);
      setIsOpen(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
    },
    [onChange]
  );

  // Handle clear selection
  const handleClear = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onChange(null);
      setSearchQuery('');
    },
    [onChange]
  );

  // Open dropdown and focus search input
  const handleToggle = useCallback(() => {
    if (disabled || isLoading) return;

    if (!isOpen) {
      setIsOpen(true);
      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setIsOpen(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [disabled, isLoading, isOpen]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%' }}
    >
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
            marginBottom: 'var(--spacing-2)',
          }}
        >
          {label}
          {required && (
            <span
              style={{ color: 'var(--color-error-500)', marginLeft: '4px' }}
              aria-label="required"
            >
              *
            </span>
          )}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled || isLoading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy}
        style={{
          width: '100%',
          height: 'var(--height-input)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--spacing-3)',
          backgroundColor: disabled
            ? 'var(--color-neutral-100)'
            : 'var(--color-surface-primary, #ffffff)',
          border: error
            ? '2px solid var(--color-error-500)'
            : 'var(--border-width-default) solid var(--color-border)',
          borderRadius: 'var(--radius-input)',
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          outline: 'none',
        }}
        className="searchable-dropdown-trigger"
      >
        <span
          style={{
            flex: 1,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 'var(--text-base)',
            color: selectedOption
              ? 'var(--color-text)'
              : 'var(--color-text-tertiary)',
          }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Loader2
                size={16}
                style={{ animation: 'spin 1s linear infinite' }}
              />
              Loading options...
            </span>
          ) : selectedOption ? (
            <span>
              {selectedOption.label}
              {selectedOption.subtitle && (
                <span style={{ color: 'var(--color-text-secondary)', marginLeft: '4px' }}>
                  ({selectedOption.subtitle})
                </span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
          {/* Clear button */}
          {selectedOption && !disabled && !isLoading && (
            <span
              onClick={handleClear}
              role="button"
              aria-label="Clear selection"
              tabIndex={-1}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-neutral-200)',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-neutral-300)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-neutral-200)';
              }}
            >
              <X size={12} />
            </span>
          )}

          {/* Dropdown icon */}
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ChevronDown size={18} />
          </motion.span>
        </div>
      </button>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-1)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-error-500)',
            marginTop: 'var(--spacing-1)',
          }}
        >
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 50,
              backgroundColor: 'var(--color-surface-primary, #ffffff)',
              border: 'var(--border-width-default) solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
            }}
          >
            {/* Search Input */}
            <div
              style={{
                padding: 'var(--spacing-3)',
                borderBottom: 'var(--border-width-default) solid var(--color-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                  padding: '0 var(--spacing-3)',
                  height: '40px',
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderRadius: 'var(--radius-input)',
                  border: 'var(--border-width-default) solid var(--color-border)',
                }}
              >
                <Search size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type to search..."
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text)',
                  }}
                  aria-label="Search options"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--color-text-tertiary)',
                    }}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <ul
              ref={listRef}
              role="listbox"
              aria-label={label || 'Options'}
              style={{
                maxHeight: '280px',
                overflowY: 'auto',
                padding: 'var(--spacing-2)',
                margin: 0,
                listStyle: 'none',
              }}
            >
              {flatOptions.length === 0 ? (
                <li
                  style={{
                    padding: 'var(--spacing-6) var(--spacing-4)',
                    textAlign: 'center',
                    color: 'var(--color-text-secondary)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {searchQuery
                    ? `No results found for "${searchQuery}"`
                    : 'No options available'}
                </li>
              ) : (
                Object.entries(groupedOptions).map(([group, groupOptions]) => (
                  <React.Fragment key={group}>
                    {/* Group Header (only if multiple groups) */}
                    {Object.keys(groupedOptions).length > 1 && group !== 'ungrouped' && (
                      <li
                        style={{
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                        aria-hidden="true"
                      >
                        {group}
                      </li>
                    )}

                    {/* Group Options */}
                    {groupOptions.map((option) => {
                      const globalIndex = flatOptions.findIndex(
                        (opt) => opt.id === option.id
                      );
                      const isHighlighted = globalIndex === highlightedIndex;
                      const isSelected = option.id === value;

                      return (
                        <li
                          key={option.id}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectOption(option)}
                          onMouseEnter={() => setHighlightedIndex(globalIndex)}
                          style={{
                            padding: 'var(--spacing-3)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            backgroundColor: isHighlighted
                              ? 'var(--color-primary-50)'
                              : isSelected
                              ? 'var(--color-primary-100)'
                              : 'transparent',
                            transition: 'background-color 0.1s',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 'var(--text-sm)',
                              fontWeight: isSelected
                                ? 'var(--font-weight-medium)'
                                : 'var(--font-weight-normal)',
                              color: isSelected
                                ? 'var(--color-primary-700)'
                                : 'var(--color-text)',
                            }}
                          >
                            {option.label}
                          </div>
                          {option.subtitle && (
                            <div
                              style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-secondary)',
                                marginTop: '2px',
                              }}
                            >
                              {option.subtitle}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </ul>

            {/* Results count footer */}
            {searchQuery && flatOptions.length > 0 && (
              <div
                style={{
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderTop: 'var(--border-width-default) solid var(--color-border)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-tertiary)',
                  textAlign: 'center',
                }}
              >
                {flatOptions.length} result{flatOptions.length !== 1 ? 's' : ''} found
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .searchable-dropdown-trigger:focus {
          border-color: var(--color-primary-500);
          box-shadow: 0 0 0 3px var(--color-primary-100);
        }
        .searchable-dropdown-trigger:hover:not(:disabled) {
          border-color: var(--color-primary-300);
        }
      `}</style>
    </div>
  );
}
