# Maze Runner - A Maze Solving Browser Game
This is a browser game where your objective is to run through a randomly generated maze and solve it as fast as possible (reach the blue orb that marks the end of the maze). Or if you just want to sit back and relax, you can press the "Solve" button and watch an algorithm solve the maze for you. The algorithm is slowed down so you can watch how it works its way through the maze. But then of course, after you use the automatic maze solver, even if you finish the maze you won't get any score :) You can also customize the game. You can change the player speed, the maze size, the thickness of the walls, or the speed of the maze solving animation!

## Settings
Negative values result in funny behavior, I could have disabled them, but I find them fun to play around with :) (Sometimes they break the game though.)

**Player Speed** – How fast can the player move (relative to Maze Grid Size).

**Maze Grid Size** – How big the maze generated is. Imagine the maze is a square grid. This setting determines the number of tiles in one row or one column. Minimal size is 2, anything smaller than that will be force set to 2. WARNING: High numbers (approximately 70+) may result in a "maximum recursion limit reached" error which crashes the program and you will have to refresh the page.

**Maze Thickness** – How thick the walls of the maze are.

**Solve Delay** – How much delay there is between 2 steps of the maze solving algorithm.
