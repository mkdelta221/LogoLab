/**
 * LogoLab - Turtle Graphics Engine
 * Handles canvas rendering and turtle state management.
 */

class TurtleGraphics {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Canvas settings
        this.backgroundColor = '#ffffff';
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;

        // Multiple turtles support
        this.turtles = {};
        this.currentTurtleId = 0;

        // Initialize default turtle
        this.initTurtle(0);

        // Drawing state
        this.mode = 'wrap'; // wrap, window, fence
        this.commands = []; // History for redraw

        // Fill state
        this.filling = false;
        this.fillCommands = [];
        this.fillStartX = 0;
        this.fillStartY = 0;
        this.fillColor = '#000000';

        // Animation
        this.animationFrame = null;

        // Initialize
        this.resize();
        this.clear();
    }

    initTurtle(id) {
        this.turtles[id] = {
            x: 0,
            y: 0,
            heading: 0, // 0 = up, 90 = right
            penDown: true,
            penColor: '#000000',
            penSize: 1,
            penMode: 'paint', // paint, erase
            visible: true
        };
    }

    // Current turtle getter
    get currentTurtle() {
        return this.turtles[this.currentTurtleId];
    }

    // Convenience getters for current turtle
    get x() { return this.currentTurtle.x; }
    get y() { return this.currentTurtle.y; }
    get heading() { return this.currentTurtle.heading; }
    get penSize() { return this.currentTurtle.penSize; }
    get penColor() { return this.currentTurtle.penColor; }

    // Multiple turtle methods
    tell(id) {
        if (Array.isArray(id)) {
            id = id[0]; // For now, just use first turtle in list
        }
        if (!this.turtles[id]) {
            this.initTurtle(id);
        }
        this.currentTurtleId = id;
        this.draw();
    }

    getTurtleIds() {
        return Object.keys(this.turtles).map(Number);
    }

    // Canvas methods
    resize() {
        const container = this.canvas.parentElement;
        const padding = 10;
        const maxWidth = container.clientWidth - padding;
        const maxHeight = container.clientHeight - padding;

        // Use a 4:3 aspect ratio, fitting in container
        let width = maxWidth;
        let height = width * 0.75;

        if (height > maxHeight) {
            height = maxHeight;
            width = height / 0.75;
        }

        // Responsive minimum size based on container
        // Allow smaller canvas on small phones (min 280px)
        const minWidth = Math.min(280, maxWidth);
        width = Math.max(minWidth, Math.min(800, width));
        height = Math.max(minWidth * 0.75, Math.min(600, height));

        this.canvas.width = width;
        this.canvas.height = height;

        this.centerX = width / 2;
        this.centerY = height / 2;

        this.redraw();
    }

    // Convert Logo coordinates to canvas coordinates
    toCanvasX(x) {
        return this.centerX + (x + this.panX) * this.zoom;
    }

    toCanvasY(y) {
        return this.centerY - (y + this.panY) * this.zoom;
    }

    // Convert canvas coordinates to Logo coordinates
    toLogoX(canvasX) {
        return (canvasX - this.centerX) / this.zoom - this.panX;
    }

    toLogoY(canvasY) {
        return -(canvasY - this.centerY) / this.zoom - this.panY;
    }

    // Movement commands
    forward(distance) {
        const turtle = this.currentTurtle;
        const radians = (turtle.heading - 90) * Math.PI / 180;
        const newX = turtle.x + distance * Math.cos(radians);
        const newY = turtle.y - distance * Math.sin(radians);

        this.moveTo(newX, newY);
    }

    back(distance) {
        this.forward(-distance);
    }

    left(angle) {
        const turtle = this.currentTurtle;
        turtle.heading = (turtle.heading - angle) % 360;
        if (turtle.heading < 0) turtle.heading += 360;
        this.draw();
    }

    right(angle) {
        const turtle = this.currentTurtle;
        turtle.heading = (turtle.heading + angle) % 360;
        this.draw();
    }

    home() {
        this.moveTo(0, 0);
        this.currentTurtle.heading = 0;
        this.draw();
    }

    setPosition(x, y) {
        this.moveTo(x, y);
    }

    setX(x) {
        this.moveTo(x, this.currentTurtle.y);
    }

    setY(y) {
        this.moveTo(this.currentTurtle.x, y);
    }

    setHeading(angle) {
        this.currentTurtle.heading = angle % 360;
        if (this.currentTurtle.heading < 0) this.currentTurtle.heading += 360;
        this.draw();
    }

    moveTo(newX, newY) {
        const turtle = this.currentTurtle;
        const oldX = turtle.x;
        const oldY = turtle.y;

        // Handle screen modes
        if (this.mode === 'wrap') {
            // Wrap around edges
            const halfWidth = this.canvas.width / (2 * this.zoom);
            const halfHeight = this.canvas.height / (2 * this.zoom);

            // Draw line segments across wraps
            let x = oldX, y = oldY;
            const dx = newX - oldX;
            const dy = newY - oldY;
            // Ensure at least 1 step so small movements still draw
            const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 10));

            for (let i = 1; i <= steps; i++) {
                const nextX = oldX + (dx * i / steps);
                const nextY = oldY + (dy * i / steps);

                if (turtle.penDown) {
                    this.drawLine(x, y, nextX, nextY);
                }

                x = nextX;
                y = nextY;

                // Wrap coordinates
                while (x > halfWidth) x -= halfWidth * 2;
                while (x < -halfWidth) x += halfWidth * 2;
                while (y > halfHeight) y -= halfHeight * 2;
                while (y < -halfHeight) y += halfHeight * 2;
            }

            // Final wrap
            while (newX > halfWidth) newX -= halfWidth * 2;
            while (newX < -halfWidth) newX += halfWidth * 2;
            while (newY > halfHeight) newY -= halfHeight * 2;
            while (newY < -halfHeight) newY += halfHeight * 2;

            turtle.x = newX;
            turtle.y = newY;

        } else if (this.mode === 'fence') {
            // Stop at edges
            const halfWidth = this.canvas.width / (2 * this.zoom);
            const halfHeight = this.canvas.height / (2 * this.zoom);

            newX = Math.max(-halfWidth, Math.min(halfWidth, newX));
            newY = Math.max(-halfHeight, Math.min(halfHeight, newY));

            if (turtle.penDown) {
                this.drawLine(oldX, oldY, newX, newY);
            }
            turtle.x = newX;
            turtle.y = newY;

        } else {
            // Window mode - allow going beyond edges
            if (turtle.penDown) {
                this.drawLine(oldX, oldY, newX, newY);
            }
            turtle.x = newX;
            turtle.y = newY;
        }

        this.draw();
    }

    drawLine(x1, y1, x2, y2) {
        const turtle = this.currentTurtle;
        const command = {
            type: 'line',
            x1, y1, x2, y2,
            color: turtle.penColor,
            size: turtle.penSize,
            mode: turtle.penMode
        };
        this.commands.push(command);
        this.executeCommand(command);

        // Track for filling
        if (this.filling) {
            this.fillCommands.push(command);
        }
    }

    executeCommand(cmd) {
        if (cmd.type === 'line') {
            this.ctx.beginPath();
            this.ctx.moveTo(this.toCanvasX(cmd.x1), this.toCanvasY(cmd.y1));
            this.ctx.lineTo(this.toCanvasX(cmd.x2), this.toCanvasY(cmd.y2));
            this.ctx.strokeStyle = cmd.mode === 'erase' ? this.backgroundColor : cmd.color;
            this.ctx.lineWidth = cmd.size * this.zoom;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
        } else if (cmd.type === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(
                this.toCanvasX(cmd.x),
                this.toCanvasY(cmd.y),
                Math.abs(cmd.radius) * this.zoom,
                0,
                2 * Math.PI
            );
            if (cmd.filled) {
                this.ctx.fillStyle = cmd.color;
                this.ctx.fill();
            }
            this.ctx.strokeStyle = cmd.mode === 'erase' ? this.backgroundColor : cmd.color;
            this.ctx.lineWidth = cmd.size * this.zoom;
            this.ctx.stroke();
        } else if (cmd.type === 'arc') {
            this.ctx.beginPath();
            this.ctx.arc(
                this.toCanvasX(cmd.centerX),
                this.toCanvasY(cmd.centerY),
                cmd.radius * this.zoom,
                -cmd.startAngle, // Negate because canvas Y is inverted
                -cmd.endAngle,
                !cmd.counterclockwise // Invert because canvas Y is inverted
            );
            this.ctx.strokeStyle = cmd.mode === 'erase' ? this.backgroundColor : cmd.color;
            this.ctx.lineWidth = cmd.size * this.zoom;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        } else if (cmd.type === 'fill') {
            this.ctx.beginPath();
            this.ctx.moveTo(this.toCanvasX(cmd.startX), this.toCanvasY(cmd.startY));

            for (const subCmd of cmd.commands) {
                if (subCmd.type === 'line') {
                    this.ctx.lineTo(this.toCanvasX(subCmd.x2), this.toCanvasY(subCmd.y2));
                } else if (subCmd.type === 'arc') {
                    this.ctx.arc(
                        this.toCanvasX(subCmd.centerX),
                        this.toCanvasY(subCmd.centerY),
                        subCmd.radius * this.zoom,
                        -subCmd.startAngle,
                        -subCmd.endAngle,
                        !subCmd.counterclockwise
                    );
                } else if (subCmd.type === 'circle') {
                    // For filled circles within a path, draw separately
                    this.ctx.moveTo(
                        this.toCanvasX(subCmd.x) + Math.abs(subCmd.radius) * this.zoom,
                        this.toCanvasY(subCmd.y)
                    );
                    this.ctx.arc(
                        this.toCanvasX(subCmd.x),
                        this.toCanvasY(subCmd.y),
                        Math.abs(subCmd.radius) * this.zoom,
                        0,
                        2 * Math.PI
                    );
                }
            }

            this.ctx.closePath();
            this.ctx.fillStyle = cmd.color;
            this.ctx.fill();
        }
    }

    // Pen commands
    penUp() {
        this.currentTurtle.penDown = false;
    }

    penDown() {
        this.currentTurtle.penDown = true;
    }

    setPenColor(color) {
        this.currentTurtle.penColor = color;
    }

    setPenSize(size) {
        this.currentTurtle.penSize = Math.max(1, size);
    }

    penErase() {
        this.currentTurtle.penMode = 'erase';
    }

    penPaint() {
        this.currentTurtle.penMode = 'paint';
    }

    // Circle and arc drawing
    circle(radius) {
        const turtle = this.currentTurtle;
        const command = {
            type: 'circle',
            x: turtle.x,
            y: turtle.y,
            radius: radius,
            color: turtle.penColor,
            size: turtle.penSize,
            mode: turtle.penMode,
            filled: this.filling
        };
        this.commands.push(command);
        this.executeCommand(command);

        // If filling, add to fill path
        if (this.filling) {
            this.fillCommands.push(command);
        }
        this.draw();
    }

    arc(angle, radius) {
        const turtle = this.currentTurtle;
        // Arc draws from current position, moving the turtle along the arc
        // Positive angle = counterclockwise (left), negative = clockwise (right)
        const startAngle = (turtle.heading - 90) * Math.PI / 180;
        const arcRadians = angle * Math.PI / 180;

        // Calculate arc center (perpendicular to turtle direction)
        const perpAngle = startAngle + Math.PI / 2; // 90 degrees to the left
        const centerX = turtle.x + radius * Math.cos(perpAngle);
        const centerY = turtle.y - radius * Math.sin(perpAngle);

        // Calculate end position
        const endAngle = startAngle - arcRadians;
        const newX = centerX - radius * Math.cos(perpAngle - arcRadians);
        const newY = centerY + radius * Math.sin(perpAngle - arcRadians);

        if (turtle.penDown) {
            const command = {
                type: 'arc',
                centerX: centerX,
                centerY: centerY,
                radius: Math.abs(radius),
                startAngle: startAngle - Math.PI / 2,
                endAngle: startAngle - Math.PI / 2 - arcRadians,
                counterclockwise: angle > 0,
                color: turtle.penColor,
                size: turtle.penSize,
                mode: turtle.penMode
            };
            this.commands.push(command);
            this.executeCommand(command);

            if (this.filling) {
                this.fillCommands.push(command);
            }
        }

        // Move turtle to end of arc and update heading
        turtle.x = newX;
        turtle.y = newY;
        turtle.heading = (turtle.heading + angle) % 360;
        if (turtle.heading < 0) turtle.heading += 360;

        this.draw();
    }

    // Fill support
    beginFill() {
        this.filling = true;
        this.fillCommands = [];
        this.fillStartX = this.currentTurtle.x;
        this.fillStartY = this.currentTurtle.y;
        this.fillColor = this.currentTurtle.penColor;
    }

    endFill() {
        if (!this.filling) return;

        this.filling = false;

        // Create a fill command from collected path
        if (this.fillCommands.length > 0) {
            const command = {
                type: 'fill',
                commands: [...this.fillCommands],
                color: this.fillColor,
                startX: this.fillStartX,
                startY: this.fillStartY
            };
            this.commands.push(command);
            this.executeCommand(command);
        }

        this.fillCommands = [];
        this.draw();
    }

    setBackground(color) {
        this.backgroundColor = color;
        this.redraw();
    }

    // Screen commands
    clearScreen() {
        // Reset all turtles first (before clearing commands, to avoid drawing lines)
        for (const id in this.turtles) {
            this.turtles[id].x = 0;
            this.turtles[id].y = 0;
            this.turtles[id].heading = 0;
            this.turtles[id].penDown = true;
            this.turtles[id].penColor = '#000000';
            this.turtles[id].penSize = 1;
            this.turtles[id].penMode = 'paint';
            this.turtles[id].visible = true;
        }
        // Now clear commands and redraw
        this.commands = [];
        this.redraw();
    }

    clean() {
        this.commands = [];
        this.redraw();
    }

    hideTurtle() {
        this.currentTurtle.visible = false;
        this.draw();
    }

    showTurtle() {
        this.currentTurtle.visible = true;
        this.draw();
    }

    setMode(mode) {
        this.mode = mode;
    }

    // Zoom and pan
    zoomIn() {
        this.zoom = Math.min(4, this.zoom * 1.2);
        this.redraw();
    }

    zoomOut() {
        this.zoom = Math.max(0.25, this.zoom / 1.2);
        this.redraw();
    }

    resetView() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.redraw();
    }

    // Drawing
    clear() {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    redraw() {
        this.clear();

        // Redraw all commands
        for (const cmd of this.commands) {
            this.executeCommand(cmd);
        }

        // Draw all turtles
        this.drawTurtles();
    }

    draw() {
        // Just redraw turtles (lines are drawn immediately)
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.animationFrame = requestAnimationFrame(() => {
            this.redraw();
        });
    }

    drawTurtles() {
        for (const id in this.turtles) {
            const turtle = this.turtles[id];
            if (turtle.visible) {
                this.drawTurtle(turtle);
            }
        }
    }

    drawTurtle(turtle) {
        const x = this.toCanvasX(turtle.x);
        const y = this.toCanvasY(turtle.y);
        const size = 15 * this.zoom;
        const angle = (turtle.heading - 90) * Math.PI / 180;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        // Draw turtle shape (arrow/triangle)
        this.ctx.beginPath();
        this.ctx.moveTo(size, 0);
        this.ctx.lineTo(-size * 0.7, -size * 0.5);
        this.ctx.lineTo(-size * 0.4, 0);
        this.ctx.lineTo(-size * 0.7, size * 0.5);
        this.ctx.closePath();

        this.ctx.fillStyle = turtle.penColor;
        this.ctx.fill();
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.restore();
    }

    // Full reset
    reset() {
        this.commands = [];
        this.turtles = {};
        this.currentTurtleId = 0;
        this.initTurtle(0);
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.backgroundColor = '#ffffff';
        this.mode = 'wrap';
        this.redraw();
    }

    // Get coordinates at canvas position
    getCoordinates(canvasX, canvasY) {
        return {
            x: Math.round(this.toLogoX(canvasX)),
            y: Math.round(this.toLogoY(canvasY))
        };
    }

    // Export canvas as image
    exportImage(hideTurtle = true) {
        // Temporarily hide turtles if requested
        const turtleVisibility = {};
        if (hideTurtle) {
            for (const id in this.turtles) {
                turtleVisibility[id] = this.turtles[id].visible;
                this.turtles[id].visible = false;
            }
            this.redraw();
        }

        // Get canvas data
        const dataURL = this.canvas.toDataURL('image/png');

        // Restore turtle visibility
        if (hideTurtle) {
            for (const id in this.turtles) {
                this.turtles[id].visible = turtleVisibility[id];
            }
            this.redraw();
        }

        return dataURL;
    }

    // Download canvas as image file
    downloadImage(filename = 'logolab-drawing') {
        const dataURL = this.exportImage(true);
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `${filename}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TurtleGraphics;
}
