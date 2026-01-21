// ============================================
// SISTEMA DE AUTENTICAÇÃO - TemplateShop
// ============================================

class AuthSystem {
    constructor() {
        this.MAX_ATTEMPTS = 3;
        this.LOCK_TIME = 15 * 60 * 1000; // 15 minutos
        this.SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 horas
        
        this.init();
    }
    
    init() {
        // Verificar se estamos na página de login
        if (window.location.pathname.includes('admin-login.html')) {
            this.setupLoginPage();
        } else if (window.location.pathname.includes('admin-panel.html')) {
            this.protectAdminPanel();
        }
        
        // Configurar logout global
        this.setupGlobalLogout();
    }
    
    // ============================================
    // PÁGINA DE LOGIN
    // ============================================
    
    setupLoginPage() {
        this.checkIfAlreadyLoggedIn();
        this.setupLoginForm();
        this.updateAttemptsDisplay();
        this.preventDevTools();
    }
    
    checkIfAlreadyLoggedIn() {
        if (this.isAuthenticated()) {
            // Redirecionar diretamente para o painel
            window.location.href = 'admin-panel.html';
        }
    }
    
    setupLoginForm() {
        const form = document.getElementById('loginForm');
        const accessCodeInput = document.getElementById('accessCode');
        const loginButton = document.getElementById('loginButton');
        
        if (!form) return;
        
        // Verificar se está bloqueado
        if (this.isLocked()) {
            this.showLockMessage();
            return;
        }
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.authenticate(accessCodeInput.value);
        });
        
        // Limpar erro ao digitar
        accessCodeInput.addEventListener('input', () => {
            this.hideError();
        });
        
        // Focar no input
        accessCodeInput.focus();
    }
    
    authenticate(code) {
        // Verificar bloqueio
        if (this.isLocked()) {
            this.showLockMessage();
            return;
        }
        
        // Incrementar tentativas
        this.incrementAttempts();
        this.updateAttemptsDisplay();
        
        // Verificar código
        const settings = window.database.getSettings();
        const validCodes = [
            settings.adminPassword || 'ADMIN@2024',
            'TEMPLATE123', // Código alternativo
            'SUPORTE456'   // Código de emergência
        ];
        
        if (validCodes.includes(code.trim())) {
            // Login bem-sucedido
            this.loginSuccess();
        } else {
            // Login falhou
            this.loginFailed();
        }
    }
    
    loginSuccess() {
        // Resetar tentativas
        this.resetAttempts();
        
        // Criar sessão
        const session = {
            token: this.generateToken(),
            expires: Date.now() + this.SESSION_DURATION,
            user: 'admin',
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        };
        
        // Salvar sessão
        localStorage.setItem('adminSession', JSON.stringify(session));
        
        // Redirecionar para o painel
        window.location.href = 'admin-panel.html';
    }
    
    loginFailed() {
        const attempts = this.getAttempts();
        const remaining = this.MAX_ATTEMPTS - attempts;
        
        // Mostrar erro
        this.showError(`Código inválido. Tentativas restantes: ${remaining}`);
        
        // Limpar campo
        document.getElementById('accessCode').value = '';
        document.getElementById('accessCode').focus();
        
        // Verificar se deve bloquear
        if (attempts >= this.MAX_ATTEMPTS) {
            this.lockAccess();
            this.showLockMessage();
        }
    }
    
    // ============================================
    // PROTEÇÃO DO PAINEL ADMIN
    // ============================================
    
    protectAdminPanel() {
        // Verificar autenticação
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return;
        }
        
        // Configurar auto-logout
        this.setupAutoLogout();
        
        // Monitorar atividade
        this.setupActivityMonitor();
        
        // Configurar logout nos botões
        this.setupLogoutButtons();
    }
    
    isAuthenticated() {
        const session = localStorage.getItem('adminSession');
        if (!session) return false;
        
        try {
            const sessionData = JSON.parse(session);
            const now = Date.now();
            
            // Verificar expiração
            if (now > sessionData.expires) {
                this.logout();
                return false;
            }
            
            // Verificar user agent (proteção básica)
            if (sessionData.userAgent !== navigator.userAgent) {
                this.logout();
                return false;
            }
            
            // Atualizar tempo da sessão
            sessionData.lastActivity = now;
            localStorage.setItem('adminSession', JSON.stringify(sessionData));
            
            return true;
            
        } catch (error) {
            this.logout();
            return false;
        }
    }
    
    setupAutoLogout() {
        // Logout após 30 minutos de inatividade
        this.inactivityTimer = setTimeout(() => {
            this.logout('Sessão expirada por inatividade');
        }, 30 * 60 * 1000); // 30 minutos
        
        // Resetar timer em atividade
        const resetTimer = () => {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = setTimeout(() => {
                this.logout('Sessão expirada por inatividade');
            }, 30 * 60 * 1000);
            
            // Atualizar última atividade
            const session = localStorage.getItem('adminSession');
            if (session) {
                try {
                    const sessionData = JSON.parse(session);
                    sessionData.lastActivity = Date.now();
                    localStorage.setItem('adminSession', JSON.stringify(sessionData));
                } catch (error) {
                    // Ignorar erro
                }
            }
        };
        
        // Eventos que indicam atividade
        ['click', 'keypress', 'mousemove', 'scroll'].forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true });
        });
    }
    
    setupActivityMonitor() {
        // Verificar sessão a cada minuto
        setInterval(() => {
            if (!this.isAuthenticated()) {
                this.redirectToLogin();
            }
        }, 60 * 1000);
    }
    
    // ============================================
    // GERENCIAMENTO DE TENTATIVAS
    // ============================================
    
    getAttempts() {
        const attempts = localStorage.getItem('loginAttempts');
        return attempts ? parseInt(attempts) : 0;
    }
    
    incrementAttempts() {
        const attempts = this.getAttempts() + 1;
        localStorage.setItem('loginAttempts', attempts);
        return attempts;
    }
    
    resetAttempts() {
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lockUntil');
    }
    
    updateAttemptsDisplay() {
        const attemptsLeft = document.getElementById('attemptsLeft');
        if (attemptsLeft) {
            const attempts = this.getAttempts();
            const remaining = this.MAX_ATTEMPTS - attempts;
            attemptsLeft.textContent = Math.max(0, remaining);
        }
    }
    
    isLocked() {
        const lockUntil = localStorage.getItem('lockUntil');
        return lockUntil && Date.now() < parseInt(lockUntil);
    }
    
    lockAccess() {
        const lockUntil = Date.now() + this.LOCK_TIME;
        localStorage.setItem('lockUntil', lockUntil);
        localStorage.setItem('loginAttempts', 0);
    }
    
    getRemainingLockTime() {
        const lockUntil = localStorage.getItem('lockUntil');
        if (!lockUntil) return 0;
        
        const remaining = parseInt(lockUntil) - Date.now();
        return Math.max(0, remaining);
    }
    
    // ============================================
    // INTERFACE DO USUÁRIO
    // ============================================
    
    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorElement && errorText) {
            errorText.textContent = message;
            errorElement.classList.add('show');
            
            // Adicionar animação de shake
            errorElement.style.animation = 'none';
            setTimeout(() => {
                errorElement.style.animation = 'shake 0.5s ease-in-out';
            }, 10);
        }
    }
    
    hideError() {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }
    
    showLockMessage() {
        const remaining = Math.ceil(this.getRemainingLockTime() / 60000);
        
        this.showError(`Acesso bloqueado. Tente novamente em ${remaining} minutos.`);
        
        // Desabilitar formulário
        document.getElementById('accessCode').disabled = true;
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.innerHTML = '<i class="fas fa-lock"></i> Acesso Bloqueado';
        }
    }
    
    // ============================================
    // LOGOUT
    // ============================================
    
    setupLogoutButtons() {
        // Botão de logout no painel
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        // Botão de logout na sidebar
        const sidebarLogout = document.getElementById('sidebarLogout');
        if (sidebarLogout) {
            sidebarLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }
    
    setupGlobalLogout() {
        // Logout quando a página for fechada (opcional)
        window.addEventListener('beforeunload', () => {
            // Não fazer logout automático para permitir abas múltiplas
            // Mas podemos limpar temporariamente
        });
    }
    
    logout(message = 'Logout realizado') {
        // Limpar sessão
        localStorage.removeItem('adminSession');
        
        // Redirecionar para login
        this.redirectToLogin(message);
    }
    
    redirectToLogin(message = '') {
        // Adicionar mensagem à URL se fornecida
        const url = 'admin-login.html' + (message ? '?message=' + encodeURIComponent(message) : '');
        window.location.href = url;
    }
    
    // ============================================
    // SEGURANÇA AVANÇADA
    // ============================================
    
    preventDevTools() {
        // Detectar DevTools básico
        const devtools = {
            isOpen: false,
            orientation: undefined
        };
        
        const threshold = 160;
        const emitEvent = (isOpen, orientation) => {
            if (devtools.isOpen !== isOpen || devtools.orientation !== orientation) {
                devtools.isOpen = isOpen;
                devtools.orientation = orientation;
                
                if (isOpen) {
                    this.blockPage('Ferramentas de desenvolvedor detectadas');
                }
            }
        };
        
        // Verificar periodicamente
        setInterval(() => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            
            if (widthThreshold || heightThreshold) {
                emitEvent(true, widthThreshold ? 'vertical' : 'horizontal');
            } else {
                emitEvent(false, undefined);
            }
        }, 500);
    }
    
    blockPage(reason) {
        // Substituir todo o conteúdo da página
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #0f172a;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
                z-index: 9999;
            ">
                <div>
                    <h1 style="color: #ef4444; margin-bottom: 20px;">
                        <i class="fas fa-ban"></i> Acesso Bloqueado
                    </h1>
                    <p>${reason}</p>
                    <p style="color: #94a3b8; margin-top: 20px;">
                        Recarregue a página para continuar.
                    </p>
                </div>
            </div>
        `;
        
        // Prevenir qualquer interação
        document.body.style.pointerEvents = 'none';
    }
    
    // ============================================
    // UTILITÁRIOS
    // ============================================
    
    generateToken() {
        return 'TS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
    }
    
    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Inicializar sistema de autenticação
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});