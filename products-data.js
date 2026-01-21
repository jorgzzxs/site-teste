// ============================================
// SISTEMA DE DADOS DE PRODUTOS - TemplateShop
// ============================================

class ProductsData {
    constructor() {
        this.STORAGE_KEY = 'templateShop_products_data';
        this.init();
    }
    
    init() {
        // Inicializar dados padrão se necessário
        if (!this.getProducts().length) {
            this.createDefaultProducts();
        }
    }
    
    // ============================================
    // CRUD DE PRODUTOS
    // ============================================
    
    getProducts() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            return [];
        }
    }
    
    saveProducts(products) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
            this.dispatchProductsUpdate();
            return true;
        } catch (error) {
            console.error('Erro ao salvar produtos:', error);
            return false;
        }
    }
    
    getProduct(id) {
        const products = this.getProducts();
        return products.find(p => p.id == id);
    }
    
    addProduct(productData) {
        const products = this.getProducts();
        const newProduct = {
            id: this.generateId(),
            ...this.validateProductData(productData),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            salesCount: 0,
            views: 0
        };
        
        products.push(newProduct);
        this.saveProducts(products);
        return newProduct;
    }
    
    updateProduct(id, productData) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id == id);
        
        if (index === -1) return null;
        
        const updatedProduct = {
            ...products[index],
            ...this.validateProductData(productData),
            updatedAt: new Date().toISOString(),
            id: products[index].id, // Manter ID original
            createdAt: products[index].createdAt, // Manter data criação
            salesCount: products[index].salesCount || 0, // Manter vendas
            views: products[index].views || 0 // Manter visualizações
        };
        
        products[index] = updatedProduct;
        this.saveProducts(products);
        return updatedProduct;
    }
    
    deleteProduct(id) {
        const products = this.getProducts();
        const filteredProducts = products.filter(p => p.id != id);
        this.saveProducts(filteredProducts);
        return true;
    }
    
    // ============================================
    // FUNÇÕES ESPECIALIZADAS DE PRODUTOS
    // ============================================
    
    getFeaturedProducts(limit = 3) {
        const products = this.getProducts();
        return products
            .filter(p => p.featured)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, limit);
    }
    
    getProductsByCategory(category, limit = null) {
        const products = this.getProducts();
        const filtered = products.filter(p => p.category === category)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        return limit ? filtered.slice(0, limit) : filtered;
    }
    
    getCategories() {
        const products = this.getProducts();
        const categories = [...new Set(products.map(p => p.category))];
        
        // Mapear categorias para nomes amigáveis
        return categories.map(category => ({
            id: category,
            name: this.getCategoryName(category),
            count: products.filter(p => p.category === category).length,
            icon: this.getCategoryIcon(category)
        }));
    }
    
    getCategoryName(category) {
        const categories = {
            'portfolio': 'Portfólio',
            'landing': 'Landing Page',
            'blog': 'Blog',
            'negocio': 'Negócios',
            'ecommerce': 'E-commerce',
            'saas': 'SaaS',
            'pessoal': 'Pessoal',
            'empresa': 'Empresa'
        };
        return categories[category] || category;
    }
    
    getCategoryIcon(category) {
        const icons = {
            'portfolio': 'fas fa-briefcase',
            'landing': 'fas fa-rocket',
            'blog': 'fas fa-blog',
            'negocio': 'fas fa-building',
            'ecommerce': 'fas fa-shopping-cart',
            'saas': 'fas fa-cloud',
            'pessoal': 'fas fa-user',
            'empresa': 'fas fa-landmark'
        };
        return icons[category] || 'fas fa-box';
    }
    
    incrementViews(productId) {
        const product = this.getProduct(productId);
        if (product) {
            product.views = (product.views || 0) + 1;
            this.updateProduct(productId, { views: product.views });
        }
    }
    
    incrementSales(productId) {
        const product = this.getProduct(productId);
        if (product) {
            product.salesCount = (product.salesCount || 0) + 1;
            this.updateProduct(productId, { salesCount: product.salesCount });
        }
    }
    
    getPopularProducts(limit = 5) {
        const products = this.getProducts();
        return products
            .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
            .slice(0, limit);
    }
    
    getRecentProducts(limit = 5) {
        const products = this.getProducts();
        return products
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }
    
    searchProducts(query) {
        const products = this.getProducts();
        const searchTerm = query.toLowerCase().trim();
        
        return products.filter(product => {
            return (
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                this.getCategoryName(product.category).toLowerCase().includes(searchTerm)
            );
        });
    }
    
    getProductsWithPromotions(promotionsData) {
        const products = this.getProducts();
        const promotions = promotionsData.getActivePromotions();
        
        return products.map(product => {
            let finalProduct = { ...product };
            let bestDiscount = 0;
            
            // Aplicar melhor promoção
            promotions.forEach(promo => {
                if (promo.products.includes('all') || promo.products.includes(product.id)) {
                    let discount = 0;
                    
                    if (promo.type === 'percentage') {
                        discount = (product.price * promo.value) / 100;
                    } else if (promo.type === 'fixed') {
                        discount = promo.value;
                    }
                    
                    if (discount > bestDiscount) {
                        bestDiscount = discount;
                        finalProduct.promotionId = promo.id;
                        finalProduct.promotionName = promo.name;
                    }
                }
            });
            
            if (bestDiscount > 0) {
                finalProduct.finalPrice = product.price - bestDiscount;
                finalProduct.discount = Math.round((bestDiscount / product.price) * 100);
                finalProduct.hasPromotion = true;
            } else {
                finalProduct.finalPrice = product.price;
                finalProduct.discount = product.discount || 0;
                finalProduct.hasPromotion = false;
            }
            
            return finalProduct;
        });
    }
    
    // ============================================
    // VALIDAÇÃO E UTILITÁRIOS
    // ============================================
    
    validateProductData(data) {
        // Garantir tipos corretos
        return {
            name: String(data.name || '').trim(),
            category: data.category || 'portfolio',
            description: String(data.description || '').trim(),
            longDescription: String(data.longDescription || '').trim(),
            price: parseFloat(data.price) || 0,
            originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
            image: data.image || null,
            featured: Boolean(data.featured),
            tags: Array.isArray(data.tags) ? data.tags : 
                  typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()) : [],
            filesIncluded: data.filesIncluded || [
                'HTML Files',
                'CSS Files', 
                'JavaScript Files',
                'Documentation',
                'Image Assets'
            ],
            requirements: data.requirements || [
                'Basic HTML/CSS knowledge',
                'Text editor',
                'Web browser'
            ],
            compatibility: data.compatibility || [
                'All modern browsers',
                'Mobile responsive',
                'GitHub Pages ready'
            ]
        };
    }
    
    validateProduct(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 3) {
            errors.push('Nome deve ter pelo menos 3 caracteres');
        }
        
        if (!data.category) {
            errors.push('Categoria é obrigatória');
        }
        
        if (!data.price || data.price <= 0) {
            errors.push('Preço deve ser maior que zero');
        }
        
        if (!data.description || data.description.trim().length < 10) {
            errors.push('Descrição deve ter pelo menos 10 caracteres');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    generateId() {
        return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // ============================================
    // DADOS PADRÃO
    // ============================================
    
    createDefaultProducts() {
        const defaultProducts = [
            {
                id: 'prod_1',
                name: 'PortfolioPro',
                category: 'portfolio',
                description: 'Template profissional para portfólios de desenvolvedores e designers.',
                longDescription: 'Template moderno com foco na apresentação de projetos. Inclui seções para habilidades, portfólio, experiência e contato. Totalmente responsivo e otimizado para performance.',
                price: 49.90,
                originalPrice: 79.90,
                discount: 38,
                featured: true,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGY0NmU1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qb3J0Zm9saW9Qcm88L3RleHQ+PC9zdmc+',
                tags: ['responsivo', 'moderno', 'portfolio', 'dev', 'designer'],
                filesIncluded: ['HTML Files', 'CSS Files', 'JavaScript', 'README.md', 'Images'],
                requirements: ['Basic HTML/CSS', 'Text editor'],
                compatibility: ['All browsers', 'Mobile', 'GitHub Pages'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                salesCount: 42,
                views: 156
            },
            {
                id: 'prod_2',
                name: 'StartupLand',
                category: 'landing',
                description: 'Landing page moderna para startups e serviços digitais.',
                longDescription: 'Landing page otimizada para conversão com foco em startups. Inclui seções para features, testimonials, pricing e call-to-action. Design clean e profissional.',
                price: 39.90,
                originalPrice: 59.90,
                discount: 33,
                featured: true,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTAiPjwvcmVjdD48L3N2Zz4=',
                tags: ['landing', 'startup', 'conversão', 'saas', 'negócios'],
                filesIncluded: ['HTML Files', 'CSS Files', 'JavaScript', 'Images', 'Documentation'],
                requirements: ['Basic web knowledge'],
                compatibility: ['All modern browsers', 'Responsive'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                salesCount: 28,
                views: 89
            },
            {
                id: 'prod_3',
                name: 'BlogMaster',
                category: 'blog',
                description: 'Template elegante para blogs pessoais e de nicho.',
                longDescription: 'Template para blogs com design clean, otimizado para leitura. Inclui sistema de categorias, tags, comentários e sidebar. Perfeito para conteúdo de texto.',
                price: 29.90,
                originalPrice: 44.90,
                discount: 33,
                featured: true,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjN2MzYWVkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CbG9nTWFzdGVyPC90ZXh0Pjwvc3ZnPg==',
                tags: ['blog', 'leitura', 'conteúdo', 'escrita', 'artigos'],
                filesIncluded: ['HTML Files', 'CSS Files', 'Blog Templates', 'Images'],
                requirements: ['Basic HTML'],
                compatibility: ['All browsers', 'SEO friendly'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                salesCount: 35,
                views: 120
            },
            {
                id: 'prod_4',
                name: 'BusinessCorp',
                category: 'negocio',
                description: 'Template corporativo para empresas e organizações.',
                longDescription: 'Template profissional para sites corporativos. Inclui páginas: sobre, serviços, equipe, contato e blog. Design sério e confiável.',
                price: 59.90,
                originalPrice: 89.90,
                discount: 33,
                featured: false,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMHgwMDAiPjwvcmVjdD48L3N2Zz4=',
                tags: ['corporativo', 'empresa', 'profissional', 'negócios'],
                filesIncluded: ['All HTML Pages', 'CSS', 'JavaScript', 'Documentation'],
                requirements: ['Web development basics'],
                compatibility: ['Enterprise ready', 'Responsive'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                salesCount: 18,
                views: 67
            },
            {
                id: 'prod_5',
                name: 'EcommercePlus',
                category: 'ecommerce',
                description: 'Template completo para lojas virtuais.',
                longDescription: 'Sistema de e-commerce completo com carrinho, checkout e admin. Perfeito para começar uma loja online rapidamente.',
                price: 79.90,
                originalPrice: 119.90,
                discount: 33,
                featured: false,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjU5ZTBhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FY29tbWVyY2VQbHVzPC90ZXh0Pjwvc3ZnPg==',
                tags: ['ecommerce', 'loja', 'produtos', 'carrinho', 'checkout'],
                filesIncluded: ['Full E-commerce System', 'Admin Panel', 'Product Pages'],
                requirements: ['JavaScript knowledge'],
                compatibility: ['E-commerce ready', 'Payment gateways'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                salesCount: 22,
                views: 95
            }
        ];
        
        this.saveProducts(defaultProducts);
        return defaultProducts;
    }
    
    // ============================================
    // EVENTOS E OBSERVERS
    // ============================================
    
    dispatchProductsUpdate() {
        // Disparar evento customizado para notificar outras partes do sistema
        const event = new CustomEvent('productsUpdated', {
            detail: { timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
    }
    
    // ============================================
    // ESTATÍSTICAS
    // ============================================
    
    getStats() {
        const products = this.getProducts();
        
        return {
            totalProducts: products.length,
            featuredProducts: products.filter(p => p.featured).length,
            totalSales: products.reduce((sum, p) => sum + (p.salesCount || 0), 0),
            totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0),
            totalValue: products.reduce((sum, p) => sum + p.price, 0),
            averagePrice: products.length > 0 ? 
                products.reduce((sum, p) => sum + p.price, 0) / products.length : 0,
            categories: this.getCategories()
        };
    }
    
    getSalesData(days = 30) {
        // Simular dados de vendas (em produção viria de um backend)
        const products = this.getProducts();
        const salesData = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Simular vendas aleatórias
            const totalSales = products.reduce((sum, product) => {
                // Simular que produtos populares vendem mais
                const baseSales = Math.floor((product.salesCount || 0) / 30);
                const randomSales = Math.floor(Math.random() * 3);
                return sum + baseSales + randomSales;
            }, 0);
            
            salesData.push({
                date: date.toISOString().split('T')[0],
                sales: Math.max(1, totalSales),
                revenue: totalSales * 29.90 // Preço médio
            });
        }
        
        return salesData;
    }
}

// Criar instância global
window.productsData = new ProductsData();