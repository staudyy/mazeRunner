// SETTINGS

// TODO
// Clean up unused stuff and texts
// Make maze solver
// Make settings / upgrades

//NEW STUFF
var DEF_SPEED = 8
var MAZE_SIZE = 12
var DEF_MAZE_THICKNESS = 10
var SOLUTION_DRAW_DELAY = 50

//Game vars
var score = 0

// to engine
var DEF_GRAVITY = 0
var DEF_GRAVITY_X = 0
var BOUNCINESS = 0
var FRICTION = 1
var FRICTION_STATIC = 1
var FRICTION_AIR = 1
var RESTING = 0.1  //autism jednotka proste cim menej tym presnejsie bounces default: 4
var POSITION_ITER = 30  //makes stacking more stable, default: 6

// Colors
const BG_COLOR = 0xebac54
const PADDING_COLOR = 0x4a4640
const MAZE_COLOR = 0x000000
const BUTTON_COLOR = 0x701340
const BUTTON_HOVER_COLOR = 0x991153
// const FINISH_COLOR = 0x34e03f
const FINISH_COLOR = 0x008cff
const SOLVE_GOOD_COLOR = 0x09d617
const SOLVE_BAD_COLOR = 0xec3d3d

// Changeable
var GAME_SIDES_RATIO = 1  // 0.5;  WIDTH : HEIGHT (1 = square) -> WIDTH == 0.5*HEIGHT

const PADDING_TOP_RATIO = 1/20
const PADDING_BOTTOM_RATIO = 1/15
const PADDING_SIDES_RATIO = 1/20



//Calculate needed constants
//need recount
let DPR
let WIDTH
let HEIGHT

let SCALE_RATIO

let FIXED_PADDING_TOP
let FIXED_PADDING_BOTTOM
let FIXED_PADDING_SIDE

let MIN_GAME_WIDTH
let MIN_GAME_HEIGHT

let PADDING_TOP
let PADDING_BOTTOM
let PADDING_SIDE

let GAME_WIDTH
let GAME_HEIGHT

let GAME_SCALE_RATIO

let SPEED
let MAZE_THICKNESS

let GRAVITY
let GRAVITY_X

let FONT
let COLORS

function recount_scaleable() {
    // Part 1 of calculations
    DPR = window.devicePixelRatio
    WIDTH = window.innerWidth * DPR
    HEIGHT = window.innerHeight * DPR

    SCALE_RATIO = HEIGHT / 1000

    FIXED_PADDING_TOP = HEIGHT * PADDING_TOP_RATIO
    FIXED_PADDING_BOTTOM = HEIGHT * PADDING_BOTTOM_RATIO
    FIXED_PADDING_SIDE = WIDTH * (PADDING_SIDES_RATIO / 2)

    MIN_GAME_WIDTH = WIDTH - 2 * FIXED_PADDING_SIDE
    MIN_GAME_HEIGHT = HEIGHT - FIXED_PADDING_TOP - FIXED_PADDING_BOTTOM

    // Game ratio stuff
    if (MIN_GAME_WIDTH >= GAME_SIDES_RATIO * MIN_GAME_HEIGHT) {  //Too wide
        PADDING_TOP = FIXED_PADDING_TOP
        PADDING_BOTTOM = FIXED_PADDING_BOTTOM
        PADDING_SIDE = FIXED_PADDING_SIDE + (MIN_GAME_WIDTH - GAME_SIDES_RATIO * MIN_GAME_HEIGHT) / 2
    
    } else {  //Too high (WIDTH < RATIO*HEIGHT)
        PADDING_TOP = FIXED_PADDING_TOP + (MIN_GAME_HEIGHT - MIN_GAME_WIDTH / GAME_SIDES_RATIO) / 2
        PADDING_BOTTOM = FIXED_PADDING_BOTTOM + (MIN_GAME_HEIGHT - MIN_GAME_WIDTH / GAME_SIDES_RATIO) / 2
        PADDING_SIDE = FIXED_PADDING_SIDE
    }
    
    GAME_WIDTH = WIDTH - 2 * PADDING_SIDE
    GAME_HEIGHT = HEIGHT - PADDING_TOP - PADDING_BOTTOM
    
    GAME_SCALE_RATIO = GAME_HEIGHT / 1000
    
    // MAX_QUEUE_HEIGHT = 55 * SCALE_RATIO
    // GAME_LINE_HEIGHT = PADDING_TOP + GAME_SCALE_RATIO * 150
    // FRUIT_SPAWN_PADDING = 10 * GAME_SCALE_RATIO

    // // Colors
    // COLORS = []
    // for (let i = 0; i < DIAMETERS.length; i++) {
    //     COLORS.push(getRandomColor())
    // }

    // Gravity
    GRAVITY = DEF_GRAVITY*GAME_SCALE_RATIO
    GRAVITY_X = DEF_GRAVITY_X*GAME_SCALE_RATIO

    // Font
    FONT = {
        fontSize: 25*SCALE_RATIO,
        fontFamily: 'LocalComicSans, Comic Sans MS, Comic Sans, Verdana, serif',
        color: "white"
    }

    if (MAZE_SIZE < 2) {
        MAZE_SIZE = 2
    }

    SPEED = DEF_SPEED * GAME_SCALE_RATIO
    MAZE_THICKNESS = DEF_MAZE_THICKNESS * GAME_SCALE_RATIO

    SPEED = SPEED * ((GAME_WIDTH / MAZE_SIZE) / 100)
}

recount_scaleable()


function windowResize() {
    // recount disabled cuz nechcem forcovat restart
    // recount_scaleable()
    game.scale.setGameSize(WIDTH, HEIGHT)
    game.scale.displaySize.resize(WIDTH, HEIGHT);

    // game.scene.scenes.forEach((scene) => {
    //     const key = scene.scene.key;
    //     game.scene.stop(key);
    // })
    // game.scene.start('Menu');
}

function randint(start, stop) {
    return Math.floor(Math.random() * (stop - start + 1)) + start;
}

function getRandomColor() {
    var letters = '23456789ABCD';
    var color = '0x';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}



class MazeTile {
    constructor() {
        this.visited = false
        this.walls = {
            up: true,
            down: true,
            left: true,
            right: true
        }
        this.merged = {
            up: false,
            down: false,
            left: false,
            right: false
        }
    }
}


class Maze {
    constructor(width, height, to_delete_chance=0) {
        this.maze = [];  // Access as this.maze[y][x]
        this.width = width;
        this.height = height;
        
        if (this.width <= 0 || this.height <= 0) {
            return
        }

        this.populate()
        this.create_maze()
        if (0 < to_delete_chance <= 100) {
            this.empty_percentage(to_delete_chance)
        }
    }

    populate() {
        for (let i = 0; i < this.height; i++) {
            let row = []
            for (let j = 0; j < this.width; j++) {
                row.push(new MazeTile())
            }
            this.maze.push(row)
        }
    }

    clear_visit() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.maze[y][x].visited = false
            }
        }
    }

    _change_wall(x, y, wall, action) {
        if (wall == "right" && x + 1 < this.width) {
            this.maze[y][x].walls.right = action
            this.maze[y][x+1].walls.left = action

        } else if (wall == "left" && x - 1 >= 0) {
            this.maze[y][x].walls.left = action
            this.maze[y][x-1].walls.right = action

        } else if (wall == "down" && y + 1 < this.height) {
            this.maze[y][x].walls.down = action
            this.maze[y+1][x].walls.up = action

        } else if (wall == "up" && y - 1 >= 0) {
            this.maze[y][x].walls.up = action
            this.maze[y-1][x].walls.down = action

        }
    }

    _maze_recursive(x, y) {
        this.maze[y][x].visited = true

        let keys = Object.keys(this.maze[y][x].walls).filter(k => this.maze[y][x].walls[k])
        keys.sort(() => 0.5 - Math.random())

        while (keys.length > 0) {
            let key = keys.pop()
            if (key == "right" && x + 1 < this.width && !this.maze[y][x+1].visited) {
                this._change_wall(x, y, "right", false)
                this._maze_recursive(x+1, y)
            
            } else if (key == "left" && x - 1 >= 0 && !this.maze[y][x-1].visited) {
                this._change_wall(x, y, "left", false)
                this._maze_recursive(x-1, y)

            } else if (key == "down" && y + 1 < this.height && !this.maze[y+1][x].visited) {
                this._change_wall(x, y, "down", false)
                this._maze_recursive(x, y+1)

            } else if (key == "up" && y - 1 >= 0 && !this.maze[y-1][x].visited) {
                this._change_wall(x, y, "up", false)
                this._maze_recursive(x, y-1)

            }
        }

        return
    }

    create_maze() {
        this._maze_recursive(randint(0, this.width-1), randint(0, this.height-1))
    }

    empty_percentage(percentage) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.maze[y][x].walls.right) {
                    let roll = Math.random()
                    if (roll < percentage/100) {
                        this._change_wall(x, y, "right", false)
                    }
                }
                if (this.maze[y][x].walls.left) {
                    let roll = Math.random()
                    if (roll < percentage/100) {
                        this._change_wall(x, y, "left", false)
                    }
                }
                if (this.maze[y][x].walls.up) {
                    let roll = Math.random()
                    if (roll < percentage/100) {
                        this._change_wall(x, y, "up", false)
                    }
                }
                if (this.maze[y][x].walls.down) {
                    let roll = Math.random()
                    if (roll < percentage/100) {
                        this._change_wall(x, y, "down", false)
                    }
                }
            }
        }
    }

    draw(draw_data) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let walls = this.maze[y][x].walls
                
                let canvas_x = draw_data.start_x + x * draw_data.tile_size
                let canvas_y = draw_data.start_y + y * draw_data.tile_size
                if (walls.left) {
                    let wall = draw_data.scene.add.rectangle(canvas_x, canvas_y + draw_data.tile_size/2, draw_data.thickness, draw_data.tile_size + draw_data.thickness, MAZE_COLOR)
                    draw_data.scene.matter.add.gameObject(wall, draw_data.matter_obj)
                }

                if (walls.up) {
                    let wall = draw_data.scene.add.rectangle(canvas_x + draw_data.tile_size/2, canvas_y, draw_data.tile_size + draw_data.thickness, draw_data.thickness, MAZE_COLOR)
                    draw_data.scene.matter.add.gameObject(wall, draw_data.matter_obj)
                }
            }
        }

        // Finish outer wall
        let outer1 = draw_data.scene.add.rectangle(draw_data.start_x + this.width*draw_data.tile_size, draw_data.start_y + (this.height*draw_data.tile_size)/2, draw_data.thickness, this.height*draw_data.tile_size + draw_data.thickness, MAZE_COLOR)
        draw_data.scene.matter.add.gameObject(outer1, draw_data.matter_obj)

        let outer2 = draw_data.scene.add.rectangle(draw_data.start_x + (this.width*draw_data.tile_size)/2, draw_data.start_y + this.height*draw_data.tile_size, this.width*draw_data.tile_size + draw_data.thickness, draw_data.thickness, MAZE_COLOR)
        draw_data.scene.matter.add.gameObject(outer2, draw_data.matter_obj)
    }

    sleep(ms) {
        if (ms <= 0) {
            return
        }
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async _draw_solution_recursive(x, y, x_target, y_target, draw_data) {
        if (!draw_data.scene.scene.isActive()) {  // Active scene check
            return true
        }
        this.maze[y][x].visited = true
        this.color_tile(x, y, SOLVE_GOOD_COLOR, draw_data)
        if (x == x_target && y == y_target) {
            return true
        }
        await this.sleep(SOLUTION_DRAW_DELAY)
        if (!draw_data.scene.scene.isActive()) {  // Active scene check
            return true
        }

        let walls = this.maze[y][x].walls
        let done = false
        if (!walls.left && x - 1 >= 0 && !this.maze[y][x-1].visited) {
            done = await this._draw_solution_recursive(x-1, y, x_target, y_target, draw_data)
            if (done) {
                return true
            }
        }
        if (!walls.right && x + 1 < this.width && !this.maze[y][x+1].visited) {
            done = await this._draw_solution_recursive(x+1, y, x_target, y_target, draw_data)
            if (done) {
                return true
            }
        }
        if (!walls.up && y - 1 >= 0 && !this.maze[y-1][x].visited) {
            done = await this._draw_solution_recursive(x, y-1, x_target, y_target, draw_data)
            if (done) {
                return true
            }
        }
        if (!walls.down && y + 1 < this.height && !this.maze[y+1][x].visited) {
            done = await this._draw_solution_recursive(x, y+1, x_target, y_target, draw_data)
            if (done) {
                return true
            }
        }

        this.color_tile(x, y, SOLVE_BAD_COLOR, draw_data)
        await this.sleep(SOLUTION_DRAW_DELAY)
        if (!draw_data.scene.scene.isActive()) {  // Active scene check
            return true
        }
        return false
    }

    async finish_drawing_nonsolutions(draw_data) {
        for (let y = 0; y < this.height; y++) {
            let colored = false
            for (let x = 0; x < this.width; x++) {
                if (!draw_data.scene.scene.isActive()) {
                    return
                }
                if (!this.maze[y][x].visited) {
                    this.color_tile(x, y, 0xec3d3d, draw_data)
                    colored = true
                }
            }
            if (colored) {
                await this.sleep(SOLUTION_DRAW_DELAY*3)
            }
        }
    }

    async draw_solution(x_target, y_target, draw_data) {  // Can be called only after scene updates for the first time
        this.clear_visit()
        await this._draw_solution_recursive(0, 0, x_target, y_target, draw_data)
        await this.finish_drawing_nonsolutions(draw_data)
    }

    color_tile(x, y, color,  draw_data) {
        let canvas_x = draw_data.start_x + x * draw_data.tile_size
        let canvas_y = draw_data.start_y + y * draw_data.tile_size

        let rect = draw_data.scene.add.rectangle(
            canvas_x + draw_data.tile_size/2,
            canvas_y + draw_data.tile_size/2,
            draw_data.tile_size,
            draw_data.tile_size, color
        )
        rect.setDepth(-10)
        rect.setDepth(rect.depth + 1)
    }

    _farthest_coords_recursive(x, y) { //Returns {depth: depth, x: x, y: y}
        this.maze[y][x].visited = true

        let children_results = [{depth:0}, {depth:0}, {depth:0}, {depth:0}]
        let walls = this.maze[y][x].walls

        let dead_end = true
        if (!walls.right && x + 1 < this.width && !this.maze[y][x+1].visited) {
            dead_end = false
            children_results[0] = this._farthest_coords_recursive(x+1, y)
            children_results[0].depth +=1
        }
        if (!walls.left && x - 1 >= 0 && !this.maze[y][x-1].visited) {
            dead_end = false
            children_results[1] = this._farthest_coords_recursive(x-1, y)
            children_results[1].depth +=1
        }
        if (!walls.down && y + 1 < this.height && !this.maze[y+1][x].visited) {
            dead_end = false
            children_results[2] = this._farthest_coords_recursive(x, y+1)
            children_results[2].depth +=1
        }
        if (!walls.up && y - 1 >= 0 && !this.maze[y-1][x].visited) {
            dead_end = false
            children_results[3] = this._farthest_coords_recursive(x, y-1)
            children_results[3].depth +=1
        }

        let return_obj = {}
        if (dead_end) {
            return_obj.x = x
            return_obj.y = y
            return_obj.depth = 0
        } else {
            let max_depth = -1
            for (let i = 0; i < children_results.length; i++) {
                if (children_results[i].depth > max_depth) {
                    max_depth = children_results[i].depth
                    return_obj = children_results[i]
                }
            }
    
            return_obj.depth = max_depth
        }
        return return_obj
    }

    get_farthest_coords(start_x, start_y) {
        this.clear_visit()
        let result = this._farthest_coords_recursive(start_x, start_y)
        return {x: result.x, y: result.y}
    }
}


class Finish {
    constructor(scene, matter_obj, x, y, size){
        this.scene = scene

        let circle = scene.add.circle(x, y, size, FINISH_COLOR)
        this.finish = scene.matter.add.gameObject(circle, matter_obj)

        this.finish.setOnCollide(this.collision)
    }

    collision(event) {
        if (event.bodyA.gameObject != null && event.bodyA.label == "Finish") {
            event.bodyA.gameObject.destroy()
        } else if (event.bodyB.gameObject != null && event.bodyB.label == "Finish") {
            event.bodyB.gameObject.destroy()
        }
    }
}


class Player {
    constructor(data) {
        this.scene = data.scene

        let player_obj = this.scene.add.sprite(data.x, data.y, data.sprite)

        this.player = this.scene.matter.add.gameObject(player_obj, data.physics_obj)
        this.player.setScale(data.size / 1000)
        this.height = this.player.height * (data.size / 1000)
        this.width = this.player.width * (data.size / 1000)

        // Register Controls
        this.key_up = this.scene.input.keyboard.addKey(data.controls.up);
        this.key_down = this.scene.input.keyboard.addKey(data.controls.down);
        this.key_left = this.scene.input.keyboard.addKey(data.controls.left);
        this.key_right = this.scene.input.keyboard.addKey(data.controls.right);

        // Add collision with bullet check
        // this.player.setOnCollide(this.collision, "hi")
    }

    update() {
        if (!this.player.active) {
            return
        }

        this.player.setFrictionAir(FRICTION_AIR)
        let key_pressed = false
        if(this.key_up.isDown) {
            key_pressed = true
            this.player.setFrictionAir(0)
            this.player.setVelocity(this.player.body.velocity.x, -SPEED)
        } else if(this.key_down.isDown) {
            key_pressed = true
            this.player.setFrictionAir(0)
            this.player.setVelocity(this.player.body.velocity.x, SPEED)
        } else {
            this.player.setVelocity(this.player.body.velocity.x, 0)
        }

        if(this.key_left.isDown) {
            key_pressed = true
            this.player.setFrictionAir(0)
            this.player.setVelocity(-SPEED, this.player.body.velocity.y)
        }
        else if(this.key_right.isDown) {
            key_pressed = true
            this.player.setFrictionAir(0)
            this.player.setVelocity(SPEED, this.player.body.velocity.y)
        } else {
            this.player.setVelocity(0, this.player.body.velocity.y)
        }

        if(key_pressed) {
            // this.tank1.setFrictionAir(0)
        } else {
            // this.tank1.setFrictionAir(FRICTION_AIR)
        }
    }
}



class NumberInput {
    constructor (scene, x, y, width, height, min=null, max=null, step="any") {
        this.input_object = scene.add.dom(x, y).createFromHTML(this.getInputString(width, height, step))
        if (min != null) {
            this.setMin(min)
        }
        if (max != null) {
            this.setMax(max)
        }
    }

    setMin(value) {
        this.input_object.getChildByName("myInput").min = value
    }

    setMax(value) {
        this.input_object.getChildByName("myInput").max = value
    }

    getInputString(width, height, step) {
        return `
            <input type="number" name="myInput" placeholder="Value" step="${step}" style="${this.getInputStyle(width, height)}"/>
        `
    }

    getInputStyle(width, height) {
        return `
                font-size: ${FONT.fontSize}px;
                width: ${width}px;
                height: ${height}px;
                padding: 0px;
                text-indent: 10px;
        `
        .replace(/\s+/g, '') // Remove whitespaces
    }

    getVal() {
        let html_obj = this.input_object.getChildByName("myInput")
        if(html_obj.value != "") {
            return Number(html_obj.value)
        } else {
            return null
        }
    }

    setVal(value) {
        let html_obj = this.input_object.getChildByName("myInput")
        html_obj.value = value
    }

    destroy() {
        this.input_object.destroy()
    }
}


class MyScene extends Phaser.Scene {
    constructor(arg) {
        super(arg)
    }

    create_button(x, y, width, height, text, callback, color=BUTTON_COLOR, hover_color=BUTTON_HOVER_COLOR) {
        this.add.rectangle(x, y, width, height, color)
        .setInteractive({cursor: "pointer"})
        .on('pointerup', () => callback.call(this))
        .on('pointerover', function() {this.setFillStyle(hover_color)})
        .on('pointerout', function() {this.setFillStyle(color)});
        
        this.add.text(x, y, text, FONT).setOrigin(0.5)
    }

    create_input(x, y, width, height, min=null, max=null, step="any") {
        return new NumberInput(this, x, y, width, height, min, max, step)
    }
}


class Menu extends MyScene {
    constructor () {
        super("Menu")
    }

    create () {
        this.add.text(Math.floor(WIDTH/2), 80*SCALE_RATIO, "Maze Runner", FONT)
        .setOrigin(0.5)
        .setFontSize(70*SCALE_RATIO)
        .setWordWrapWidth(WIDTH)

        this.add.text(Math.floor(WIDTH/2), 190*SCALE_RATIO, "Reach the blue orb as fast as possible!", FONT)
        .setOrigin(0.5)
        .setFontSize(40*SCALE_RATIO)
        .setAlign("center")
        // .setColor("#a100a1")
        .setWordWrapWidth(WIDTH - 5*SCALE_RATIO)

        this.add.text(Math.floor(WIDTH/2), HEIGHT/4 + 60*SCALE_RATIO, "Controls:\nWASD", FONT)
        .setOrigin(0.5)
        .setFontSize(40*SCALE_RATIO)
        .setAlign("center")
        .setColor("#a100a1")
        .setWordWrapWidth(WIDTH - 5*SCALE_RATIO)

        this.create_button(WIDTH/2, HEIGHT/2 - 60*SCALE_RATIO, 200*SCALE_RATIO, 95*SCALE_RATIO, "PLAY", function(){
            this.scene.start("Game")
        })

        this.create_button(WIDTH/2, HEIGHT/2 + 60*SCALE_RATIO, 200*SCALE_RATIO, 95*SCALE_RATIO, "SETTINGS", function(){
            this.scene.start("Settings")
        })

        this.add.text(Math.floor(WIDTH/2), HEIGHT - 100*SCALE_RATIO, "-Maze generator and solver included!\n-Highly customizable!\n-Works only with a keyboard\n-After resizing the page reload it to fix visual issues", FONT)
        .setOrigin(0.5)
        .setFontSize(22*SCALE_RATIO)
        .setWordWrapWidth(WIDTH - 70*SCALE_RATIO)
    }
}

class Settings extends MyScene {
    constructor() {
        super("Settings")
    }

    create () {
        function save_data() {
            for (let i = 0; i < settings_setup.length; i++) {
                if (settings_setup[i].input.getVal() != null) {
                    window[settings_setup[i].name] = settings_setup[i].input.getVal()
                }
            }
            recount_scaleable()
        }

        this.add.text(Math.floor(WIDTH/2), 50*SCALE_RATIO, "Settings", FONT).setOrigin(0.5).setFontSize(45*SCALE_RATIO)
        this.add.text(WIDTH - WIDTH/6, 50*SCALE_RATIO, "*Changing these might make the game unplayable :)", FONT)
        .setOrigin(0.5)
        .setFontSize(15*SCALE_RATIO)
        .setWordWrapWidth(WIDTH/4)

        this.create_button(80*SCALE_RATIO, 50*SCALE_RATIO, 130*SCALE_RATIO, 55*SCALE_RATIO, "Home", function(){
            save_data()
            this.scene.start("Menu")
        })

        let settings_setup = [
            {
                name: "DEF_SPEED",
                val: DEF_SPEED,
                text: "Player Speed",
                input: null
            },
            {
                name: "MAZE_SIZE",
                val: MAZE_SIZE,
                text: "Maze Grid Size",
                input: null
            },
            {
                name: "DEF_MAZE_THICKNESS",
                val: DEF_MAZE_THICKNESS,
                text: "Maze Thickness",
                input: null
            },
            {
                name: "SOLUTION_DRAW_DELAY",
                val: SOLUTION_DRAW_DELAY,
                text: "Solve Delay",
                input: null
            }
        ]
        const OFFSET = 65
        const START = 150
        for (let i = 0; i < settings_setup.length; i++) {
            this.add.text(10*SCALE_RATIO, START*SCALE_RATIO + i * (OFFSET*SCALE_RATIO), settings_setup[i].text, FONT)
            .setWordWrapWidth(WIDTH/2)
            .setFontSize(18*SCALE_RATIO)
            .setOrigin(0, 0.5)

            settings_setup[i].input = this.create_input(WIDTH / 2 + 50*SCALE_RATIO, START*SCALE_RATIO + i * (OFFSET*SCALE_RATIO), 82*SCALE_RATIO, 42*SCALE_RATIO)
            settings_setup[i].input.setVal(settings_setup[i].val)
            this.add.line(0, 0, 10*SCALE_RATIO, (START + 35)*SCALE_RATIO + i * (OFFSET*SCALE_RATIO), WIDTH - 10*SCALE_RATIO, (START + 35)*SCALE_RATIO + i * (OFFSET*SCALE_RATIO), 0xffffff)
            .setOrigin(0)
        }


    }
}

class LoseOverlay extends MyScene {
    constructor() {
        super("LoseOverlay")
    }

    create(args) {
        this.add.rectangle(WIDTH/2, HEIGHT/2, 250*SCALE_RATIO, 300*SCALE_RATIO, PADDING_COLOR).setAlpha(0.7)
        
        this.add.text(WIDTH/2, HEIGHT/2 - 100*SCALE_RATIO, "You won!", FONT).setOrigin(0.5).setFontSize(40*SCALE_RATIO)
        this.add.text(WIDTH/2, HEIGHT/2 - 40*SCALE_RATIO, "Score: " + args.score, FONT).setOrigin(0.5)

        this.create_button(WIDTH/2, HEIGHT/2 + 30*SCALE_RATIO, 150*SCALE_RATIO, 55*SCALE_RATIO, "Restart", function() {
            this.scene.start("Game")
        })

        this.create_button(WIDTH/2, HEIGHT/2 + 100*SCALE_RATIO, 150*SCALE_RATIO, 55*SCALE_RATIO, "Menu", function() {
            game.scene.stop("Game")
            this.scene.start("Menu")
        })
    }
}

class GameScene extends MyScene {
    constructor () {
        super("Game")
    }

    reset_variables() {
        //set gravity
        this.matter.world.setGravity(GRAVITY_X, GRAVITY)

        this.timer_text;
        this.score_text;
        this.is_solved = false;
        this.time_start = Date.now()

        this.default_player_physics = {
            label: 'Player',
            shape: {
                type: 'circle'
            },
            chamfer: null,
        
            isStatic: false,
            isSensor: false,
            isSleeping: false,
            ignoreGravity: true,
            ignorePointer: false,
        
            sleepThreshold: 60,
            density: 0.001,
            restitution: BOUNCINESS, // 0
            friction: FRICTION, // 0.1
            frictionStatic: FRICTION_STATIC, // 0.5
            frictionAir: FRICTION_AIR, // 0.01
        
            inertia: Infinity,
        
            force: { x: 0, y: 0 },
            angle: 0,
            torque: 0,
        
            collisionFilter: {
                group: 0,
                category: 0x0001,
                mask: 0xFFFFFFFF,
            },
        
            // parts: [],
        
            // plugin: {
            //     attractors: [
            //         (function(bodyA, bodyB) { return {x, y}}),
            //     ]
            // },
        
            slop: 0.05,
        
            timeScale: 1
        },

        this.default_finish_physics = {
            label: 'Finish',
            shape: {
                type: 'circle',
            },
            chamfer: null,
        
            isStatic: true,
            isSensor: true,
            isSleeping: false,
            ignoreGravity: true,
            ignorePointer: false,
        
            sleepThreshold: 60,
            density: 0.001,
            restitution: 1, // 0
            friction: 0, // 0.1
            frictionStatic: 0, // 0.5
            frictionAir: 0, // 0.01
        
            inertia: Infinity,
        
            force: { x: 0, y: 0 },
            angle: 0,
            torque: 0,
        
            collisionFilter: {
                group: 0,
                category: 0x0001,
                mask: 0xFFFFFFFF,
            },
        
            // parts: [],
        
            // plugin: {
            //     attractors: [
            //         (function(bodyA, bodyB) { return {x, y}}),
            //     ]
            // },
        
            slop: 0.05,
        
            timeScale: 1
        },

        this.default_wall_physics = {
            label: 'BodyWall',
            shape: {
                type: 'rectangle'
            },
            chamfer: null,
        
            isStatic: true,
            isSensor: false,
            isSleeping: false,
            ignoreGravity: true,
            ignorePointer: false,
        
            sleepThreshold: 60,
            density: 0.001,
            restitution: 0, // 0
            friction: 0, // 0.1
            frictionStatic: 0, // 0.5
            frictionAir: 0, // 0.01
        
            inertia: Infinity,
        
            force: { x: 0, y: 0 },
            angle: 0,
            torque: 0,
        
            collisionFilter: {
                group: 0,
                category: 0x0001,
                mask: 0xFFFFFFFF,
            },
        
            // parts: [],
        
            // plugin: {
            //     attractors: [
            //         (function(bodyA, bodyB) { return {x, y}}),
            //     ]
            // },
        
            slop: 0.05,
        
            timeScale: 1
        }
    }
    
    preload ()
    {
        this.load.image('player', 'assets/player.png');
    }

    create ()
    {
        this.reset_variables()

        // Fix sudden stop of bouncing
        Phaser.Physics.Matter.Matter.Resolver._restingThresh = RESTING; // default is 4

        //Make stacking more stable
        this.matter.world.engine.positionIterations = POSITION_ITER;  // default is 6

        // Set world bounds
        // this.matter.world.setBounds(PADDING_SIDE, PADDING_TOP, WIDTH - PADDING_SIDE*2, HEIGHT - PADDING_BOTTOM - PADDING_TOP, 1500);
        // this.matter.world.setBounds(0, 0, 800, 600, 500);

        // Create top and bottom rectangles
        this.add.rectangle(0, 0, WIDTH, PADDING_TOP, PADDING_COLOR).setOrigin(0)
        this.add.rectangle(0, HEIGHT - PADDING_BOTTOM, WIDTH, HEIGHT, PADDING_COLOR).setOrigin(0)

        // Create side rectangles
        this.add.rectangle(0, 0, PADDING_SIDE, HEIGHT, PADDING_COLOR).setOrigin(0)
        this.add.rectangle(WIDTH - PADDING_SIDE, 0, PADDING_SIDE, HEIGHT, PADDING_COLOR).setOrigin(0)

        // Create a home button
        this.create_button(WIDTH - Math.max(PADDING_SIDE, 10*SCALE_RATIO) - 60*SCALE_RATIO, 25*SCALE_RATIO, 120*SCALE_RATIO, 40*SCALE_RATIO, "Home", function(){
            this.scene.start("Menu")
        })

        // Add timer text
        this.timer_text = this.add.text(Math.max(10*SCALE_RATIO, PADDING_SIDE), 25*SCALE_RATIO, `Time: 0`, FONT)
        .setOrigin(0, 0.5)

        // Add score text
        this.score_text = this.add.text(Math.max(10*SCALE_RATIO, PADDING_SIDE), HEIGHT - PADDING_BOTTOM + 25*SCALE_RATIO, `Total Score: ${score}`, FONT)
        .setOrigin(0, 0.5)


        let player_size = (GAME_WIDTH / MAZE_SIZE) / (3/(MAZE_SIZE+2) + 1.5)
        if (player_size > (GAME_WIDTH / MAZE_SIZE) - MAZE_THICKNESS) {
            player_size = (GAME_WIDTH / MAZE_SIZE) - MAZE_THICKNESS
        }

        let player_data = {
            scene: this,
            x: PADDING_SIDE + (1 * (GAME_WIDTH / MAZE_SIZE)) - (GAME_WIDTH / MAZE_SIZE)/2,
            y: PADDING_TOP + (1 * (GAME_WIDTH / MAZE_SIZE)) - (GAME_WIDTH / MAZE_SIZE)/2,
            size: player_size,
            sprite: "player",
            physics_obj: this.default_player_physics,
            controls: {
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            }
        }



        this.player = new Player(player_data)

        // Add maze
        this.maze = new Maze(MAZE_SIZE, MAZE_SIZE)
        let coords = this.maze.get_farthest_coords(0, 0)
        let canvas_x = PADDING_SIDE + coords.x * (GAME_WIDTH / MAZE_SIZE)
        let canvas_y = PADDING_TOP + coords.y * (GAME_WIDTH / MAZE_SIZE)
        this.finish = new Finish(this, this.default_finish_physics, canvas_x + (GAME_WIDTH / MAZE_SIZE)/2, canvas_y + (GAME_WIDTH / MAZE_SIZE)/2, (GAME_WIDTH / MAZE_SIZE)/4)

        // Create a solve button
        this.create_button(WIDTH - Math.max(PADDING_SIDE+130*SCALE_RATIO, 140*SCALE_RATIO) - 60*SCALE_RATIO, 25*SCALE_RATIO, 120*SCALE_RATIO, 40*SCALE_RATIO, "Solve", function(){
            if (!this.is_solved) {
                this.is_solved = true
                this.maze.draw_solution(coords.x, coords.y, draw_data)
            }
        })

        let draw_data = {
            scene: this,
            matter_obj: this.default_wall_physics,
            start_x: PADDING_SIDE,
            start_y: PADDING_TOP,
            tile_size: GAME_WIDTH / MAZE_SIZE,
            thickness: MAZE_THICKNESS}

        this.maze.draw(draw_data)
    }

    update() {
        this.player.update()

        if (!this.finish.finish.active) {
            game.scene.pause("Game")
            let current_score = 0
            if (!this.is_solved) {
                current_score = Math.round(MAZE_SIZE**3 / ((Date.now() - this.time_start) / 1000)**0.75)
            }
            this.add_score(current_score)
            game.scene.start("LoseOverlay", {score: current_score})
        }

        this.update_timer()
    };

    add_score(time) {
        score += time
    }

    update_timer() {
        let elapsed = ((Date.now() - this.time_start) / 1000).toFixed(1);
        this.timer_text.setText(`Time: ${elapsed}`)
    }

}


let config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: BG_COLOR,
    scene: [Menu, GameScene, LoseOverlay, Settings],
    physics: {
        default: 'matter',
        matter: {
            enableSleeping: false,
            gravity: { y: GRAVITY },
            debug: false,
        }
    },
    dom: {
        createContainer: true
    },
    scale: {
        mode: Phaser.Scale.FIT,
        width: WIDTH,
        height: HEIGHT,
    }
};

// Phaser stuff
let game = new Phaser.Game(config);


window.addEventListener("resize", function (event) {
    windowResize()
})