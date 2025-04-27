// Get form dynamically based on page
const form = document.getElementById("signup") || document.getElementById("login");
const firstnameInput = document.getElementById("firstname-input");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const errorMessage = document.getElementById("error-message");

// API endpoints (updated to match backend routes in app.py)
const API_URL = {
    signup: '/signup',
    login: '/login'
};

// Function to validate email format
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Function to check password strength
function checkStrength(password) {
    let score = 0;
    let details = [];

    // Check length
    if (password.length >= 8) {
        score += 1;
        details.push("✓ At least 8 characters");
    } else {
        details.push("✗ At least 8 characters");
    }

    // Check for uppercase letters
    if (/[A-Z]/.test(password)) {
        score += 1;
        details.push("✓ Contains uppercase letter");
    } else {
        details.push("✗ Contains uppercase letter");
    }

    // Check for numbers
    if (/[0-9]/.test(password)) {
        score += 1;
        details.push("✓ Contains number");
    } else {
        details.push("✗ Contains number");
    }

    // Check for special characters
    if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
        details.push("✓ Contains special character");
    } else {
        details.push("✗ Contains special character");
    }

    return { score, details };
}

// Function to add error styling
function addError(input, message) {
    if (input) {
        input.parentElement.classList.add("incorrect");
        if (message && errorMessage) {
            errorMessage.innerText += message + ". ";
        }
    }
}

// Function to clear errors
function clearErrors() {
    if (errorMessage) {
        errorMessage.innerText = "";
    }
    document.querySelectorAll("input").forEach(input => {
        input.parentElement.classList.remove("incorrect");
    });
}

// Client-side validation for signup
function validateSignupClient() {
    let errors = [];

    // Firstname validation
    if (!firstnameInput || firstnameInput.value.trim() === "") {
        errors.push("First name is required");
        addError(firstnameInput, "First name is required");
    }

    // Email validation
    if (!emailInput || emailInput.value.trim() === "") {
        errors.push("Email is required");
        addError(emailInput, "Email is required");
    } else if (!isValidEmail(emailInput.value)) {
        errors.push("Invalid email format");
        addError(emailInput, "Invalid email format");
    }

    // Password validation
    if (!passwordInput || passwordInput.value.trim() === "") {
        errors.push("Password is required");
        addError(passwordInput, "Password is required");
    } else {
        const strength = checkStrength(passwordInput.value);
        if (strength.score < 3) {
            errors.push(`Password is too weak: ${strength.details.filter(d => d.startsWith("✗")).join(", ")}`);
            addError(passwordInput, "Password is too weak");
        }
    }

    return errors;
}

// Client-side validation for login
function validateLoginClient() {
    let errors = [];

    if (!emailInput || emailInput.value.trim() === "") {
        errors.push("Email is required");
        addError(emailInput, "Email is required");
    } else if (!isValidEmail(emailInput.value)) {
        errors.push("Invalid email format");
        addError(emailInput, "Invalid email format");
    }

    if (!passwordInput || passwordInput.value.trim() === "") {
        errors.push("Password is required");
        addError(passwordInput, "Password is required");
    }

    return errors;
}

// Backend validation and submission
async function submitToBackend(isSignup) {
    const endpoint = isSignup ? API_URL.signup : API_URL.login;
    const payload = isSignup ? {
        firstname: firstnameInput.value.trim(),  // Match the field name expected by backend
        email: emailInput.value.trim(),
        password: passwordInput.value
    } : {
        email: emailInput.value.trim(),
        password: passwordInput.value
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Backend validation failed');  // Use 'error' key from backend response
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Event listener for form submission
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors();

        const isSignup = form.id === "signup";
        const clientErrors = isSignup ? validateSignupClient() : validateLoginClient();

        if (clientErrors.length > 0) {
            if (errorMessage) {
                errorMessage.innerText = clientErrors.join(". ");
            }
            return;
        }

        const result = await submitToBackend(isSignup);

        if (result.success) {
            if (isSignup) {
                alert("Account created successfully!");
                window.location.href = "/login";
            } else {
                alert("Login successful!");
                window.location.href = "/home";
            }
        } else {
            if (errorMessage) {
                errorMessage.innerText = result.message;
            }
            if (isSignup) {
                addError(firstnameInput, "");
                addError(emailInput, "");
                addError(passwordInput, "");
            } else {
                addError(emailInput, "");
                addError(passwordInput, "");
            }
        }
    });
}

// Dynamic error clearing on input
document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
        input.parentElement.classList.remove("incorrect");
        if (errorMessage) {
            errorMessage.innerText = "";
        }
    });
});