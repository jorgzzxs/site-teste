// ============================================
// SISTEMA DE UPLOAD DE IMAGENS - TemplateShop
// ============================================

class ImageUploadSystem {
    constructor() {
        this.maxSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        this.init();
    }
    
    init() {
        // Configurar drag and drop global
        this.setupGlobalDragDrop();
    }
    
    setupGlobalDragDrop() {
        // Prevenir comportamento padrão do navegador
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, this.preventDefaults, false);
        });
        
        // Destacar área de drop quando arrastar sobre
        ['dragenter', 'dragover'].forEach(eventName => {
            document.addEventListener(eventName, this.highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, this.unhighlight, false);
        });
        
        // Manipular drop
        document.addEventListener('drop', this.handleDrop.bind(this), false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    highlight() {
        // Adicionar classe de highlight ao body
        document.body.classList.add('dragover');
        
        // Adicionar overlay visual
        if (!document.getElementById('dropOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'dropOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(79, 70, 229, 0.1);
                border: 4px dashed #4f46e5;
                z-index: 9998;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
            `;
            
            const message = document.createElement('div');
            message.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                font-size: 1.2rem;
                color: #4f46e5;
            `;
            message.innerHTML = `
                <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>Solte a imagem para fazer upload</p>
            `;
            
            overlay.appendChild(message);
            document.body.appendChild(overlay);
        }
    }
    
    unhighlight() {
        document.body.classList.remove('dragover');
        
        const overlay = document.getElementById('dropOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    async handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length === 0) return;
        
        const file = files[0];
        
        // Verificar se é imagem
        if (!file.type.startsWith('image/')) {
            this.showError('Por favor, solte apenas arquivos de imagem!');
            return;
        }
        
        // Verificar tipo
        if (!this.allowedTypes.includes(file.type)) {
            this.showError(`Tipo de arquivo não permitido. Tipos permitidos: ${this.allowedTypes.join(', ')}`);
            return;
        }
        
        // Verificar tamanho
        if (file.size > this.maxSize) {
            this.showError(`Arquivo muito grande. Tamanho máximo: ${this.formatBytes(this.maxSize)}`);
            return;
        }
        
        try {
            // Converter para base64
            const base64 = await this.fileToBase64(file);
            
            // Verificar se estamos em um contexto de upload
            if (window.admin && document.activeElement && document.activeElement.id === 'productImageBase64') {
                // Estamos no formulário de produto
                document.getElementById('productImageBase64').value = base64;
                const imagePreview = document.getElementById('imagePreview');
                if (imagePreview) {
                    imagePreview.innerHTML = `<img src="${base64}" alt="Preview" style="width:100%;height:100%;object-fit:cover;">`;
                }
                this.showSuccess('Imagem carregada com sucesso!');
            } else {
                // Oferecer para copiar base64
                this.offerBase64Copy(base64, file.name);
            }
            
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            this.showError('Erro ao processar a imagem. Tente novamente.');
        }
    }
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    offerBase64Copy(base64, filename) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 600px;
            width: 100%;
            text-align: center;
        `;
        
        content.innerHTML = `
            <h3 style="margin-bottom: 15px; color: #1a202c;">
                <i class="fas fa-image"></i> Imagem Carregada
            </h3>
            <p style="color: #6b7280; margin-bottom: 20px;">
                ${filename} (${this.formatBytes(base64.length * 0.75)})
            </p>
            
            <div style="margin: 20px 0;">
                <img src="${base64}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 25px;">
                <button id="copyBase64Btn" style="padding: 12px 25px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-copy"></i> Copiar Base64
                </button>
                <button id="closeUploadModal" style="padding: 12px 25px; background: #e5e7eb; color: #1a202c; border: none; border-radius: 8px; cursor: pointer;">
                    Fechar
                </button>
            </div>
            
            <p style="color: #9ca3af; font-size: 0.8rem; margin-top: 20px;">
                O base64 foi copiado para uso em formulários de produtos.
            </p>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Configurar botões
        document.getElementById('copyBase64Btn').addEventListener('click', () => {
            navigator.clipboard.writeText(base64).then(() => {
                this.showSuccess('Base64 copiado para a área de transferência!');
                modal.remove();
            }).catch(err => {
                console.error('Erro ao copiar:', err);
                this.showError('Erro ao copiar. Tente novamente.');
            });
        });
        
        document.getElementById('closeUploadModal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showNotification(message, type = 'success') {
        // Usar o sistema de notificação existente se disponível
        if (window.admin && window.admin.showNotification) {
            window.admin.showNotification(message, type);
            return;
        }
        
        // Criar notificação básica
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Método para upload direto em input file
    setupFileInput(inputId, previewId) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        
        if (!input || !preview) return;
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            this.processImageFile(file, preview);
        });
    }
    
    async processImageFile(file, previewElement) {
        try {
            const base64 = await this.fileToBase64(file);
            
            // Atualizar preview
            previewElement.innerHTML = `
                <img src="${base64}" alt="Preview" style="width:100%;height:100%;object-fit:cover;">
            `;
            
            return base64;
            
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            this.showError('Erro ao processar a imagem');
            return null;
        }
    }
    
    // Método para converter URL em base64
    async urlToBase64(url) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return await this.fileToBase64(blob);
        } catch (error) {
            console.error('Erro ao converter URL:', error);
            throw error;
        }
    }
    
    // Método para validar base64
    isValidBase64(str) {
        try {
            return btoa(atob(str)) === str;
        } catch (err) {
            return false;
        }
    }
    
    // Método para comprimir imagem
    async compressImage(base64, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Redimensionar se necessário
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Comprimir
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            
            img.onerror = reject;
        });
    }
}

// Inicializar sistema de upload
document.addEventListener('DOMContentLoaded', () => {
    window.imageUpload = new ImageUploadSystem();
    
    // Adicionar estilos CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        body.dragover {
            cursor: copy;
        }
        
        .image-drop-zone {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            background: #f9fafb;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .image-drop-zone:hover {
            border-color: #4f46e5;
            background: rgba(79, 70, 229, 0.05);
        }
        
        .image-drop-zone.dragover {
            border-color: #4f46e5;
            background: rgba(79, 70, 229, 0.1);
            transform: scale(1.02);
        }
        
        .image-preview {
            width: 100%;
            height: 200px;
            border-radius: 8px;
            overflow: hidden;
            background: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            position: relative;
        }
        
        .image-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .image-preview .remove-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(239, 68, 68, 0.9);
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .image-preview .remove-btn:hover {
            background: #dc2626;
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);
});