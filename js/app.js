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

    rainbow: `; Draw a rainbow
TO ARC :radius :color
  SETPC :color
  SETPENSIZE 15
  REPEAT 90 [
    FD :radius * 3.14159 / 90
    RT 1
  ]
END

PU SETPOS [-200 -50] PD
SETH 0

ARC 100 "red
PU HOME SETPOS [-200 -50] SETH 0 PD
ARC 115 "orange
PU HOME SETPOS [-200 -50] SETH 0 PD
ARC 130 "yellow
PU HOME SETPOS [-200 -50] SETH 0 PD
ARC 145 "green
PU HOME SETPOS [-200 -50] SETH 0 PD
ARC 160 "blue
PU HOME SETPOS [-200 -50] SETH 0 PD
ARC 175 "purple

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
        this.fileInput = document.getElementById('file-input');

        // Modals
        this.helpModal = document.getElementById('help-modal');
        this.examplesModal = document.getElementById('examples-modal');

        // Initialize components
        this.turtle = new TurtleGraphics(this.canvas);
        this.interpreter = new LogoInterpreter(this.turtle);
        this.editor = new LogoEditor(this.codeEditor, this.lineNumbers);
        this.storage = new StorageManager();

        // Set up event handlers
        this.setupEventHandlers();

        // Load auto-saved code
        this.loadAutoSave();

        // Handle window resize
        window.addEventListener('resize', () => this.turtle.resize());
    }

    setupEventHandlers() {
        // Run button
        this.btnRun.addEventListener('click', () => this.run());

        // Stop button
        this.btnStop.addEventListener('click', () => this.stop());

        // Clear canvas button
        this.btnClear.addEventListener('click', () => {
            this.turtle.clearScreen();
            this.interpreter.reset();
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

        // Help tabs
        document.querySelectorAll('.help-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.help-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.help-section').forEach(s => s.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`help-${tab.dataset.tab}`).classList.add('active');
            });
        });

        // Close modals on backdrop click
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) this.hideHelp();
        });
        this.examplesModal.addEventListener('click', (e) => {
            if (e.target === this.examplesModal) this.hideExamples();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter to run
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.run();
            }
            // Escape to stop or close modals
            if (e.key === 'Escape') {
                if (!this.helpModal.classList.contains('hidden')) {
                    this.hideHelp();
                } else if (!this.examplesModal.classList.contains('hidden')) {
                    this.hideExamples();
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
        }
    }

    stop() {
        this.interpreter.stop();
        this.btnRun.disabled = false;
        this.btnStop.disabled = true;
        this.appendOutput('Stopped.\n', false, 'info');
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

    newProject() {
        if (this.editor.getValue().trim() && !confirm('Clear current code and start a new project?')) {
            return;
        }
        this.editor.clear();
        this.turtle.reset();
        this.interpreter.reset();
        this.clearOutput();
        this.storage.clearAutoSave();
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
