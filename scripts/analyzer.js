const strengthLevels = {
    0: "Very Weak",
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
    5: "Very Strong"
};

// Common passwords (subset for demonstration)
const commonPasswords = [
    "password123",
    "qwerty",
    "12345678",
    "admin123",
    "letmein"
];

// Function to calculate password entropy
function calculateEntropy(password) {
    const charSet = new Set(password).size;
    return Math.log2(Math.pow(charSet, password.length));
}

// Updated function to check password strength
function checkStrength(password) {
    if (!password || typeof password !== 'string') {
        return { score: 0, message: "Invalid password", details: [] };
    }

    let score = 0;
    const details = [];

    // Basic requirement checks
    if (password.length >= 8) {
        score++;
        details.push("✓ Sufficient length (8+ characters)");
    } else {
        details.push("✗ Password too short (<8 characters)");
    }

    if (/[A-Z]/.test(password)) {
        score++;
        details.push("✓ Contains uppercase letter");
    } else {
        details.push("✗ No uppercase letter");
    }

    if (/[a-z]/.test(password)) {
        score++;
        details.push("✓ Contains lowercase letter");
    } else {
        details.push("✗ No lowercase letter");
    }

    if (/\d/.test(password)) {
        score++;
        details.push("✓ Contains number");
    } else {
        details.push("✗ No number");
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score++;
        details.push("✓ Contains special character");
    } else {
        details.push("✗ No special character");
    }

    // Additional security checks
    if (commonPasswords.includes(password.toLowerCase())) {
        score = Math.max(0, score - 2);
        details.push("✗ Common password detected");
    }

    if (/(.)\1{2,}/.test(password)) {
        score = Math.max(0, score - 1);
        details.push("✗ Contains repetitive characters");
    }

    if (/(abc|123|qwe)/i.test(password)) {
        score = Math.max(0, score - 1);
        details.push("✗ Contains sequential characters");
    }

    const entropy = calculateEntropy(password);
    if (entropy > 30) {
        score++;
        details.push("✓ Good password entropy");
    } else {
        details.push("✗ Low password entropy");
    }

    if (password.length >= 12) {
        score++;
        details.push("✓ Extra length bonus (12+ characters)");
    }

    score = Math.min(score, 5);

    return {
        score,
        message: strengthLevels[score],
        details,
        entropy: entropy.toFixed(2)
    };
}

// Function to check if password is breached (using Have I Been Pwned API)
async function checkBreach(password) {
    const hash = await sha1(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5).toUpperCase();

    try {
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        const data = await response.text();
        const breaches = data.split("\n").filter(line => line.startsWith(suffix));

        return breaches.length > 0 
            ? `⚠️ This password has been breached ${breaches.length} time(s)! Consider changing it.` 
            : "✅ This password has not been found in breaches.";
    } catch (error) {
        console.error("Error checking breaches:", error);
        return "❌ Unable to check for breaches.";
    }
}

// Function to display security tips based on password strength
function getSecurityTips(strengthObj) {
    const { message, details } = strengthObj;
    switch (message) {
        case "Very Weak":
        case "Weak":
            return `⚠️ Your password is too weak! ${details.filter(d => d.startsWith("✗")).join(", ")}.`;
        case "Fair":
            return `🔸 Your password could be stronger. ${details.filter(d => d.startsWith("✗")).join(", ")}.`;
        case "Good":
            return `✅ Your password is decent, but consider improving: ${details.filter(d => d.startsWith("✗")).join(", ")}.`;
        case "Strong":
        case "Very Strong":
            return "🎉 Great job! Your password is strong.";
        default:
            return "⚠️ Consider using a stronger password.";
    }
}

// Enhanced function to generate a strong password
function generateStrongPassword(length = 16) {
    // Extended character sets for increased entropy
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_-+=<>?[]{}|;:,./~`';
    const allChars = upperCase + lowerCase + numbers + specialChars;

    // Ensure minimum length for security
    if (length < 12) {
        length = 12;
    }

    // Function to get a random character from a string using crypto
    const getRandomChar = (charSet) => {
        const randomBuffer = new Uint8Array(1);
        crypto.getRandomValues(randomBuffer);
        return charSet[randomBuffer[0] % charSet.length];
    };

    // Initialize password with one character from each category
    let password = [
        getRandomChar(upperCase),
        getRandomChar(lowerCase),
        getRandomChar(numbers),
        getRandomChar(specialChars)
    ];

    // Fill the remaining length with random characters
    for (let i = password.length; i < length; i++) {
        password.push(getRandomChar(allChars));
    }

    // Shuffle the password array to randomize character positions
    for (let i = password.length - 1; i > 0; i--) {
        const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (2**32) * (i + 1));
        [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
}

// Function to handle password input
async function handlePasswordInput() {
    const password = document.getElementById("password").value;
    const strengthMeter = document.getElementById("strength-meter");
    const securityTips = document.getElementById("security-tips");
    const breachMessage = document.getElementById("breach-message");
    const suggestedPasswordDiv = document.getElementById("suggested-password");
    const generatedPasswordSpan = document.getElementById("generated-password");

    // Update strength meter
    const strength = checkStrength(password);
    strengthMeter.textContent = `Strength: ${strength.message} (Score: ${strength.score}/5, Entropy: ${strength.entropy})`;
    
    // Display security tips
    securityTips.textContent = getSecurityTips(strength);

    // Check for breach when button is clicked
    document.getElementById("breach-check").onclick = async () => {
        const breachResult = await checkBreach(password);
        breachMessage.textContent = breachResult;

        // If breached, generate and display a strong password inside the white box
        if (breachResult.includes("breached")) {
            const newPassword = generateStrongPassword();
            generatedPasswordSpan.textContent = newPassword;
            suggestedPasswordDiv.style.display = "block"; // Show suggested password div
        } else {
            suggestedPasswordDiv.style.display = "none"; // Hide suggested password div
        }
    };
}

// Secure SHA-1 hash function
async function sha1(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const buffer = await crypto.subtle.digest("SHA-1", data);
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// Event listener for password input
document.getElementById("password").addEventListener("input", handlePasswordInput);