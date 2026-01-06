/**
 * LogoLab - Code Editor
 * Handles the code editor functionality including line numbers and basic features.
 */

class LogoEditor {
    constructor(textarea, lineNumbers) {
        this.textarea = textarea;
        this.lineNumbers = lineNumbers;
        this.onChange = null;

        this.init();
    }

    init() {
        // Update line numbers on input
        this.textarea.addEventListener('input', () => {
            this.updateLineNumbers();
            if (this.onChange) {
                this.onChange(this.textarea.value);
            }
        });

        // Handle scroll sync
        this.textarea.addEventListener('scroll', () => {
            this.lineNumbers.scrollTop = this.textarea.scrollTop;
        });

        // Handle tab key
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertAtCursor('  ');
            }

            // Auto-indent on Enter
            if (e.key === 'Enter') {
                const { value, selectionStart } = this.textarea;
                const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
                const line = value.slice(lineStart, selectionStart);
                const indent = line.match(/^\s*/)[0];

                // Extra indent after TO
                const trimmedLine = line.trim().toUpperCase();
                let extraIndent = '';
                if (trimmedLine.startsWith('TO ') ||
                    trimmedLine.endsWith('[') ||
                    trimmedLine === 'REPEAT' ||
                    trimmedLine === 'IF' ||
                    trimmedLine === 'IFELSE' ||
                    trimmedLine === 'FOR' ||
                    trimmedLine === 'WHILE') {
                    extraIndent = '  ';
                }

                e.preventDefault();
                this.insertAtCursor('\n' + indent + extraIndent);
            }
        });

        // Initial line numbers
        this.updateLineNumbers();
    }

    insertAtCursor(text) {
        const { selectionStart, selectionEnd, value } = this.textarea;
        this.textarea.value = value.slice(0, selectionStart) + text + value.slice(selectionEnd);
        this.textarea.selectionStart = this.textarea.selectionEnd = selectionStart + text.length;
        this.updateLineNumbers();
        this.textarea.focus();

        if (this.onChange) {
            this.onChange(this.textarea.value);
        }
    }

    updateLineNumbers() {
        const lines = this.textarea.value.split('\n');
        const numbers = lines.map((_, i) => i + 1).join('\n');
        this.lineNumbers.textContent = numbers;
    }

    getValue() {
        return this.textarea.value;
    }

    setValue(code) {
        this.textarea.value = code;
        this.updateLineNumbers();
    }

    clear() {
        this.setValue('');
    }

    focus() {
        this.textarea.focus();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogoEditor;
}
