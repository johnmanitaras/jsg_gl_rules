// embeddedMode.ts
// This file handles communication with parent app when running in embedded mode

interface AuthData {
  type: string;
  authToken: string;
  tenantName: string;
}

// Create a function to initialize embedded mode listener
export function initEmbeddedModeListener(callback: (authToken: string, tenantName: string) => void): void {
  // Listen for messages from parent window
  window.addEventListener('message', (event) => {
    // Check if the message is the authentication data from parent
    if (event.data && event.data.type === 'AUTH_DATA') {
      const authData = event.data as AuthData;
      console.log('Received auth data from parent:', {
        authToken: authData.authToken.substring(0, 20) + '...',
        tenantName: authData.tenantName
      });
      
      // Call the callback with the authentication data
      callback(authData.authToken, authData.tenantName);
    }
  });

  // Notify parent that we're ready to receive auth data
  // This is useful if the parent is waiting for the iframe to be ready
  if (window.parent !== window) {
    console.log('Running in iframe, sending IFRAME_READY message to parent');
    window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
  }
}

// Check if we're running in an iframe (embedded mode)
export function isRunningInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // If we can't access window.top due to same-origin policy,
    // we're definitely in an iframe
    return true;
  }
}
