/**
 * JetSetGo GL Rules App - Main Package Export
 *
 * This is the main entry point for the package when imported by the wrapper application.
 * Exports the GLRulesApp component and TypeScript types.
 */

// Import CSS for bundling
import './styles/variables-fallback.css';
import './styles/custom-variables.css';
import './styles/gl-rules.css';
import './index.css';

// Export the main component
export { default } from './App';

// Export TypeScript types
export type {
  Account,
  GLRuleSet,
  GLRuleSetType,
  GLRule,
  RuleType,
  RuleFormData,
} from './types/gl-rules';
