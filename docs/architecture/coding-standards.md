# Coding Standards

## Critical Fullstack Rules

- **Data Persistence:** Always use ContactService for localStorage operations
- **Form Validation:** Validate all user input before saving
- **Error Handling:** Handle localStorage quota exceeded errors gracefully
- **UI Updates:** Use consistent rendering functions for contact list updates
- **State Management:** Maintain single source of truth for contact data

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `ContactForm.js` |
| Functions | camelCase | - | `validateEmail()` |
| Variables | camelCase | - | `contactList` |
| CSS Classes | kebab-case | - | `.contact-item` |
| Constants | UPPER_SNAKE_CASE | - | `MAX_CONTACTS` |

## Code Organization

```
src/
├── components/
│   ├── ContactForm.js      # Form for creating/editing contacts
│   ├── ContactList.js      # Displays list of contacts
│   ├── ContactItem.js      # Individual contact display
│   └── Modal.js            # Modal dialog for editing
├── services/
│   └── ContactService.js   # Handles data operations
├── utils/
│   ├── validation.js       # Form validation functions
│   └── helpers.js          # Utility functions
├── styles/
│   └── main.css            # Global styles
└── main.js                 # Application entry point
```

## Security Practices

- Always escape HTML content to prevent XSS attacks
- Validate all user inputs before processing
- Handle errors gracefully without exposing sensitive information
- Use localStorage securely, being aware of its limitations

## Performance Guidelines

- Minimize DOM manipulations
- Use efficient selectors
- Avoid blocking the main thread
- Optimize event handlers
- Implement proper error handling to prevent application crashes