[file name]: database.js
[file content begin]
// ============================================
// SISTEMA DE BANCO DE DADOS - TemplateShop
// ============================================

class Database {
    constructor() {
        this.STORAGE_KEYS = {
            PRODUCTS: 'templateShop_products',
            PROMOTIONS: 'templateShop_promotions',
            PAYMENT_LINKS: 'templateShop_paymentLinks',
            SETTINGS: 'templateShop_settings',
            BACKUP: 'templateShop_backup'
        };
        
        this.init();
    }
    
    init() {
        // Inicializar dados padrão se necessário
        if (!this.getProducts().length) {
            this.createDefaultData();
        }
    }
    
    // ============================================
    // PRODUTOS
    // ============================================
    
    getProducts() {
        const products = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS);
        if (!products) return [];
        
        const parsedProducts = JSON.parse(products);
        
        // Adicionar links de pagamento aos produtos
        const paymentLinks = this.getPaymentLinks();
        return parsedProducts.map(product => ({
            ...product,
            paymentLink: paymentLinks[product.id] || '#'
        }));
    }
    
    saveProducts(products) {
        localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        this.updatePromotions(); // Atualizar promoções
        return true;
    }
    
    getProduct(id) {
        const products = this.getProducts();
        return products.find(p => p.id == id);
    }
    
    addProduct(productData) {
        const products = this.getProducts();
        const newProduct = {
            id: Date.now(), // ID único
            ...productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            paymentLink: '#'
        };
        
        products.push(newProduct);
        this.saveProducts(products);
        return newProduct;
    }
    
    updateProduct(id, productData) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id == id);
        
        if (index === -1) return false;
        
        products[index] = {
            ...products[index],
            ...productData,
            updatedAt: new Date().toISOString()
        };
        
        this.saveProducts(products);
        return products[index];
    }
    
    deleteProduct(id) {
        const products = this.getProducts();
        const filtered = products.filter(p => p.id != id);
        
        // Remover também o link de pagamento associado
        this.deletePaymentLink(id);
        
        this.saveProducts(filtered);
        return true;
    }
    
    // ============================================
    // LINKS DE PAGAMENTO - FUNÇÕES ADICIONADAS
    // ============================================
    
    getPaymentLinks() {
        const links = localStorage.getItem(this.STORAGE_KEYS.PAYMENT_LINKS);
        return links ? JSON.parse(links) : {};
    }
    
    savePaymentLinks(links) {
        localStorage.setItem(this.STORAGE_KEYS.PAYMENT_LINKS, JSON.stringify(links));
        return true;
    }
    
    updatePaymentLink(productId, link) {
        const links = this.getPaymentLinks();
        links[productId] = link;
        this.savePaymentLinks(links);
        return true;
    }
    
    deletePaymentLink(productId) {
        const links = this.getPaymentLinks();
        delete links[productId];
        this.savePaymentLinks(links);
        return true;
    }
    
    validatePaymentLink(link) {
        if (!link || typeof link !== 'string') {
            return { isValid: false, error: 'Link inválido' };
        }
        
        // Validar se é uma URL válida (http:// ou https://)
        try {
            if (link.trim() === '') {
                return { isValid: true }; // Link vazio é válido (não configurado)
            }
            
            if (!link.startsWith('http://') && !link.startsWith('https://')) {
                return { isValid: false, error: 'Link deve começar com http:// ou https://' };
            }
            return { isValid: true };
        } catch (e) {
            return { isValid: false, error: 'Formato de link inválido' };
        }
    }
    
    // ============================================
    // PROMOÇÕES
    // ============================================
    
    getPromotions() {
        const promotions = localStorage.getItem(this.STORAGE_KEYS.PROMOTIONS);
        return promotions ? JSON.parse(promotions) : [];
    }
    
    savePromotions(promotions) {
        localStorage.setItem(this.STORAGE_KEYS.PROMOTIONS, JSON.stringify(promotions));
        this.updatePromotions(); // Atualizar produtos com promoções
        return true;
    }
    
    addPromotion(promotionData) {
        const promotions = this.getPromotions();
        const newPromotion = {
            id: Date.now(),
            ...promotionData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        promotions.push(newPromotion);
        this.savePromotions(promotions);
        return newPromotion;
    }
    
    updatePromotion(id, promotionData) {
        const promotions = this.getPromotions();
        const index = promotions.findIndex(p => p.id == id);
        
        if (index === -1) return false;
        
        promotions[index] = {
            ...promotions[index],
            ...promotionData,
            updatedAt: new Date().toISOString()
        };
        
        this.savePromotions(promotions);
        return promotions[index];
    }
    
    deletePromotion(id) {
        const promotions = this.getPromotions();
        const filtered = promotions.filter(p => p.id != id);
        this.savePromotions(filtered);
        return true;
    }
    
    // Aplicar promoções aos produtos
    updatePromotions() {
        const products = this.getProducts();
        const promotions = this.getPromotions();
        const now = new Date();
        
        const activePromotions = promotions.filter(promo => {
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);
            return promo.active && now >= start && now <= end;
        });
        
        const updatedProducts = products.map(product => {
            let finalProduct = { ...product };
            let bestDiscount = 0;
            let appliedPromotion = null;
            
            // Encontrar melhor promoção para este produto
            activePromotions.forEach(promo => {
                if (promo.products.includes('all') || promo.products.includes(product.id)) {
                    let discount = 0;
                    
                    if (promo.type === 'percentage') {
                        discount = (product.price * promo.value) / 100;
                    } else if (promo.type === 'fixed') {
                        discount = promo.value;
                    }
                    
                    if (discount > bestDiscount) {
                        bestDiscount = discount;
                        appliedPromotion = promo;
                    }
                }
            });
            
            if (appliedPromotion && bestDiscount > 0) {
                finalProduct.finalPrice = product.price - bestDiscount;
                finalProduct.discount = Math.round((bestDiscount / product.price) * 100);
                finalProduct.promotionId = appliedPromotion.id;
            } else {
                finalProduct.finalPrice = product.price;
                finalProduct.discount = product.discount || 0;
            }
            
            return finalProduct;
        });
        
        // Salvar produtos com promoções aplicadas
        localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    }
    
    getActivePromotions() {
        const promotions = this.getPromotions();
        const now = new Date();
        
        return promotions.filter(promo => {
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);
            return promo.active && now >= start && now <= end;
        });
    }
    
    // ============================================
    // CONFIGURAÇÕES
    // ============================================
    
    getSettings() {
        const settings = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
        return settings ? JSON.parse(settings) : {
            siteName: 'TemplateShop',
            siteDescription: 'Loja de templates de sites',
            currency: 'R$',
            contactEmail: 'suporte@templateshop.com',
            adminPassword: 'ADMIN@2024' // ALTERE ESTA SENHA!
        };
    }
    
    saveSettings(settings) {
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        return true;
    }
    
    // ============================================
    // BACKUP & RESTORE
    // ============================================
    
    createBackup() {
        const backup = {
            products: this.getProducts(),
            promotions: this.getPromotions(),
            paymentLinks: this.getPaymentLinks(),
            settings: this.getSettings(),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
        
        localStorage.setItem(this.STORAGE_KEYS.BACKUP, JSON.stringify(backup));
        return backup;
    }
    
    getBackup() {
        const backup = localStorage.getItem(this.STORAGE_KEYS.BACKUP);
        return backup ? JSON.parse(backup) : null;
    }
    
    restoreBackup(backupData) {
        if (!backupData.products || !backupData.promotions) {
            throw new Error('Backup inválido');
        }
        
        this.saveProducts(backupData.products);
        this.savePromotions(backupData.promotions);
        this.savePaymentLinks(backupData.paymentLinks || {});
        
        if (backupData.settings) {
            this.saveSettings(backupData.settings);
        }
        
        return true;
    }
    
    exportData() {
        return {
            products: this.getProducts(),
            promotions: this.getPromotions(),
            paymentLinks: this.getPaymentLinks(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    }
    
    importData(data) {
        return this.restoreBackup(data);
    }
    
    // ============================================
    // DADOS PADRÃO
    // ============================================
    
    createDefaultData() {
        // Produtos padrão
        const defaultProducts = [
            {
                id: 1,
                name: "PortfolioPro",
                category: "portfolio",
                description: "Template profissional para portfólios de desenvolvedores e designers.",
                longDescription: "Template moderno com foco na apresentação de projetos. Inclui seções para habilidades, portfólio, experiência e contato.",
                price: 49.90,
                originalPrice: 79.90,
                discount: 38,
                featured: true,
                image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGY0NmU1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qb3J0Zm9saW9Qcm88L3RleHQ+PC9zdmc+",
                tags: ["responsivo", "moderno", "portfolio"],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                paymentLink: "https://pay.hotmart.com/demo"
            },
            {
                id: 2,
                name: "StartupLand",
                category: "landing",
                description: "Landing page moderna para startups e serviços digitais.",
                longDescription: "Landing page otimizada para conversão com foco em startups. Inclui seções para features, testimonials, pricing e CTA.",
                price: 39.90,
                originalPrice: 59.90,
                discount: 33,
                featured: true,
                image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTAiPjwvcmVjdD48L3N2Zz4=",
                tags: ["landing", "startup", "conversão"],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                paymentLink: "https://pay.hotmart.com/demo"
            },
            {
                id: 3,
                name: "BlogMaster",
                category: "blog",
                description: "Template elegante para blogs pessoais e de nicho.",
                longDescription: "Template para blogs com design clean, otimizado para leitura. Inclui sistema de categorias, tags, comentários e sidebar.",
                price: 29.90,
                originalPrice: 44.90,
                discount: 33,
                featured: true,
                image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjN2MzYWVkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CbG9nTWFzdGVyPC90ZXh0Pjwvc3ZnPg==",
                tags: ["blog", "leitura", "conteúdo"],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                paymentLink: "https://pay.hotmart.com/demo"
            }
        ];
        
        // Promoção padrão
        const defaultPromotion = {
            id: 1,
            name: "Lançamento",
            type: "percentage",
            value: 20,
            description: "Promoção de lançamento do site",
            products: ["all"],
            active: true,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Links de pagamento padrão
        const defaultLinks = {
            1: "https://pay.hotmart.com/demo",
            2: "https://pay.hotmart.com/demo",
            3: "https://pay.hotmart.com/demo"
        };
        
        // Salvar dados
        this.saveProducts(defaultProducts);
        this.savePromotions([defaultPromotion]);
        this.savePaymentLinks(defaultLinks);
        
        // Aplicar promoções
        this.updatePromotions();
        
        return {
            products: defaultProducts,
            promotions: [defaultPromotion],
            paymentLinks: defaultLinks
        };
    }
    
    // ============================================
    // ESTATÍSTICAS
    // ============================================
    
    getStats() {
        const products = this.getProducts();
        const promotions = this.getActivePromotions();
        const paymentLinks = this.getPaymentLinks();
        
        // Contar links configurados
        const configuredLinks = Object.values(paymentLinks).filter(link => 
            link && link.trim() !== '' && link !== '#'
        ).length;
        
        return {
            totalProducts: products.length,
            activePromotions: promotions.length,
            featuredProducts: products.filter(p => p.featured).length,
            configuredPaymentLinks: configuredLinks,
            totalValue: products.reduce((sum, p) => sum + (p.finalPrice || p.price), 0)
        };
    }
    
    // ============================================
    // UTILITÁRIOS
    // ============================================
    
    validateProduct(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 3) {
            errors.push("Nome do produto deve ter pelo menos 3 caracteres");
        }
        
        if (!data.category) {
            errors.push("Categoria é obrigatória");
        }
        
        if (!data.price || data.price <= 0) {
            errors.push("Preço deve ser maior que zero");
        }
        
        if (!data.description || data.description.trim().length < 10) {
            errors.push("Descrição deve ter pelo menos 10 caracteres");
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    validatePromotion(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 3) {
            errors.push("Nome da promoção é obrigatório");
        }
        
        if (!data.type || !['percentage', 'fixed'].includes(data.type)) {
            errors.push("Tipo de promoção inválido");
        }
        
        if (!data.value || data.value <= 0) {
            errors.push("Valor da promoção deve ser maior que zero");
        }
        
        if (data.type === 'percentage' && data.value > 100) {
            errors.push("Porcentagem não pode ser maior que 100%");
        }
        
        if (!data.startDate || !data.endDate) {
            errors.push("Datas de início e término são obrigatórias");
        }
        
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        
        if (start >= end) {
            errors.push("Data de término deve ser após a data de início");
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Criar instância global
window.database = new Database();
[file content end]