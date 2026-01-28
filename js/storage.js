/**
 * LogoLab - Storage Manager
 * Handles saving and loading projects locally.
 */

class StorageManager {
    constructor() {
        this.storageKey = 'logolab_projects';
        this.autoSaveKey = 'logolab_autosave';
        this.libraryKey = 'logolab_library';
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

    // ============== PROCEDURE LIBRARY ==============

    // Get all library procedures (built-in + user saved)
    getLibrary() {
        try {
            const stored = localStorage.getItem(this.libraryKey);
            if (stored) {
                const userLibrary = JSON.parse(stored);
                // Merge with built-in procedures (built-ins always fresh)
                return { ...this.getBuiltinProcedures(), ...userLibrary };
            }
        } catch (e) {
            console.warn('Load library failed:', e);
        }
        return this.getBuiltinProcedures();
    }

    // Save a procedure to the library
    saveToLibrary(proc) {
        try {
            // Get only user procedures (not built-ins)
            const stored = localStorage.getItem(this.libraryKey);
            const userLibrary = stored ? JSON.parse(stored) : {};

            userLibrary[proc.name.toUpperCase()] = {
                name: proc.name.toUpperCase(),
                code: proc.code,
                description: proc.description || 'User-defined procedure',
                category: proc.category || 'my',
                builtin: false,
                created: Date.now()
            };

            localStorage.setItem(this.libraryKey, JSON.stringify(userLibrary));
            return true;
        } catch (e) {
            console.warn('Save to library failed:', e);
            return false;
        }
    }

    // Remove a procedure from the library
    removeFromLibrary(name) {
        try {
            const stored = localStorage.getItem(this.libraryKey);
            if (stored) {
                const userLibrary = JSON.parse(stored);
                const upperName = name.toUpperCase();
                if (userLibrary[upperName] && !userLibrary[upperName].builtin) {
                    delete userLibrary[upperName];
                    localStorage.setItem(this.libraryKey, JSON.stringify(userLibrary));
                    return true;
                }
            }
        } catch (e) {
            console.warn('Remove from library failed:', e);
        }
        return false;
    }

    // Built-in procedures that come pre-loaded
    getBuiltinProcedures() {
        return {
            'SQUARE': {
                name: 'SQUARE',
                code: 'TO SQUARE :size\n  REPEAT 4 [FD :size RT 90]\nEND',
                description: 'Draw a square of given size',
                category: 'shapes',
                builtin: true
            },
            'TRIANGLE': {
                name: 'TRIANGLE',
                code: 'TO TRIANGLE :size\n  REPEAT 3 [FD :size RT 120]\nEND',
                description: 'Draw an equilateral triangle',
                category: 'shapes',
                builtin: true
            },
            'POLYGON': {
                name: 'POLYGON',
                code: 'TO POLYGON :sides :size\n  REPEAT :sides [FD :size RT 360 / :sides]\nEND',
                description: 'Draw any regular polygon',
                category: 'shapes',
                builtin: true
            },
            'STAR': {
                name: 'STAR',
                code: 'TO STAR :size\n  REPEAT 5 [FD :size RT 144]\nEND',
                description: 'Draw a 5-pointed star',
                category: 'shapes',
                builtin: true
            },
            'HEXAGON': {
                name: 'HEXAGON',
                code: 'TO HEXAGON :size\n  REPEAT 6 [FD :size RT 60]\nEND',
                description: 'Draw a hexagon',
                category: 'shapes',
                builtin: true
            },
            'SPIRAL': {
                name: 'SPIRAL',
                code: 'TO SPIRAL :size\n  IF :size > 200 [STOP]\n  FD :size RT 91\n  SPIRAL :size + 2\nEND',
                description: 'Recursive spiral pattern',
                category: 'patterns',
                builtin: true
            },
            'SQUIRAL': {
                name: 'SQUIRAL',
                code: 'TO SQUIRAL :size :angle\n  IF :size > 200 [STOP]\n  FD :size RT :angle\n  SQUIRAL :size + 3 :angle\nEND',
                description: 'Square spiral with custom angle',
                category: 'patterns',
                builtin: true
            },
            'FLOWER': {
                name: 'FLOWER',
                code: 'TO FLOWER :petals :size\n  REPEAT :petals [\n    REPEAT 2 [FD :size RT 60 FD :size RT 120]\n    RT 360 / :petals\n  ]\nEND',
                description: 'Draw a flower with given petals',
                category: 'patterns',
                builtin: true
            },
            'TREE': {
                name: 'TREE',
                code: 'TO TREE :size\n  IF :size < 5 [STOP]\n  FD :size\n  LT 30 TREE :size * 0.7\n  RT 60 TREE :size * 0.7\n  LT 30\n  BK :size\nEND',
                description: 'Recursive fractal tree',
                category: 'patterns',
                builtin: true
            },
            'RANDOMCOLOR': {
                name: 'RANDOMCOLOR',
                code: 'TO RANDOMCOLOR\n  OUTPUT (LIST RANDOM 256 RANDOM 256 RANDOM 256)\nEND',
                description: 'Returns a random RGB color',
                category: 'colors',
                builtin: true
            },
            'RAINBOW': {
                name: 'RAINBOW',
                code: 'TO RAINBOW :n\n  ; Sets pen to rainbow color based on n (0-360)\n  LOCAL "r LOCAL "g LOCAL "b\n  MAKE "r 128 + 127 * SIN :n\n  MAKE "g 128 + 127 * SIN :n + 120\n  MAKE "b 128 + 127 * SIN :n + 240\n  SETPC (LIST INT :r INT :g INT :b)\nEND',
                description: 'Set pen color based on angle (0-360)',
                category: 'colors',
                builtin: true
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
