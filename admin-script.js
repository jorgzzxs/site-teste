[file name]: admin-script.js
[file content begin]
// ============================================
// SISTEMA DO PAINEL ADMINISTRATIVO - TemplateShop
// ============================================

class AdminSystem {
    constructor() {
        this.currentProductId = null;
        this.currentPromotionId = null;
        this.init();
    }
    
    init() {
        // Configurar navegação
        this.setupNavigation();
        
        // Configurar eventos
        this.setupEvents();
        
        // Carregar dashboard inicial
        this.loadDashboard();
        
        // Configurar menu mobile
        this.setupMobileMenu();
    }
    
    // ============================================
    // NAVEGAÇÃO
    // ============================================
    
    setupNavigation() {
        // Alternar entre seções
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remover active de todos os links
                document.querySelectorAll('.nav-link').forEach(l => {
                    l.classList.remove('active');
                });
                
                // Adicionar active ao link clicado
                link.classList.add('active');
                
                // Mostrar seção correspondente
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });
        
        // Configurar logout
        this.setupLogout();
    }
    
    showSection(sectionId) {
        // Esconder todas as seções
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar seção selecionada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Carregar conteúdo específico da seção
            switch(sectionId) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'produtos':
                    this.loadProductsSection();
                    break;
                case 'promocoes':
                    this.loadPromotionsSection();
                    break;
                case 'pagamentos':
                    this.loadPaymentLinksSection();
                    break;
                case 'configuracoes':
                    this.loadSettingsSection();
                    break;
            }
        }
    }
    
    setupLogout() {
        const logoutBtns = ['sidebarLogout'];
        logoutBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.authSystem.logout('Logout realizado com sucesso');
                });
            }
        });
    }
    
    setupMobileMenu() {
        const menuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('adminSidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                menuToggle.innerHTML = sidebar.classList.contains('active') 
                    ? '<i class="fas fa-times"></i>' 
                    : '<i class="fas fa-bars"></i>';
            });
            
            // Fechar menu ao clicar fora (em mobile)
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 1024) {
                    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                        sidebar.classList.remove('active');
                        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                    }
                }
            });
        }
    }
    
    // ============================================
    // DASHBOARD
    // ============================================
    
    loadDashboard() {
        const stats = window.database.getStats();
        const products = window.database.getProducts();
        
        // Atualizar estatísticas
        document.getElementById('statProducts').textContent = stats.totalProducts;
        document.getElementById('statPromotions').textContent = stats.activePromotions;
        document.getElementById('statLinks').textContent = Object.keys(window.database.getPaymentLinks()).length;
        document.getElementById('statFeatured').textContent = stats.featuredProducts;
        
        // Atualizar status na sidebar
        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('activePromotions').textContent = stats.activePromotions;
        
        // Carregar produtos recentes
        this.loadRecentProducts(products);
        
        // Configurar ações rápidas
        this.setupQuickActions();
    }
    
    loadRecentProducts(products) {
        const container = document.getElementById('recentProductsList');
        if (!container) return;
        
        // Ordenar por data de criação (mais recentes primeiro)
        const recentProducts = [...products]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        if (recentProducts.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center;">Nenhum produto cadastrado</p>';
            return;
        }
        
        container.innerHTML = recentProducts.map(product => `
            <div class="product-mini-item" style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f9fafb; border-radius: 8px; transition: background 0.3s ease;">
                <div class="product-mini-image" style="width: 50px; height: 50px; border-radius: 8px; overflow: hidden; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: flex; align-items: center; justify-content: center; color: white;">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` :
                        `<i class="fas fa-laptop-code"></i>`
                    }
                </div>
                <div class="product-mini-info">
                    <h4 style="font-size: 1rem; margin-bottom: 5px; color: #1a202c;">${product.name}</h4>
                    <div class="product-mini-price" style="font-size: 0.9rem; color: #4f46e5; font-weight: 600;">
                        R$ ${this.formatPrice(product.finalPrice || product.price)}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    setupQuickActions() {
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                
                switch(action) {
                    case 'add-product':
                        this.openProductModal();
                        break;
                    case 'add-promotion':
                        this.openPromotionModal();
                        break;
                    case 'view-site':
                        window.open('index.html', '_blank');
                        break;
                    case 'export-data':
                        this.exportData();
                        break;
                }
            });
        });
    }
    
    // ============================================
    // GERENCIAMENTO DE PRODUTOS
    // ============================================
    
    loadProductsSection() {
        this.refreshProductsList();
        
        // Configurar botões
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.openProductModal();
        });
        
        document.getElementById('refreshProductsBtn').addEventListener('click', () => {
            this.refreshProductsList();
            this.showNotification('Lista atualizada!', 'success');
        });
    }
    
    refreshProductsList() {
        const products = window.database.getProducts();
        const container = document.getElementById('productsList');
        
        if (!container) return;
        
        if (products.length === 0) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #6b7280;">
                    <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 20px; color: #d1d5db;"></i>
                    <h3 style="margin-bottom: 10px;">Nenhum produto cadastrado</h3>
                    <p>Clique em "Adicionar Novo Produto" para começar.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = products.map(product => `
            <div class="product-item" data-id="${product.id}" style="display: grid; grid-template-columns: auto 1fr auto; gap: 20px; align-items: center; padding: 20px; border-bottom: 1px solid #e5e7eb; transition: background 0.3s ease;">
                <div class="product-image-small" style="width: 80px; height: 80px; border-radius: 10px; overflow: hidden; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: flex; align-items: center; justify-content: center; color: white;">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` :
                        `<i class="fas fa-laptop-code"></i>`
                    }
                </div>
                <div class="product-info">
                    <h4 style="font-size: 1.1rem; margin-bottom: 5px; color: #1a202c;">${product.name}</h4>
                    <div class="product-category-badge" style="display: inline-block; background: rgba(79, 70, 229, 0.1); color: #4f46e5; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; margin-bottom: 10px;">
                        ${this.getCategoryName(product.category)}
                    </div>
                    <p class="product-description-short" style="color: #6b7280; font-size: 0.9rem; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${product.description}
                    </p>
                    <div class="product-price-info" style="display: flex; align-items: center; gap: 10px;">
                        <span class="product-price" style="font-weight: 600; color: #1a202c;">
                            R$ ${this.formatPrice(product.finalPrice || product.price)}
                        </span>
                        ${product.originalPrice ? 
                            `<span class="product-original-price" style="text-decoration: line-through; color: #9ca3af; font-size: 0.9rem;">
                                R$ ${this.formatPrice(product.originalPrice)}
                            </span>` : 
                            ''
                        }
                        ${product.featured ? 
                            '<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 500;">⭐ Destaque</span>' : 
                            ''
                        }
                    </div>
                </div>
                <div class="product-actions" style="display: flex; gap: 10px;">
                    <button class="action-btn-small edit" onclick="admin.editProduct(${product.id})" style="width: 36px; height: 36px; border-radius: 8px; border: none; background: #e5e7eb; color: #1a202c; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn-small delete" onclick="admin.deleteProduct(${product.id})" style="width: 36px; height: 36px; border-radius: 8px; border: none; background: #e5e7eb; color: #1a202c; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Atualizar estatísticas
        this.updateStats();
    }
    
    getCategoryName(category) {
        const categories = {
            'portfolio': 'Portfólio',
            'landing': 'Landing Page',
            'blog': 'Blog',
            'negocio': 'Negócios'
        };
        return categories[category] || category;
    }
    
    openProductModal(productId = null) {
        this.currentProductId = productId;
        const modal = document.getElementById('productModal');
        const modalBody = modal.querySelector('.modal-body');
        
        // Limpar modal
        modalBody.innerHTML = '';
        
        // Definir título
        document.getElementById('modalProductTitle').textContent = 
            productId ? 'Editar Produto' : 'Adicionar Novo Produto';
        
        // Criar formulário
        const formHTML = this.createProductForm(productId);
        modalBody.innerHTML = formHTML;
        
        // Configurar eventos do formulário
        this.setupProductFormEvents();
        
        // Carregar dados se for edição
        if (productId) {
            this.loadProductData(productId);
        }
        
        // Mostrar modal
        modal.style.display = 'flex';
        
        // Configurar fechamento do modal
        this.setupModalClose(modal);
    }
    
    createProductForm() {
        return `
            <form id="productForm">
                <input type="hidden" id="productId">
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="productName" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                        <i class="fas fa-heading"></i> Nome do Produto *
                    </label>
                    <input type="text" id="productName" required style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                </div>
                
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="form-group">
                        <label for="productCategory" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                            <i class="fas fa-tag"></i> Categoria *
                        </label>
                        <select id="productCategory" required style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                            <option value="">Selecione...</option>
                            <option value="portfolio">Portfólio</option>
                            <option value="landing">Landing Page</option>
                            <option value="blog">Blog</option>
                            <option value="negocio">Negócios</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="productPrice" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                            <i class="fas fa-tag"></i> Preço (R$) *
                        </label>
                        <input type="number" id="productPrice" step="0.01" min="0" required style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="productDescription" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                        <i class="fas fa-align-left"></i> Descrição Curta *
                    </label>
                    <textarea id="productDescription" rows="3" required style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;"></textarea>
                </div>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="productLongDescription" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                        <i class="fas fa-file-alt"></i> Descrição Longa
                    </label>
                    <textarea id="productLongDescription" rows="5" style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;"></textarea>
                </div>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                        <i class="fas fa-image"></i> Imagem do Produto
                    </label>
                    <div class="image-upload-container" style="border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; background: #f9fafb;">
                        <div id="imagePreview" class="image-preview" style="width: 100%; height: 200px; border-radius: 8px; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af; margin-bottom: 15px; overflow: hidden;">
                            <i class="fas fa-image" style="font-size: 3rem; margin-bottom: 10px;"></i>
                            <span>Nenhuma imagem selecionada</span>
                        </div>
                        <div class="image-upload-options" style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <label class="upload-option" style="display: flex; align-items: center; gap: 8px; padding: 10px 15px; background: white; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease;">
                                <input type="file" id="imageFile" accept="image/*" style="display: none;">
                                <i class="fas fa-upload"></i> Upload
                            </label>
                            <button type="button" id="pasteImageBtn" class="upload-option" style="display: flex; align-items: center; gap: 8px; padding: 10px 15px; background: white; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease;">
                                <i class="fas fa-paste"></i> Colar URL/Base64
                            </button>
                            <button type="button" id="clearImageBtn" class="upload-option danger" style="display: flex; align-items: center; gap: 8px; padding: 10px 15px; background: white; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease;">
                                <i class="fas fa-trash"></i> Remover
                            </button>
                        </div>
                        <input type="hidden" id="productImageBase64">
                    </div>
                </div>
                
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="form-group">
                        <label for="productOriginalPrice" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                            <i class="fas fa-tag"></i> Preço Original (opcional)
                        </label>
                        <input type="number" id="productOriginalPrice" step="0.01" min="0" style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                    </div>
                    
                    <div class="form-group">
                        <label for="productTags" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                            <i class="fas fa-tags"></i> Tags (separadas por vírgula)
                        </label>
                        <input type="text" id="productTags" placeholder="ex: responsivo, moderno, portfolio" style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                    </div>
                </div>
                
                <!-- NOVO CAMPO: Link de Pagamento -->
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="productPaymentLink" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                        <i class="fas fa-link"></i> Link de Pagamento (Hotmart, Gumroad, etc.)
                    </label>
                    <input type="text" id="productPaymentLink" placeholder="https://pay.hotmart.com/SEUCODIGO" style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                    <small style="display: block; margin-top: 5px; color: #6b7280; font-size: 0.8rem;">
                        Quando um cliente clicar em "Comprar", será redirecionado para este link
                    </small>
                </div>
                
                <div class="checkbox-group" style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: normal;">
                        <input type="checkbox" id="productFeatured" style="width: auto; transform: scale(1.2);">
                        <span><i class="fas fa-star"></i> Destacar este produto na página inicial</span>
                    </label>
                </div>
            </form>
        `;
    }
    
    setupProductFormEvents() {
        // Upload de imagem
        const imageFile = document.getElementById('imageFile');
        const imagePreview = document.getElementById('imagePreview');
        const base64Input = document.getElementById('productImageBase64');
        const clearImageBtn = document.getElementById('clearImageBtn');
        const pasteImageBtn = document.getElementById('pasteImageBtn');
        
        if (imageFile) {
            imageFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                if (!file.type.startsWith('image/')) {
                    this.showNotification('Selecione apenas arquivos de imagem!', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    base64Input.value = e.target.result;
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width:100%;height:100%;object-fit:cover;">`;
                };
                reader.readAsDataURL(file);
            });
        }
        
        if (clearImageBtn) {
            clearImageBtn.addEventListener('click', () => {
                base64Input.value = '';
                imagePreview.innerHTML = `
                    <i class="fas fa-image" style="font-size: 3rem; margin-bottom: 10px;"></i>
                    <span>Nenhuma imagem selecionada</span>
                `;
                if (imageFile) imageFile.value = '';
            });
        }
        
        if (pasteImageBtn) {
            pasteImageBtn.addEventListener('click', () => {
                const url = prompt('Cole a URL da imagem:');
                if (url && url.trim()) {
                    base64Input.value = url.trim();
                    imagePreview.innerHTML = `<img src="${url.trim()}" alt="Preview" style="width:100%;height:100%;object-fit:cover;">`;
                    this.showNotification('Imagem adicionada!', 'success');
                }
            });
        }
        
        // Salvar produto
        const saveBtn = document.getElementById('saveProductBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveProduct());
        }
    }
    
    loadProductData(productId) {
        const product = window.database.getProduct(productId);
        if (!product) return;
        
        // Preencher formulário
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productLongDescription').value = product.longDescription || '';
        document.getElementById('productOriginalPrice').value = product.originalPrice || '';
        document.getElementById('productTags').value = product.tags ? product.tags.join(', ') : '';
        document.getElementById('productFeatured').checked = product.featured || false;
        
        // Carregar link de pagamento
        const paymentLinks = window.database.getPaymentLinks();
        document.getElementById('productPaymentLink').value = paymentLinks[product.id] || '';
        
        // Carregar imagem
        if (product.image) {
            document.getElementById('productImageBase64').value = product.image;
            const imagePreview = document.getElementById('imagePreview');
            if (imagePreview) {
                imagePreview.innerHTML = `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`;
            }
        }
    }
    
    saveProduct() {
        const validation = window.database.validateProduct({
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            description: document.getElementById('productDescription').value
        });
        
        if (!validation.isValid) {
            this.showNotification(validation.errors[0], 'error');
            return;
        }
        
        const productData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            description: document.getElementById('productDescription').value,
            longDescription: document.getElementById('productLongDescription').value || '',
            originalPrice: document.getElementById('productOriginalPrice').value ? 
                parseFloat(document.getElementById('productOriginalPrice').value) : null,
            tags: document.getElementById('productTags').value ? 
                document.getElementById('productTags').value.split(',').map(tag => tag.trim()) : [],
            image: document.getElementById('productImageBase64').value || null,
            featured: document.getElementById('productFeatured').checked
        };
        
        // Salvar link de pagamento separadamente
        const paymentLink = document.getElementById('productPaymentLink').value.trim();
        if (paymentLink) {
            const productId = document.getElementById('productId').value || Date.now();
            window.database.updatePaymentLink(productId, paymentLink);
        }
        
        if (this.currentProductId) {
            // Atualizar produto
            window.database.updateProduct(this.currentProductId, productData);
            this.showNotification('Produto atualizado com sucesso!', 'success');
        } else {
            // Adicionar novo produto
            const newProduct = window.database.addProduct(productData);
            
            // Salvar link de pagamento para o novo produto
            if (paymentLink) {
                window.database.updatePaymentLink(newProduct.id, paymentLink);
            }
            
            this.showNotification('Produto adicionado com sucesso!', 'success');
        }
        
        // Fechar modal e atualizar lista
        this.closeModal('productModal');
        this.refreshProductsList();
        this.loadDashboard();
    }
    
    editProduct(productId) {
        this.openProductModal(productId);
    }
    
    deleteProduct(productId) {
        if (confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
            window.database.deleteProduct(productId);
            this.refreshProductsList();
            this.loadDashboard();
            this.showNotification('Produto excluído com sucesso!', 'success');
        }
    }
    
    // ============================================
    // GERENCIAMENTO DE PROMOÇÕES
    // ============================================
    
    loadPromotionsSection() {
        this.refreshPromotionsList();
        
        // Configurar botões
        document.getElementById('addPromotionBtn').addEventListener('click', () => {
            this.openPromotionModal();
        });
    }
    
    refreshPromotionsList() {
        const promotions = window.database.getPromotions();
        const container = document.getElementById('promotionsList');
        
        if (!container) return;
        
        if (promotions.length === 0) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #6b7280;">
                    <i class="fas fa-tags" style="font-size: 3rem; margin-bottom: 20px; color: #d1d5db;"></i>
                    <h3 style="margin-bottom: 10px;">Nenhuma promoção cadastrada</h3>
                    <p>Clique em "Nova Promoção" para começar.</p>
                </div>
            `;
            return;
        }
        
        const products = window.database.getProducts();
        const now = new Date();
        
        container.innerHTML = promotions.map(promo => {
            const startDate = new Date(promo.startDate);
            const endDate = new Date(promo.endDate);
            const isActive = promo.active && now >= startDate && now <= endDate;
            
            // Obter nomes dos produtos
            let productNames = [];
            if (promo.products.includes('all')) {
                productNames = ['Todos os Produtos'];
            } else {
                productNames = promo.products.map(productId => {
                    const product = products.find(p => p.id == productId);
                    return product ? product.name : `Produto #${productId}`;
                });
            }
            
            return `
                <div class="promotion-item" style="padding: 20px; border-bottom: 1px solid #e5e7eb; transition: background 0.3s ease;">
                    <div class="promotion-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div class="promotion-title" style="font-size: 1.1rem; color: #1a202c; font-weight: 600;">
                            ${promo.name}
                        </div>
                        <div class="promotion-status ${isActive ? 'active' : 'inactive'}" style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; background: ${isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)'}; color: ${isActive ? '#10b981' : '#6b7280'}">
                            ${isActive ? 'Ativa' : 'Inativa'}
                        </div>
                    </div>
                    <div class="promotion-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                        <div class="promotion-detail">
                            <span class="promotion-label" style="font-size: 0.8rem; color: #6b7280;">Tipo</span>
                            <span class="promotion-value" style="font-weight: 500; color: #1a202c;">
                                ${promo.type === 'percentage' ? `${promo.value}%` : `R$ ${this.formatPrice(promo.value)}`}
                            </span>
                        </div>
                        <div class="promotion-detail">
                            <span class="promotion-label" style="font-size: 0.8rem; color: #6b7280;">Início</span>
                            <span class="promotion-value" style="font-weight: 500; color: #1a202c;">
                                ${this.formatDate(promo.startDate)}
                            </span>
                        </div>
                        <div class="promotion-detail">
                            <span class="promotion-label" style="font-size: 0.8rem; color: #6b7280;">Término</span>
                            <span class="promotion-value" style="font-weight: 500; color: #1a202c;">
                                ${this.formatDate(promo.endDate)}
                            </span>
                        </div>
                    </div>
                    ${promo.description ? `<p style="color: #6b7280; margin-bottom: 10px;">${promo.description}</p>` : ''}
                    <div class="promotion-products" style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px;">
                        ${productNames.map(name => `
                            <span class="promotion-product-tag" style="background: rgba(79, 70, 229, 0.1); color: #4f46e5; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">
                                ${name}
                            </span>
                        `).join('')}
                    </div>
                    <div class="promotion-actions" style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-small" onclick="admin.editPromotion(${promo.id})" style="padding: 8px 16px; background: #e5e7eb; color: #1a202c; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-small btn-danger" onclick="admin.deletePromotion(${promo.id})" style="padding: 8px 16px; background: #fee2e2; color: #dc2626; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    openPromotionModal(promotionId = null) {
        this.currentPromotionId = promotionId;
        const modal = document.getElementById('promotionModal');
        const modalBody = modal.querySelector('.modal-body');
        
        // Limpar modal
        modalBody.innerHTML = '';
        
        // Definir título
        document.getElementById('modalPromotionTitle').textContent = 
            promotionId ? 'Editar Promoção' : 'Nova Promoção';
        
        // Criar formulário
        const formHTML = this.createPromotionForm(promotionId);
        modalBody.innerHTML = formHTML;
        
        // Configurar eventos
        this.setupPromotionFormEvents();
        
        // Carregar dados se for edição
        if (promotionId) {
            this.loadPromotionData(promotionId);
        } else {
            // Definir datas padrão
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            document.getElementById('promotionStart').value = this.formatDateTimeLocal(now);
            document.getElementById('promotionEnd').value = this.formatDateTimeLocal(tomorrow);
        }
        
        // Mostrar modal
        modal.style.display = 'flex';
        
        // Configurar fechamento
        this.setupModalClose(modal);
    }
    
    createPromotionForm() {
        const products = window.database.getProducts();
        
        return `
            <form id="promotionForm">
                <input type="hidden" id="promotionId">
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="promotionName" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                        <i class="fas fa-tag"></i> Nome da Promoção *
                    </label>
                    <input type="text" id="promotionName" required style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                </div>
                
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="form-group">
                        <label for="promotionType" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                            <i class="fas fa-percentage"></i> Tipo de Desconto *
                        </label>
                        <select id="promotionType" required style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                            <option value="percentage">Porcentagem (%)</option>
                            <option value="fixed">Valor Fixo (R$)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="promotionValue" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                            <i class="fas fa-money-bill-wave"></i> Valor *
                        </label>
                        <input type="number" id="promotionValue" step="0.01" min="0" required style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="promotionProducts" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                        <i class="fas fa-box"></i> Produtos Aplicados
                    </label>
                    <select id="promotionProducts" multiple style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; height: 120px;">
                        <option value="all">Todos os Produtos</option>
                        ${products.map(product => `
                            <option value="${product.id}">${product.name}</option>
                        `).join('')}
                    </select>
                    <small style="display: block; margin-top: 5px; color: #6b7280; font-size: 0.8rem;">
                        Segure Ctrl para selecionar múltiplos produtos
                    </small>
                </div>
                
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="form-group">
                        <label for="promotionStart" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                            <i class="fas fa-calendar-alt"></i> Data de Início *
                        </label>
                        <input type="datetime-local" id="promotionStart" required style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                    </div>
                    
                    <div class="form-group">
                        <label for="promotionEnd" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                            <i class="fas fa-calendar-alt"></i> Data de Término *
                        </label>
                        <input type="datetime-local" id="promotionEnd" required style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="promotionDescription" style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                        <i class="fas fa-align-left"></i> Descrição
                    </label>
                    <textarea id="promotionDescription" rows="3" style="width: 100%; padding: 12px 15px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;"></textarea>
                </div>
                
                <div class="checkbox-group" style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: normal;">
                        <input type="checkbox" id="promotionActive" checked style="width: auto; transform: scale(1.2);">
                        <span><i class="fas fa-toggle-on"></i> Promoção Ativa</span>
                    </label>
                </div>
            </form>
        `;
    }
    
    setupPromotionFormEvents() {
        // Salvar promoção
        const saveBtn = document.getElementById('savePromotionBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePromotion());
        }
    }
    
    loadPromotionData(promotionId) {
        const promotions = window.database.getPromotions();
        const promotion = promotions.find(p => p.id == promotionId);
        if (!promotion) return;
        
        document.getElementById('promotionId').value = promotion.id;
        document.getElementById('promotionName').value = promotion.name;
        document.getElementById('promotionType').value = promotion.type;
        document.getElementById('promotionValue').value = promotion.value;
        document.getElementById('promotionDescription').value = promotion.description || '';
        document.getElementById('promotionActive').checked = promotion.active;
        document.getElementById('promotionStart').value = this.formatDateTimeLocal(new Date(promotion.startDate));
        document.getElementById('promotionEnd').value = this.formatDateTimeLocal(new Date(promotion.endDate));
        
        // Selecionar produtos
        const productsSelect = document.getElementById('promotionProducts');
        if (productsSelect) {
            promotion.products.forEach(productId => {
                const option = Array.from(productsSelect.options).find(opt => opt.value == productId);
                if (option) option.selected = true;
            });
        }
    }
    
    savePromotion() {
        const validation = window.database.validatePromotion({
            name: document.getElementById('promotionName').value,
            type: document.getElementById('promotionType').value,
            value: parseFloat(document.getElementById('promotionValue').value),
            startDate: document.getElementById('promotionStart').value,
            endDate: document.getElementById('promotionEnd').value
        });
        
        if (!validation.isValid) {
            this.showNotification(validation.errors[0], 'error');
            return;
        }
        
        const promotionData = {
            name: document.getElementById('promotionName').value,
            type: document.getElementById('promotionType').value,
            value: parseFloat(document.getElementById('promotionValue').value),
            description: document.getElementById('promotionDescription').value,
            active: document.getElementById('promotionActive').checked,
            startDate: document.getElementById('promotionStart').value,
            endDate: document.getElementById('promotionEnd').value,
            products: Array.from(document.getElementById('promotionProducts').selectedOptions)
                .map(option => option.value)
        };
        
        if (this.currentPromotionId) {
            // Atualizar promoção
            window.database.updatePromotion(this.currentPromotionId, promotionData);
            this.showNotification('Promoção atualizada com sucesso!', 'success');
        } else {
            // Adicionar nova promoção
            window.database.addPromotion(promotionData);
            this.showNotification('Promoção criada com sucesso!', 'success');
        }
        
        // Fechar modal e atualizar lista
        this.closeModal('promotionModal');
        this.refreshPromotionsList();
        this.loadDashboard();
    }
    
    editPromotion(promotionId) {
        this.openPromotionModal(promotionId);
    }
    
    deletePromotion(promotionId) {
        if (confirm('Tem certeza que deseja excluir esta promoção?')) {
            window.database.deletePromotion(promotionId);
            this.refreshPromotionsList();
            this.loadDashboard();
            this.showNotification('Promoção excluída com sucesso!', 'success');
        }
    }
    
    // ============================================
    // LINKS DE PAGAMENTO - FUNÇÃO ADICIONADA
    // ============================================
    
    loadPaymentLinksSection() {
        this.refreshPaymentLinks();
    }
    
    refreshPaymentLinks() {
        const products = window.database.getProducts();
        const paymentLinks = window.database.getPaymentLinks();
        const container = document.getElementById('paymentLinksList');
        
        if (!container) return;
        
        if (products.length === 0) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #6b7280;">
                    <i class="fas fa-link" style="font-size: 3rem; margin-bottom: 20px; color: #d1d5db;"></i>
                    <h3 style="margin-bottom: 10px;">Nenhum produto cadastrado</h3>
                    <p>Adicione produtos primeiro para configurar links de pagamento.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = products.map(product => {
            const currentLink = paymentLinks[product.id] || '';
            const hasLink = currentLink && currentLink.trim() !== '';
            
            return `
                <div class="payment-link-item" data-product-id="${product.id}" style="padding: 20px; border-bottom: 1px solid #e5e7eb; transition: background 0.3s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <h4 style="font-size: 1.1rem; margin-bottom: 5px; color: #1a202c;">${product.name}</h4>
                            <div class="product-meta" style="display: flex; align-items: center; gap: 10px;">
                                <span class="product-category-badge" style="background: rgba(79, 70, 229, 0.1); color: #4f46e5; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem;">
                                    ${this.getCategoryName(product.category)}
                                </span>
                                <span style="font-weight: 600; color: #1a202c;">
                                    R$ ${this.formatPrice(product.finalPrice || product.price)}
                                </span>
                                ${hasLink ? 
                                    '<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem;">Link Configurado</span>' : 
                                    '<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem;">Sem Link</span>'
                                }
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; align-items: center;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #1a202c;">
                                Link de Pagamento:
                            </label>
                            <input type="text" class="link-input" value="${currentLink}" 
                                   placeholder="https://pay.hotmart.com/SEUCODIGO"
                                   data-product-id="${product.id}" style="width: 100%; padding: 12px 15px; border: 2px solid ${hasLink ? '#10b981' : '#e5e7eb'}; border-radius: 8px; font-size: 0.9rem; background-color: ${hasLink ? '#f0fdf4' : 'white'};">
                            <small style="display: block; margin-top: 5px; color: #6b7280; font-size: 0.8rem;">
                                Hotmart, Gumroad, Mercado Pago, etc.
                            </small>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <button class="btn btn-small" onclick="admin.testPaymentLink(${product.id})" style="padding: 10px 20px; background: #e5e7eb; color: #1a202c; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap;" ${!hasLink ? 'disabled' : ''}>
                                <i class="fas fa-external-link-alt"></i> Testar
                            </button>
                            <button class="btn btn-small btn-primary" onclick="admin.savePaymentLink(${product.id})" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                                <i class="fas fa-save"></i> Salvar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Configurar eventos de Enter nos inputs
        document.querySelectorAll('.link-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const productId = input.getAttribute('data-product-id');
                    this.savePaymentLink(productId);
                }
            });
        });
    }
    
    savePaymentLink(productId) {
        const input = document.querySelector(`.link-input[data-product-id="${productId}"]`);
        const link = input.value.trim();
        
        if (link && !link.startsWith('http://') && !link.startsWith('https://')) {
            this.showNotification('O link deve começar com http:// ou https://', 'error');
            return;
        }
        
        window.database.updatePaymentLink(productId, link);
        
        // Atualizar visual do input
        if (link) {
            input.style.borderColor = '#10b981';
            input.style.backgroundColor = '#f0fdf4';
        } else {
            input.style.borderColor = '#e5e7eb';
            input.style.backgroundColor = 'white';
        }
        
        this.showNotification('Link de pagamento salvo com sucesso!', 'success');
        this.loadDashboard(); // Atualizar estatísticas
    }
    
    testPaymentLink(productId) {
        const paymentLinks = window.database.getPaymentLinks();
        const link = paymentLinks[productId];
        
        if (!link) {
            this.showNotification('Nenhum link configurado para este produto!', 'error');
            return;
        }
        
        window.open(link, '_blank');
    }
    
    // ============================================
    // CONFIGURAÇÕES
    // ============================================
    
    loadSettingsSection() {
        this.updateSystemInfo();
        this.setupSettingsButtons();
    }
    
    updateSystemInfo() {
        const stats = window.database.getStats();
        const backup = window.database.getBackup();
        
        document.getElementById('systemProducts').textContent = stats.totalProducts;
        document.getElementById('systemPromotions').textContent = stats.activePromotions;
        
        if (backup) {
            const backupDate = new Date(backup.timestamp);
            document.getElementById('lastBackup').textContent = this.formatDate(backupDate);
        } else {
            document.getElementById('lastBackup').textContent = 'Nunca';
        }
    }
    
    setupSettingsButtons() {
        // Backup
        document.getElementById('backupBtn').addEventListener('click', () => {
            window.database.createBackup();
            this.updateSystemInfo();
            this.showNotification('Backup criado com sucesso!', 'success');
            
            // Oferecer download
            const backup = window.database.getBackup();
            const backupStr = JSON.stringify(backup, null, 2);
            const blob = new Blob([backupStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `templateShop-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
        
        // Restore
        document.getElementById('restoreBtn').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const backup = JSON.parse(e.target.result);
                        
                        if (confirm('Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.')) {
                            window.database.restoreBackup(backup);
                            this.showNotification('Backup restaurado com sucesso!', 'success');
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                        }
                    } catch (error) {
                        this.showNotification('Erro ao ler arquivo de backup!', 'error');
                    }
                };
                reader.readAsText(file);
            };
            
            input.click();
        });
        
        // Reset
        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('ATENÇÃO: Esta ação irá remover TODOS os produtos, promoções e configurações. Esta ação não pode ser desfeita. Tem certeza?')) {
                localStorage.clear();
                this.showNotification('Todos os dados foram removidos!', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        });
    }
    
    exportData() {
        const data = window.database.exportData();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `templateShop-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Dados exportados com sucesso!', 'success');
    }
    
    // ============================================
    // UTILITÁRIOS
    // ============================================
    
    setupEvents() {
        // Configurar fechamento de modais
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Fechar modais ao clicar fora
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
    
    setupModalClose(modal) {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    formatPrice(price) {
        return parseFloat(price).toFixed(2).replace('.', ',');
    }
    
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    formatDateTimeLocal(date) {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    }
    
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#4f46e5'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 1.2rem;"></i>
            <span>${message}</span>
        `;
        
        notification.className = `notification show ${type}`;
        notification.style.borderLeft = `4px solid ${colors[type]}`;
        notification.style.display = 'flex';
        
        // Animar entrada
        notification.style.animation = 'slideIn 0.3s ease';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
    
    updateStats() {
        const stats = window.database.getStats();
        
        // Atualizar sidebar
        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('activePromotions').textContent = stats.activePromotions;
    }
}

// Inicializar sistema admin
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminSystem();
});
[file content end]