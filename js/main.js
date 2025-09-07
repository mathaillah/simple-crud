// Main JavaScript file for the CRUD application

/**
 * Contact Data Model
 * Defines the structure and validation for contact entries
 */
class Contact {
    /**
     * Create a new contact
     * @param {Object} data - Contact data
     * @param {string} data.id - Unique identifier for the contact
     * @param {string} data.name - Contact name
     * @param {string} data.email - Contact email
     * @param {string} data.createdAt - ISO timestamp of when the contact was created
     * @param {string} data.updatedAt - ISO timestamp of when the contact was last updated
     */
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.version = data.version || 1; // For future migration support
    }
    
    /**
     * Validate contact data
     * @returns {Array} - Array of validation errors
     */
    validate() {
        const errors = [];
        
        // Validate name
        if (!this.name || typeof this.name !== 'string' || this.name.trim() === '') {
            errors.push('Name is required and must be a non-empty string');
        }
        
        // Validate email
        if (!this.email || typeof this.email !== 'string') {
            errors.push('Email is required and must be a string');
        } else if (!this.isValidEmail(this.email)) {
            errors.push('Email must be a valid email address');
        }
        
        // Validate ID
        if (!this.id || typeof this.id !== 'string') {
            errors.push('ID is required and must be a string');
        }
        
        // Validate timestamps
        if (this.createdAt && isNaN(Date.parse(this.createdAt))) {
            errors.push('createdAt must be a valid ISO timestamp');
        }
        
        if (this.updatedAt && isNaN(Date.parse(this.updatedAt))) {
            errors.push('updatedAt must be a valid ISO timestamp');
        }
        
        return errors;
    }
    
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Update contact data
     * @param {Object} data - Updated contact data
     */
    update(data) {
        if (data.name !== undefined) this.name = data.name;
        if (data.email !== undefined) this.email = data.email;
        this.updatedAt = new Date().toISOString();
    }
}

/**
 * Data Migration Manager
 * Handles migration of contact data between versions
 */
class DataMigrationManager {
    /**
     * Migrate contacts to the latest version
     * @param {Array} contacts - Array of contact objects
     * @returns {Array} - Migrated contacts
     */
    static migrateContacts(contacts) {
        if (!Array.isArray(contacts)) {
            console.warn('Contacts data is not an array. Returning empty array.');
            return [];
        }
        
        return contacts.map(contact => this.migrateContact(contact));
    }
    
    /**
     * Migrate a single contact to the latest version
     * @param {Object} contact - Contact object
     * @returns {Contact} - Migrated contact
     */
    static migrateContact(contact) {
        // If it's already a Contact instance, return it
        if (contact instanceof Contact) {
            return contact;
        }
        
        // Handle version 1 contacts (current version)
        if (!contact.version || contact.version === 1) {
            // Ensure all required fields exist
            const migratedContact = {
                id: contact.id,
                name: contact.name,
                email: contact.email,
                createdAt: contact.createdAt || new Date().toISOString(),
                updatedAt: contact.updatedAt || new Date().toISOString(),
                version: 1
            };
            
            return new Contact(migratedContact);
        }
        
        // Future versions would be handled here
        // For example, if we add a phone field in version 2:
        // if (contact.version === 2) { ... }
        
        // If we don't recognize the version, return as-is but log a warning
        console.warn(`Unknown contact version: ${contact.version}`, contact);
        return new Contact(contact);
    }
}

/**
 * ContactManager class to handle all CRUD operations and UI interactions
 */
class ContactManager {
    constructor() {
        // Application state
        this.contacts = [];
        this.editingContactId = null;
        this.storageKey = 'contacts';
        this.storageAvailable = this.checkStorageAvailability();
        this.dataVersion = 1; // Current data model version
        this.isLoading = true; // Track loading state
        
        // Pagination state
        this.currentPage = 1;
        this.itemsPerPage = 5;
        
        // DOM elements
        this.contactForm = document.getElementById('contact-form');
        this.contactList = document.getElementById('contact-list');
        this.nameInput = document.getElementById('name');
        this.emailInput = document.getElementById('email');
        this.submitButton = document.querySelector('button[type="submit"]');
        
        // Initialize the application
        this.init();
    }
    
    /**
     * Check if localStorage is available
     * @returns {boolean} - True if localStorage is available, false otherwise
     */
    checkStorageAvailability() {
        try {
            const testKey = 'testStorageAvailability';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('localStorage is not available. Falling back to sessionStorage.');
            return false;
        }
    }
    
    /**
     * Initialize the application when the DOM is loaded
     */
    init() {
        console.log('Application initialized');
        
        // Show loading indicator
        this.showLoadingIndicator();
        
        // Load contacts from storage
        this.loadContactsFromStorage();
        
        // Render the contact list
        this.renderContactList();
        
        // Hide loading indicator
        this.hideLoadingIndicator();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Mark loading as complete
        this.isLoading = false;
    }
    
    /**
     * Show loading indicator
     */
    showLoadingIndicator() {
        if (this.contactList) {
            this.contactList.innerHTML = '<p id="loading-message">Loading contacts...</p>';
        }
    }
    
    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }
    
    /**
     * Set up event listeners for DOM elements
     */
    setupEventListeners() {
        // Form submission handler
        this.contactForm.addEventListener('submit', (event) => this.handleFormSubmit(event));
        
        // Form reset handler
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.handleFormReset());
        }
        
        // Real-time validation
        if (this.nameInput) {
            this.nameInput.addEventListener('blur', () => this.validateName());
            this.nameInput.addEventListener('input', () => this.validateNameRealTime());
        }
        
        if (this.emailInput) {
            this.emailInput.addEventListener('blur', () => this.validateEmail());
            this.emailInput.addEventListener('input', () => this.validateEmailRealTime());
        }
    }
    
    /**
     * Handle form submission
     * @param {Event} event - The form submission event
     */
    handleFormSubmit(event) {
        event.preventDefault();
        
        // Get form data
        const name = this.nameInput.value.trim();
        const email = this.emailInput.value.trim();
        
        // Validate form data
        const isValid = this.validateForm();
        
        if (!isValid) {
            return;
        }
        
        // Create or update contact
        if (this.editingContactId) {
            this.updateContact(this.editingContactId, name, email);
        } else {
            this.createContact(name, email);
            // When adding a new contact, go to the last page to show the new contact
            const totalPages = Math.ceil((this.contacts.length + 1) / this.itemsPerPage);
            this.currentPage = totalPages;
        }
        
        // Reset form
        this.resetForm();
    }
    
    /**
     * Handle form reset
     */
    handleFormReset() {
        this.resetForm();
    }
    
    /**
     * Reset form fields and clear validation errors
     */
    resetForm() {
        this.contactForm.reset();
        this.editingContactId = null;
        this.updateFormHeading('Add New Contact');
        // Reset submit button text
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Add Contact';
        }
        
        this.clearValidationErrors();
        
        // Focus on first input field
        if (this.nameInput) {
            this.nameInput.focus();
        }
    }
    
    /**
     * Validate the entire form
     * @returns {boolean} - True if valid, false otherwise
     */
    validateForm() {
        const isNameValid = this.validateName();
        const isEmailValid = this.validateEmail();
        
        return isNameValid && isEmailValid;
    }
    
    /**
     * Validate name field
     * @returns {boolean} - True if valid, false otherwise
     */
    validateName() {
        const name = this.nameInput.value.trim();
        const nameError = document.getElementById('name-error');
        
        // Clear previous error
        if (nameError) {
            nameError.remove();
        }
        
        // Check maximum length
        if (name.length > 100) {
            this.showFieldError('name', 'Name must be 100 characters or less');
            return false;
        }
        
        if (!name) {
            this.showFieldError('name', 'Name is required');
            return false;
        }
        
        // Check for only whitespace
        if (name.length > 0 && !/\S/.test(name)) {
            this.showFieldError('name', 'Name cannot be only whitespace');
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate name field in real-time
     * @returns {boolean} - True if valid, false otherwise
     */
    validateNameRealTime() {
        // Only validate if the field has content
        if (this.nameInput.value.trim().length > 0) {
            return this.validateName();
        }
        return true;
    }
    
    /**
     * Validate email field
     * @returns {boolean} - True if valid, false otherwise
     */
    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailError = document.getElementById('email-error');
        
        // Clear previous error
        if (emailError) {
            emailError.remove();
        }
        
        // Check maximum length
        if (email.length > 254) {
            this.showFieldError('email', 'Email must be 254 characters or less');
            return false;
        }
        
        if (!email) {
            this.showFieldError('email', 'Email is required');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate email field in real-time
     * @returns {boolean} - True if valid, false otherwise
     */
    validateEmailRealTime() {
        // Only validate if the field has content
        if (this.emailInput.value.trim().length > 0) {
            return this.validateEmail();
        }
        return true;
    }
    
    /**
     * Show error message for a field
     * @param {string} fieldName - The name of the field
     * @param {string} message - The error message
     */
    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        if (!field) return;
        
        // Create error element
        const errorElement = document.createElement('div');
        errorElement.id = `${fieldName}-error`;
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        
        // Add error class to field
        field.classList.add('error');
        
        // Insert error after field
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
    
    /**
     * Clear all validation errors
     */
    clearValidationErrors() {
        // Remove error classes from fields
        if (this.nameInput) {
            this.nameInput.classList.remove('error');
        }
        if (this.emailInput) {
            this.emailInput.classList.remove('error');
        }
        
        // Remove error messages
        const errorMessages = this.contactForm.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.remove());
    }
    
    /**
     * Validate email format
     * @param {string} email - The email to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    isValidEmail(email) {
        // More comprehensive email regex pattern
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email);
    }
    
    /**
     * Create a new contact
     * @param {string} name - The contact name
     * @param {string} email - The contact email
     */
    createContact(name, email) {
        // Create contact data object
        const contactData = {
            id: this.generateId(),
            name: name,
            email: email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: this.dataVersion
        };
        
        // Create Contact instance
        const contact = new Contact(contactData);
        
        // Validate contact
        const errors = contact.validate();
        if (errors.length > 0) {
            console.error('Contact validation failed:', errors);
            this.showFormError('Failed to create contact: ' + errors.join(', '));
            return;
        }
        
        this.contacts.push(contact);
        this.saveContactsToStorage();
        this.renderContactList();
        
        // Show success message
        this.showFormSuccess('Contact added successfully!');
    }
    
    /**
     * Update an existing contact
     * @param {string} id - The contact ID
     * @param {string} name - The contact name
     * @param {string} email - The contact email
     */
    updateContact(id, name, email) {
        const contactIndex = this.contacts.findIndex(contact => contact.id === id);
        
        if (contactIndex !== -1) {
            // Update contact data
            this.contacts[contactIndex].update({ name, email });
            
            // Validate contact
            const errors = this.contacts[contactIndex].validate();
            if (errors.length > 0) {
                console.error('Contact validation failed:', errors);
                this.showFormError('Failed to update contact: ' + errors.join(', '));
                return;
            }
            
            this.saveContactsToStorage();
            this.renderContactList();
            
            // Show success message
            this.showFormSuccess('Contact updated successfully!');
            
            // Return focus to first input field
            if (this.nameInput) {
                this.nameInput.focus();
            }
        }
    }
    
    /**
     * Show form error message
     * @param {string} message - The error message
     */
    showFormError(message) {
        this.clearFormMessages();
        
        const errorElement = document.createElement('div');
        errorElement.id = 'form-error';
        errorElement.className = 'form-message error';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        
        this.contactForm.insertBefore(errorElement, this.contactForm.firstChild);
    }
    
    /**
     * Show form success message
     * @param {string} message - The success message
     */
    showFormSuccess(message) {
        this.clearFormMessages();
        
        const successElement = document.createElement('div');
        successElement.id = 'form-success';
        successElement.className = 'form-message success';
        successElement.textContent = message;
        
        this.contactForm.insertBefore(successElement, this.contactForm.firstChild);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            if (successElement.parentNode) {
                successElement.remove();
            }
        }, 3000);
    }
    
    /**
     * Clear form messages
     */
    clearFormMessages() {
        const formError = document.getElementById('form-error');
        const formSuccess = document.getElementById('form-success');
        
        if (formError) {
            formError.remove();
        }
        
        if (formSuccess) {
            formSuccess.remove();
        }
    }
    
    /**
     * Delete a contact
     * @param {string} id - The contact ID
     */
    deleteContact(id) {
        // Get contact name for better confirmation message
        const contact = this.getContactById(id);
        const contactName = contact ? contact.name : 'this contact';
        
        if (confirm(`Are you sure you want to delete "${contactName}"?`)) {
            // Remove contact from memory
            const initialLength = this.contacts.length;
            this.contacts = this.contacts.filter(contact => contact.id !== id);
            
            // Check if deletion was successful
            if (this.contacts.length === initialLength) {
                this.showFormError('Failed to delete contact. Please try again.');
                return;
            }
            
            // Save updated contacts to storage
            this.saveContactsToStorage();
            
            // Handle pagination after deletion
            const totalPages = Math.ceil(this.contacts.length / this.itemsPerPage);
            if (this.currentPage > totalPages && totalPages > 0) {
                this.currentPage = totalPages;
            }
            
            // Update UI
            this.renderContactList();
            
            // Show success message
            this.showFormSuccess('Contact deleted successfully!');
            
            // Handle edge case: if we were editing the deleted contact, reset the form
            if (this.editingContactId === id) {
                this.resetForm();
            }
            
            // Return focus to appropriate element
            if (this.contacts.length > 0) {
                // Focus on the first contact's edit button if available
                const firstEditButton = document.querySelector('.btn-edit');
                if (firstEditButton) {
                    firstEditButton.focus();
                }
            } else {
                // If no contacts left, focus on the name input field
                if (this.nameInput) {
                    this.nameInput.focus();
                }
            }
        }
    }
    
    /**
     * Get all contacts
     * @returns {Array} - Array of Contact instances
     */
    getContacts() {
        return [...this.contacts]; // Return a copy to prevent direct manipulation
    }
    
    /**
     * Get a contact by ID
     * @param {string} id - The contact ID
     * @returns {Contact|null} - The contact or null if not found
     */
    getContactById(id) {
        return this.contacts.find(contact => contact.id === id) || null;
    }
    
    /**
     * Edit a contact
     * @param {string} id - The contact ID
     */
    editContact(id) {
        const contact = this.getContactById(id);
        
        if (contact) {
            this.nameInput.value = contact.name;
            this.emailInput.value = contact.email;
            this.editingContactId = id;
            this.updateFormHeading('Edit Contact');
            
            // Update submit button text for edit mode
            const submitButton = document.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Save Changes';
            }
            
            // Scroll to the form
            document.querySelector('.contact-form-section').scrollIntoView({ behavior: 'smooth' });
            
            // Focus on first input field after a short delay to ensure scroll is complete
            setTimeout(() => {
                if (this.nameInput) {
                    this.nameInput.focus();
                    this.nameInput.select();
                }
            }, 300);
        }
    }
    
    /**
     * Update form heading
     * @param {string} text - The heading text
     */
    updateFormHeading(text) {
        const formHeading = document.getElementById('form-heading');
        if (formHeading) {
            formHeading.textContent = text;
        }
    }
    
    /**
     * Get storage object based on availability
     * @returns {Storage} - localStorage or sessionStorage
     */
    getStorage() {
        return this.storageAvailable ? localStorage : sessionStorage;
    }
    
    /**
     * Load contacts from storage
     */
    loadContactsFromStorage() {
        try {
            const storage = this.getStorage();
            const storedContacts = storage.getItem(this.storageKey);
            
            // Handle case where no data exists (first-time use)
            if (!storedContacts || storedContacts === 'null' || storedContacts === 'undefined') {
                console.log('No existing data found. Initializing with empty array.');
                this.contacts = [];
                return;
            }
            
            // Validate that stored data is valid JSON
            let parsedContacts;
            try {
                parsedContacts = JSON.parse(storedContacts);
            } catch (parseError) {
                console.error('Failed to parse stored data:', parseError);
                console.warn('Stored data is corrupted. Initializing with empty array.');
                this.contacts = [];
                return;
            }
            
            // Ensure it's an array
            if (!Array.isArray(parsedContacts)) {
                console.warn('Stored data is not an array. Initializing with empty array.');
                this.contacts = [];
                return;
            }
            
            // Validate each contact and filter out invalid ones
            const validContacts = [];
            const invalidContacts = [];
            
            parsedContacts.forEach((contact, index) => {
                try {
                    // Try to migrate the contact
                    const migratedContact = DataMigrationManager.migrateContact(contact);
                    
                    // Validate the migrated contact
                    const errors = migratedContact.validate();
                    if (errors.length === 0) {
                        validContacts.push(migratedContact);
                    } else {
                        console.warn(`Invalid contact at index ${index}:`, errors, contact);
                        invalidContacts.push(contact);
                    }
                } catch (migrationError) {
                    console.error(`Failed to migrate contact at index ${index}:`, migrationError, contact);
                    invalidContacts.push(contact);
                }
            });
            
            // Set the valid contacts
            this.contacts = validContacts;
            
            // Report any invalid contacts
            if (invalidContacts.length > 0) {
                console.warn(`${invalidContacts.length} invalid contacts were found and skipped.`);
                // In a real application, we might want to notify the user or provide an option to recover
            }
            
            console.log(`Loaded ${this.contacts.length} contacts from storage.`);
        } catch (error) {
            console.error('Unexpected error loading contacts from storage:', error);
            // Fallback to empty array
            this.contacts = [];
        }
    }
    
    /**
     * Save contacts to storage
     */
    saveContactsToStorage() {
        try {
            const storage = this.getStorage();
            
            // Convert Contact instances to plain objects for serialization
            const contactsToSave = this.contacts.map(contact => ({
                id: contact.id,
                name: contact.name,
                email: contact.email,
                createdAt: contact.createdAt,
                updatedAt: contact.updatedAt,
                version: contact.version
            }));
            
            // Serialize contacts array
            const serializedContacts = JSON.stringify(contactsToSave);
            
            // Save to storage
            storage.setItem(this.storageKey, serializedContacts);
        } catch (error) {
            console.error('Error saving contacts to storage:', error);
            
            // Handle quota exceeded errors
            if (error.name === 'QuotaExceededError' || 
                error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                this.showFormError('Storage quota exceeded. Please delete some contacts to free up space.');
            } else {
                // Handle other storage errors
                this.showFormError('Failed to save contacts. Your changes might not persist after closing the browser.');
            }
        }
    }
    
    /**
     * Render the contact list with pagination
     */
    renderContactList() {
        // Reset form heading if we were editing and there are no contacts left
        if (this.editingContactId && this.contacts.length === 0) {
            this.updateFormHeading('Add New Contact');
            this.editingContactId = null;
        }
        
        if (this.contacts.length === 0) {
            this.contactList.innerHTML = '<p id="empty-message">No contacts yet. Add your first contact above!</p>';
            return;
        }
        
        // Sort contacts alphabetically by name for better scannability
        const sortedContacts = [...this.contacts].sort((a, b) => 
            a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        
        // Calculate pagination
        const totalPages = Math.ceil(sortedContacts.length / this.itemsPerPage);
        
        // Ensure current page is within valid range
        if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = totalPages;
        }
        if (this.currentPage < 1) {
            this.currentPage = 1;
        }
        
        // Get contacts for current page
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedContacts = sortedContacts.slice(startIndex, endIndex);
        
        // Clear contact list
        this.contactList.innerHTML = '';
        
        // Render contacts for current page
        const contactsContainer = document.createElement('div');
        contactsContainer.className = 'contacts-container';
        
        paginatedContacts.forEach(contact => {
            const contactElement = document.createElement('div');
            contactElement.className = 'contact-item';
            contactElement.setAttribute('data-testid', 'contact-item');
            contactElement.setAttribute('data-contact-id', contact.id);
            contactElement.innerHTML = `
                <div class="contact-info" data-testid="contact-info">
                    <h3 class="contact-name" data-testid="contact-name">${this.escapeHtml(contact.name)}</h3>
                    <p class="contact-email" data-testid="contact-email">${this.escapeHtml(contact.email)}</p>
                    <p class="contact-meta" data-testid="contact-meta">Updated: ${this.formatDate(contact.updatedAt)}</p>
                </div>
                <div class="contact-actions" data-testid="contact-actions">
                    <button class="btn-edit" data-testid="edit-button" onclick="contactManager.editContact('${contact.id}')" aria-label="Edit ${this.escapeHtml(contact.name)}">Edit</button>
                    <button class="btn-delete" data-testid="delete-button" onclick="contactManager.deleteContact('${contact.id}')" aria-label="Delete ${this.escapeHtml(contact.name)}">Delete</button>
                </div>
            `;
            contactsContainer.appendChild(contactElement);
        });
        
        this.contactList.appendChild(contactsContainer);
        
        // Render pagination if more than one page
        if (totalPages > 1) {
            this.renderPagination(totalPages, sortedContacts.length);
        }
    }
    
    /**
     * Generate a unique ID
     * @returns {string} - A unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - The text to escape
     * @returns {string} - The escaped text
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    /**
     * Format date for display
     * @param {string} dateStr - ISO date string
     * @returns {string} - Formatted date string
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    /**
     * Render pagination controls
     * @param {number} totalPages - Total number of pages
     * @param {number} totalContacts - Total number of contacts
     */
    renderPagination(totalPages, totalContacts) {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination';
        paginationContainer.setAttribute('data-testid', 'pagination');
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = '‹ Previous';
        prevButton.disabled = this.currentPage === 1;
        prevButton.onclick = () => this.goToPage(this.currentPage - 1);
        prevButton.setAttribute('aria-label', 'Go to previous page');
        paginationContainer.appendChild(prevButton);
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page if not visible
        if (startPage > 1) {
            const firstButton = document.createElement('button');
            firstButton.textContent = '1';
            firstButton.onclick = () => this.goToPage(1);
            firstButton.setAttribute('aria-label', 'Go to page 1');
            paginationContainer.appendChild(firstButton);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                paginationContainer.appendChild(ellipsis);
            }
        }
        
        // Visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i.toString();
            pageButton.onclick = () => this.goToPage(i);
            pageButton.setAttribute('aria-label', `Go to page ${i}`);
            
            if (i === this.currentPage) {
                pageButton.className = 'active';
                pageButton.setAttribute('aria-current', 'page');
            }
            
            paginationContainer.appendChild(pageButton);
        }
        
        // Last page if not visible
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                paginationContainer.appendChild(ellipsis);
            }
            
            const lastButton = document.createElement('button');
            lastButton.textContent = totalPages.toString();
            lastButton.onclick = () => this.goToPage(totalPages);
            lastButton.setAttribute('aria-label', `Go to page ${totalPages}`);
            paginationContainer.appendChild(lastButton);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next ›';
        nextButton.disabled = this.currentPage === totalPages;
        nextButton.onclick = () => this.goToPage(this.currentPage + 1);
        nextButton.setAttribute('aria-label', 'Go to next page');
        paginationContainer.appendChild(nextButton);
        
        // Pagination info
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, totalContacts);
        
        const paginationInfo = document.createElement('div');
        paginationInfo.className = 'pagination-info';
        paginationInfo.setAttribute('data-testid', 'pagination-info');
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalContacts} contacts`;
        
        this.contactList.appendChild(paginationContainer);
        this.contactList.appendChild(paginationInfo);
    }
    
    /**
     * Navigate to a specific page
     * @param {number} page - Page number to navigate to
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.contacts.length / this.itemsPerPage);
        
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderContactList();
            
            // Scroll to top of contact list
            document.querySelector('.contact-list-section').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }
}

// Initialize the ContactManager when the DOM is loaded
let contactManager;
document.addEventListener('DOMContentLoaded', function() {
    contactManager = new ContactManager();
});