// ============================================
// DADOS DOS PRODUTOS (AGORA COM localStorage)
// ============================================
const STORAGE_KEY = 'templateShopProducts';
const PROMOTIONS_KEY = 'templateShopPromotions';
const PAYMENT_LINKS_KEY = 'templateShopPaymentLinks';

// Função para carregar produtos do localStorage
function loadProducts() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    } else {
        // Produtos padrão se não houver no localStorage
        const defaultProducts = [
            {
                id: 1,
                name: "PortfolioPro",
                category: "portfolio",
                description: "Template profissional para portfólios de desenvolvedores e designers.",
                longDescription: "Template moderno com foco na apresentação de projetos. Inclui seções para habilidades, portfólio, experiência e contato.",
                price: 29.90,
                originalPrice: 49.90,
                discount: 40,
                featured: true,
                image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGY0NmU1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qb3J0Zm9saW9Qcm88L3RleHQ+PC9zdmc+",
                tags: ["responsivo", "moderno", "portfolio"],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProducts));
        return defaultProducts;
    }
}

// Função para carregar promoções
function loadPromotions() {
    const stored = localStorage.getItem(PROMOTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Função para carregar links de pagamento
function loadPaymentLinks() {
    const stored = localStorage.getItem(PAYMENT_LINKS_KEY);
    return stored ? JSON.parse(stored) : {};
}

// Função para salvar produtos
function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

// ============================================
// FUNÇÕES GERAIS
// ============================================

// Atualiza o ano atual no footer
function updateCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Alternar menu mobile
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

// Scroll suave para links internos
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#' || href.startsWith('#!')) return;
            
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
                const menuToggle = document.getElementById('menuToggle');
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    if (menuToggle) {
                        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                    }
                }
            }
        });
    });
}

// Formatar preço em reais
function formatPrice(price) {
    return price.toFixed(2).replace('.', ',');
}

// Verificar promoções ativas
function getActivePromotions() {
    const promotions = loadPromotions();
    const now = new Date();
    
    return promotions.filter(promo => {
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);
        return now >= startDate && now <= endDate && promo.active;
    });
}

// Aplicar promoções aos produtos
function applyPromotionsToProducts(products) {
    const promotions = getActivePromotions();
    const paymentLinks = loadPaymentLinks();
    
    return products.map(product => {
        let finalProduct = { ...product };
        let discountApplied = 0;
        
        // Verificar se há promoção específica para este produto
        const productPromotion = promotions.find(promo => 
            promo.products.includes(product.id) || promo.products.includes('all')
        );
        
        if (productPromotion) {
            if (productPromotion.type === 'percentage') {
                discountApplied = (product.price * productPromotion.value) / 100;
            } else if (productPromotion.type === 'fixed') {
                discountApplied = productPromotion.value;
            }
            
            finalProduct.finalPrice = product.price - discountApplied;
            finalProduct.discount = Math.round((discountApplied / product.price) * 100);
            finalProduct.promotionId = productPromotion.id;
        } else {
            finalProduct.finalPrice = product.price;
            finalProduct.discount = product.discount || 0;
        }
        
        // Adicionar link de pagamento se existir
        finalProduct.paymentLink = paymentLinks[product.id] || '#';
        
        return finalProduct;
    });
}

// ============================================
// FUNÇÕES PARA PRODUTOS
// ============================================

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
                    `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` :
                    `<i class="fas fa-laptop-code"></i><span>${product.name}</span>`
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
                    <a href="${paymentLink}" target="_blank" class="btn btn-primary buy-btn" data-id="${product.id}">Comprar</a>
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

// Carregar produtos em destaque na página inicial
function loadFeaturedProducts() {
    const featuredContainer = document.getElementById('featuredProducts');
    if (!featuredContainer) return;
    
    let products = loadProducts();
    products = applyPromotionsToProducts(products);
    const featuredProducts = products.filter(product => product.featured);
    
    if (featuredProducts.length === 0) {
        featuredContainer.innerHTML = '<p class="no-products">Nenhum produto em destaque no momento.</p>';
        return;
    }
    
    featuredContainer.innerHTML = featuredProducts.map(product => createProductCard(product)).join('');
}

// Carregar todos os produtos na página de produtos
function loadAllProducts() {
    const productsContainer = document.getElementById('productsGrid');
    if (!productsContainer) return;
    
    let products = loadProducts();
    products = applyPromotionsToProducts(products);
    
    if (products.length === 0) {
        productsContainer.innerHTML = '<p class="no-products">Nenhum produto disponível no momento.</p>';
        return;
    }
    
    productsContainer.innerHTML = products.map(product => createProductCard(product)).join('');
    
    // Configurar filtros
    setupProductFilters();
}

// Configurar filtros de produtos
function setupProductFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover classe active de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Adicionar classe active ao botão clicado
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

// Carregar dados do produto na página de detalhes
function loadProductDetails() {
    // Verificar se estamos na página de produto individual
    if (!window.location.pathname.includes('produto.html')) return;
    
    // Obter ID do produto da URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id')) || 1;
    
    // Buscar produto
    let products = loadProducts();
    products = applyPromotionsToProducts(products);
    const product = products.find(p => p.id === productId) || products[0];
    
    // Atualizar informações na página
    document.title = `${product.name} | TemplateShop`;
    
    // Atualizar elementos da página se existirem
    const updateElement = (selector, content) => {
        const element = document.querySelector(selector);
        if (element) element.innerHTML = content;
    };
    
    updateElement('.product-title', product.name);
    updateElement('.product-category', getCategoryName(product.category));
    
    const finalPrice = product.finalPrice || product.price;
    const originalPrice = product.originalPrice || product.price;
    const discount = product.discount || 0;
    
    updateElement('.current-price', `R$ ${formatPrice(finalPrice)}`);
    
    const originalPriceElement = document.querySelector('.original-price');
    if (originalPriceElement) {
        if (discount > 0) {
            originalPriceElement.textContent = `R$ ${formatPrice(originalPrice)}`;
            originalPriceElement.style.display = 'inline';
        } else {
            originalPriceElement.style.display = 'none';
        }
    }
    
    const discountElement = document.querySelector('.discount-badge');
    if (discountElement) {
        if (discount > 0) {
            discountElement.textContent = `${discount}% OFF`;
            discountElement.style.display = 'inline-block';
        } else {
            discountElement.style.display = 'none';
        }
    }
    
    const descriptionElement = document.querySelector('.product-description');
    if (descriptionElement) {
        descriptionElement.textContent = product.longDescription || product.description;
    }
    
    const buyButton = document.querySelector('.btn-extra-large');
    if (buyButton) {
        const paymentLink = product.paymentLink || '#';
        buyButton.href = paymentLink;
        buyButton.target = '_blank';
        buyButton.innerHTML = `<i class="fas fa-shopping-cart"></i> Comprar agora - R$ ${formatPrice(finalPrice)}`;
    }
    
    // Atualizar imagem do produto
    const imagePlaceholder = document.querySelector('.image-placeholder.large');
    if (imagePlaceholder && product.image) {
        imagePlaceholder.innerHTML = `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`;
    }
    
    // Configurar abas
    setupProductTabs();
}

// Configurar abas na página de produto
function setupProductTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remover classe active de todos os botões e conteúdos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Adicionar classe active ao botão e conteúdo clicado
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Configurações gerais
    updateCurrentYear();
    setupMobileMenu();
    setupSmoothScroll();
    
    // Carregar produtos conforme a página
    if (window.location.pathname.includes('produtos.html') || window.location.pathname === '/produtos.html') {
        loadAllProducts();
    } else if (window.location.pathname.includes('produto.html') || window.location.pathname === '/produto.html') {
        loadProductDetails();
    } else {
        // Página inicial
        loadFeaturedProducts();
    }
    // Remover link do admin do site público
function hideAdminLink() {
    // Verificar se estamos no site público (não no admin)
    if (!window.location.pathname.includes('admin') && 
        !window.location.pathname.includes('login')) {
        
        const adminLink = document.querySelector('.admin-link');
        if (adminLink) {
            adminLink.style.display = 'none';
        }
        
        // Remover do DOM após carregamento
        setTimeout(() => {
            if (adminLink && adminLink.parentNode) {
                adminLink.parentNode.removeChild(adminLink);
            }
        }, 1000);
    }
}

// Chamar a função ao carregar
document.addEventListener('DOMContentLoaded', hideAdminLink);
});