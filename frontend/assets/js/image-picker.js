// Image Picker Component
class ImagePicker {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            allowUpload: options.allowUpload !== false,
            placeholder: options.placeholder || 'Select or upload image...',
            ...options
        };
        this.init();
    }

    async init() {
        // Create picker container
        const container = document.createElement('div');
        container.className = 'image-picker-container';
        container.style.cssText = 'position: relative; width: 100%;';

        // Create display input
        const display = document.createElement('input');
        display.type = 'text';
        display.placeholder = this.options.placeholder;
        display.readOnly = true;
        display.style.cssText = 'width: 100%; padding: 10px; background: var(--bg-dark); border: 1px solid var(--border-color); color: white; border-radius: 4px; cursor: pointer;';
        display.value = this.input.value || '';

        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'image-picker-dropdown';
        dropdown.style.cssText = 'display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; max-height: 400px; overflow-y: auto; z-index: 9999; margin-top: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';

        // Upload section
        if (this.options.allowUpload) {
            const uploadSection = document.createElement('div');
            uploadSection.style.cssText = 'padding: 15px; border-bottom: 1px solid var(--border-color);';
            uploadSection.innerHTML = `
                <label style="display: block; margin-bottom: 8px; color: var(--accent-gold); font-weight: bold;">📤 Upload New Image</label>
                <input type="file" accept="image/*" class="image-upload-input" style="width: 100%; padding: 8px; background: var(--bg-dark); border: 1px solid var(--border-color); color: white; border-radius: 4px;">
            `;
            dropdown.appendChild(uploadSection);

            const uploadInput = uploadSection.querySelector('.image-upload-input');
            uploadInput.addEventListener('change', (e) => this.handleUpload(e, display, dropdown));
        }

        // Images grid
        const imagesSection = document.createElement('div');
        imagesSection.style.cssText = 'padding: 15px;';
        imagesSection.innerHTML = '<p style="color: var(--text-secondary);">Loading images...</p>';
        dropdown.appendChild(imagesSection);

        // Assemble
        this.input.style.display = 'none';
        container.appendChild(display);
        container.appendChild(dropdown);
        this.input.parentNode.insertBefore(container, this.input);

        // Events
        display.addEventListener('click', () => {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            if (dropdown.style.display === 'block') {
                this.loadImages(imagesSection);
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        this.display = display;
        this.dropdown = dropdown;
    }

    async loadImages(container) {
        try {
            const res = await fetch('/api/uploads/list');
            const data = await res.json();

            if (data.success && data.data && data.data.length > 0) {
                const grid = document.createElement('div');
                grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px;';

                data.data.forEach(img => {
                    const item = document.createElement('div');
                    item.style.cssText = 'cursor: pointer; border: 2px solid transparent; border-radius: 4px; overflow: hidden; transition: border-color 0.2s;';
                    item.innerHTML = `<img src="${img.url}" alt="${img.filename}" style="width: 100%; height: 80px; object-fit: cover;">`;

                    item.addEventListener('mouseenter', () => item.style.borderColor = 'var(--accent-gold)');
                    item.addEventListener('mouseleave', () => item.style.borderColor = 'transparent');
                    item.addEventListener('click', () => this.selectImage(img.url));

                    grid.appendChild(item);
                });

                container.innerHTML = '<p style="color: var(--accent-gold); font-weight: bold; margin-bottom: 10px;">📁 Select from Image Manager</p>';
                container.appendChild(grid);
            } else {
                container.innerHTML = '<p style="color: var(--text-secondary);">No images available. Upload one above!</p>';
            }
        } catch (err) {
            container.innerHTML = '<p style="color: red;">Failed to load images.</p>';
        }
    }

    async handleUpload(e, display, dropdown) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/uploads', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success && data.url) {
                this.selectImage(data.url);
                dropdown.style.display = 'none';
            } else {
                alert('Upload failed: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Upload error: ' + err.message);
        }
    }

    selectImage(url) {
        this.input.value = url;
        this.display.value = url;
        this.dropdown.style.display = 'none';

        // Trigger change event
        const event = new Event('change', { bubbles: true });
        this.input.dispatchEvent(event);
    }
}

// Auto-initialize on image inputs
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[data-image-picker]').forEach(input => {
        new ImagePicker(input);
    });
});
