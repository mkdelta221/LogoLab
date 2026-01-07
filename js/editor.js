/**
 * LogoLab - Code Editor
 * Handles the code editor functionality including line numbers and basic features.
 */

class LogoEditor {
    constructor(textarea, lineNumbers) {
        this.textarea = textarea;
        this.lineNumbers = lineNumbers;
        this.syntaxHighlight = document.getElementById('syntax-highlight');
        this.onChange = null;

        // Logo keywords for syntax highlighting
        this.keywords = [
            'TO', 'END', 'REPEAT', 'IF', 'IFELSE', 'FOR', 'WHILE', 'STOP', 'OUTPUT', 'OP',
            'FORWARD', 'FD', 'BACK', 'BK', 'LEFT', 'LT', 'RIGHT', 'RT', 'HOME',
            'PENUP', 'PU', 'PENDOWN', 'PD', 'SETPENCOLOR', 'SETPC', 'SETPENSIZE',
            'PENERASE', 'PE', 'PENPAINT', 'PPT', 'SETBACKGROUND', 'SETBG',
            'CLEARSCREEN', 'CS', 'CLEAN', 'HIDETURTLE', 'HT', 'SHOWTURTLE', 'ST',
            'SETPOS', 'SETX', 'SETY', 'SETHEADING', 'SETH', 'WRAP', 'WINDOW', 'FENCE',
            'MAKE', 'LOCAL', 'THING', 'PRINT', 'SHOW', 'TYPE', 'WAIT',
            'TELL', 'ASK', 'WHO', 'TURTLES',
            'AND', 'OR', 'NOT', 'TRUE', 'FALSE',
            'FIRST', 'LAST', 'BUTFIRST', 'BF', 'BUTLAST', 'BL', 'COUNT', 'ITEM',
            'LIST', 'SENTENCE', 'SE', 'FPUT', 'LPUT', 'EMPTY?', 'LIST?', 'NUMBER?', 'WORD?', 'MEMBER?',
            'SQRT', 'SIN', 'COS', 'TAN', 'ARCTAN', 'ABS', 'INT', 'ROUND', 'RANDOM', 'POWER', 'REMAINDER', 'MODULO',
            'XCOR', 'YCOR', 'HEADING', 'POS', 'PENSIZE', 'PENCOLOR', 'PC', 'REPCOUNT'
        ];

        this.init();
    }

    init() {
        // Update line numbers and syntax highlighting on input
        this.textarea.addEventListener('input', () => {
            this.updateLineNumbers();
            this.updateSyntaxHighlight();
            if (this.onChange) {
                this.onChange(this.textarea.value);
            }
        });

        // Handle scroll sync
        this.textarea.addEventListener('scroll', () => {
            this.lineNumbers.scrollTop = this.textarea.scrollTop;
            if (this.syntaxHighlight) {
                this.syntaxHighlight.scrollTop = this.textarea.scrollTop;
                this.syntaxHighlight.scrollLeft = this.textarea.scrollLeft;
            }
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

        // Initial line numbers and syntax highlighting
        this.updateLineNumbers();
        this.updateSyntaxHighlight();
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

    updateSyntaxHighlight() {
        if (!this.syntaxHighlight) return;

        const code = this.textarea.value;
        let highlighted = this.escapeHtml(code);

        // Highlight comments first (;...)
        highlighted = highlighted.replace(/(;[^\n]*)/g, '<span class="token-comment">$1</span>');

        // Highlight strings ("word)
        highlighted = highlighted.replace(/(&quot;)(\w+)/g, '<span class="token-string">$1$2</span>');

        // Highlight variable references (:var)
        highlighted = highlighted.replace(/(:\w+)/g, '<span class="token-variable">$1</span>');

        // Highlight numbers
        highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>');

        // Highlight keywords (must be done carefully to avoid double-wrapping)
        const keywordPattern = new RegExp('\\b(' + this.keywords.join('|') + ')\\b', 'gi');
        highlighted = highlighted.replace(keywordPattern, (match) => {
            // Check if already inside a span
            return '<span class="token-keyword">' + match + '</span>';
        });

        // Highlight brackets
        highlighted = highlighted.replace(/(\[|\])/g, '<span class="token-bracket">$1</span>');

        // Note: We skip highlighting < and > as operators because they conflict with HTML tags
        // Logo uses <> for not-equals which is handled by the interpreter
        highlighted = highlighted.replace(/([+\-*/=])/g, '<span class="token-operator">$1</span>');

        this.syntaxHighlight.innerHTML = highlighted + '\n'; // Extra newline for scrolling
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getValue() {
        return this.textarea.value;
    }

    setValue(code) {
        this.textarea.value = code;
        this.updateLineNumbers();
        this.updateSyntaxHighlight();
    }

    clear() {
        this.setValue('');
    }

    focus() {
        this.textarea.focus();
    }

    // Highlight a specific line (for step-through debugging)
    highlightLine(lineNum) {
        // This is a visual indicator only - actual highlighting done via CSS
        this.currentHighlightLine = lineNum;
        // Could add a visual indicator here if needed
    }

    clearHighlight() {
        this.currentHighlightLine = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogoEditor;
}
