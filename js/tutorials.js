/**
 * LogoLab - Interactive Tutorials
 * Provides step-by-step lessons for learning Logo programming.
 */

const TUTORIALS = {
    1: {
        title: "Moving the Turtle",
        content: `
            <h3>Welcome to Logo!</h3>
            <p>Logo uses a "turtle" - a small arrow that can move around and draw. Think of it like a robot holding a pen!</p>

            <h4>Basic Movement Commands</h4>
            <table class="tutorial-table">
                <tr><td><code>FORWARD 100</code> or <code>FD 100</code></td><td>Move forward 100 steps</td></tr>
                <tr><td><code>BACK 50</code> or <code>BK 50</code></td><td>Move backward 50 steps</td></tr>
                <tr><td><code>RIGHT 90</code> or <code>RT 90</code></td><td>Turn right 90 degrees</td></tr>
                <tr><td><code>LEFT 90</code> or <code>LT 90</code></td><td>Turn left 90 degrees</td></tr>
                <tr><td><code>HOME</code></td><td>Return to the center</td></tr>
            </table>

            <h4>Try It!</h4>
            <p>Type these commands and click Run:</p>
            <pre class="tutorial-code">FD 100
RT 90
FD 50</pre>
            <button class="btn btn-primary try-code" data-code="FD 100\nRT 90\nFD 50">Load this code</button>

            <h4>Challenge</h4>
            <p>Can you make the turtle draw an "L" shape?</p>
        `
    },
    2: {
        title: "Drawing Shapes",
        content: `
            <h3>Drawing Basic Shapes</h3>
            <p>To draw a shape, we move forward and turn, then repeat!</p>

            <h4>Drawing a Square</h4>
            <p>A square has 4 sides and 4 corners. Each corner is a 90-degree turn.</p>
            <pre class="tutorial-code">FD 100
RT 90
FD 100
RT 90
FD 100
RT 90
FD 100
RT 90</pre>
            <button class="btn btn-primary try-code" data-code="FD 100\nRT 90\nFD 100\nRT 90\nFD 100\nRT 90\nFD 100\nRT 90">Load this code</button>

            <h4>Drawing a Triangle</h4>
            <p>A triangle has 3 sides. Each turn is 120 degrees (360 / 3 = 120).</p>
            <pre class="tutorial-code">FD 100
RT 120
FD 100
RT 120
FD 100
RT 120</pre>
            <button class="btn btn-primary try-code" data-code="FD 100\nRT 120\nFD 100\nRT 120\nFD 100\nRT 120">Load this code</button>

            <h4>The Pattern</h4>
            <p>Notice the pattern? To draw any regular shape:</p>
            <ul>
                <li>Turn angle = 360 / number of sides</li>
                <li>Repeat: move forward, then turn</li>
            </ul>

            <h4>Challenge</h4>
            <p>Can you draw a hexagon (6 sides)? Hint: 360 / 6 = 60</p>
        `
    },
    3: {
        title: "Colors & Pen",
        content: `
            <h3>Adding Color!</h3>
            <p>Make your drawings colorful with pen commands.</p>

            <h4>Pen Commands</h4>
            <table class="tutorial-table">
                <tr><td><code>SETPC "red</code></td><td>Set pen color to red</td></tr>
                <tr><td><code>SETPENSIZE 3</code></td><td>Set pen width to 3</td></tr>
                <tr><td><code>PENUP</code> or <code>PU</code></td><td>Lift pen (stop drawing)</td></tr>
                <tr><td><code>PENDOWN</code> or <code>PD</code></td><td>Lower pen (start drawing)</td></tr>
            </table>

            <h4>Available Colors</h4>
            <p><code>red</code>, <code>blue</code>, <code>green</code>, <code>yellow</code>, <code>orange</code>, <code>purple</code>, <code>pink</code>, <code>cyan</code>, <code>black</code>, <code>white</code></p>

            <h4>Try It!</h4>
            <pre class="tutorial-code">SETPC "red
SETPENSIZE 3
FD 100
RT 90
SETPC "blue
FD 100</pre>
            <button class="btn btn-primary try-code" data-code='SETPC "red\nSETPENSIZE 3\nFD 100\nRT 90\nSETPIC "blue\nFD 100'>Load this code</button>

            <h4>Moving Without Drawing</h4>
            <p>Use PENUP to move without drawing, then PENDOWN to start drawing again:</p>
            <pre class="tutorial-code">FD 50
PU
FD 50
PD
FD 50</pre>
            <button class="btn btn-primary try-code" data-code="FD 50\nPU\nFD 50\nPD\nFD 50">Load this code</button>

            <h4>Challenge</h4>
            <p>Draw a traffic light: three circles (red, yellow, green) stacked vertically!</p>
        `
    },
    4: {
        title: "Loops with REPEAT",
        content: `
            <h3>The Power of REPEAT</h3>
            <p>Instead of typing the same commands over and over, use REPEAT!</p>

            <h4>REPEAT Syntax</h4>
            <pre class="tutorial-code">REPEAT 4 [FD 100 RT 90]</pre>
            <p>This means: "Do FD 100 RT 90 four times" - it draws a square!</p>
            <button class="btn btn-primary try-code" data-code="REPEAT 4 [FD 100 RT 90]">Load this code</button>

            <h4>Drawing Different Shapes</h4>
            <pre class="tutorial-code">; Triangle
REPEAT 3 [FD 100 RT 120]

; Pentagon
PU FD 150 PD
REPEAT 5 [FD 80 RT 72]

; Hexagon
PU HOME RT 90 FD 150 LT 90 PD
REPEAT 6 [FD 60 RT 60]</pre>
            <button class="btn btn-primary try-code" data-code="; Triangle\nREPEAT 3 [FD 100 RT 120]\n\n; Pentagon\nPU FD 150 PD\nREPEAT 5 [FD 80 RT 72]\n\n; Hexagon\nPU HOME RT 90 FD 150 LT 90 PD\nREPEAT 6 [FD 60 RT 60]">Load this code</button>

            <h4>Drawing a Star</h4>
            <pre class="tutorial-code">SETPC "gold
REPEAT 5 [FD 100 RT 144]</pre>
            <button class="btn btn-primary try-code" data-code='SETPC "gold\nREPEAT 5 [FD 100 RT 144]'>Load this code</button>

            <h4>Nested REPEAT</h4>
            <p>You can put REPEAT inside REPEAT for amazing patterns!</p>
            <pre class="tutorial-code">REPEAT 36 [
  REPEAT 4 [FD 50 RT 90]
  RT 10
]</pre>
            <button class="btn btn-primary try-code" data-code="REPEAT 36 [\n  REPEAT 4 [FD 50 RT 90]\n  RT 10\n]">Load this code</button>

            <h4>Challenge</h4>
            <p>Make a spiral using REPEAT and increasing distances!</p>
        `
    },
    5: {
        title: "Creating Procedures",
        content: `
            <h3>Make Your Own Commands!</h3>
            <p>Procedures let you create reusable commands with TO...END.</p>

            <h4>Your First Procedure</h4>
            <pre class="tutorial-code">TO SQUARE
  REPEAT 4 [FD 100 RT 90]
END

SQUARE</pre>
            <button class="btn btn-primary try-code" data-code="TO SQUARE\n  REPEAT 4 [FD 100 RT 90]\nEND\n\nSQUARE">Load this code</button>

            <h4>Procedures with Parameters</h4>
            <p>Use :name to pass values to your procedure:</p>
            <pre class="tutorial-code">TO SQUARE :size
  REPEAT 4 [FD :size RT 90]
END

SQUARE 50
PU FD 80 PD
SQUARE 100</pre>
            <button class="btn btn-primary try-code" data-code="TO SQUARE :size\n  REPEAT 4 [FD :size RT 90]\nEND\n\nSQUARE 50\nPU FD 80 PD\nSQUARE 100">Load this code</button>

            <h4>A Polygon Procedure</h4>
            <pre class="tutorial-code">TO POLYGON :sides :size
  REPEAT :sides [
    FD :size
    RT 360 / :sides
  ]
END

SETPC "red
POLYGON 3 80
PU RT 90 FD 120 LT 90 PD
SETPC "blue
POLYGON 6 50</pre>
            <button class="btn btn-primary try-code" data-code='TO POLYGON :sides :size\n  REPEAT :sides [\n    FD :size\n    RT 360 / :sides\n  ]\nEND\n\nSETPC "red\nPOLYGON 3 80\nPU RT 90 FD 120 LT 90 PD\nSETPC "blue\nPOLYGON 6 50'>Load this code</button>

            <h4>Challenge</h4>
            <p>Create a STAR procedure that takes a size parameter!</p>
        `
    },
    6: {
        title: "Variables",
        content: `
            <h3>Storing Values with Variables</h3>
            <p>Variables let you store and reuse values.</p>

            <h4>Creating Variables</h4>
            <pre class="tutorial-code">MAKE "size 100
FD :size
RT 90
FD :size</pre>
            <button class="btn btn-primary try-code" data-code='MAKE "size 100\nFD :size\nRT 90\nFD :size'>Load this code</button>

            <h4>Variable Syntax</h4>
            <table class="tutorial-table">
                <tr><td><code>MAKE "name value</code></td><td>Create or set a variable</td></tr>
                <tr><td><code>:name</code></td><td>Get the variable's value</td></tr>
            </table>

            <h4>Using Math with Variables</h4>
            <pre class="tutorial-code">MAKE "size 20
REPEAT 10 [
  FD :size
  RT 90
  FD :size
  RT 90
  FD :size
  RT 90
  FD :size
  RT 90
  MAKE "size :size + 10
  RT 36
]</pre>
            <button class="btn btn-primary try-code" data-code='MAKE "size 20\nREPEAT 10 [\n  FD :size\n  RT 90\n  FD :size\n  RT 90\n  FD :size\n  RT 90\n  FD :size\n  RT 90\n  MAKE "size :size + 10\n  RT 36\n]'>Load this code</button>

            <h4>Recursive Procedures</h4>
            <p>Procedures can call themselves!</p>
            <pre class="tutorial-code">TO SPIRAL :size
  IF :size > 200 [STOP]
  FD :size
  RT 91
  SPIRAL :size + 2
END

SPIRAL 1</pre>
            <button class="btn btn-primary try-code" data-code="TO SPIRAL :size\n  IF :size > 200 [STOP]\n  FD :size\n  RT 91\n  SPIRAL :size + 2\nEND\n\nSPIRAL 1">Load this code</button>

            <h4>Congratulations!</h4>
            <p>You've learned the basics of Logo programming! Keep experimenting and creating amazing art!</p>
        `
    }
};

class TutorialManager {
    constructor() {
        this.currentLesson = 1;
    }

    getLesson(lessonNum) {
        return TUTORIALS[lessonNum] || TUTORIALS[1];
    }

    getLessonContent(lessonNum) {
        const lesson = this.getLesson(lessonNum);
        return lesson.content;
    }

    getLessonTitle(lessonNum) {
        const lesson = this.getLesson(lessonNum);
        return lesson.title;
    }

    getTotalLessons() {
        return Object.keys(TUTORIALS).length;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TUTORIALS, TutorialManager };
}
