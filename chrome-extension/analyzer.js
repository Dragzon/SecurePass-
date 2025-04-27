document.getElementById('analyze-btn').addEventListener('click', async () => {
    const password = document.getElementById('password-input').value;
    const result = analyzePassword(password);
    document.getElementById('analysis-result').innerText = result;

    if (result.includes("✅ Strong Password!")) {
        await checkPasswordBreach(password);
    }
});

function analyzePassword(password) {
    if (password.length < 8) return "❌ Weak: Too short!";
    if (!/[A-Z]/.test(password)) return "⚠️ Weak: Add uppercase letters!";
    if (!/[0-9]/.test(password)) return "⚠️ Weak: Add numbers!";
    if (!/[!@#$%^&*]/.test(password)) return "⚠️ Weak: Add special characters!";
    return "✅ Strong Password!";
}

async function checkPasswordBreach(password) {
    const breachResult = document.getElementById('analysis-result');
    breachResult.innerText = "🔍 Checking for breaches...";

    try {
        const hash = await sha1(password);
        const prefix = hash.substring(0, 5);
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        const text = await response.text();
        
        if (text.includes(hash.substring(5).toUpperCase())) {
            breachResult.innerText = "⚠️ This password has been breached! Generate a secure password.";
        } else {
            breachResult.innerText += "\n✅ No breaches found!";
        }
    } catch (error) {
        breachResult.innerText = "❌ Error checking breaches. Try again later.";
    }
}

async function sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
}
