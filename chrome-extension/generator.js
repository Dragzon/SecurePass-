document.getElementById('generate-btn').addEventListener('click', () => {
    const newPassword = generatePassword(14);
    document.getElementById('generated-password').innerText = newPassword;
});

function generatePassword(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

document.getElementById('copy-btn').addEventListener('click', () => {
    const passwordText = document.getElementById('generated-password').innerText;
    navigator.clipboard.writeText(passwordText);
    alert("✅ Password copied to clipboard!");
});
