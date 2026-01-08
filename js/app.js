/**
 * LogoLab - Main Application
 * Ties together all components and handles UI interactions.
 */

// Example programs
const EXAMPLES = {
    square: `; Draw a square
REPEAT 4 [
  FD 100
  RT 90
]`,

    star: `; Draw a 5-pointed star
SETPC "gold
REPEAT 5 [
  FD 150
  RT 144
]`,

    spiral: `; Draw a colorful spiral
TO SPIRAL :size :angle
  IF :size > 200 [STOP]
  FD :size
  RT :angle
  SPIRAL :size + 2 :angle
END

SETPC "blue
SPIRAL 1 91`,

    flower: `; Draw a flower pattern
TO PETAL
  REPEAT 2 [
    REPEAT 30 [FD 3 RT 3]
    RT 90
  ]
END

TO FLOWER :petals
  REPEAT :petals [
    PETAL
    RT 360 / :petals
  ]
END

SETPC "red
FLOWER 12`,

    tree: `; Draw a recursive fractal tree
TO TREE :size
  IF :size < 5 [STOP]
  FD :size
  LT 30
  TREE :size * 0.7
  RT 60
  TREE :size * 0.7
  LT 30
  BK :size
END

PU SETY -100 PD
SETPC "green
TREE 80`,

    polygon: `; Define and use a polygon procedure
TO POLYGON :sides :size
  REPEAT :sides [
    FD :size
    RT 360 / :sides
  ]
END

; Draw different polygons
SETPC "red
POLYGON 3 80
PU RT 90 FD 120 LT 90 PD

SETPC "blue
POLYGON 5 60
PU RT 90 FD 120 LT 90 PD

SETPC "green
POLYGON 6 50`,

    rainbow: `; Draw a rainbow with colored stripes
SETPENSIZE 10

; Red stripe
SETPC "red
PU SETPOS [-150 50] SETH 90 PD
FD 300

; Orange stripe
SETPC "orange
PU SETPOS [-150 30] SETH 90 PD
FD 300

; Yellow stripe
SETPC "yellow
PU SETPOS [-150 10] SETH 90 PD
FD 300

; Green stripe
SETPC "green
PU SETPOS [-150 -10] SETH 90 PD
FD 300

; Blue stripe
SETPC "blue
PU SETPOS [-150 -30] SETH 90 PD
FD 300

; Purple stripe
SETPC "purple
PU SETPOS [-150 -50] SETH 90 PD
FD 300

SETPENSIZE 1
HT`,

    sierpinski: `; Draw a Sierpinski triangle fractal
TO TRIANGLE :size
  REPEAT 3 [
    FD :size
    RT 120
  ]
END

TO SIERPINSKI :size :level
  IF :level = 0 [
    TRIANGLE :size
    STOP
  ]
  SIERPINSKI :size / 2 :level - 1
  FD :size / 2
  SIERPINSKI :size / 2 :level - 1
  BK :size / 2
  RT 60
  FD :size / 2
  LT 60
  SIERPINSKI :size / 2 :level - 1
  RT 60
  BK :size / 2
  LT 60
END

PU SETPOS [-150 -100] PD
SETPC "purple
SIERPINSKI 300 4
HT`
};

class LogoLabApp {
    constructor() {
        // Get DOM elements
        this.canvas = document.getElementById('turtle-canvas');
        this.codeEditor = document.getElementById('code-editor');
        this.lineNumbers = document.getElementById('line-numbers');
        this.outputConsole = document.getElementById('output-console');
        this.coordinates = document.getElementById('coordinates');

        // Buttons
        this.btnRun = document.getElementById('btn-run');
        this.btnStep = document.getElementById('btn-step');
        this.btnStop = document.getElementById('btn-stop');
        this.btnClear = document.getElementById('btn-clear');
        this.btnHelp = document.getElementById('btn-help');
        this.btnExamples = document.getElementById('btn-examples');
        this.btnNew = document.getElementById('btn-new');
        this.btnSave = document.getElementById('btn-save');
        this.btnLoad = document.getElementById('btn-load');
        this.btnClearOutput = document.getElementById('btn-clear-output');
        this.btnZoomIn = document.getElementById('btn-zoom-in');
        this.btnZoomOut = document.getElementById('btn-zoom-out');
        this.btnResetView = document.getElementById('btn-reset-view');
        this.btnDownload = document.getElementById('btn-download');
        this.btnShare = document.getElementById('btn-share');
        this.btnLearn = document.getElementById('btn-learn');
        this.btnTheme = document.getElementById('btn-theme');
        this.btnToggleVars = document.getElementById('btn-toggle-vars');
        this.fileInput = document.getElementById('file-input');

        // Speed selector
        this.speedSelect = document.getElementById('speed-select');

        // Modals
        this.helpModal = document.getElementById('help-modal');
        this.examplesModal = document.getElementById('examples-modal');
        this.tutorialsModal = document.getElementById('tutorials-modal');
        this.shareModal = document.getElementById('share-modal');

        // Theme
        this.themeIcon = document.getElementById('theme-icon');
        this.currentTheme = localStorage.getItem('logolab-theme') || 'dark';

        // Variables panel
        this.variablesPanel = document.getElementById('variables-panel');
        this.variablesContent = document.getElementById('variables-content');

        // Initialize components
        this.turtle = new TurtleGraphics(this.canvas);
        this.interpreter = new LogoInterpreter(this.turtle);
        this.editor = new LogoEditor(this.codeEditor, this.lineNumbers);
        this.storage = new StorageManager();
        this.tutorialManager = new TutorialManager();

        // Set up event handlers
        this.setupEventHandlers();

        // Apply theme
        this.applyTheme();

        // Load code from URL or auto-save
        this.loadInitialCode();

        // Handle window resize
        window.addEventListener('resize', () => this.turtle.resize());
    }

    setupEventHandlers() {
        // Run button
        this.btnRun.addEventListener('click', () => this.run());

        // Step button
        if (this.btnStep) {
            this.btnStep.addEventListener('click', () => this.step());
        }

        // Stop button
        this.btnStop.addEventListener('click', () => this.stop());

        // Clear button - clears canvas, code, and resets everything
        this.btnClear.addEventListener('click', () => {
            // Stop any running program first
            this.stop();
            this.editor.clear();
            this.turtle.clearScreen();
            this.interpreter.reset();
            this.clearOutput();
            this.updateVariablesPanel();
        });

        // Help button
        this.btnHelp.addEventListener('click', () => this.showHelp());
        document.getElementById('btn-close-help').addEventListener('click', () => this.hideHelp());

        // Examples button
        this.btnExamples.addEventListener('click', () => this.showExamples());
        document.getElementById('btn-close-examples').addEventListener('click', () => this.hideExamples());

        // Example items
        document.querySelectorAll('.example-item').forEach(item => {
            item.addEventListener('click', () => {
                const example = item.dataset.example;
                if (EXAMPLES[example]) {
                    // Stop any running program first
                    this.stop();
                    // Clear canvas and reset interpreter before loading new example
                    this.turtle.clearScreen();
                    this.interpreter.reset();
                    this.clearOutput();
                    this.updateVariablesPanel();
                    // Now load the new example
                    this.editor.setValue(EXAMPLES[example]);
                    this.hideExamples();
                }
            });
        });

        // New button
        this.btnNew.addEventListener('click', () => this.newProject());

        // Save button
        this.btnSave.addEventListener('click', () => this.saveProject());

        // Load button
        this.btnLoad.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.loadProject(e));

        // Clear output button
        this.btnClearOutput.addEventListener('click', () => this.clearOutput());

        // Zoom buttons
        this.btnZoomIn.addEventListener('click', () => this.turtle.zoomIn());
        this.btnZoomOut.addEventListener('click', () => this.turtle.zoomOut());
        this.btnResetView.addEventListener('click', () => this.turtle.resetView());

        // Download image button
        if (this.btnDownload) {
            this.btnDownload.addEventListener('click', () => this.downloadImage());
        }

        // Share button
        if (this.btnShare) {
            this.btnShare.addEventListener('click', () => this.showShareModal());
        }

        // Learn/Tutorials button
        if (this.btnLearn) {
            this.btnLearn.addEventListener('click', () => this.showTutorials());
        }

        // Theme toggle button
        if (this.btnTheme) {
            this.btnTheme.addEventListener('click', () => this.toggleTheme());
        }

        // Variables panel toggle
        if (this.btnToggleVars) {
            this.btnToggleVars.addEventListener('click', () => this.toggleVariablesPanel());
        }

        // Speed selector
        if (this.speedSelect) {
            this.speedSelect.addEventListener('change', () => {
                this.interpreter.executionSpeed = parseInt(this.speedSelect.value);
            });
            // Set initial speed
            this.interpreter.executionSpeed = parseInt(this.speedSelect.value);
        }

        // Help tabs
        document.querySelectorAll('.help-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.help-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.help-section').forEach(s => s.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`help-${tab.dataset.tab}`).classList.add('active');
            });
        });

        // Tutorials modal
        if (this.tutorialsModal) {
            document.getElementById('btn-close-tutorials')?.addEventListener('click', () => this.hideTutorials());

            // Tutorial lesson items
            document.querySelectorAll('.tutorial-item').forEach(item => {
                item.addEventListener('click', () => {
                    const lesson = parseInt(item.dataset.lesson);
                    this.loadTutorialLesson(lesson);
                    document.querySelectorAll('.tutorial-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                });
            });
        }

        // Share modal
        if (this.shareModal) {
            document.getElementById('btn-close-share')?.addEventListener('click', () => this.hideShareModal());
            document.getElementById('btn-copy-url')?.addEventListener('click', () => this.copyShareUrl());
        }

        // Close modals on backdrop click
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) this.hideHelp();
        });
        this.examplesModal.addEventListener('click', (e) => {
            if (e.target === this.examplesModal) this.hideExamples();
        });
        if (this.tutorialsModal) {
            this.tutorialsModal.addEventListener('click', (e) => {
                if (e.target === this.tutorialsModal) this.hideTutorials();
            });
        }
        if (this.shareModal) {
            this.shareModal.addEventListener('click', (e) => {
                if (e.target === this.shareModal) this.hideShareModal();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter to run
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.run();
            }
            // Ctrl+S to save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveProject();
            }
            // F10 to step
            if (e.key === 'F10') {
                e.preventDefault();
                this.step();
            }
            // F1 for help
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelp();
            }
            // Escape to stop or close modals
            if (e.key === 'Escape') {
                if (!this.helpModal.classList.contains('hidden')) {
                    this.hideHelp();
                } else if (!this.examplesModal.classList.contains('hidden')) {
                    this.hideExamples();
                } else if (this.tutorialsModal && !this.tutorialsModal.classList.contains('hidden')) {
                    this.hideTutorials();
                } else if (this.shareModal && !this.shareModal.classList.contains('hidden')) {
                    this.hideShareModal();
                } else {
                    this.stop();
                }
            }
        });

        // Canvas mouse move for coordinates
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const coords = this.turtle.getCoordinates(x, y);
            this.coordinates.textContent = `X: ${coords.x}, Y: ${coords.y}`;
        });

        // Touch support for mobile devices
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const coords = this.turtle.getCoordinates(x, y);
            this.coordinates.textContent = `X: ${coords.x}, Y: ${coords.y}`;
        }, { passive: false });

        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const coords = this.turtle.getCoordinates(x, y);
            this.coordinates.textContent = `X: ${coords.x}, Y: ${coords.y}`;
        }, { passive: true });

        // Auto-save on code change
        this.editor.onChange = (code) => {
            this.storage.autoSave(code);
        };

        // Interpreter output handlers
        this.interpreter.onOutput = (text, type) => {
            if (type === 'inline') {
                this.appendOutput(text, false);
            } else {
                this.appendOutput(text + '\n', false);
            }
        };

        this.interpreter.onError = (text) => {
            this.appendOutput('Error: ' + text + '\n', true);
        };
    }

    loadInitialCode() {
        // Check URL for shared code first
        const urlCode = this.loadFromUrl();
        if (urlCode) {
            this.editor.setValue(urlCode);
            this.appendOutput('Loaded shared code from URL\n', false, 'info');
            // Clear the URL hash to avoid confusion
            history.replaceState(null, '', window.location.pathname);
            return;
        }

        // Otherwise load auto-saved code
        this.loadAutoSave();
    }

    async run() {
        const code = this.editor.getValue();
        if (!code.trim()) {
            this.appendOutput('No code to run\n', true);
            return;
        }

        this.btnRun.disabled = true;
        this.btnStop.disabled = false;
        this.clearOutput();
        this.appendOutput('Running...\n', false, 'info');

        try {
            await this.interpreter.execute(code);
            this.appendOutput('Done.\n', false, 'info');
        } catch (e) {
            if (e.type !== 'STOP' && e.type !== 'OUTPUT') {
                this.appendOutput('Error: ' + e.message + '\n', true);
            }
        } finally {
            this.btnRun.disabled = false;
            this.btnStop.disabled = true;
            this.updateVariablesPanel();
        }
    }

    async step() {
        // Step-through debugging - simplified version
        // For full step-through, would need to modify interpreter more extensively
        this.appendOutput('Step mode: Running one command...\n', false, 'info');
        // For now, just run with slow speed
        const oldSpeed = this.interpreter.executionSpeed;
        this.interpreter.executionSpeed = 500;
        await this.run();
        this.interpreter.executionSpeed = oldSpeed;
    }

    stop() {
        const wasRunning = this.interpreter.running;
        this.interpreter.stop();
        this.btnRun.disabled = false;
        this.btnStop.disabled = true;
        // Only show "Stopped" message if something was actually running
        if (wasRunning) {
            this.appendOutput('Stopped.\n', false, 'info');
        }
    }

    appendOutput(text, isError = false, className = '') {
        const span = document.createElement('span');
        span.className = 'output-line';
        if (isError) span.classList.add('output-error');
        if (className) span.classList.add(`output-${className}`);
        span.textContent = text;
        this.outputConsole.appendChild(span);
        this.outputConsole.scrollTop = this.outputConsole.scrollHeight;
    }

    clearOutput() {
        this.outputConsole.innerHTML = '';
    }

    showHelp() {
        this.helpModal.classList.remove('hidden');
    }

    hideHelp() {
        this.helpModal.classList.add('hidden');
    }

    showExamples() {
        this.examplesModal.classList.remove('hidden');
    }

    hideExamples() {
        this.examplesModal.classList.add('hidden');
    }

    showTutorials() {
        if (this.tutorialsModal) {
            this.tutorialsModal.classList.remove('hidden');
            this.loadTutorialLesson(1);
        }
    }

    hideTutorials() {
        if (this.tutorialsModal) {
            this.tutorialsModal.classList.add('hidden');
        }
    }

    loadTutorialLesson(lessonNum) {
        const content = document.getElementById('tutorial-content');
        if (content && this.tutorialManager) {
            content.innerHTML = this.tutorialManager.getLessonContent(lessonNum);

            // Add click handlers for "Try It" buttons
            content.querySelectorAll('.try-code').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Stop any running program and reset before loading tutorial code
                    this.stop();
                    this.turtle.clearScreen();
                    this.interpreter.reset();
                    this.clearOutput();
                    this.updateVariablesPanel();
                    // Now load the tutorial code
                    const code = btn.dataset.code.replace(/\\n/g, '\n');
                    this.editor.setValue(code);
                    this.hideTutorials();
                });
            });
        }
    }

    showShareModal() {
        if (this.shareModal) {
            const code = this.editor.getValue();
            const shareUrl = this.generateShareUrl(code);
            document.getElementById('share-url').value = shareUrl;
            this.shareModal.classList.remove('hidden');
        }
    }

    hideShareModal() {
        if (this.shareModal) {
            this.shareModal.classList.add('hidden');
        }
    }

    generateShareUrl(code) {
        if (typeof LZString !== 'undefined') {
            const compressed = LZString.compressToEncodedURIComponent(code);
            return `${window.location.origin}${window.location.pathname}#code=${compressed}`;
        }
        // Fallback to base64 if LZString not available
        const encoded = btoa(encodeURIComponent(code));
        return `${window.location.origin}${window.location.pathname}#code64=${encoded}`;
    }

    loadFromUrl() {
        const hash = window.location.hash;
        if (!hash) return null;

        if (hash.startsWith('#code=')) {
            const compressed = hash.substring(6);
            if (typeof LZString !== 'undefined') {
                return LZString.decompressFromEncodedURIComponent(compressed);
            }
        } else if (hash.startsWith('#code64=')) {
            const encoded = hash.substring(8);
            try {
                return decodeURIComponent(atob(encoded));
            } catch (e) {
                console.warn('Failed to decode URL code:', e);
            }
        }
        return null;
    }

    copyShareUrl() {
        const urlInput = document.getElementById('share-url');
        urlInput.select();
        document.execCommand('copy');

        // Show feedback
        const btn = document.getElementById('btn-copy-url');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }

    downloadImage() {
        this.turtle.downloadImage('logolab-drawing');
        this.appendOutput('Image downloaded!\n', false, 'info');
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('logolab-theme', this.currentTheme);
        this.applyTheme();
    }

    applyTheme() {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${this.currentTheme}-theme`);

        if (this.themeIcon) {
            this.themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    toggleVariablesPanel() {
        if (this.variablesPanel) {
            this.variablesPanel.classList.toggle('collapsed');
            const btn = this.btnToggleVars;
            if (btn) {
                btn.textContent = this.variablesPanel.classList.contains('collapsed') ? '▼' : '▲';
            }
        }
    }

    updateVariablesPanel() {
        if (!this.variablesContent) return;

        const vars = this.interpreter.globalVariables;
        const procs = this.interpreter.procedures;

        let html = '';

        // Show variables
        const varNames = Object.keys(vars);
        if (varNames.length > 0) {
            html += '<div class="var-section"><strong>Variables:</strong></div>';
            for (const name of varNames) {
                const value = vars[name];
                const displayValue = Array.isArray(value) ? `[${value.join(' ')}]` : value;
                html += `<div class="var-item"><span class="var-name">:${name}</span> = <span class="var-value">${displayValue}</span></div>`;
            }
        }

        // Show procedures
        const procNames = Object.keys(procs);
        if (procNames.length > 0) {
            html += '<div class="var-section"><strong>Procedures:</strong></div>';
            for (const name of procNames) {
                const proc = procs[name];
                const params = proc.params.map(p => ':' + p).join(' ');
                html += `<div class="var-item"><span class="var-name">TO ${name}</span> ${params}</div>`;
            }
        }

        if (html === '') {
            html = '<div class="var-empty">No variables or procedures defined yet.</div>';
        }

        this.variablesContent.innerHTML = html;
    }

    newProject() {
        if (this.editor.getValue().trim() && !confirm('Clear current code and start a new project?')) {
            return;
        }
        this.editor.clear();
        this.turtle.reset();
        this.interpreter.reset();
        this.clearOutput();
        this.storage.clearAutoSave();
        this.updateVariablesPanel();
    }

    saveProject() {
        const code = this.editor.getValue();
        if (!code.trim()) {
            this.appendOutput('Nothing to save\n', true);
            return;
        }

        const filename = prompt('Enter filename:', 'my-logo-project');
        if (filename) {
            this.storage.saveToFile(code, filename);
            this.storage.addToRecent(filename, code);
            this.appendOutput(`Saved as ${filename}.logo\n`, false, 'info');
        }
    }

    async loadProject(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const project = await this.storage.loadFromFile(file);
            this.editor.setValue(project.code);
            this.turtle.reset();
            this.interpreter.reset();
            this.clearOutput();
            this.appendOutput(`Loaded: ${project.name}\n`, false, 'info');
            this.updateVariablesPanel();
        } catch (e) {
            this.appendOutput('Error loading file: ' + e.message + '\n', true);
        }

        // Reset file input
        event.target.value = '';
    }

    loadAutoSave() {
        const saved = this.storage.loadAutoSave();
        if (saved && saved.code) {
            this.editor.setValue(saved.code);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LogoLabApp();
});
