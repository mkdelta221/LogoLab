# CLAUDE.md - LogoLab Project Context

## Project Overview

LogoLab is a free, web-based Logo programming environment for students, inspired by [FMSLogo](https://fmslogo.sourceforge.io/). It provides an accessible way to learn programming through turtle graphics directly in the browser.

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (no build tools or frameworks)
- **Hosting**: GitHub Pages (static site)
- **Storage**: Browser localStorage for auto-save and recent projects

## Project Structure

```
/LogoLab
├── index.html          # Main application HTML
├── style.css           # All styles (dark theme)
├── js/
│   ├── interpreter.js  # Logo language interpreter (tokenizer, parser, executor)
│   ├── turtle.js       # Turtle graphics engine (canvas rendering)
│   ├── editor.js       # Code editor with line numbers
│   ├── storage.js      # Local save/load functionality
│   └── app.js          # Main application logic, UI handlers, examples
├── CLAUDE.md           # This file - project context
├── README.md           # GitHub documentation
├── LICENSE             # MIT License
└── .github/
    └── FUNDING.yml     # Ko-fi donation link
```

## Key Components

### Logo Interpreter (`js/interpreter.js`)

Full-featured Logo interpreter supporting:
- **Turtle commands**: FORWARD, BACK, LEFT, RIGHT, HOME, SETPOS, SETX, SETY, SETHEADING
- **Pen commands**: PENUP, PENDOWN, SETPENCOLOR, SETPENSIZE, PENERASE, PENPAINT
- **Screen commands**: CLEARSCREEN, CLEAN, HIDETURTLE, SHOWTURTLE, WRAP, WINDOW, FENCE
- **Control structures**: REPEAT, IF, IFELSE, FOR, WHILE, STOP
- **Procedures**: TO/END with parameters, OUTPUT, LOCAL variables
- **Variables**: MAKE, :varname, THING
- **Math**: +, -, *, /, SQRT, SIN, COS, TAN, ABS, RANDOM, etc.
- **Lists**: LIST, FIRST, LAST, BUTFIRST, BUTLAST, ITEM, COUNT, FPUT, LPUT
- **Multiple turtles**: TELL, ASK, WHO, TURTLES
- **Output**: PRINT, SHOW, TYPE

### Turtle Graphics (`js/turtle.js`)

Canvas-based rendering with:
- Multiple turtle support
- Screen modes: wrap, window, fence
- Zoom and pan
- Coordinate display

### Storage (`js/storage.js`)

- Auto-save to localStorage
- Save/load .logo files (JSON format)
- Recent projects history

## Development

### Running Locally

Simply open `index.html` in a browser. No build step required.

For development with live reload:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

### Testing Changes

1. Open the app in browser
2. Try the built-in examples (Examples button)
3. Test specific commands in the editor
4. Check browser console for errors

### Common Commands for Testing

```logo
; Basic square
REPEAT 4 [FD 100 RT 90]

; Test procedures
TO SQUARE :size
  REPEAT 4 [FD :size RT 90]
END
SQUARE 50

; Test variables
MAKE "x 100
FD :x

; Test lists
PRINT FIRST [1 2 3]
```

## Deployment

The site is hosted on GitHub Pages. To deploy:

1. Push changes to the `main` branch
2. GitHub Pages automatically builds and deploys
3. Site available at: `https://mkdelta221.github.io/LogoLab`

## Attribution

This project is inspired by [FMSLogo](https://fmslogo.sourceforge.io/), a free implementation of the Logo programming language. LogoLab is an independent web-based implementation and does not use any FMSLogo code.

## License

MIT License - see LICENSE file
