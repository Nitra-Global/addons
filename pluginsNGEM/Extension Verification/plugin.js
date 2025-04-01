// Enhanced Extension Verification Modal without Progress Bar

class ExtensionVerificationModal {
    constructor() {
        // Configuration
        this.VERIFIED_API_URL = 'https://raw.githubusercontent.com/Nitra-Global/api/refs/heads/main/NG%20Extension%20Manager%20/extDetails.json';

        // Cache settings
        this.CACHE_KEY = 'extensionVerificationCache';
        this.CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
        
        // Bind methods to maintain correct context
        this.init = this.init.bind(this);
        this.createModal = this.createModal.bind(this);
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.verifyExtension = this.verifyExtension.bind(this);
    }

    // Initialize the entire extension verification system
    init() {
        this.createModal();
        this.createMeatballsMenuButton();
        this.addGlobalStyles();
        this.setupMobileResponsiveness();
    }

    // Add global styles to improve performance and consistency
    addGlobalStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `            
             #extensionModal {
  /* Dark mode variables */
  --bg-dark: #1b1b1b;
  --bg-darker: #131314;
  --accent-color: #004a77;
  --text-light: #ffffff;
  --text-dark: #333;
  --error-color: #d9534f;
  --success-color: #28a745;
  --shadow-color: rgba(0, 0, 0, 0.2);
  --border-radius: 12px;
  --font-family: "Inter", sans-serif;

  /* General styles */
  background-color: var(--bg-dark);
  color: var(--text-light);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 12px var(--shadow-color);
  padding: 24px;
  max-width: 500px;
  width: 100%;
  margin: 20px auto;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  outline: none; /* Removes the default focus outline */
 }

 /* Use prefers-color-scheme to define light mode styles */
 @media (prefers-color-scheme: light) {
  #extensionModal {
   --bg-dark: #f9f9f9;
   --bg-darker: #eee;
   --accent-color: #007bff;
   --text-light: #333;
   background-color: var(--bg-dark);
   color: var(--text-dark);
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  #extensionModal .info-section {
   background-color: var(--bg-darker);
   color: var(--text-dark);
  }

  #extensionModal .help-text {
   color: #777;
  }
 }

 #extensionModal *:focus {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px; /* Add a small gap for better visibility */
 }

 #extensionModal * {
  box-sizing: border-box;
  font-family: var(--font-family);
  transition:
   background-color 0.3s ease,
   color 0.3s ease,
   box-shadow 0.3s ease,
   transform 0.2s ease;
 }

 #extensionModal .modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
 }

 #extensionModal .btn {
  padding: 12px 20px;
  border-radius: var(--border-radius);
  border: none;
  cursor: pointer;
  font-weight: 600;
  text-align: center;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 6px var(--shadow-color);
 }

 #extensionModal .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px var(--shadow-color);
 }

 #extensionModal .btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px var(--shadow-color);
 }

 #extensionModal .btn-primary {
  background-color: var(--accent-color);
  color: var(--text-light);
 }

 #extensionModal .btn-primary:hover {
  background-color: color-mix(in srgb, var(--accent-color) 80%, black);
 }

 #extensionModal .btn-secondary {
  background-color: #6c757d;
  color: var(--text-light);
  margin-top: 8px;
 }

 #extensionModal .btn-secondary:hover {
  background-color: color-mix(in srgb, #6c757d 80%, black);
 }

 #extensionModal .status-message {
  text-align: center;
  font-weight: 500;
  padding: 8px;
  border-radius: var(--border-radius);
 }

 #extensionModal .status-message.success {
  background-color: rgba(40, 167, 69, 0.1);
  color: var(--success-color);
 }

 #extensionModal .status-message.error {
  background-color: rgba(217, 83, 79, 0.1);
  color: var(--error-color);
 }

 #extensionModal .help-text {
  font-size: 0.9em;
  color: #aaa;
  text-align: center;
  margin-top: 16px;
 }

 #extensionModal .info-section {
  background-color: var(--bg-darker);
  border-radius: var(--border-radius);
  padding: 16px;
  margin-top: 16px;
 }

 /* Add more spacing and a subtle border */
 #extensionModal .info-section p {
  margin-bottom: 8px;
  line-height: 1.6;
 }

 /* Style the last paragraph without margin */
 #extensionModal .info-section p:last-child {
  margin-bottom: 0;
 }

 /* Mobile Responsiveness */
 @media (max-width: 480px) {
  #extensionModal {
   width: 90%;
   max-width: 90%;
   margin: 0 auto;
   top: 50%;
   transform: translate(-50%, -50%);
   padding: 20px;
  }

  #extensionModal .btn {
   padding: 12px 16px;
   font-size: 0.9rem;
  }

  #extensionModal .help-text {
   font-size: 0.8rem;
  }
 }

 /* Accessibility improvements */
 /* Add a visible focus state */
 #extensionModal *:focus {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
 }

 /* Ensure sufficient contrast for text */
 body {
  line-height: 1.6;
 }
        `;
        document.head.appendChild(styleElement);
    }

    // Setup additional mobile responsiveness
    setupMobileResponsiveness() {
        window.addEventListener('resize', () => {
            if (this.modal) {
                const width = window.innerWidth;
                if (width <= 480) {
                    this.modal.style.width = '95%';
                    this.modal.style.maxWidth = '95%';
                } else {
                    this.modal.style.width = '90%';
                    this.modal.style.maxWidth = '420px';
                }
            }
        });
    }

    // Create the modal with improved structure and accessibility
    createModal() {
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.id = 'extensionModal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'modal-title');
        
        // Improved modal structure with more comprehensive information
        this.modal.innerHTML = `
            <div class="modal-content">
                <h2 id="modal-title">Extension Verification</h2>
                
                <div id="verificationStatus" 
                     class="status-message" 
                     aria-live="polite">
                    Click "Verify Extension" to start verification.
                </div>
                
                <div id="actionContainer" class="action-container">
                    <button id="confirmButton" class="btn btn-primary">Verify Extension</button>
                    <button id="closeModalBtn" class="btn btn-secondary">Close</button>
                </div>
                
                <div class="info-section">
                    <h3>What is Extension Verification?</h3>
                    <p>This tool helps you verify the authenticity and safety of browser extensions.</p>
                    
                    <h3>Troubleshooting</h3>
                    <ul>
                        <li>Ensure you have a stable internet connection</li>
                        <li>Check that the extension ID is correct</li>
                    </ul>
                </div>

                <p class="help-text">
                    If verification fails, check your connection or try again later.
                </p>
            </div>
        `;

        // Add styles directly to improve performance
        this.modal.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 420px;
            background-color: var(--bg-dark);
            border-radius: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
            padding: 24px;
            z-index: 1000;
            color: var(--text-light);
            max-height: 90vh;
            overflow-y: auto;
        `;

        // Attach to document
        document.body.appendChild(this.modal);

        // Event Listeners
        this.modal.querySelector('#closeModalBtn')
            .addEventListener('click', this.closeModal);
        
        this.modal.querySelector('#confirmButton')
            .addEventListener('click', () => {
                const extensionId = this.getExtensionIdFromUrl();
                if (extensionId) {
                    this.verifyExtension(extensionId);
                }
            });

        // Close modal when clicking outside
        document.addEventListener('click', this.handleOutsideClick);
    }

    // Handle clicks outside the modal
    handleOutsideClick(event) {
        const modal = document.getElementById('extensionModal');
        const meatballButton = document.getElementById('meatballsMenuButton');
        
        if (modal && 
            modal.style.display === 'block' && 
            !modal.contains(event.target) && 
            (!meatballButton || !meatballButton.contains(event.target))) {
            this.closeModal();
        }
    }

    // Create the meatballs menu button with improved accessibility
    createMeatballsMenuButton() {
        const button = document.createElement('button');
        button.id = 'meatballsMenuButton';
        button.setAttribute('aria-label', 'Open Extension Verification Menu');
        
        button.style.cssText = `
            position: fixed;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            cursor: pointer;
            z-index: 1001;
            outline: none;
            transition: transform 0.2s ease;
        `;
        
        const icon = document.createElement('img');
        icon.src = 'icons/meatball.svg';
        icon.alt = 'Menu';
        icon.style.cssText = 'width: 32px; height: 32px;';
        
        button.appendChild(icon);
        document.body.appendChild(button);

        button.addEventListener('click', this.handleMeatballClick.bind(this));

        // Add hover and click animations
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
    }

    // Centralized method to handle meatball button click
    handleMeatballClick() {
        const extensionId = this.getExtensionIdFromUrl();
        if (extensionId) {
            this.openModal(extensionId);
        } else {
            this.showErrorMessage('No extension ID found in the URL.');
        }
    }

    // Open the modal with improved error handling
    openModal(extensionId) {
        const statusElement = this.modal.querySelector('#verificationStatus');
        
        // Reset modal state
        this.modal.style.display = 'block';
        statusElement.style.color = '';
        statusElement.textContent = 'Preparing verification...';

        // Immediately verify the extension
        this.verifyExtension(extensionId);
    }

    async verifyExtension(extensionId) {
        const statusElement = this.modal.querySelector('#verificationStatus');

        try {
            // Check cache first
            const cachedResult = this.getCachedResult(extensionId);
            if (cachedResult) {
                this.displayVerificationResult(cachedResult, statusElement);
                return;
            }

            statusElement.textContent = 'Checking...';

            // Fetch verification data
            const response = await fetch(this.VERIFIED_API_URL);

            if (!response.ok) {
                throw new Error('Oops! We couldn\'t reach the verification server. Please try again later.');
            }

            const data = await response.json();

            // Check verification status
            const isVerified = Array.isArray(data.verifiedExtensions) &&
                data.verifiedExtensions.includes(extensionId);

            // Cache result
            this.cacheResult(extensionId, isVerified);

            // Display result
            this.displayVerificationResult(isVerified, statusElement);

        } catch (error) {
            this.showErrorMessage(error.message);
        }
    }

    // Function to cache verification result
    cacheResult(extensionId, isVerified) {
        const cache = {
            isVerified: isVerified,
            expiry: Date.now() + this.CACHE_TTL
        };
        localStorage.setItem(`${this.CACHE_KEY}_${extensionId}`, JSON.stringify(cache));
    }

    // Function to get cached verification result
    getCachedResult(extensionId) {
        const cachedData = localStorage.getItem(`${this.CACHE_KEY}_${extensionId}`);
        if (!cachedData) return null;

        try {
            const cache = JSON.parse(cachedData);
            if (Date.now() > cache.expiry) {
                localStorage.removeItem(`${this.CACHE_KEY}_${extensionId}`);
                return null;
            }
            return cache.isVerified;
        } catch (error) {
            localStorage.removeItem(`${this.CACHE_KEY}_${extensionId}`);
            return null;
        }
    }

    // Function to display verification result
    displayVerificationResult(isVerified, statusElement) {
        if (isVerified) {
            statusElement.innerHTML = `
                <span style="color: var(--success-color);">✅ Verified!</span>
                This extension is on our safe list.
            `;
            statusElement.style.color = 'var(--text-light)';
        } else {
            statusElement.innerHTML = `
                <span style="color: #ffa500;">⚠️ Not Verified</span>
                We don't have this extension on our safe list. This doesn't mean it's unsafe, but please be careful!
            `;
            statusElement.style.color = 'var(--text-light)';
        }
    }

    // Centralized error message display
    showErrorMessage(message) {
        const statusElement = this.modal.querySelector('#verificationStatus');
        statusElement.textContent = `Error: ${message}`;
        statusElement.style.color = 'var(--error-color)';
    }

    // Close modal and reset state
    closeModal() {
        this.modal.style.display = 'none';
    }

    // Extract extension ID from URL
    getExtensionIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }
}

// Initialize the extension verification modal
document.addEventListener('DOMContentLoaded', () => {
    const extensionVerification = new ExtensionVerificationModal();
    extensionVerification.init();
});
