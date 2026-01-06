/**
 * LogoLab - Storage Manager
 * Handles saving and loading projects locally.
 */

class StorageManager {
    constructor() {
        this.storageKey = 'logolab_projects';
        this.autoSaveKey = 'logolab_autosave';
    }

    // Auto-save current code to localStorage
    autoSave(code) {
        try {
            localStorage.setItem(this.autoSaveKey, JSON.stringify({
                code,
                timestamp: new Date().toISOString()
            }));
        } catch (e) {
            console.warn('Auto-save failed:', e);
        }
    }

    // Load auto-saved code
    loadAutoSave() {
        try {
            const data = localStorage.getItem(this.autoSaveKey);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('Load auto-save failed:', e);
        }
        return null;
    }

    // Clear auto-save
    clearAutoSave() {
        localStorage.removeItem(this.autoSaveKey);
    }

    // Save project to file download
    saveToFile(code, filename = 'untitled') {
        const project = {
            name: filename,
            code: code,
            created: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.logo`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    }

    // Load project from file
    loadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target.result;

                    // Try to parse as JSON first
                    try {
                        const project = JSON.parse(content);
                        if (project.code) {
                            resolve({
                                name: project.name || file.name,
                                code: project.code
                            });
                            return;
                        }
                    } catch (jsonError) {
                        // Not JSON, treat as plain text Logo code
                    }

                    // Plain text Logo code
                    resolve({
                        name: file.name.replace(/\.[^/.]+$/, ''),
                        code: content
                    });

                } catch (error) {
                    reject(new Error('Failed to parse file'));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    // Save recent project to localStorage
    addToRecent(name, code) {
        try {
            const recent = this.getRecentProjects();

            // Remove if already exists
            const index = recent.findIndex(p => p.name === name);
            if (index > -1) {
                recent.splice(index, 1);
            }

            // Add to front
            recent.unshift({
                name,
                code,
                timestamp: new Date().toISOString()
            });

            // Keep only last 10
            if (recent.length > 10) {
                recent.pop();
            }

            localStorage.setItem(this.storageKey, JSON.stringify(recent));
        } catch (e) {
            console.warn('Save to recent failed:', e);
        }
    }

    // Get recent projects from localStorage
    getRecentProjects() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('Load recent projects failed:', e);
        }
        return [];
    }

    // Clear all stored data
    clearAll() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.autoSaveKey);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
