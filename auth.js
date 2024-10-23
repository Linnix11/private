
const AUTH_STORAGE_KEY = 'user';

function isAuthenticated() {
    try {
        const user = localStorage.getItem(AUTH_STORAGE_KEY);
        return user !== null && user !== 'undefined';
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        return false;
    }
}

function getCurrentUser() {
    try {
        const userStr = localStorage.getItem(AUTH_STORAGE_KEY);
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Erreur lors de la récupération des informations utilisateur:', error);
        return null;
    }
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function redirectIfAuth() {
    if (isAuthenticated()) {
        window.location.href = 'index.html';
    }
}

function updateNavigation() {
    const navButtons = document.getElementById('navButtons');
    if (!navButtons) return;

    if (isAuthenticated()) {
        const user = getCurrentUser();
        navButtons.innerHTML = `
            <div class="nav-user-section">
                <span class="username">Bienvenue, ${user?.username || 'Utilisateur'}</span>
                <button onclick="logout()" class="nav-button logout-btn">Déconnexion</button>
            </div>
        `;
    } else {
        navButtons.innerHTML = `
            <div class="nav-auth-section">
                <a href="login.html" class="nav-button login-btn">Connexion</a>
                <a href="register.html" class="nav-button register-btn">Inscription</a>
            </div>
        `;
    }
}


function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = 'login.html';
}


function initAuth() {
    updateNavigation();
    if (window.location.pathname !== '/login.html' && 
        window.location.pathname !== '/register.html' && 
        !isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.redirectIfAuth = redirectIfAuth;
window.updateNavigation = updateNavigation;
window.logout = logout;
window.initAuth = initAuth;

document.addEventListener('DOMContentLoaded', initAuth);