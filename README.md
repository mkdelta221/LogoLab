# LogoLab

A free, web-based Logo programming environment for students. Learn programming through turtle graphics directly in your browser!

**[Try LogoLab Now](https://mkdelta221.github.io/LogoLab)**

## What is Logo?

Logo is an educational programming language designed in 1967 to teach programming concepts to beginners. It uses a "turtle" - a cursor that can be moved around the screen to draw shapes and patterns.

## Features

- **Full Logo interpreter** with 50+ commands
- **Turtle graphics** with real-time rendering
- **Procedures & variables** - define your own commands
- **Control structures** - REPEAT, IF, FOR, WHILE
- **Multiple turtles** - create complex animations
- **Lists support** - advanced data manipulation
- **Save & load** - save your work locally
- **Example programs** - learn from built-in examples
- **Command reference** - in-app help
- **Works offline** - no server required
- **Free forever** - no sign-up, no ads

## Quick Start

1. Visit the [LogoLab website](https://mkdelta221.github.io/LogoLab)
2. Type some code in the editor, for example:
   ```logo
   REPEAT 4 [FD 100 RT 90]
   ```
3. Click **Run** (or press Ctrl+Enter)
4. Watch the turtle draw a square!

## Example Programs

### Draw a Star
```logo
REPEAT 5 [FD 100 RT 144]
```

### Draw a Spiral
```logo
TO SPIRAL :size
  IF :size > 200 [STOP]
  FD :size
  RT 91
  SPIRAL :size + 2
END

SPIRAL 1
```

### Draw a Flower
```logo
TO PETAL
  REPEAT 2 [
    REPEAT 30 [FD 3 RT 3]
    RT 90
  ]
END

REPEAT 12 [PETAL RT 30]
```

## Command Reference

### Movement
| Command | Description |
|---------|-------------|
| `FORWARD n` / `FD n` | Move forward n steps |
| `BACK n` / `BK n` | Move backward n steps |
| `LEFT n` / `LT n` | Turn left n degrees |
| `RIGHT n` / `RT n` | Turn right n degrees |
| `HOME` | Return to center |
| `SETPOS [x y]` | Move to position |

### Pen
| Command | Description |
|---------|-------------|
| `PENUP` / `PU` | Lift pen (stop drawing) |
| `PENDOWN` / `PD` | Lower pen (start drawing) |
| `SETPENCOLOR color` | Set pen color |
| `SETPENSIZE n` | Set pen width |

### Control
| Command | Description |
|---------|-------------|
| `REPEAT n [...]` | Repeat commands n times |
| `IF cond [...]` | Execute if condition is true |
| `TO name ... END` | Define a procedure |

See the in-app **Help** button for the complete command reference.

## Saving Your Work

- **Auto-save**: Your code is automatically saved to your browser
- **Save button**: Download your project as a `.logo` file
- **Load button**: Open a previously saved `.logo` file

## Running Locally

1. Download or clone this repository
2. Open `index.html` in your browser
3. That's it! No build step required.

## Support This Project

LogoLab is free and open source. If you find it useful, please consider:

- ☕ [Buy me a coffee on Ko-fi](https://ko-fi.com/cyborgninja)
- ⭐ Star this repository
- 📢 Share with teachers and students

## Attribution

This project is inspired by [FMSLogo](https://fmslogo.sourceforge.io/), a wonderful free implementation of Logo. We thank the FMSLogo team for keeping Logo alive for generations of students.

LogoLab is an independent web-based implementation and does not use any FMSLogo code.

## License

MIT License - feel free to use, modify, and distribute.

---

Made with ❤️ for students everywhere.
