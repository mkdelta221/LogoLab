/**
 * LogoLab - Logo Language Interpreter
 * A full-featured Logo interpreter supporting procedures, variables, lists, and more.
 */

class LogoInterpreter {
    constructor(turtle) {
        this.turtle = turtle;
        this.procedures = {};
        this.globalVariables = {};
        this.localScopes = [];
        this.output = [];
        this.running = false;
        this.stopRequested = false;
        this.onOutput = null;
        this.onError = null;
        this.executionSpeed = 0; // ms delay between commands (0 = instant)

        // Built-in colors
        this.colors = {
            'black': [0, 0, 0],
            'white': [255, 255, 255],
            'red': [255, 0, 0],
            'green': [0, 128, 0],
            'blue': [0, 0, 255],
            'yellow': [255, 255, 0],
            'cyan': [0, 255, 255],
            'magenta': [255, 0, 255],
            'orange': [255, 165, 0],
            'purple': [128, 0, 128],
            'pink': [255, 192, 203],
            'brown': [139, 69, 19],
            'gray': [128, 128, 128],
            'grey': [128, 128, 128],
            'lime': [0, 255, 0],
            'navy': [0, 0, 128],
            'teal': [0, 128, 128],
            'maroon': [128, 0, 0],
            'olive': [128, 128, 0],
            'aqua': [0, 255, 255],
            'silver': [192, 192, 192],
            'gold': [255, 215, 0],
            'violet': [238, 130, 238],
            'indigo': [75, 0, 130],
            'coral': [255, 127, 80],
            'turquoise': [64, 224, 208]
        };
    }

    // ============== ERROR HELPERS ==============

    // List of known commands for "Did you mean...?" suggestions
    getKnownCommands() {
        return [
            'FORWARD', 'FD', 'BACK', 'BK', 'LEFT', 'LT', 'RIGHT', 'RT', 'HOME',
            'SETPOS', 'SETX', 'SETY', 'SETHEADING', 'SETH',
            'PENUP', 'PU', 'PENDOWN', 'PD', 'SETPENCOLOR', 'SETPC', 'SETPENSIZE',
            'PENERASE', 'PE', 'PENPAINT', 'PPT', 'SETBACKGROUND', 'SETBG',
            'CIRCLE', 'ARC', 'FILLED',
            'CLEARSCREEN', 'CS', 'CLEAN', 'HIDETURTLE', 'HT', 'SHOWTURTLE', 'ST',
            'WRAP', 'WINDOW', 'FENCE',
            'REPEAT', 'IF', 'IFELSE', 'FOR', 'WHILE', 'STOP', 'OUTPUT', 'OP', 'WAIT',
            'MAKE', 'LOCAL', 'PRINT', 'SHOW', 'TYPE', 'TELL', 'ASK',
            'TO', 'END',
            // Math functions
            'SQRT', 'SIN', 'COS', 'TAN', 'ARCTAN', 'ABS', 'INT', 'ROUND', 'RANDOM',
            'POWER', 'REMAINDER', 'MODULO', 'EXP', 'LOG', 'LOG10', 'LN', 'SIGN', 'MIN', 'MAX',
            // List functions
            'FIRST', 'LAST', 'BUTFIRST', 'BF', 'BUTLAST', 'BL', 'COUNT', 'ITEM',
            'LIST', 'SENTENCE', 'SE', 'FPUT', 'LPUT', 'REVERSE',
            // Logic
            'AND', 'OR', 'NOT', 'TRUE', 'FALSE',
            // Turtle state
            'XCOR', 'YCOR', 'HEADING', 'POS', 'PENSIZE', 'PENCOLOR', 'PC', 'WHO', 'TURTLES',
            // String functions
            'WORD', 'CHAR', 'ASCII', 'UPPERCASE', 'LOWERCASE',
            // Geometry functions
            'TOWARDS', 'DISTANCE',
            // User input
            'READWORD', 'READLIST'
        ];
    }

    // Find similar command (simple Levenshtein-like check)
    findSimilarCommand(unknown) {
        unknown = unknown.toUpperCase();
        const commands = this.getKnownCommands();

        // Also include user procedures
        const allCommands = [...commands, ...Object.keys(this.procedures)];

        let bestMatch = null;
        let bestScore = Infinity;

        for (const cmd of allCommands) {
            // Quick length check - if too different, skip
            if (Math.abs(cmd.length - unknown.length) > 2) continue;

            // Calculate simple edit distance
            const score = this.editDistance(unknown, cmd);
            if (score <= 2 && score < bestScore) {
                bestScore = score;
                bestMatch = cmd;
            }
        }

        return bestMatch;
    }

    // Simple edit distance calculation
    editDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b[i-1] === a[j-1]) {
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i-1][j-1] + 1, // substitution
                        matrix[i][j-1] + 1,   // insertion
                        matrix[i-1][j] + 1    // deletion
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    // ============== TOKENIZER ==============

    tokenize(code) {
        const tokens = [];
        let i = 0;
        let bracketDepth = 0; // Track if we're inside brackets

        while (i < code.length) {
            // Skip whitespace
            if (/\s/.test(code[i])) {
                i++;
                continue;
            }

            // Skip comments (semicolon to end of line)
            if (code[i] === ';') {
                while (i < code.length && code[i] !== '\n') i++;
                continue;
            }

            // List brackets
            if (code[i] === '[') {
                tokens.push({ type: 'LBRACKET', value: '[' });
                bracketDepth++;
                i++;
                continue;
            }
            if (code[i] === ']') {
                tokens.push({ type: 'RBRACKET', value: ']' });
                bracketDepth--;
                i++;
                continue;
            }

            // Parentheses
            if (code[i] === '(') {
                tokens.push({ type: 'LPAREN', value: '(' });
                i++;
                continue;
            }
            if (code[i] === ')') {
                tokens.push({ type: 'RPAREN', value: ')' });
                i++;
                continue;
            }

            // Operators
            if (code[i] === '+' || code[i] === '*' || code[i] === '/') {
                tokens.push({ type: 'OPERATOR', value: code[i] });
                i++;
                continue;
            }

            // Minus (could be operator or negative number)
            if (code[i] === '-') {
                // Check if it's a negative number
                if (i + 1 < code.length && /\d/.test(code[i + 1])) {
                    // Inside brackets, always treat as negative number (e.g., [-150 -10])
                    // Outside brackets, check context to decide
                    const prev = tokens[tokens.length - 1];
                    const isSubtraction = bracketDepth === 0 && prev &&
                        (prev.type === 'NUMBER' || prev.type === 'WORD' || prev.type === 'RPAREN' || prev.type === 'RBRACKET');

                    if (isSubtraction) {
                        tokens.push({ type: 'OPERATOR', value: '-' });
                        i++;
                        continue;
                    }
                    // It's a negative number - parse it
                    i++; // skip the minus
                    let num = '-';
                    while (i < code.length && (/\d/.test(code[i]) || code[i] === '.')) {
                        num += code[i];
                        i++;
                    }
                    tokens.push({ type: 'NUMBER', value: parseFloat(num) });
                    continue;
                }
                tokens.push({ type: 'OPERATOR', value: '-' });
                i++;
                continue;
            }

            // Comparison operators
            if (code[i] === '=' || code[i] === '<' || code[i] === '>') {
                let op = code[i];
                i++;
                if (i < code.length && (code[i] === '=' || code[i] === '>')) {
                    op += code[i];
                    i++;
                }
                tokens.push({ type: 'COMPARISON', value: op });
                continue;
            }

            // Variable reference (:varname)
            if (code[i] === ':') {
                i++;
                let name = '';
                while (i < code.length && /[a-zA-Z0-9_.]/.test(code[i])) {
                    name += code[i];
                    i++;
                }
                if (name) {
                    tokens.push({ type: 'VARREF', value: name });
                }
                continue;
            }

            // Quoted word ("word) - supports escaped spaces with backslash
            if (code[i] === '"') {
                i++;
                let word = '';
                while (i < code.length) {
                    // Handle escaped space (\ followed by space)
                    if (code[i] === '\\' && i + 1 < code.length && code[i + 1] === ' ') {
                        word += ' ';
                        i += 2;
                        continue;
                    }
                    // Stop at unescaped whitespace or special characters
                    if (/\s/.test(code[i]) || /[\[\]\(\);]/.test(code[i])) {
                        break;
                    }
                    word += code[i];
                    i++;
                }
                tokens.push({ type: 'QUOTED', value: word });
                continue;
            }

            // Number
            if (/\d/.test(code[i]) || (code[i] === '.' && i + 1 < code.length && /\d/.test(code[i + 1]))) {
                let num = '';
                while (i < code.length && (/\d/.test(code[i]) || code[i] === '.')) {
                    num += code[i];
                    i++;
                }
                tokens.push({ type: 'NUMBER', value: parseFloat(num) });
                continue;
            }

            // Word/Command
            if (/[a-zA-Z_?]/.test(code[i])) {
                let word = '';
                while (i < code.length && /[a-zA-Z0-9_?]/.test(code[i])) {
                    word += code[i];
                    i++;
                }
                tokens.push({ type: 'WORD', value: word.toUpperCase() });
                continue;
            }

            // Unknown character - skip
            i++;
        }

        return tokens;
    }

    // ============== PARSER ==============

    parseList(tokens, startIndex) {
        const items = [];
        let i = startIndex;
        let depth = 1;

        while (i < tokens.length && depth > 0) {
            if (tokens[i].type === 'LBRACKET') {
                const nested = this.parseList(tokens, i + 1);
                items.push(nested.list);
                i = nested.endIndex;
            } else if (tokens[i].type === 'RBRACKET') {
                depth--;
                if (depth === 0) {
                    return { list: items, endIndex: i + 1 };
                }
            } else {
                items.push(tokens[i]);
                i++;
            }
        }

        return { list: items, endIndex: i };
    }

    // Convert list items (which may be token objects) to actual values
    evaluateListItems(items) {
        const result = [];
        for (const item of items) {
            if (Array.isArray(item)) {
                // Nested list
                result.push(this.evaluateListItems(item));
            } else if (item && typeof item === 'object' && item.type) {
                // Token object - extract value
                if (item.type === 'NUMBER') {
                    result.push(item.value);
                } else if (item.type === 'QUOTED') {
                    result.push(item.value);
                } else if (item.type === 'VARREF') {
                    result.push(this.getVariable(item.value));
                } else if (item.type === 'WORD') {
                    result.push(item.value);
                } else {
                    result.push(item.value);
                }
            } else {
                // Already a primitive value
                result.push(item);
            }
        }
        return result;
    }

    // ============== EXPRESSION EVALUATOR ==============

    async evaluateExpression(tokens, index) {
        return this.parseAddSub(tokens, index);
    }

    async parseAddSub(tokens, index) {
        let result = await this.parseMulDiv(tokens, index);
        let i = result.index;
        let value = result.value;

        while (i < tokens.length) {
            const token = tokens[i];
            if (token.type === 'OPERATOR' && (token.value === '+' || token.value === '-')) {
                i++;
                const right = await this.parseMulDiv(tokens, i);
                i = right.index;
                if (token.value === '+') {
                    value = value + right.value;
                } else {
                    value = value - right.value;
                }
            } else {
                break;
            }
        }

        return { value, index: i };
    }

    async parseMulDiv(tokens, index) {
        let result = await this.parseUnary(tokens, index);
        let i = result.index;
        let value = result.value;

        while (i < tokens.length) {
            const token = tokens[i];
            if (token.type === 'OPERATOR' && (token.value === '*' || token.value === '/')) {
                i++;
                const right = await this.parseUnary(tokens, i);
                i = right.index;
                if (token.value === '*') {
                    value = value * right.value;
                } else {
                    if (right.value === 0) {
                        throw new Error("Oops! You can't divide by zero.");
                    }
                    value = value / right.value;
                }
            } else {
                break;
            }
        }

        return { value, index: i };
    }

    async parseUnary(tokens, index) {
        if (index >= tokens.length) {
            throw new Error("I ran out of things to read! Did you forget to finish your code?");
        }

        const token = tokens[index];

        if (token.type === 'OPERATOR' && token.value === '-') {
            const result = await this.parseUnary(tokens, index + 1);
            return { value: -result.value, index: result.index };
        }

        return this.parsePrimary(tokens, index);
    }

    async parsePrimary(tokens, index) {
        if (index >= tokens.length) {
            throw new Error("I ran out of things to read! Did you forget to finish your code?");
        }

        const token = tokens[index];

        // Parenthesized expression
        if (token.type === 'LPAREN') {
            // Check if next token is a function that supports variable args
            // FMS Logo allows (LIST a b c ...) with any number of arguments
            const nextToken = tokens[index + 1];
            if (nextToken && nextToken.type === 'WORD') {
                const funcName = nextToken.value.toUpperCase();
                if (['LIST', 'WORD', 'SENTENCE', 'SE'].includes(funcName)) {
                    // Handle special form: (LIST a b c ...)
                    const result = await this.evaluateVariadicFunction(funcName, tokens, index + 2);
                    // result.index should be at RPAREN
                    if (result.index >= tokens.length || tokens[result.index].type !== 'RPAREN') {
                        throw new Error("You opened ( but forgot to close it with )");
                    }
                    return { value: result.value, index: result.index + 1 };
                }
            }
            // Normal parenthesized expression
            const result = await this.parseAddSub(tokens, index + 1);
            if (result.index >= tokens.length || tokens[result.index].type !== 'RPAREN') {
                throw new Error("You opened ( but forgot to close it with )");
            }
            return { value: result.value, index: result.index + 1 };
        }

        // Number
        if (token.type === 'NUMBER') {
            return { value: token.value, index: index + 1 };
        }

        // Variable reference
        if (token.type === 'VARREF') {
            const value = this.getVariable(token.value);
            return { value, index: index + 1 };
        }

        // Quoted word (returns as string)
        if (token.type === 'QUOTED') {
            return { value: token.value, index: index + 1 };
        }

        // List - evaluate items to get actual values
        if (token.type === 'LBRACKET') {
            const listResult = this.parseList(tokens, index + 1);
            // Convert token objects to actual values
            const evaluatedList = this.evaluateListItems(listResult.list);
            return { value: evaluatedList, index: listResult.endIndex };
        }

        // Function call or word
        if (token.type === 'WORD') {
            return await this.evaluateFunction(tokens, index);
        }

        throw new Error(`I don't understand "${token.value}" here. Check your code!`);
    }

    async evaluateFunction(tokens, index) {
        const funcName = tokens[index].value;
        index++;

        // Math functions
        const mathFuncs = {
            'SQRT': (a) => Math.sqrt(a),
            'SIN': (a) => Math.sin(a * Math.PI / 180),
            'COS': (a) => Math.cos(a * Math.PI / 180),
            'TAN': (a) => Math.tan(a * Math.PI / 180),
            'ARCTAN': (a) => Math.atan(a) * 180 / Math.PI,
            'ABS': (a) => Math.abs(a),
            'INT': (a) => Math.trunc(a),
            'ROUND': (a) => Math.round(a),
            'RANDOM': (a) => a <= 0 ? 0 : Math.floor(Math.random() * a),
            'POWER': null, // Two args
            'REMAINDER': null, // Two args
            'MODULO': null, // Two args
            'EXP': (a) => Math.exp(a),
            'LOG': (a) => Math.log(a),
            'LOG10': (a) => Math.log10(a),
            'LN': (a) => Math.log(a),
            'SIGN': (a) => Math.sign(a),
            'MIN': null, // Variable args
            'MAX': null  // Variable args
        };

        if (funcName in mathFuncs) {
            if (funcName === 'POWER') {
                const arg1 = await this.evaluateExpression(tokens, index);
                const arg2 = await this.evaluateExpression(tokens, arg1.index);
                return { value: Math.pow(arg1.value, arg2.value), index: arg2.index };
            }
            if (funcName === 'REMAINDER' || funcName === 'MODULO') {
                const arg1 = await this.evaluateExpression(tokens, index);
                const arg2 = await this.evaluateExpression(tokens, arg1.index);
                if (arg2.value === 0) {
                    throw new Error("Oops! You can't divide by zero.");
                }
                return { value: arg1.value % arg2.value, index: arg2.index };
            }
            if (funcName === 'MIN' || funcName === 'MAX') {
                // MIN and MAX take two arguments
                const arg1 = await this.evaluateExpression(tokens, index);
                const arg2 = await this.evaluateExpression(tokens, arg1.index);
                const result = funcName === 'MIN'
                    ? Math.min(arg1.value, arg2.value)
                    : Math.max(arg1.value, arg2.value);
                return { value: result, index: arg2.index };
            }
            const arg = await this.evaluateExpression(tokens, index);
            return { value: mathFuncs[funcName](arg.value), index: arg.index };
        }

        // Turtle state functions
        if (funcName === 'XCOR') {
            return { value: this.turtle.x, index };
        }
        if (funcName === 'YCOR') {
            return { value: this.turtle.y, index };
        }
        if (funcName === 'HEADING') {
            return { value: this.turtle.heading, index };
        }
        if (funcName === 'POS') {
            return { value: [this.turtle.x, this.turtle.y], index };
        }
        if (funcName === 'PENSIZE') {
            return { value: this.turtle.penSize, index };
        }
        if (funcName === 'PENCOLOR' || funcName === 'PC') {
            return { value: this.turtle.penColor, index };
        }
        if (funcName === 'WHO') {
            return { value: this.turtle.currentTurtleId, index };
        }
        if (funcName === 'TURTLES') {
            return { value: this.turtle.getTurtleIds(), index };
        }

        // String functions
        if (funcName === 'WORD') {
            // WORD combines two words into one
            const arg1 = await this.evaluateExpression(tokens, index);
            const arg2 = await this.evaluateExpression(tokens, arg1.index);
            return { value: String(arg1.value) + String(arg2.value), index: arg2.index };
        }
        if (funcName === 'CHAR') {
            // CHAR returns character for ASCII code
            const arg = await this.evaluateExpression(tokens, index);
            return { value: String.fromCharCode(arg.value), index: arg.index };
        }
        if (funcName === 'ASCII') {
            // ASCII returns code for first character
            const arg = await this.evaluateExpression(tokens, index);
            const str = String(arg.value);
            if (str.length === 0) {
                throw new Error("ASCII needs a word with at least one character!");
            }
            return { value: str.charCodeAt(0), index: arg.index };
        }
        if (funcName === 'UPPERCASE') {
            const arg = await this.evaluateExpression(tokens, index);
            return { value: String(arg.value).toUpperCase(), index: arg.index };
        }
        if (funcName === 'LOWERCASE') {
            const arg = await this.evaluateExpression(tokens, index);
            return { value: String(arg.value).toLowerCase(), index: arg.index };
        }

        // Geometry functions
        if (funcName === 'TOWARDS') {
            // Returns angle from turtle to point
            const arg = await this.evaluateExpression(tokens, index);
            if (!Array.isArray(arg.value) || arg.value.length < 2) {
                throw new Error("TOWARDS needs a point like [x y]");
            }
            const dx = arg.value[0] - this.turtle.x;
            const dy = arg.value[1] - this.turtle.y;
            // Calculate angle in Logo's coordinate system (0 = up, 90 = right)
            let angle = Math.atan2(dx, dy) * 180 / Math.PI;
            if (angle < 0) angle += 360;
            return { value: angle, index: arg.index };
        }
        if (funcName === 'DISTANCE') {
            // Returns distance from turtle to point
            const arg = await this.evaluateExpression(tokens, index);
            if (!Array.isArray(arg.value) || arg.value.length < 2) {
                throw new Error("DISTANCE needs a point like [x y]");
            }
            const dx = arg.value[0] - this.turtle.x;
            const dy = arg.value[1] - this.turtle.y;
            return { value: Math.sqrt(dx * dx + dy * dy), index: arg.index };
        }

        // List functions
        if (funcName === 'FIRST') {
            const arg = await this.evaluateExpression(tokens, index);
            const list = arg.value;
            if (Array.isArray(list)) {
                if (list.length === 0) {
                    throw new Error("The list is empty! FIRST needs at least one item.");
                }
                return { value: list[0], index: arg.index };
            }
            if (typeof list === 'string') {
                if (list.length === 0) {
                    throw new Error("The word is empty! FIRST needs at least one character.");
                }
                return { value: list[0], index: arg.index };
            }
            throw new Error('FIRST needs a list like [1 2 3] or a word');
        }
        if (funcName === 'LAST') {
            const arg = await this.evaluateExpression(tokens, index);
            const list = arg.value;
            if (Array.isArray(list)) {
                if (list.length === 0) {
                    throw new Error("The list is empty! LAST needs at least one item.");
                }
                return { value: list[list.length - 1], index: arg.index };
            }
            if (typeof list === 'string') {
                if (list.length === 0) {
                    throw new Error("The word is empty! LAST needs at least one character.");
                }
                return { value: list[list.length - 1], index: arg.index };
            }
            throw new Error('LAST needs a list like [1 2 3] or a word');
        }
        if (funcName === 'BUTFIRST' || funcName === 'BF') {
            const arg = await this.evaluateExpression(tokens, index);
            const list = arg.value;
            if (Array.isArray(list)) {
                return { value: list.slice(1), index: arg.index };
            }
            if (typeof list === 'string') {
                return { value: list.slice(1), index: arg.index };
            }
            throw new Error('BUTFIRST needs a list like [1 2 3] or a word');
        }
        if (funcName === 'BUTLAST' || funcName === 'BL') {
            const arg = await this.evaluateExpression(tokens, index);
            const list = arg.value;
            if (Array.isArray(list)) {
                return { value: list.slice(0, -1), index: arg.index };
            }
            if (typeof list === 'string') {
                return { value: list.slice(0, -1), index: arg.index };
            }
            throw new Error('BUTLAST needs a list like [1 2 3] or a word');
        }
        if (funcName === 'COUNT') {
            const arg = await this.evaluateExpression(tokens, index);
            const list = arg.value;
            if (Array.isArray(list)) {
                return { value: list.length, index: arg.index };
            }
            if (typeof list === 'string') {
                return { value: list.length, index: arg.index };
            }
            throw new Error('COUNT needs a list like [1 2 3] or a word');
        }
        if (funcName === 'ITEM') {
            const idx = await this.evaluateExpression(tokens, index);
            const list = await this.evaluateExpression(tokens, idx.index);
            const itemIndex = idx.value;
            if (Array.isArray(list.value)) {
                if (list.value.length === 0) {
                    throw new Error("The list is empty! There are no items to get.");
                }
                if (itemIndex < 1 || itemIndex > list.value.length) {
                    throw new Error(`Item ${itemIndex} doesn't exist! The list only has ${list.value.length} item${list.value.length === 1 ? '' : 's'}.`);
                }
                return { value: list.value[itemIndex - 1], index: list.index };
            }
            if (typeof list.value === 'string') {
                if (list.value.length === 0) {
                    throw new Error("The word is empty! There are no characters to get.");
                }
                if (itemIndex < 1 || itemIndex > list.value.length) {
                    throw new Error(`Character ${itemIndex} doesn't exist! The word only has ${list.value.length} character${list.value.length === 1 ? '' : 's'}.`);
                }
                return { value: list.value[itemIndex - 1], index: list.index };
            }
            throw new Error('ITEM needs a list like [1 2 3] or a word');
        }
        if (funcName === 'LIST') {
            const items = [];
            // Collect two items
            const arg1 = await this.evaluateExpression(tokens, index);
            items.push(arg1.value);
            const arg2 = await this.evaluateExpression(tokens, arg1.index);
            items.push(arg2.value);
            return { value: items, index: arg2.index };
        }
        if (funcName === 'SENTENCE' || funcName === 'SE') {
            const arg1 = await this.evaluateExpression(tokens, index);
            const arg2 = await this.evaluateExpression(tokens, arg1.index);
            const result = [];
            if (Array.isArray(arg1.value)) {
                result.push(...arg1.value);
            } else {
                result.push(arg1.value);
            }
            if (Array.isArray(arg2.value)) {
                result.push(...arg2.value);
            } else {
                result.push(arg2.value);
            }
            return { value: result, index: arg2.index };
        }
        if (funcName === 'FPUT') {
            const item = await this.evaluateExpression(tokens, index);
            const list = await this.evaluateExpression(tokens, item.index);
            if (!Array.isArray(list.value)) {
                throw new Error('FPUT needs a list: FPUT "hello [1 2 3] puts "hello at the front');
            }
            return { value: [item.value, ...list.value], index: list.index };
        }
        if (funcName === 'LPUT') {
            const item = await this.evaluateExpression(tokens, index);
            const list = await this.evaluateExpression(tokens, item.index);
            if (!Array.isArray(list.value)) {
                throw new Error('LPUT needs a list: LPUT "hello [1 2 3] puts "hello at the end');
            }
            return { value: [...list.value, item.value], index: list.index };
        }

        // Predicates
        if (funcName === 'EMPTY?') {
            const arg = await this.evaluateExpression(tokens, index);
            if (Array.isArray(arg.value)) {
                return { value: arg.value.length === 0, index: arg.index };
            }
            if (typeof arg.value === 'string') {
                return { value: arg.value.length === 0, index: arg.index };
            }
            return { value: false, index: arg.index };
        }
        if (funcName === 'LIST?') {
            const arg = await this.evaluateExpression(tokens, index);
            return { value: Array.isArray(arg.value), index: arg.index };
        }
        if (funcName === 'NUMBER?') {
            const arg = await this.evaluateExpression(tokens, index);
            return { value: typeof arg.value === 'number', index: arg.index };
        }
        if (funcName === 'WORD?') {
            const arg = await this.evaluateExpression(tokens, index);
            return { value: typeof arg.value === 'string', index: arg.index };
        }
        if (funcName === 'MEMBER?') {
            const item = await this.evaluateExpression(tokens, index);
            const list = await this.evaluateExpression(tokens, item.index);
            if (Array.isArray(list.value)) {
                return { value: list.value.includes(item.value), index: list.index };
            }
            if (typeof list.value === 'string') {
                return { value: list.value.includes(item.value), index: list.index };
            }
            return { value: false, index: list.index };
        }
        if (funcName === 'REVERSE') {
            const arg = await this.evaluateExpression(tokens, index);
            if (Array.isArray(arg.value)) {
                return { value: [...arg.value].reverse(), index: arg.index };
            }
            if (typeof arg.value === 'string') {
                return { value: arg.value.split('').reverse().join(''), index: arg.index };
            }
            throw new Error("REVERSE needs a list like [1 2 3] or a word");
        }

        // Logic functions
        if (funcName === 'AND') {
            const arg1 = await this.evaluateExpression(tokens, index);
            const arg2 = await this.evaluateExpression(tokens, arg1.index);
            return { value: this.isTruthy(arg1.value) && this.isTruthy(arg2.value), index: arg2.index };
        }
        if (funcName === 'OR') {
            const arg1 = await this.evaluateExpression(tokens, index);
            const arg2 = await this.evaluateExpression(tokens, arg1.index);
            return { value: this.isTruthy(arg1.value) || this.isTruthy(arg2.value), index: arg2.index };
        }
        if (funcName === 'NOT') {
            const arg = await this.evaluateExpression(tokens, index);
            return { value: !this.isTruthy(arg.value), index: arg.index };
        }

        // User input functions
        if (funcName === 'READWORD') {
            // Get optional prompt from string argument
            let prompt = 'Enter a word:';
            if (index < tokens.length && tokens[index].type === 'QUOTED') {
                prompt = tokens[index].value;
                index++;
            }
            const input = window.prompt(prompt) || '';
            return { value: input, index };
        }
        if (funcName === 'READLIST') {
            // Get optional prompt from string argument
            let prompt = 'Enter values (space-separated):';
            if (index < tokens.length && tokens[index].type === 'QUOTED') {
                prompt = tokens[index].value;
                index++;
            }
            const input = window.prompt(prompt) || '';
            // Parse into list
            const list = input.split(/\s+/).filter(s => s.length > 0).map(s => {
                const num = parseFloat(s);
                return isNaN(num) ? s : num;
            });
            return { value: list, index };
        }

        // THING - get variable value
        if (funcName === 'THING') {
            const arg = await this.evaluateExpression(tokens, index);
            const varName = String(arg.value).toUpperCase();
            return { value: this.getVariable(varName), index: arg.index };
        }

        // REPCOUNT - current repeat iteration
        if (funcName === 'REPCOUNT') {
            return { value: this.repcount || 1, index };
        }

        // Check for user-defined procedure
        const proc = this.procedures[funcName];
        if (proc) {
            const args = [];
            for (let i = 0; i < proc.params.length; i++) {
                const argResult = await this.evaluateExpression(tokens, index);
                args.push(argResult.value);
                index = argResult.index;
            }

            // Execute procedure and get output
            this.localScopes.push({});
            for (let i = 0; i < proc.params.length; i++) {
                this.setLocalVariable(proc.params[i], args[i]);
            }

            let outputValue = null;
            try {
                await this.executeBlock(proc.body);
            } catch (e) {
                if (e.type === 'OUTPUT') {
                    outputValue = e.value;
                } else if (e.type !== 'STOP') {
                    throw e;
                }
            }

            this.localScopes.pop();
            return { value: outputValue, index };
        }

        // Boolean values
        if (funcName === 'TRUE') {
            return { value: true, index };
        }
        if (funcName === 'FALSE') {
            return { value: false, index };
        }

        throw new Error(`I don't know the function "${funcName}". Check your spelling!`);
    }

    /**
     * Evaluate a variadic function call inside parentheses.
     * Collects all arguments until the closing paren.
     * Supports: LIST, WORD, SENTENCE/SE
     * Example: (LIST 1 2 3 4) -> [1, 2, 3, 4]
     */
    async evaluateVariadicFunction(funcName, tokens, index) {
        const items = [];

        // Collect all arguments until we hit RPAREN
        while (index < tokens.length && tokens[index].type !== 'RPAREN') {
            const result = await this.evaluateExpression(tokens, index);
            items.push(result.value);
            index = result.index;
        }

        // Return based on function type
        if (funcName === 'LIST') {
            return { value: items, index };
        }

        if (funcName === 'WORD') {
            // Concatenate all items as strings
            return { value: items.map(String).join(''), index };
        }

        if (funcName === 'SENTENCE' || funcName === 'SE') {
            // Flatten all items into a single list
            const result = [];
            for (const item of items) {
                if (Array.isArray(item)) {
                    result.push(...item);
                } else {
                    result.push(item);
                }
            }
            return { value: result, index };
        }

        // Fallback - return as list
        return { value: items, index };
    }

    isTruthy(value) {
        if (value === true || value === 'TRUE') return true;
        if (value === false || value === 'FALSE') return false;
        return !!value;
    }

    // ============== VARIABLE MANAGEMENT ==============

    getVariable(name) {
        name = name.toUpperCase();
        // Check local scopes from innermost to outermost
        for (let i = this.localScopes.length - 1; i >= 0; i--) {
            if (name in this.localScopes[i]) {
                return this.localScopes[i][name];
            }
        }
        // Check global variables
        if (name in this.globalVariables) {
            return this.globalVariables[name];
        }
        throw new Error(`I don't know the variable :${name} yet. Did you create it with MAKE first?`);
    }

    setVariable(name, value) {
        name = name.toUpperCase();
        // Check if exists in local scopes
        for (let i = this.localScopes.length - 1; i >= 0; i--) {
            if (name in this.localScopes[i]) {
                this.localScopes[i][name] = value;
                return;
            }
        }
        // Set global variable
        this.globalVariables[name] = value;
    }

    setLocalVariable(name, value) {
        name = name.toUpperCase();
        if (this.localScopes.length > 0) {
            this.localScopes[this.localScopes.length - 1][name] = value;
        } else {
            this.globalVariables[name] = value;
        }
    }

    // ============== COMMAND EXECUTION ==============

    async execute(code) {
        this.running = true;
        this.stopRequested = false;
        this.output = [];

        try {
            const tokens = this.tokenize(code);
            await this.executeTokens(tokens, 0);
        } catch (e) {
            if (e.type !== 'STOP' && e.type !== 'OUTPUT') {
                this.printError(e.message);
                throw e;
            }
        } finally {
            this.running = false;
        }
    }

    stop() {
        this.stopRequested = true;
    }

    async executeTokens(tokens, index) {
        while (index < tokens.length && !this.stopRequested) {
            const token = tokens[index];

            if (token.type !== 'WORD') {
                index++;
                continue;
            }

            const command = token.value;
            index++;

            // Handle procedure definitions
            if (command === 'TO') {
                index = this.defineProcedure(tokens, index);
                continue;
            }

            // Execute command
            index = await this.executeCommand(command, tokens, index);

            // Small delay for animation if needed
            if (this.executionSpeed > 0) {
                await this.delay(this.executionSpeed);
            }
        }

        return index;
    }

    async executeCommand(command, tokens, index) {
        if (this.stopRequested) return index;

        // ===== TURTLE MOVEMENT =====
        if (command === 'FORWARD' || command === 'FD') {
            const result = await this.evaluateExpression(tokens, index);
            this.turtle.forward(result.value);
            return result.index;
        }
        if (command === 'BACK' || command === 'BK') {
            const result = await this.evaluateExpression(tokens, index);
            this.turtle.back(result.value);
            return result.index;
        }
        if (command === 'LEFT' || command === 'LT') {
            const result = await this.evaluateExpression(tokens, index);
            this.turtle.left(result.value);
            return result.index;
        }
        if (command === 'RIGHT' || command === 'RT') {
            const result = await this.evaluateExpression(tokens, index);
            this.turtle.right(result.value);
            return result.index;
        }
        if (command === 'HOME') {
            this.turtle.home();
            return index;
        }
        if (command === 'SETPOS') {
            const result = await this.evaluateExpression(tokens, index);
            if (Array.isArray(result.value) && result.value.length >= 2) {
                this.turtle.setPosition(result.value[0], result.value[1]);
            }
            return result.index;
        }
        if (command === 'SETX') {
            const result = await this.evaluateExpression(tokens, index);
            this.turtle.setX(result.value);
            return result.index;
        }
        if (command === 'SETY') {
            const result = await this.evaluateExpression(tokens, index);
            this.turtle.setY(result.value);
            return result.index;
        }
        if (command === 'SETHEADING' || command === 'SETH') {
            const result = await this.evaluateExpression(tokens, index);
            this.turtle.setHeading(result.value);
            return result.index;
        }

        // ===== PEN COMMANDS =====
        if (command === 'PENUP' || command === 'PU') {
            this.turtle.penUp();
            return index;
        }
        if (command === 'PENDOWN' || command === 'PD') {
            this.turtle.penDown();
            return index;
        }
        if (command === 'SETPENCOLOR' || command === 'SETPC') {
            const result = await this.evaluateExpression(tokens, index);
            const color = this.resolveColor(result.value);
            this.turtle.setPenColor(color);
            return result.index;
        }
        if (command === 'SETPENSIZE') {
            const result = await this.evaluateExpression(tokens, index);
            this.turtle.setPenSize(result.value);
            return result.index;
        }
        if (command === 'PENERASE' || command === 'PE') {
            this.turtle.penErase();
            return index;
        }
        if (command === 'PENPAINT' || command === 'PPT') {
            this.turtle.penPaint();
            return index;
        }
        if (command === 'SETBACKGROUND' || command === 'SETBG') {
            const result = await this.evaluateExpression(tokens, index);
            const color = this.resolveColor(result.value);
            this.turtle.setBackground(color);
            return result.index;
        }

        // ===== SHAPE COMMANDS =====
        if (command === 'CIRCLE') {
            const result = await this.evaluateExpression(tokens, index);
            this.turtle.circle(result.value);
            return result.index;
        }
        if (command === 'ARC') {
            const angleResult = await this.evaluateExpression(tokens, index);
            const radiusResult = await this.evaluateExpression(tokens, angleResult.index);
            this.turtle.arc(angleResult.value, radiusResult.value);
            return radiusResult.index;
        }
        if (command === 'FILLED') {
            if (tokens[index]?.type !== 'LBRACKET') {
                throw new Error("FILLED needs commands in brackets: FILLED [REPEAT 4 [FD 100 RT 90]]");
            }
            const blockResult = this.parseList(tokens, index + 1);

            this.turtle.beginFill();
            await this.executeBlock(blockResult.list);
            this.turtle.endFill();

            return blockResult.endIndex;
        }

        // ===== SCREEN COMMANDS =====
        if (command === 'CLEARSCREEN' || command === 'CS') {
            this.turtle.clearScreen();
            return index;
        }
        if (command === 'CLEAN') {
            this.turtle.clean();
            return index;
        }
        if (command === 'HIDETURTLE' || command === 'HT') {
            this.turtle.hideTurtle();
            return index;
        }
        if (command === 'SHOWTURTLE' || command === 'ST') {
            this.turtle.showTurtle();
            return index;
        }
        if (command === 'WRAP') {
            this.turtle.setMode('wrap');
            return index;
        }
        if (command === 'WINDOW') {
            this.turtle.setMode('window');
            return index;
        }
        if (command === 'FENCE') {
            this.turtle.setMode('fence');
            return index;
        }

        // ===== CONTROL STRUCTURES =====
        if (command === 'REPEAT') {
            const countResult = await this.evaluateExpression(tokens, index);
            const count = Math.floor(countResult.value);
            index = countResult.index;

            if (tokens[index]?.type !== 'LBRACKET') {
                throw new Error("REPEAT needs commands in brackets, like: REPEAT 4 [FD 100 RT 90]");
            }
            const blockResult = this.parseList(tokens, index + 1);

            for (let i = 1; i <= count && !this.stopRequested; i++) {
                const oldRepcount = this.repcount;
                this.repcount = i;
                await this.executeBlock(blockResult.list);
                this.repcount = oldRepcount;
            }

            return blockResult.endIndex;
        }

        if (command === 'IF') {
            const condResult = await this.evaluateCondition(tokens, index);
            index = condResult.index;

            if (tokens[index]?.type !== 'LBRACKET') {
                throw new Error("IF needs commands in brackets, like: IF :x > 5 [PRINT :x]");
            }
            const blockResult = this.parseList(tokens, index + 1);

            if (this.isTruthy(condResult.value)) {
                await this.executeBlock(blockResult.list);
            }

            return blockResult.endIndex;
        }

        if (command === 'IFELSE') {
            const condResult = await this.evaluateCondition(tokens, index);
            index = condResult.index;

            if (tokens[index]?.type !== 'LBRACKET') {
                throw new Error("IFELSE needs two bracket groups: IFELSE condition [do if true] [do if false]");
            }
            const trueBlock = this.parseList(tokens, index + 1);
            index = trueBlock.endIndex;

            if (tokens[index]?.type !== 'LBRACKET') {
                throw new Error("IFELSE needs two bracket groups: IFELSE condition [do if true] [do if false]");
            }
            const falseBlock = this.parseList(tokens, index + 1);

            if (this.isTruthy(condResult.value)) {
                await this.executeBlock(trueBlock.list);
            } else {
                await this.executeBlock(falseBlock.list);
            }

            return falseBlock.endIndex;
        }

        if (command === 'FOR') {
            if (tokens[index]?.type !== 'LBRACKET') {
                throw new Error("FOR needs a control list like [i 1 10], for example: FOR [i 1 10] [PRINT :i]");
            }
            const controlList = this.parseList(tokens, index + 1);
            index = controlList.endIndex;

            if (controlList.list.length < 3) {
                throw new Error("FOR control list needs at least 3 things: [variable start end]");
            }

            const varName = controlList.list[0].value;
            const startResult = await this.evaluateExpression(controlList.list, 1);
            const endResult = await this.evaluateExpression(controlList.list, startResult.index);
            let step = 1;
            if (endResult.index < controlList.list.length) {
                const stepResult = await this.evaluateExpression(controlList.list, endResult.index);
                step = stepResult.value;
            }

            if (step === 0) {
                throw new Error("FOR loop step can't be zero - the loop would never end!");
            }

            if (tokens[index]?.type !== 'LBRACKET') {
                throw new Error("FOR needs commands in brackets after the control list");
            }
            const bodyBlock = this.parseList(tokens, index + 1);

            this.localScopes.push({});
            const start = startResult.value;
            const end = endResult.value;

            if (step > 0) {
                for (let i = start; i <= end && !this.stopRequested; i += step) {
                    this.setLocalVariable(varName, i);
                    await this.executeBlock(bodyBlock.list);
                }
            } else if (step < 0) {
                for (let i = start; i >= end && !this.stopRequested; i += step) {
                    this.setLocalVariable(varName, i);
                    await this.executeBlock(bodyBlock.list);
                }
            }

            this.localScopes.pop();
            return bodyBlock.endIndex;
        }

        if (command === 'WHILE') {
            if (tokens[index]?.type !== 'LBRACKET') {
                throw new Error("WHILE needs a condition in brackets: WHILE [:x < 10] [commands]");
            }
            const condBlock = this.parseList(tokens, index + 1);
            index = condBlock.endIndex;

            if (tokens[index]?.type !== 'LBRACKET') {
                throw new Error("WHILE needs commands in brackets after the condition");
            }
            const bodyBlock = this.parseList(tokens, index + 1);

            while (!this.stopRequested) {
                const condTokens = this.flattenListToTokens(condBlock.list);
                const condResult = await this.evaluateCondition(condTokens, 0);
                if (!this.isTruthy(condResult.value)) break;
                await this.executeBlock(bodyBlock.list);
            }

            return bodyBlock.endIndex;
        }

        if (command === 'STOP') {
            throw { type: 'STOP' };
        }

        if (command === 'OUTPUT' || command === 'OP') {
            const result = await this.evaluateExpression(tokens, index);
            throw { type: 'OUTPUT', value: result.value };
        }

        if (command === 'WAIT') {
            const result = await this.evaluateExpression(tokens, index);
            await this.delay(result.value);
            return result.index;
        }

        // ===== VARIABLES =====
        if (command === 'MAKE') {
            const nameResult = await this.evaluateExpression(tokens, index);
            const valueResult = await this.evaluateExpression(tokens, nameResult.index);
            const varName = String(nameResult.value).toUpperCase();
            this.setVariable(varName, valueResult.value);
            return valueResult.index;
        }

        if (command === 'LOCAL') {
            const nameResult = await this.evaluateExpression(tokens, index);
            const varName = String(nameResult.value).toUpperCase();
            this.setLocalVariable(varName, null);
            return nameResult.index;
        }

        // ===== OUTPUT =====
        if (command === 'PRINT') {
            const result = await this.evaluateExpression(tokens, index);
            this.print(this.formatValue(result.value));
            return result.index;
        }

        if (command === 'SHOW') {
            const result = await this.evaluateExpression(tokens, index);
            this.print(this.formatValueShow(result.value));
            return result.index;
        }

        if (command === 'TYPE') {
            const result = await this.evaluateExpression(tokens, index);
            this.printInline(this.formatValue(result.value));
            return result.index;
        }

        // ===== MULTIPLE TURTLES =====
        if (command === 'TELL') {
            const result = await this.evaluateExpression(tokens, index);
            this.turtle.tell(result.value);
            return result.index;
        }

        if (command === 'ASK') {
            const idResult = await this.evaluateExpression(tokens, index);
            index = idResult.index;

            if (tokens[index]?.type !== 'LBRACKET') {
                throw new Error("ASK needs commands in brackets: ASK 1 [FD 100]");
            }
            const blockResult = this.parseList(tokens, index + 1);

            const currentTurtle = this.turtle.currentTurtleId;
            this.turtle.tell(idResult.value);
            await this.executeBlock(blockResult.list);
            this.turtle.tell(currentTurtle);

            return blockResult.endIndex;
        }

        // ===== USER PROCEDURE CALL =====
        const proc = this.procedures[command];
        if (proc) {
            const args = [];
            for (let i = 0; i < proc.params.length; i++) {
                const argResult = await this.evaluateExpression(tokens, index);
                args.push(argResult.value);
                index = argResult.index;
            }

            this.localScopes.push({});
            for (let i = 0; i < proc.params.length; i++) {
                this.setLocalVariable(proc.params[i], args[i]);
            }

            try {
                await this.executeBlock(proc.body);
            } catch (e) {
                if (e.type !== 'STOP' && e.type !== 'OUTPUT') {
                    throw e;
                }
            }

            this.localScopes.pop();
            return index;
        }

        // Try to find a similar command for helpful suggestion
        const suggestion = this.findSimilarCommand(command);
        if (suggestion) {
            throw new Error(`I don't know "${command}". Did you mean ${suggestion}?`);
        }
        throw new Error(`I don't know the command "${command}". Check your spelling or use HELP to see all commands.`);
    }

    defineProcedure(tokens, index) {
        if (index >= tokens.length || tokens[index].type !== 'WORD') {
            throw new Error('TO needs a name for your procedure: TO SQUARE ... END');
        }

        const name = tokens[index].value.toUpperCase();
        index++;

        // Parse parameters
        const params = [];
        while (index < tokens.length && tokens[index].type === 'VARREF') {
            params.push(tokens[index].value.toUpperCase());
            index++;
        }

        // Find END and collect body
        const body = [];
        let depth = 1;
        while (index < tokens.length) {
            if (tokens[index].type === 'WORD' && tokens[index].value === 'TO') {
                depth++;
            } else if (tokens[index].type === 'WORD' && tokens[index].value === 'END') {
                depth--;
                if (depth === 0) {
                    break;
                }
            }
            body.push(tokens[index]);
            index++;
        }

        if (index >= tokens.length) {
            throw new Error(`Your procedure ${name} is missing END. Every TO needs an END!`);
        }

        this.procedures[name] = { params, body };
        return index + 1; // Skip END
    }

    async executeBlock(items) {
        const tokens = this.flattenListToTokens(items);
        await this.executeTokens(tokens, 0);
    }

    flattenListToTokens(items) {
        const tokens = [];
        for (const item of items) {
            if (Array.isArray(item)) {
                tokens.push({ type: 'LBRACKET', value: '[' });
                tokens.push(...this.flattenListToTokens(item));
                tokens.push({ type: 'RBRACKET', value: ']' });
            } else {
                tokens.push(item);
            }
        }
        return tokens;
    }

    async evaluateCondition(tokens, index) {
        const left = await this.evaluateExpression(tokens, index);
        index = left.index;

        if (index >= tokens.length) {
            return left;
        }

        const op = tokens[index];
        if (op.type === 'COMPARISON') {
            index++;
            const right = await this.evaluateExpression(tokens, index);
            let result;
            switch (op.value) {
                case '=': result = left.value === right.value; break;
                case '<': result = left.value < right.value; break;
                case '>': result = left.value > right.value; break;
                case '<=': result = left.value <= right.value; break;
                case '>=': result = left.value >= right.value; break;
                case '<>': result = left.value !== right.value; break;
                default: result = false;
            }
            return { value: result, index: right.index };
        }

        return left;
    }

    resolveColor(value) {
        if (Array.isArray(value) && value.length >= 3) {
            return `rgb(${value[0]}, ${value[1]}, ${value[2]})`;
        }
        if (typeof value === 'string') {
            const lower = value.toLowerCase();
            if (this.colors[lower]) {
                const [r, g, b] = this.colors[lower];
                return `rgb(${r}, ${g}, ${b})`;
            }
            return value;
        }
        return 'black';
    }

    formatValue(value) {
        if (Array.isArray(value)) {
            return value.map(v => this.formatValue(v)).join(' ');
        }
        return String(value);
    }

    formatValueShow(value) {
        if (Array.isArray(value)) {
            return '[' + value.map(v => this.formatValueShow(v)).join(' ') + ']';
        }
        return String(value);
    }

    print(text) {
        this.output.push(text);
        if (this.onOutput) {
            this.onOutput(text, 'normal');
        }
    }

    printInline(text) {
        if (this.onOutput) {
            this.onOutput(text, 'inline');
        }
    }

    printError(text) {
        if (this.onError) {
            this.onError(text);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        this.procedures = {};
        this.globalVariables = {};
        this.localScopes = [];
        this.output = [];
        this.running = false;
        this.stopRequested = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogoInterpreter;
}
