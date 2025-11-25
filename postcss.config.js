export default {
  plugins: {
    tailwindcss: {},
    'postcss-prefix-selector': {
      prefix: '.jsg-gl-rules',
      transform: function (prefix, selector, prefixedSelector) {
        // Don't prefix :root or html/body selectors
        if (selector === ':root' || selector === 'html' || selector === 'body') {
          return selector;
        }
        // Don't prefix keyframes
        if (selector.match(/^@/)) {
          return selector;
        }
        return prefixedSelector;
      }
    },
    autoprefixer: {},
  },
};
