/**
 * Sistema de autenticação para o painel administrativo
 * Versão corrigida para GitHub Pages
 */

// Chave de armazenamento para sessão
const SESSION_KEY = 'adminSession';

/**
 * Verifica se o usuário está autenticado
 * @returns {boolean} True se autenticado, false caso contrário
 */
function isAuthenticated() {
    try {
        const sessionData = getSessionData();
        
        if (!sessionData || !sessionData.authenticated) {
            return false;
        }
        
        // Verificar se a sessão expirou (24 horas)
        if (isSessionExpired(sessionData.timestamp)) {
            logout();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return false;
    }
}

/**
 * Autentica o usuário com uma chave de acesso
 * @param {string} accessKey - Chave de acesso fornecida pelo usuário
 * @returns {boolean} True se autenticação bem-sucedida
 */
function authenticate(accessKey) {
    try {
        // Obter chave armazenada (padrão: admin123)
        const storedKey = localStorage.getItem('adminAccessKey') || 'admin123';
        
        if (accessKey === storedKey) {
            // Criar sessão
            createSession();
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return false;
    }
}

/**
 * Cria uma nova sessão de administrador
 */
function createSession() {
    const sessionData = {
        authenticated: true,
        timestamp: new Date().getTime(),
        userAgent: navigator.userAgent
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

/**
 * Obtém os dados da sessão atual
 * @returns {Object|null} Dados da sessão ou null
 */
function getSessionData() {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    } catch (error) {
        console.error('Erro ao ler sessão:', error);
        return null;
    }
}

/**
 * Verifica se a sessão expirou
 * @param {number} sessionTimestamp - Timestamp da criação da sessão
 * @returns {boolean} True se expirada
 */
function isSessionExpired(sessionTimestamp) {
    const now = new Date().getTime();
    const sessionAge = now - sessionTimestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
    
    return sessionAge > maxAge;
}

/**
 * Renova a sessão atual (estende a validade)
 * @returns {boolean} True se renovada
 */
function renewSession() {
    if (isAuthenticated()) {
        createSession();
        return true;
    }
    return false;
}

/**
 * Encerra a sessão atual (logout)
 */
function logout() {
    localStorage.removeItem(SESSION_KEY);
}

/**
 * Verifica autenticação e redireciona se necessário
 */
function requireAuth() {
    // Permitir acesso via URL com chave
    const urlParams = new URLSearchParams(window.location.search);
    const urlKey = urlParams.get('key');
    
    if (urlKey) {
        if (authenticate(urlKey)) {
            return; // Acesso permitido via URL
        }
    }
    
    // Verificar sessão normal
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

/**
 * Altera a chave de acesso administrativo
 * @param {string} newKey - Nova chave de acesso
 * @returns {boolean} True se alterada com sucesso
 */
function changeAdminKey(newKey) {
    if (!newKey || newKey.trim().length < 4) {
        return false;
    }
    
    localStorage.setItem('adminAccessKey', newKey.trim());
    return true;
}

/**
 * Obtém o tempo restante da sessão em minutos
 * @returns {number} Minutos restantes ou 0 se não autenticado
 */
function getSessionTimeRemaining() {
    const sessionData = getSessionData();
    
    if (!sessionData || !sessionData.authenticated) {
        return 0;
    }
    
    const now = new Date().getTime();
    const sessionAge = now - sessionData.timestamp;
    const maxAge = 24 * 60 * 60 * 1000;
    const remaining = maxAge - sessionAge;
    
    return Math.max(0, Math.floor(remaining / (60 * 1000)));
}

/**
 * Configura a proteção da página admin
 */
function setupAdminProtection() {
    // Verificar se estamos na página admin
    if (window.location.pathname.includes('admin.html')) {
        requireAuth();
    }
}

// Verificar e renovar sessão periodicamente (a cada 5 minutos)
setInterval(() => {
    if (isAuthenticated()) {
        renewSession();
    }
}, 5 * 60 * 1000);

// Inicializar proteção quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAdminProtection);
} else {
    setupAdminProtection();
}

// Exportar funções para uso global
window.auth = {
    isAuthenticated,
    authenticate,
    logout,
    requireAuth,
    changeAdminKey,
    getSessionTimeRemaining
};

// Debug: Log no console
console.log('Auth.js carregado - Sistema de autenticação ativo');
