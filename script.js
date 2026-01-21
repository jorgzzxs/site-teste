[file name]: script.js
[file content begin]
// ============================================
// SISTEMA PRINCIPAL DO SITE - TemplateShop
// ============================================

// Configurações iniciais
document.addEventListener('DOMContentLoaded', function() {
    // Atualizar ano no footer
    updateCurrentYear();
    
    // Configurar menu mobile
    setupMobileMenu();
    
    // Carregar produtos conforme a página
    loadPageContent();
    
    // Configurar funcionalidades comuns
    setupCommonFeatures();
});

// Atualizar ano atual
function updateCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Menu mobile
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.innerHTML = navLinks.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
}

// Carregar conteúdo conforme a página
function loadPageContent() {
    const path = window.location.pathname;
    
    if (path.includes('produto.html')) {
        loadProductDetails();
        setupProductTabs();
        setupPurchaseModal();
    } else if (path.includes('produtos.html')) {
        loadAllProducts();
        setupProductFilters();
    } else {
        // Página inicial
        loadFeaturedProducts();
    }
}

// Configurar funcionalidades comuns
function setupCommonFeatures() {
    // Scroll suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Fechar menu mobile se aberto
                const navLinks = document.querySelector('.nav-links');
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    const menuToggle = document.getElementById('menuToggle');
                    if (menuToggle) {
                        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                    }
                }
            }
        });
    });
}

// Formatar preço
function formatPrice(price) {
    return parseFloat(price).toFixed(2).replace('.', ',');
}

// ============================================
// FUNÇÕES DE PRODUTOS
// ============================================

// Carregar produtos em destaque
async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    try {
        // Carregar produtos do database
        const products = await window.database.getProducts();
        const featured = products.filter(p => p.featured).slice(0, 3);
        
        if (featured.length === 0) {
            container.innerHTML = '<p class="no-products">Nenhum produto em destaque no momento.</p>';
            return;
        }
        
        container.innerHTML = featured.map(product => createProductCard(product)).join('');
        
        // Configurar eventos dos botões de compra
        setupBuyButtons();
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        container.innerHTML = '<p class="no-products">Erro ao carregar produtos.</p>';
    }
}

// Carregar todos os produtos
async function loadAllProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    try {
        const products = await window.database.getProducts();
        
        if (products.length === 0) {
            container.innerHTML = '<p class="no-products">Nenhum produto disponível no momento.</p>';
            return;
        }
        
        container.innerHTML = products.map(product => createProductCard(product)).join('');
        
        setupBuyButtons();
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        container.innerHTML = '<p class="no-products">Erro ao carregar produtos.</p>';
    }
}

// Criar card de produto
function createProductCard(product) {
    const finalPrice = product.finalPrice || product.price;
    const originalPrice = product.originalPrice || product.price;
    const discount = product.discount || 0;
    const paymentLink = product.paymentLink || '#';
    
    return `
        <div class="product-card" data-category="${product.category}" data-id="${product.id}">
            <div class="product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" loading="lazy">` :
                    `<i class="fas fa-laptop-code"></i>`
                }
            </div>
            <div class="product-content">
                <div class="product-category">${getCategoryName(product.category)}</div>
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-price">
                    ${discount > 0 ? `<span class="original-price">R$ ${formatPrice(originalPrice)}</span>` : ''}
                    <span class="current-price">R$ ${formatPrice(finalPrice)}</span>
                    ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
                </div>
                <div class="product-actions">
                    <a href="produto.html?id=${product.id}" class="btn btn-secondary">Ver detalhes</a>
                    <button class="btn btn-primary buy-btn" data-id="${product.id}" data-link="${paymentLink}">Comprar</button>
                </div>
            </div>
        </div>
    `;
}

// Obter nome da categoria
function getCategoryName(category) {
    const categories = {
        'portfolio': 'Portfólio',
        'landing': 'Landing Page',
        'blog': 'Blog',
        'negocio': 'Negócios'
    };
    return categories[category] || category;
}

// Configurar botões de compra
function setupBuyButtons() {
    document.querySelectorAll('.buy-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-id');
            const paymentLink = this.getAttribute('data-link');
            
            // Usar a função global de compra
            comprarTemplate(productId);
        });
    });
}

// Configurar filtros de produtos
function setupProductFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover active de todos
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            
            // Filtrar produtos
            productCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// ============================================
// PÁGINA DE DETALHES DO PRODUTO
// ============================================

// Carregar detalhes do produto
async function loadProductDetails() {
    // Obter ID da URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || 1;
    
    try {
        const products = await window.database.getProducts();
        const product = products.find(p => p.id == productId) || products[0];
        
        if (!product) return;
        
        // Atualizar elementos da página
        updateElement('productTitle', product.name);
        updateElement('productCategory', getCategoryName(product.category));
        updateElement('productDescription', product.longDescription || product.description);
        
        const finalPrice = product.finalPrice || product.price;
        const originalPrice = product.originalPrice || product.price;
        const discount = product.discount || 0;
        
        updateElement('currentPrice', `R$ ${formatPrice(finalPrice)}`);
        
        const originalPriceElem = document.getElementById('originalPrice');
        if (originalPriceElem) {
            if (discount > 0) {
                originalPriceElem.textContent = `R$ ${formatPrice(originalPrice)}`;
                originalPriceElem.style.display = 'inline';
            } else {
                originalPriceElem.style.display = 'none';
            }
        }
        
        const discountBadge = document.getElementById('discountBadge');
        if (discountBadge) {
            if (discount > 0) {
                discountBadge.textContent = `${discount}% OFF`;
                discountBadge.style.display = 'inline-block';
            } else {
                discountBadge.style.display = 'none';
            }
        }
        
        // Atualizar imagem
        const mainImage = document.getElementById('productMainImage');
        if (mainImage && product.image) {
            mainImage.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
        }
        
        // Atualizar botão de compra
        const buyButton = document.getElementById('buyButton');
        if (buyButton) {
            buyButton.addEventListener('click', (e) => {
                e.preventDefault();
                comprarTemplate(product.id);
            });
        }
        
    } catch (error) {
        console.error('Erro ao carregar detalhes do produto:', error);
    }
}

// Atualizar elemento
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) element.textContent = content;
}

// Configurar abas do produto
function setupProductTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remover active
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Adicionar active
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// ============================================
// FUNÇÃO DE COMPRA COM LINK DE PAGAMENTO
// ============================================

/**
 * Função para comprar um template
 * @param {string} productId - ID do produto
 */
function comprarTemplate(productId) {
    console.log('Tentando comprar produto:', productId);
    
    // 1. Obter o link de pagamento do banco de dados
    const products = window.database.getProducts();
    const product = products.find(p => p.id == productId);
    
    if (!product) {
        alert('❌ Produto não encontrado!');
        return;
    }
    
    const paymentLink = product.paymentLink;
    console.log('Link encontrado para o produto:', paymentLink);
    
    if (!paymentLink || paymentLink === '#' || paymentLink.trim() === '') {
        alert('⚠️ Link de pagamento não configurado!\n\nEste produto ainda não tem um link de pagamento configurado. Por favor, entre em contato conosco ou tente mais tarde.');
        return;
    }
    
    // 2. Validar o link
    const validation = window.database.validatePaymentLink(paymentLink);
    if (!validation.isValid) {
        alert('❌ Link de pagamento inválido!\n\n' + validation.error);
        return;
    }
    
    // 3. Mostrar mensagem de redirecionamento
    const productName = product.name;
    
    if (confirm(`Você será redirecionado para a página de pagamento de:\n\n"${productName}"\n\nPreço: R$ ${formatPrice(product.finalPrice || product.price)}\n\nClique em OK para continuar.`)) {
        // 4. Abrir o link de pagamento em nova aba
        console.log('Redirecionando para:', paymentLink);
        window.open(paymentLink, '_blank', 'noopener,noreferrer');
        
        // 5. Mostrar feedback visual (opcional)
        showPaymentRedirectMessage(productName);
    }
}

/**
 * Mostra mensagem de redirecionamento
 */
function showPaymentRedirectMessage(productName) {
    // Criar elemento de mensagem
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        border-left: 4px solid #059669;
    `;
    
    message.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-external-link-alt" style="font-size: 1.2rem;"></i>
            <div>
                <strong style="display: block; margin-bottom: 5px;">Redirecionando para pagamento</strong>
                <div style="font-size: 0.9rem;">
                    Você está sendo redirecionado para a página de pagamento de <strong>${productName}</strong>.
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(message);
    
    // Adicionar estilos de animação se não existirem
    if (!document.querySelector('#payment-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'payment-animation-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remover após 5 segundos
    setTimeout(() => {
        message.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 300);
    }, 5000);
}

// ============================================
// MODAL DE COMPRA (Para produtos sem link configurado)
// ============================================

// Configurar modal de compra
function setupPurchaseModal() {
    const modal = document.getElementById('purchaseModal');
    const closeBtn = document.getElementById('closeModal');
    
    if (modal && closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// Mostrar modal de compra
async function showPurchaseModal(productId) {
    const modal = document.getElementById('purchaseModal');
    if (!modal) return;
    
    try {
        const products = await window.database.getProducts();
        const product = products.find(p => p.id == productId);
        
        // Mostrar modal de simulação
        modal.classList.add('active');
        
        // Fechar automaticamente após 3 segundos
        setTimeout(() => {
            modal.classList.remove('active');
            alert(`Em um site real, você seria redirecionado para a página de pagamento para comprar "${product?.name || 'o produto'}".`);
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao processar compra:', error);
        modal.classList.add('active');
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

// Verificar se o database está carregado
if (typeof window.database === 'undefined') {
    console.error('Database não encontrado. Carregando...');
    
    // Tentar carregar novamente quando o database estiver disponível
    const checkDatabase = setInterval(() => {
        if (typeof window.database !== 'undefined') {
            clearInterval(checkDatabase);
            loadPageContent();
        }
    }, 100);
}

// Função global para ser chamada diretamente do HTML
window.comprarTemplate = comprarTemplate;
[file content end]