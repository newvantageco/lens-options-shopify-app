/**
 * Lens Options - Frontend Integration Script
 * This script provides the event system and customization hooks for the Lens Options app
 */

(function() {
  'use strict';

  // Lens Options namespace
  window.LensOptions = window.LensOptions || {};

  // Event system
  const events = {};
  
  LensOptions.on = function(eventName, callback) {
    if (!events[eventName]) {
      events[eventName] = [];
    }
    events[eventName].push(callback);
  };

  LensOptions.off = function(eventName, callback) {
    if (events[eventName]) {
      events[eventName] = events[eventName].filter(cb => cb !== callback);
    }
  };

  LensOptions.emit = function(eventName, data) {
    if (events[eventName]) {
      events[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Lens Options event error:', error);
        }
      });
    }
  };

  // Available events
  const LENS_OPTIONS_EVENTS = {
    INIT_START: 'lensOptions:init:start',
    INIT_COMPLETE: 'lensOptions:init:complete',
    INIT_ERROR: 'lensOptions:init:error',
    
    PRESCRIPTION_TYPE_CHANGE: 'lensOptions:prescriptionType:change',
    LENS_SELECTED: 'lensOptions:lens:selected',
    LENS_OPTION_CHANGE: 'lensOptions:lensOption:change',
    ADDON_TOGGLE: 'lensOptions:addon:toggle',
    
    PRESCRIPTION_UPLOAD: 'lensOptions:prescription:upload',
    PRESCRIPTION_MANUAL_ENTRY: 'lensOptions:prescription:manualEntry',
    PRESCRIPTION_VALIDATED: 'lensOptions:prescription:validated',
    
    CART_ADD_START: 'lensOptions:cart:add:start',
    CART_ADD_SUCCESS: 'lensOptions:cart:add:success',
    CART_ADD_ERROR: 'lensOptions:cart:add:error',
    
    MODAL_OPEN: 'lensOptions:modal:open',
    MODAL_CLOSE: 'lensOptions:modal:close',
    
    STEP_CHANGE: 'lensOptions:step:change',
    FLOW_COMPLETE: 'lensOptions:flow:complete'
  };

  LensOptions.EVENTS = LENS_OPTIONS_EVENTS;

  // Configuration
  LensOptions.config = {
    apiUrl: '/api',
    debug: false,
    customCSS: '',
    customJS: '',
    translations: {},
    settings: {}
  };

  // Utility functions
  LensOptions.utils = {
    // Format price
    formatPrice: function(price, currency = 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(price);
    },

    // Validate email
    validateEmail: function(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },

    // Validate prescription data
    validatePrescription: function(data) {
      const errors = [];
      
      if (!data.prescriptionType) {
        errors.push('Prescription type is required');
      }
      
      if (data.prescriptionType !== 'non-prescription' && data.prescriptionType !== 'frame-only') {
        if (!data.odSphere && !data.osSphere) {
          errors.push('At least one eye prescription is required');
        }
        
        if (!data.pd) {
          errors.push('Pupillary distance is required');
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors
      };
    },

    // Generate unique ID
    generateId: function() {
      return 'lo_' + Math.random().toString(36).substr(2, 9);
    },

    // Debounce function
    debounce: function(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    // Throttle function
    throttle: function(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  };

  // Analytics integration
  LensOptions.analytics = {
    // Track page view
    trackPageView: function(page) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
          page_path: page
        });
      }
      
      if (typeof fbq !== 'undefined') {
        fbq('track', 'PageView');
      }
      
      LensOptions.emit(LENS_OPTIONS_EVENTS.INIT_COMPLETE, { page });
    },

    // Track event
    trackEvent: function(eventName, parameters) {
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
      }
      
      if (typeof fbq !== 'undefined') {
        fbq('track', eventName, parameters);
      }
      
      LensOptions.emit('analytics:event', { eventName, parameters });
    },

    // Track conversion
    trackConversion: function(value, currency = 'USD') {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase', {
          transaction_id: LensOptions.utils.generateId(),
          value: value,
          currency: currency
        });
      }
      
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Purchase', {
          value: value,
          currency: currency
        });
      }
      
      LensOptions.emit('analytics:conversion', { value, currency });
    }
  };

  // Custom CSS injection
  LensOptions.injectCSS = function(css) {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);
  };

  // Custom JS execution
  LensOptions.executeJS = function(js) {
    try {
      // Create a function with the custom JS
      const func = new Function(js);
      func();
    } catch (error) {
      console.error('Lens Options custom JS error:', error);
    }
  };

  // Initialize the system
  LensOptions.init = function(config) {
    LensOptions.emit(LENS_OPTIONS_EVENTS.INIT_START, config);
    
    try {
      // Merge configuration
      LensOptions.config = Object.assign(LensOptions.config, config || {});
      
      // Inject custom CSS
      if (LensOptions.config.customCSS) {
        LensOptions.injectCSS(LensOptions.config.customCSS);
      }
      
      // Execute custom JS
      if (LensOptions.config.customJS) {
        LensOptions.executeJS(LensOptions.config.customJS);
      }
      
      // Set up global event listeners
      document.addEventListener('click', function(e) {
        const target = e.target;
        
        // Handle lens selection buttons
        if (target.matches('[data-lens-options-trigger]')) {
          LensOptions.emit(LENS_OPTIONS_EVENTS.MODAL_OPEN, {
            productId: target.dataset.productId,
            variantId: target.dataset.variantId
          });
        }
        
        // Handle prescription type selection
        if (target.matches('[data-prescription-type]')) {
          LensOptions.emit(LENS_OPTIONS_EVENTS.PRESCRIPTION_TYPE_CHANGE, {
            type: target.dataset.prescriptionType
          });
        }
        
        // Handle lens selection
        if (target.matches('[data-lens-id]')) {
          LensOptions.emit(LENS_OPTIONS_EVENTS.LENS_SELECTED, {
            lensId: target.dataset.lensId,
            lensName: target.dataset.lensName
          });
        }
      });
      
      // Set up form listeners
      document.addEventListener('change', function(e) {
        const target = e.target;
        
        // Handle lens options
        if (target.matches('[data-lens-option]')) {
          LensOptions.emit(LENS_OPTIONS_EVENTS.LENS_OPTION_CHANGE, {
            option: target.dataset.lensOption,
            value: target.value
          });
        }
        
        // Handle add-on toggles
        if (target.matches('[data-addon-id]')) {
          LensOptions.emit(LENS_OPTIONS_EVENTS.ADDON_TOGGLE, {
            addonId: target.dataset.addonId,
            checked: target.checked
          });
        }
      });
      
      // Set up file upload listeners
      document.addEventListener('change', function(e) {
        const target = e.target;
        
        if (target.matches('[data-prescription-upload]')) {
          const files = target.files;
          LensOptions.emit(LENS_OPTIONS_EVENTS.PRESCRIPTION_UPLOAD, {
            files: Array.from(files)
          });
        }
      });
      
      LensOptions.emit(LENS_OPTIONS_EVENTS.INIT_COMPLETE, LensOptions.config);
      
    } catch (error) {
      console.error('Lens Options initialization error:', error);
      LensOptions.emit(LENS_OPTIONS_EVENTS.INIT_ERROR, error);
    }
  };

  // Auto-initialize if config is available
  if (window.LensOptionsConfig) {
    LensOptions.init(window.LensOptionsConfig);
  }

  // Expose to global scope
  window.LensOptions = LensOptions;

})();
