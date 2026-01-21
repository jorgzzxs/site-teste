// ============================================
// SISTEMA DE DADOS DE PROMOÇÕES - TemplateShop
// ============================================

class PromotionsData {
    constructor() {
        this.STORAGE_KEY = 'templateShop_promotions_data';
        this.init();
    }
    
    init() {
        // Inicializar promoções padrão se necessário
        if (!this.getPromotions().length) {
            this.createDefaultPromotions();
        }
        
        // Verificar e remover promoções expiradas
        this.cleanExpiredPromotions();
        
        // Configurar verificação periódica
        this.setupExpirationCheck();
    }
    
    // ============================================
    // CRUD DE PROMOÇÕES
    // ============================================
    
    getPromotions() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Erro ao carregar promoções:', error);
            return [];
        }
    }
    
    savePromotions(promotions) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(promotions));
            this.dispatchPromotionsUpdate();
            return true;
        } catch (error) {
            console.error('Erro ao salvar promoções:', error);
            return false;
        }
    }
    
    getPromotion(id) {
        const promotions = this.getPromotions();
        return promotions.find(p => p.id == id);
    }
    
    addPromotion(promotionData) {
        const promotions = this.getPromotions();
        const newPromotion = {
            id: this.generateId(),
            ...this.validatePromotionData(promotionData),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usedCount: 0
        };
        
        promotions.push(newPromotion);
        this.savePromotions(promotions);
        return newPromotion;
    }
    
    updatePromotion(id, promotionData) {
        const promotions = this.getPromotions();
        const index = promotions.findIndex(p => p.id == id);
        
        if (index === -1) return null;
        
        const updatedPromotion = {
            ...promotions[index],
            ...this.validatePromotionData(promotionData),
            updatedAt: new Date().toISOString(),
            id: promotions[index].id,
            createdAt: promotions[index].createdAt,
            usedCount: promotions[index].usedCount || 0
        };
        
        promotions[index] = updatedPromotion;
        this.savePromotions(promotions);
        return updatedPromotion;
    }
    
    deletePromotion(id) {
        const promotions = this.getPromotions();
        const filteredPromotions = promotions.filter(p => p.id != id);
        this.savePromotions(filteredPromotions);
        return true;
    }
    
    // ============================================
    // FUNÇÕES ESPECIALIZADAS DE PROMOÇÕES
    // ============================================
    
    getActivePromotions() {
        const promotions = this.getPromotions();
        const now = new Date();
        
        return promotions.filter(promo => {
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);
            return promo.active && now >= start && now <= end;
        });
    }
    
    getUpcomingPromotions() {
        const promotions = this.getPromotions();
        const now = new Date();
        
        return promotions.filter(promo => {
            const start = new Date(promo.startDate);
            return promo.active && start > now;
        }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    }
    
    getExpiredPromotions() {
        const promotions = this.getPromotions();
        const now = new Date();
        
        return promotions.filter(promo => {
            const end = new Date(promo.endDate);
            return end < now;
        }).sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    }
    
    getPromotionForProduct(productId, promotions = null) {
        const activePromotions = promotions || this.getActivePromotions();
        
        // Encontrar a melhor promoção para este produto
        let bestPromotion = null;
        let bestDiscount = 0;
        
        activePromotions.forEach(promo => {
            // Verificar se a promoção se aplica a este produto
            const appliesToProduct = promo.products.includes('all') || 
                                    promo.products.includes(productId);
            
            if (appliesToProduct) {
                // Calcular valor do desconto (para comparação)
                const discountValue = promo.type === 'percentage' ? 
                    promo.value : // Para porcentagem, valor mais alto é melhor
                    promo.value * 10; // Para valor fixo, converter para equivalente percentual
                
                if (discountValue > bestDiscount) {
                    bestDiscount = discountValue;
                    bestPromotion = promo;
                }
            }
        });
        
        return bestPromotion;
    }
    
    calculateDiscount(productPrice, promotion) {
        if (!promotion) return { discount: 0, finalPrice: productPrice };
        
        let discount = 0;
        
        if (promotion.type === 'percentage') {
            discount = (productPrice * promotion.value) / 100;
        } else if (promotion.type === 'fixed') {
            discount = Math.min(promotion.value, productPrice);
        }
        
        const finalPrice = Math.max(0, productPrice - discount);
        
        return {
            discount: discount,
            finalPrice: finalPrice,
            discountPercentage: Math.round((discount / productPrice) * 100),
            promotionName: promotion.name
        };
    }
    
    incrementPromotionUsage(promotionId) {
        const promotion = this.getPromotion(promotionId);
        if (promotion) {
            promotion.usedCount = (promotion.usedCount || 0) + 1;
            this.updatePromotion(promotionId, { usedCount: promotion.usedCount });
        }
    }
    
    // ============================================
    // PROMOÇÕES PROGRAMADAS
    // ============================================
    
    checkAndActivateScheduledPromotions() {
        const promotions = this.getPromotions();
        const now = new Date();
        let updated = false;
        
        const updatedPromotions = promotions.map(promo => {
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);
            
            // Se a promoção está programada e chegou a hora de começar
            if (!promo.active && now >= start && now <= end) {
                updated = true;
                return { ...promo, active: true, activatedAt: now.toISOString() };
            }
            
            // Se a promoção expirou
            if (promo.active && now > end) {
                updated = true;
                return { ...promo, active: false, endedAt: now.toISOString() };
            }
            
            return promo;
        });
        
        if (updated) {
            this.savePromotions(updatedPromotions);
        }
        
        return updated;
    }
    
    cleanExpiredPromotions() {
        const promotions = this.getPromotions();
        const now = new Date();
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        // Manter apenas promoções dos últimos 30 dias ou ativas/futuras
        const filteredPromotions = promotions.filter(promo => {
            const end = new Date(promo.endDate);
            const isRecent = end > monthAgo;
            const isActiveOrFuture = promo.active || end > now;
            return isRecent || isActiveOrFuture;
        });
        
        if (filteredPromotions.length !== promotions.length) {
            this.savePromotions(filteredPromotions);
            return true;
        }
        
        return false;
    }
    
    setupExpirationCheck() {
        // Verificar promoções a cada hora
        setInterval(() => {
            this.checkAndActivateScheduledPromotions();
        }, 60 * 60 * 1000);
    }
    
    // ============================================
    // TIPOS DE PROMOÇÃO
    // ============================================
    
    getPromotionTypes() {
        return [
            { id: 'percentage', name: 'Porcentagem (%)', icon: 'fas fa-percentage' },
            { id: 'fixed', name: 'Valor Fixo (R$)', icon: 'fas fa-money-bill-wave' },
            { id: 'bundle', name: 'Pacote', icon: 'fas fa-boxes' },
            { id: 'flash', name: 'Flash Sale', icon: 'fas fa-bolt' }
        ];
    }
    
    getPromotionScopeOptions(productsData) {
        const products = productsData ? productsData.getProducts() : [];
        
        return [
            { id: 'all', name: 'Todos os Produtos', icon: 'fas fa-globe' },
            { id: 'featured', name: 'Apenas Destaques', icon: 'fas fa-star' },
            { id: 'category', name: 'Por Categoria', icon: 'fas fa-tag' },
            { id: 'selected', name: 'Produtos Selecionados', icon: 'fas fa-check-circle' }
        ];
    }
    
    // ============================================
    // VALIDAÇÃO E UTILITÁRIOS
    // ============================================
    
    validatePromotionData(data) {
        return {
            name: String(data.name || '').trim(),
            type: data.type || 'percentage',
            value: parseFloat(data.value) || 0,
            description: String(data.description || '').trim(),
            active: Boolean(data.active),
            startDate: data.startDate || new Date().toISOString(),
            endDate: data.endDate || this.getDefaultEndDate(),
            products: Array.isArray(data.products) ? data.products : 
                     typeof data.products === 'string' ? [data.products] : 
                     data.products === 'all' ? ['all'] : [],
            conditions: data.conditions || {},
            priority: parseInt(data.priority) || 1
        };
    }
    
    validatePromotion(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 3) {
            errors.push('Nome da promoção é obrigatório (mínimo 3 caracteres)');
        }
        
        if (!data.type || !['percentage', 'fixed', 'bundle', 'flash'].includes(data.type)) {
            errors.push('Tipo de promoção inválido');
        }
        
        if (!data.value || data.value <= 0) {
            errors.push('Valor deve ser maior que zero');
        }
        
        if (data.type === 'percentage' && data.value > 100) {
            errors.push('Porcentagem não pode ser maior que 100%');
        }
        
        if (!data.startDate || !data.endDate) {
            errors.push('Datas de início e término são obrigatórias');
        }
        
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        
        if (start >= end) {
            errors.push('Data de término deve ser após a data de início');
        }
        
        if (end < new Date()) {
            errors.push('Data de término não pode ser no passado');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    getDefaultEndDate(days = 7) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }
    
    generateId() {
        return 'promo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // ============================================
    // DADOS PADRÃO
    // ============================================
    
    createDefaultPromotions() {
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const defaultPromotions = [
            {
                id: 'promo_1',
                name: 'Lançamento',
                type: 'percentage',
                value: 20,
                description: 'Promoção especial de lançamento do site',
                active: true,
                startDate: now.toISOString(),
                endDate: nextMonth.toISOString(),
                products: ['all'],
                conditions: {},
                priority: 1,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                usedCount: 15
            },
            {
                id: 'promo_2',
                name: 'Flash Sale - Portfolio',
                type: 'percentage',
                value: 30,
                description: 'Promoção relâmpago para templates de portfólio',
                active: true,
                startDate: now.toISOString(),
                endDate: nextWeek.toISOString(),
                products: ['prod_1'], // Apenas PortfolioPro
                conditions: { maxUses: 50 },
                priority: 2,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                usedCount: 8
            },
            {
                id: 'promo_3',
                name: 'Black Friday',
                type: 'percentage',
                value: 40,
                description: 'Promoção especial de Black Friday',
                active: false,
                startDate: new Date(now.getFullYear(), 10, 25).toISOString(), // 25 de Novembro
                endDate: new Date(now.getFullYear(), 10, 28).toISOString(), // 28 de Novembro
                products: ['all'],
                conditions: {},
                priority: 1,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                usedCount: 0
            }
        ];
        
        this.savePromotions(defaultPromotions);
        return defaultPromotions;
    }
    
    // ============================================
    // EVENTOS E OBSERVERS
    // ============================================
    
    dispatchPromotionsUpdate() {
        const event = new CustomEvent('promotionsUpdated', {
            detail: { timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
    }
    
    // ============================================
    // ESTATÍSTICAS
    // ============================================
    
    getStats() {
        const promotions = this.getPromotions();
        const activePromotions = this.getActivePromotions();
        const expiredPromotions = this.getExpiredPromotions();
        const upcomingPromotions = this.getUpcomingPromotions();
        
        return {
            totalPromotions: promotions.length,
            activePromotions: activePromotions.length,
            expiredPromotions: expiredPromotions.length,
            upcomingPromotions: upcomingPromotions.length,
            totalUses: promotions.reduce((sum, p) => sum + (p.usedCount || 0), 0),
            mostUsedPromotion: promotions.length > 0 ? 
                promotions.reduce((max, p) => (p.usedCount || 0) > (max.usedCount || 0) ? p : max) : 
                null
        };
    }