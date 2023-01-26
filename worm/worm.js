//----------------------------
//----- CLASS DEFINITIONS ----
//----------------------------

function point(x, y)
{
    return {x: x, y: y};
}

function line(p1, p2)
{
    return {p1: p1, p2: p2};
}

function circle(center, radius)
{
    return {center: center, radius: radius};
}

function rectangle(center, width, height)
{
    return {center: center, width: width, height: height};
}

class Filmable
{
    constructor(camera)
    {
        this.camera = camera;
    }

    follow()
    {
        this.camera.filmedObject = this;
        this.updateCameraTarget();
    }
    
    unfollow()
    {
        this.camera.filmedObject = null;
    }
}

class Worm extends Filmable
{
    constructor(camera)
    {
        super(camera);
        this.blink = 0;
        this.blinkDirection = 0;
        this.blinkWait = Math.round(Math.random() * 250) + 10;
        this.controllable;
        this.dead = false;
        this.energiesCollected = 0;
        this.happiness = 0;
        this.happinessAchieved = 0;
        this.happinessDirection = -1;
        this.happinessWait = 0;
        this.hue = 0;
        this.maxLength = 0;
        this.nodes = [];
        this.type = 1;
        this.turn = 0;
        
        var tempRotation = 2 * Math.PI * Math.random();
        var tempRadius = WORLD_RADIUS * Math.sqrt(Math.random());
        this.nodes.push(
        {
            active: true,
            activeTime: 0,
            x: tempRadius * Math.cos(tempRotation),
            y: tempRadius * Math.sin(tempRotation),
            r: 2 * Math.PI * Math.random(),
            rs: 0
        });
    }
    
    setControllable(controllable = true)
    {
        if(controllable !== this.controllable)
        {
            if(controllable && this.controllable === false)
            {
                if(this.hasOwnProperty("controllable"))
                {
                    delete this.botWait;
                    delete this.botDesiredDirection;
                }
            }
            
            else if(!controllable)
            {
                this.botWait = 0;
                this.botDesiredDirection = Math.random() * 2 * Math.PI;
            }
            
            this.controllable = controllable;
        }
    }
    
    setType(type)
    {
        this.type = type;
    }
    
    setRandomType(minimumType, maximumType)
    {
        this.setType(Math.round(Math.random() * (maximumType - minimumType) + minimumType));
    }
    
    setLength(length)
    {
        var lengthDifference = Math.abs(length - this.nodes.length);
        
        if(length < this.nodes.length)
        {
            this.subtractNode(lengthDifference);
        }
        
        else if(length > this.nodes.length)
        {
            this.addNode(lengthDifference);
        }
    }
    
    setRandomLength(minimumLength, maximumLength)
    {
        this.setLength(Math.round(Math.random() * (maximumLength - minimumLength) + minimumLength));
    }
    
    setHue(hue)
    {
        this.hue = hue;
    }
    
    setRandomHue(minimumHue = 0, maximumHue = 359)
    {
        this.hue = Math.random() * (maximumHue - minimumHue) + minimumHue;
    }
    
    addNode(count = 1)
    {
        for(var n = 0; n < count; n++)
        {
            let tempLastNode = this.nodes[this.nodes.length - 1];
            this.nodes.push(
            {
                active: true,
                activeTime: 1,
                x: tempLastNode.x - 20 * Math.cos(tempLastNode.r),
                y: tempLastNode.y + 20 * Math.sin(tempLastNode.r),
                r: tempLastNode.r
            });
        }
        
        this.maxLength = clampMin(this.nodes.length, this.maxLength);
    }
    
    addNodeSmooth(count = 1)
    {
        for(var n = 0; n < count; n++)
        {
            let tempLastNode = this.nodes[this.nodes.length - 1];
            this.nodes.push(
            {
                active: false,
                activeTime: 0,
                x: tempLastNode.x,
                y: tempLastNode.y,
                r: tempLastNode.r
            });
        }
        
        this.maxLength = clampMin(this.nodes.length, this.maxLength);
    }
    
    subtractNode(count)
    {
        if(count === undefined)
        {
            count = 1;
        }
        
        this.nodes.splice(this.nodes.length - count, count);
    }
    
    increaseHappiness(value)
    {
        if(this.happiness < 1)
        {
            this.happiness += value;
            
            if(this.happiness > 1)
            {
                this.happiness = 1;
            }
        }
    }
    
    decreaseHappiness(value)
    {
        if(this.happiness > 0)
        {
            this.happiness -= value;
            
            if(this.happiness < 0)
            {
                this.happiness = 0;
            }
        }
    }
    
    die()
    {
        this.dead = true;
        
        if(this.camera.filmedObject === this)
        {
            this.camera.filmedObject = null;
        }
    }
        
    tick(wormCollection)
    {
        if(!this.controllable)
        {
            //--------- AI CODE ----------
            this.botWait -= timeScale;
            
            if(this.botWait <= 0)
            {
                var error = (Math.random() - 0.5) / 2;
                this.botDesiredDirection += (Math.random() - 0.5) * Math.PI + error;
                this.botWait = Math.round(Math.random() * 30 + 20);
            }
            
            var angleDifference = calculateAngleDifference(this.nodes[0].r, this.botDesiredDirection);
            if(angleDifference < -Math.PI / 4)
            {
                this.turn = 1;
            }
            
            else if(angleDifference > Math.PI / 4)
            {
                this.turn = -1;
            }
            
            else
            {
                this.turn = 0;
            }
        }
        
        var wormIndex = wormCollection.indexOf(this);
        var tempFirstNode = this.nodes[0];
        
        if(this.turn === -1)
        {
            tempFirstNode.rs = clampMax(tempFirstNode.rs + Math.PI / 360, Math.PI / 90);
        }

        else if(this.turn === 1)
        {
            tempFirstNode.rs = clampMin(tempFirstNode.rs - Math.PI / 360, -Math.PI / 90);
        }
        
        else
        {
            if(tempFirstNode.rs < 0)
            {
                tempFirstNode.rs += Math.PI / 1440;
                
                if(tempFirstNode.rs > 0)
                {
                    tempFirstNode.rs = 0;
                }
            }
            
            if(tempFirstNode.rs > 0)
            {
                tempFirstNode.rs -= Math.PI / 1440;
                
                if(tempFirstNode.rs < 0)
                {
                    tempFirstNode.rs = 0;
                }
            }
        }
        
        // Move the first node in its direction.
        tempFirstNode.r += tempFirstNode.rs * timeScale;
        tempFirstNode.r %= (2 * Math.PI);
        tempFirstNode.x += 3 * Math.cos(tempFirstNode.r) * timeScale;
        tempFirstNode.y -= 3 * Math.sin(tempFirstNode.r) * timeScale;
        
        // Move the rest of the nodes.
        for(var n = 1; n < this.nodes.length; n++)
        {
            var tempCurrentNode = this.nodes[n];
            var tempPreviousNode = this.nodes[n - 1];
            
            if(!tempCurrentNode.active)
            {
                if(distance(tempCurrentNode, tempPreviousNode) >= 5)
                {
                    tempCurrentNode.active = true;
                }
            }
            
            if(tempCurrentNode.active)
            {
                if(tempCurrentNode.activeTime < 1)
                {
                    tempCurrentNode.activeTime += 0.05 * timeScale;
                    
                    if(tempCurrentNode.activeTime > 1)
                    {
                        tempCurrentNode.activeTime = 1;
                    }
                }

                // Keep the rest of the nodes close to the node in front.
                tempCurrentNode.r = Math.PI - Math.atan2(tempCurrentNode.y - tempPreviousNode.y, tempCurrentNode.x - tempPreviousNode.x);
                tempCurrentNode.x = tempPreviousNode.x - 5 * Math.cos(tempCurrentNode.r);
                tempCurrentNode.y = tempPreviousNode.y + 5 * Math.sin(tempCurrentNode.r);
                
                // Measure the distance between nodes in order to avoid crowding.
                if(n > 1)
                {
                    var tempPreviousPreviousNode = this.nodes[n - 2];
                    var nodeDistance = distance(tempCurrentNode, tempPreviousPreviousNode);
                    
                    if(nodeDistance < 9.993)
                    {
                        var circle1 = circle(tempPreviousNode, 5);
                        var circle2 = circle(tempPreviousPreviousNode, 9.993);
                        var intersections = intersectCircleCircle(circle1, circle2);
                        
                        // Separate nodes by a certain threshold distance (smoothly).
                        if(distance(tempCurrentNode, intersections[0]) < distance(tempCurrentNode, intersections[1]))
                        {
                            tempCurrentNode.x = intersections[0].x;
                            tempCurrentNode.y = intersections[0].y;
                        }
                        else
                        {
                            tempCurrentNode.x = intersections[1].x;
                            tempCurrentNode.y = intersections[1].y;
                        }
                        
                        tempCurrentNode.r = Math.PI - Math.atan2(tempCurrentNode.y - tempPreviousNode.y, tempCurrentNode.x - tempPreviousNode.x);
                    }
                }
            }
        }
        
        // Change the smile of the worm based on surrounding worms.
        var foundHappiness = false;
        
        for(var n = 0; n < wormCollection.length; n++)
        {
            if(wormIndex !== n)
            {
                if(distance(this.nodes[0], wormCollection[n].nodes[0]) < 150)
                {
                    foundHappiness = true;
                }
            }
        }
        
        if(foundHappiness)
        {
            if(this.happinessWait < 50)
            {
                this.happinessWait += timeScale;
                
                if(this.happinessWait > 50)
                {
                    this.happinessWait = 50;
                }
            }
        }
        
        else
        {
            if(this.happinessWait > 0)
            {
                this.happinessWait -= timeScale;
                
                if(this.happinessWait < 0)
                {
                    this.happinessWait = 0;
                }
            }
        }
        
        if(this.happinessWait === 0)
        {
            this.happinessDirection = -1;
        }
        
        else if(this.happinessWait === 50)
        {
            if(this.happinessDirection === -1)
            {
                this.happinessAchieved++;
            }
            
            this.happinessDirection = 1;
        }
        
        if(this.happinessDirection === -1)
        {
            this.decreaseHappiness(1 / 10 * timeScale);
        }
        
        else if(this.happinessDirection === 1)
        {
            this.increaseHappiness(1 / 10 * timeScale);
        }
        
        // Blink control loop.
        this.blinkWait -= timeScale;
        
        if(this.blinkWait <= 0)
        {
            if(this.happiness < 0.5)
            {
                this.blinkWait = Math.round(Math.random() * 250) + 100;
            }
            
            else
            {
                this.blinkWait = Math.round(Math.random() * 100) + 10;
            }

            this.blinkDirection = 1;
        }
        
        this.blink += 1 / 10 * this.blinkDirection * timeScale;
        
        if(this.blink > 1)
        {
            this.blink = 2 - this.blink;
            this.blinkDirection = -1;
        }
        
        if(this.blink < 0)
        {
            this.blink = 0;
            this.blinkDirection = 0;
        }
        
        this.updateCameraTarget();
    }
    
    moveTo(p)
    {
        for(var n = 1; n < this.nodes.length; n++)
        {
            this.nodes[n].x += (p.x - this.nodes[0].x);
            this.nodes[n].y += (p.y - this.nodes[0].y);
        }
        
        this.nodes[0].x = p.x;
        this.nodes[0].y = p.y;
    }
    
    inGame(camera)
    {
        // Returns whether the worm should be rendered on the main view.
        var tempShapePadding = 80;
        var tempGlowPadding = clampMin(20 * camera.zoom, 20);
        var tempPadding = tempShapePadding * camera.zoom + tempGlowPadding;
        
        for(var n = 0; n < this.nodes.length; n++)
        {
            if(pointInRectangle(point(this.nodes[n].x - camera.x, this.nodes[n].y - camera.y), rectangle(point(0, 0), gameWidth / camera.zoom, gameHeight / camera.zoom), tempPadding))
            {
                return true;
            }
        }
        
        return false;
    }
    
    inMinimap(camera, expanded)
    {
        // Returns whether the worm should be rendered on the minimap.
        var tempShapePadding = 80;
        var tempGlowPadding = clampMin(20 * camera.zoom, 20);
        var tempPadding = tempShapePadding * camera.zoom * minimapZoom + tempGlowPadding;
        var tempWidth = minimapWidth;
        var tempHeight = minimapHeight;
        
        if(expanded)
        {
            tempWidth = gameWidth;
            tempHeight = gameHeight;
        }
        
        for(var n = 0; n < this.nodes.length; n++)
        {
            if(pointInRectangle(point(this.nodes[n].x - camera.x, this.nodes[n].y - camera.y), rectangle(point(0, 0), tempWidth / (camera.zoom * minimapZoom), tempHeight / (camera.zoom * minimapZoom)), tempPadding))
            {
                return true;
            }
        }
        
        return false;
    }
    
    updateCameraTarget()
    {
        if(this.camera.filmedObject == this)
        {
            this.camera.setTarget(this.nodes[0]);
        }
    }
}

class Energy extends Filmable
{
    constructor(camera)
    {
        super(camera);
        var tempRotation = 2 * Math.PI * Math.random();
        var tempRadius = WORLD_RADIUS * Math.sqrt(Math.random());
        this.decayFunc = null;
        this.isDestroyed = false;
        this.destroyFunc = null;
        this.isDecaying = false;
        this.opacity = 1;
        this.phase = 2 * Math.PI * Math.random();
        this.r = this.rStatic + 0.2 * Math.sin(this.phase);
        this.rStatic = 2 * Math.PI * Math.random();
        this.type = Math.round(2 * Math.random() + 1);
        this.x = tempRadius * Math.cos(tempRotation);
        this.y = tempRadius * Math.sin(tempRotation);
    }
    
    moveTo(p)
    {
        this.x = p.x;
        this.y = p.y;
    }
    
    decay()
    {
        this.isDecaying = true;
        
        if(this.decayFunc !== null)
        {
            this.decayFunc();
        }
    }
    
    onDecay(func)
    {
        this.decayFunc = func;
    }
    
    destroy()
    {
        this.isDestroyed = true;
        
        if(this.destroyFunc !== null)
        {
            this.destroyFunc();
        }
    }
    
    onDestroy(func)
    {
        this.destroyFunc = func;
    }
    
    tick(energyCollection)
    {
        // Energy decay logic.
        if(this.isDecaying)
        {
            this.opacity -= 0.1 * timeScale;
            
            if(this.opacity <= 0)
            {
                this.destroy(energyCollection);
                return;
            }
        }
        
        this.phase += 0.02 * timeScale;
        this.r = this.rStatic + 0.2 * Math.sin(this.phase);
        this.updateCameraTarget();
    }
    
    updateCameraTarget()
    {
        if(this.camera.filmedObject === this)
        {
            this.camera.setTarget(this);
        }
    }
    
    inGame(camera)
    {
        // Returns whether the energy should be rendered on the main view.
        var tempShapePadding = 80;
        var tempGlowPadding = clampMin(20 * camera.zoom, 20);
        var tempPadding = tempShapePadding * camera.zoom + tempGlowPadding;
        
        if(pointInRectangle(point(this.x - camera.x, this.y - camera.y), rectangle(point(0, 0), gameWidth / camera.zoom, gameHeight / camera.zoom), tempPadding))
        {
            return true;
        }
        
        return false;
    }
    
    inMinimap(camera, expanded)
    {
        // Returns whether the energy should be rendered on the minimap.
        var tempShapePadding = 80;
        var tempGlowPadding = clampMin(20 * camera.zoom, 20);
        var tempPadding = tempShapePadding * camera.zoom * minimapZoom + tempGlowPadding;
        var tempWidth = minimapWidth;
        var tempHeight = minimapHeight;
        
        if(expanded)
        {
            tempWidth = gameWidth;
            tempHeight = gameHeight;
        }
        
        if(pointInRectangle(point(this.x - camera.x, this.y - camera.y), rectangle(point(0, 0), tempWidth / (camera.zoom * minimapZoom), tempHeight / (camera.zoom * minimapZoom)), tempPadding))
        {
            return true;
        }
        
        return false;
    }
}

class Camera
{
    constructor(p = point(0, 0), zoom = 1)
    {
        this.filmedObject = null;
        this.x = p.y;
        this.y = p.x;
        this.targetX = this.x;
        this.targetY = this.y;
        this.zoom = zoom;
        this.MAX_SPEED = 1000;
    }
    
    setTarget(p)
    {
        this.targetX = p.x;
        this.targetY = p.y
    }
    
    moveTo(p)
    {
        this.x = p.x;
        this.y = p.y;
    }
    
    moveToSmooth(p)
    {
        // Perform continuous linear interpolation from current point to target.
        var tempActualSpeed = this.MAX_SPEED;
        var tempAngle = Math.atan2(p.y - this.y, p.x - this.x);
        var tempCosine = Math.abs(tempActualSpeed * Math.cos(tempAngle));
        var tempSine = Math.abs(tempActualSpeed * Math.sin(tempAngle));
        var oldX = this.x;
        var oldY = this.y;
        this.x = interpolateLinear(this.x, clamp(p.x, this.x - tempCosine, this.x + tempCosine), 0.2);
        this.y = interpolateLinear(this.y, clamp(p.y, this.y - tempSine, this.y + tempSine), 0.2);
    }
    
    tick()
    {
        // Camera movement and zoom logic.
        this.moveToSmooth(point(this.targetX, this.targetY));
        this.x += 25 * mouseCoordinatesNormalizedSmoothed.x;
        this.y += 25 * mouseCoordinatesNormalizedSmoothed.y;
        this.zoom = 1 - 0.2 * distance(mouseCoordinatesNormalizedSmoothed);
    }
}

//----------------------------
//--- FUNCTION DEFINITIONS ---
//----------------------------

CanvasRenderingContext2D.prototype.reset = function()
{
    this.direction = "ltr";
    this.fillStyle = "#000000";
    this.filter = "none";
    this.globalAlpha = 1;
    this.globalCompositeOperation = "source-over";
    this.imageSmoothingEnabled = true;
    this.imageSmoothingQuality = "low";
    this.lineCap = "butt";
    this.lineDashOffset = 0;
    this.lineJoin = "miter";
    this.lineWidth = 1;
    this.miterLimit = 10;
    this.shadowBlur = 0;
    this.shadowColor = "rgba(0, 0, 0, 0)";
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;
    this.strokeStyle = "#000000";
}

function getShadows()
{
    // Returns the shadowblur multiplier used for rendering based on the settings.
    if(shadows)
    {
        return clampMin(20 * camera.zoom, 20);
    }
    
    else
    {
        return 0;
    }
}

function hueString(hue)
{
    return ("hsl(" + hue + ", 100%, 50%)");
}

function resize()
{
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Check whether the aspect ratio of the user screen is greater than the aspect ratio of the game.
    if(windowWidth / windowHeight > gameWidth / gameHeight)
    {
        canvas.style.width = `${(windowHeight / windowWidth) * ( gameWidth / gameHeight) * 100}%`;
        canvas.style.height = "100%";
    }
    
    else
    {
        canvas.style.width = "100%";
        canvas.style.height = `${(windowWidth / windowHeight) * (gameHeight / gameWidth) * 100}%`;
    }
    
    updateMouseCoordinates();
}

function mousedown(event)
{
    if(!event)
    {
        event = window.event;
    }

    // Left click pans the camera to the previous worm.
    if(event.button === 0 && camera.filmedObject != null)
    {
        if(camera.filmedObject.constructor.name === "Worm")
        {
            filmedWormIndex--;
        }
    }

    // Right click pans the camera to the next worm.
    if(event.button === 2 && camera.filmedObject != null)
    {
        if(camera.filmedObject.constructor.name === "Worm")
        {
            filmedWormIndex++;
        }
    }
    
    // Middle click unfollows the current worm.
    if(worms.length > 0)
    {
        filmedWormIndex = clamp(filmedWormIndex, 0, worms.length - 1);
        
        if(event.button !== 1)
        {
            worms[filmedWormIndex].follow();
        }
        
        else
        {
            worms[filmedWormIndex].unfollow();
        }
    }
}

function mousemove(event)
{
    if(!event)
    {
        event = window.event;
    }
    
    mouseCoordinates.x = event.clientX;
    mouseCoordinates.y = event.clientY;
    updateMouseCoordinates();
}

function keydown(event)
{
    if(!event)
    {
        event = window.event;
    }
    
    var eventKey = event.key;
    
    if(keysPressed.includes(eventKey) === false)
    {
        // Keep a record of all the keys that are pressed down.
        keysPressed.push(eventKey);
        
        // Open the minimap for expanded view.
        if(eventKey.toUpperCase() === "M" && !minimapFired)
        {
            minimapFired = true;
            
            if(minimapExpanded === false)
            {
                minimapExpanded = true;
            }
            
            else
            {
                minimapExpanded = false;
            }
        }
        
        // Toggle the shadows for performance and quality tradeoff.
        if(eventKey.toUpperCase() === "G")
        {
            shadows = !shadows;
        }
    }
}

function keyup(event)
{
    if(!event)
    {
        event = window.event;
    }
    
    var eventKey = event.key;
    
    keysPressed.splice(keysPressed.indexOf(eventKey), 1);
    
    if(eventKey.toUpperCase() === "M")
    {
        minimapFired = false;
    }
}

function updateMouseCoordinates()
{
    if(mouseCoordinates !== undefined)
    {
        mouseCoordinatesIdleTime = 0;
        mouseCoordinatesNormalized.x = 2 * (mouseCoordinates.x / window.innerWidth - 0.5);
        mouseCoordinatesNormalized.y = 2 * (mouseCoordinates.y / window.innerHeight - 0.5);
    }
}

//----------------------------
//---------- EVENTS ----------
//----------------------------

window.onresize = resize;
window.onmousedown = mousedown;
window.onmousemove = mousemove;
window.onkeydown = keydown;
window.onkeyup = keyup;
window.oncontextmenu = function(event) { event.preventDefault(); };

//-----------------------------------
//--- GLOBAL VARIABLE DEFINITIONS ---
//-----------------------------------

let request;
const requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", {alpha: false});
const gameWidth = 1920;
const gameHeight = 1080;
const gameHalfWidth = 960;
const gameHalfHeight = 540;
const minimapWidth = 250;
const minimapHeight = 200;
const minimapHalfWidth = 125;
const minimapHalfHeight = 100;
let minimapZoom;
let minimapFired;
let minimapExpanded;
let blackScreenOpacityDirection = 0;
let blackScreenOpacity = 0;
let blackScreenOpacityWait = 0;
let shadows = true;
let timeScale;
const mouseCoordinates = point(0, 0);
const mouseCoordinatesNormalized = point(0, 0);
const mouseCoordinatesNormalizedSmoothed = point(0, 0);
let mouseCoordinatesIdleTime = 0;
const keysPressed = [];
let camera;
const WORLD_RADIUS = 10000;
const WORLD_CIRCLE = circle(point(0, 0), WORLD_RADIUS);
const GRID_SIZE = 100;
const WORM_BOT_COUNT = 100;
const ENERGY_COUNT = 500;
const worms = [];
const energies = [];
let filmedWormIndex;
resize();
start();

function start()
{
    timeScale = 1;
    camera = new Camera();
    worms.length = 0;
    energies.length = 0;
    minimapZoom = 0.1;
    minimapFired = false;
    minimapExpanded = false;
    filmedWormIndex = 0;

    // Generate all the worms.
    for(var n = 0; n < WORM_BOT_COUNT + 1; n++)
    {
        let worm = new Worm(camera);
        // Generate the worm player.
        if(n === 0)
        {
            camera.moveTo(worm.nodes[0]);
            worm.follow();
            worm.setControllable();
            worm.setType(1);
            worm.setHue(120);
            worm.setRandomLength(5, 50);
        }
        // Generate the AI worms.
        else
        {
            worm.setControllable(false);
            worm.setRandomType(1, 4);
            worm.setRandomHue(260, 359);
            worm.setRandomLength(5, 50);
        }
        
        worms.push(worm);
    }
    
    // Generate the energies.
    for(var n = 0; n < ENERGY_COUNT; n++)
    {
        let energy = new Energy(camera);
        energy.onDestroy(function()
        {
            let index = energies.indexOf(energy);
            energies.splice(index, 1);
        });
        energies.push(energy);
    }
    
    request = requestAnimationFrame(render);
}

function reset()
{
    cancelAnimationFrame(request);
    start();
}

function render()
{    
    //----------------------------
    //-------- MOVEMENT ----------
    //----------------------------
    
    mouseCoordinatesIdleTime++;
    
    if(mouseCoordinatesIdleTime >= 120)
    {
        mouseCoordinatesNormalized.x = 0;
        mouseCoordinatesNormalized.y = 0;
    }
    
    mouseCoordinatesNormalizedSmoothed.x = interpolateLinear(mouseCoordinatesNormalizedSmoothed.x, mouseCoordinatesNormalized.x, 0.02);
    mouseCoordinatesNormalizedSmoothed.y = interpolateLinear(mouseCoordinatesNormalizedSmoothed.y, mouseCoordinatesNormalized.y, 0.02);
    
    // Slow down time.
    if(keysPressed.includes("-") || keysPressed.includes(","))
    {
        timeScale -= 0.01;
        
        if(timeScale < 0)
        {
            timeScale = 0;
        }
    }
    
    // Speed up time.
    if(keysPressed.includes("+") || keysPressed.includes("."))
    {
        timeScale += 0.01;
    }
    
    // High level worm movement logic.
    for(var n = 0; n < worms.length; n++)
    {
        const worm = worms[n];
        
        if(!worm.dead)
        {
            if(worm.controllable)
            {
                worm.turn = 0;
                
                if(keysPressed.includes("ArrowLeft") || keysPressed.includes("a") || keysPressed.includes("A"))
                {
                    worm.turn -= 1;
                }
                
                if(keysPressed.includes("ArrowRight") || keysPressed.includes("d") || keysPressed.includes("D"))
                {
                    worm.turn += 1;
                }
            }
            
            var oldX = worm.nodes[0].x;
            var oldY = worm.nodes[0].y;
            
            worm.tick(worms);
            
            // Check if any worm falls off the circle map.
            if(!pointInCircle(worm.nodes[0], WORLD_CIRCLE))
            {
                var newX = worm.nodes[0].x;
                var newY = worm.nodes[0].y;
                var intersection = intersectCircleLineSegment(circle(point(0, 0), WORLD_RADIUS), line(point(oldX, oldY), point(newX, newY)));
                worm.moveTo(intersection[0]);
                worm.die();
            }
        }
    }
    
    // Show blackscreen if the player worm dies.
    if(blackScreenOpacityDirection === -1)
    {
        if(blackScreenOpacity > 0)
        {
            blackScreenOpacity -= timeScale / 60;
            
            if(blackScreenOpacity < 0)
            {
                blackScreenOpacity = 0;
            }
        }
    }
    
    else if(blackScreenOpacityDirection === 1)
    {
        if(blackScreenOpacity < 1)
        {
            blackScreenOpacity += timeScale / 60;
            
            if(blackScreenOpacity >= 1)
            {
                blackScreenOpacity = 2 - blackScreenOpacity;
                blackScreenOpacityDirection = -1;
                reset();
                return;
            }
        }
    }
    
    // High level energy decay and worm eat logic.
    for(var n = 0; n < energies.length; n++)
    {
        let energy = energies[n];
        let closestWorm;
        let distanceManhattanToClosestWorm = undefined;
        
        for(var m = 0; m < worms.length; m++)
        {
            let worm = worms[m];

            if(!worm.dead)
            {
                let distanceManhattanToWorm = distanceManhattan(energy, worm.nodes[0]);
            
                if(distanceManhattanToWorm < distanceManhattanToClosestWorm || distanceManhattanToClosestWorm === undefined)
                {
                    distanceManhattanToClosestWorm = distanceManhattanToWorm;
                    closestWorm = worm;
                }
            }
        }
        
        if(distanceManhattanToClosestWorm <= 50 && distanceManhattanToClosestWorm !== undefined)
        {
            if(!energy.isDecaying)
            {
                energy.decay();
                closestWorm.energiesCollected++;
                closestWorm.addNodeSmooth(5);
            }
        }
        
        energy.tick(energies);
    }
    
    camera.tick();
    
    //----------------------------
    //-------- RENDERING ---------
    //----------------------------
    
    //------ WORLD RENDERING -----
    
    ctx.reset();
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    
    ctx.translate(gameHalfWidth, gameHalfHeight);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    // GAME SPACE
    
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 2;
    
    // Render the circle map grid.
    for(var n = 1; n < 2 * WORLD_RADIUS / GRID_SIZE; n++)
    {
        ctx.beginPath();
        ctx.moveTo(n * GRID_SIZE - WORLD_RADIUS, 0 - WORLD_RADIUS);
        ctx.lineTo(n * GRID_SIZE - WORLD_RADIUS, 2 * WORLD_RADIUS - WORLD_RADIUS);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0 - WORLD_RADIUS, n * GRID_SIZE - WORLD_RADIUS);
        ctx.lineTo(2 * WORLD_RADIUS - WORLD_RADIUS, n * GRID_SIZE - WORLD_RADIUS);
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, WORLD_RADIUS, Math.PI, 0);
    ctx.lineTo(WORLD_RADIUS, -WORLD_RADIUS);
    ctx.lineTo(-WORLD_RADIUS, -WORLD_RADIUS);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, WORLD_RADIUS, 0, -Math.PI);
    ctx.lineTo(-WORLD_RADIUS, WORLD_RADIUS);
    ctx.lineTo(WORLD_RADIUS, WORLD_RADIUS);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, WORLD_RADIUS, 0, 2 * Math.PI);
    ctx.stroke();
    
    //--- DEAD WORMS RENDERING ---
    
    ctx.reset();
    
    for(var n = 0; n < worms.length; n++)
    {
        var worm = worms[n];

        if(worm.dead)
        {
            if(worm.inGame(camera))
            {
                ctx.beginPath();
                ctx.arc(worm.nodes[0].x, worm.nodes[0].y, 25, -(worm.nodes[0].r + Math.PI / 2), -(worm.nodes[0].r - Math.PI / 2));
                
                for(var m = 1; m < worm.nodes.length - 1; m++)
                {
                    ctx.lineTo(worm.nodes[m].x + 25 * Math.cos(worm.nodes[m].r - Math.PI / 2), worm.nodes[m].y - 25 * Math.sin(worm.nodes[m].r - Math.PI / 2));
                }

                ctx.arc(worm.nodes[worm.nodes.length - 1].x, worm.nodes[worm.nodes.length - 1].y, 25, -(worm.nodes[worm.nodes.length - 1].r - Math.PI / 2), -(worm.nodes[worm.nodes.length - 1].r + Math.PI / 2));
                
                for(var m = worm.nodes.length - 2; m > 0; m--)
                {
                    ctx.lineTo(worm.nodes[m].x + 25 * Math.cos(worm.nodes[m].r + Math.PI / 2), worm.nodes[m].y - 25 * Math.sin(worm.nodes[m].r + Math.PI / 2));
                }
                
                ctx.closePath();
                ctx.fillStyle = "#000000";
                ctx.fill();
                ctx.lineWidth = 30;
                ctx.strokeStyle = "#000000";
                ctx.stroke();
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#575757";
                ctx.stroke();

                ctx.save();
                ctx.translate(worm.nodes[0].x, worm.nodes[0].y);
                ctx.rotate(-worm.nodes[0].r);
                
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.arc(19, 0, 13, Math.PI - Math.PI / 3, Math.PI + Math.PI / 3);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(-3, -13);
                ctx.lineTo(3, -7);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(-3, -7);
                ctx.lineTo(3, -13);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(-3, 13);
                ctx.lineTo(3, 7);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(-3, 7);
                ctx.lineTo(3, 13);
                ctx.stroke();

                ctx.restore();
            }
        }
    }
    
    //----- ENERGY RENDERING -----
    
    ctx.reset();
    ctx.shadowBlur = getShadows(clampMin(20 * camera.zoom, 20));
    for(var n = 0; n < energies.length; n++)
    {
        const energy = energies[n];
        
        if(energy.inGame(camera))
        {
            ctx.globalAlpha = energy.opacity;
            ctx.save();
            ctx.translate(energy.x, energy.y);
            ctx.rotate(energy.r);

            switch(energy.type)
            {
                // Render the red triangle energy.
                case 1:
                    ctx.beginPath();
                    ctx.moveTo(0, 25);
                    ctx.lineTo(-21.65, -12.5);
                    ctx.lineTo(21.65, -12.5);
                    ctx.closePath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#ff0000";
                    ctx.shadowColor = "#ff0000";
                    ctx.stroke();
                    break;
                // Render the blue square energy.
                case 2:
                    ctx.beginPath();
                    ctx.moveTo(20, 20);
                    ctx.lineTo(20, -20);
                    ctx.lineTo(-20, -20);
                    ctx.lineTo(-20, 20);
                    ctx.closePath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#00e5ff";
                    ctx.shadowColor = "#00e5ff";
                    ctx.stroke();
                    break;
                // Render the orange semicircle energy.
                case 3:
                    ctx.beginPath();
                    ctx.arc(0, 0, 25, 0, Math.PI);
                    ctx.closePath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = "#ff9100";
                    ctx.shadowColor = "#ff9100";
                    ctx.stroke();
                    break;
            }
            
            ctx.restore();
        }
    }
    
    //------ WORM RENDERING ------
    
    ctx.reset();
    ctx.shadowBlur = getShadows();
    
    for(var n = 0; n < worms.length; n++)
    {
        const worm = worms[n];

        if(!worm.dead)
        {
            var color = hueString(worm.hue);
        
            // Render the worm only if seen by the camera.
            if(worm.inGame(camera))
            {
                ctx.lineWidth = 3;
                ctx.strokeStyle = color;
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                
                switch(worm.type)
                {
                    // Render the normal worm.
                    case 1:
                        ctx.beginPath();
                        ctx.arc(worm.nodes[0].x, worm.nodes[0].y, 25, -(worm.nodes[0].r + Math.PI / 2), -(worm.nodes[0].r - Math.PI / 2));
                        for(var m = 1; m < worm.nodes.length - 1; m++)
                        {
                            ctx.save();
                            ctx.translate(worm.nodes[m].x, worm.nodes[m].y);
                            ctx.rotate(-worm.nodes[m].r);
                            ctx.lineTo(0, 25);
                            ctx.restore();
                        }
                        ctx.arc(worm.nodes[worm.nodes.length - 1].x, worm.nodes[worm.nodes.length - 1].y, 25, -(worm.nodes[worm.nodes.length - 1].r - Math.PI / 2), -(worm.nodes[worm.nodes.length - 1].r + Math.PI / 2));
                        for(var m = worm.nodes.length - 2; m > 0; m--)
                        {
                            ctx.save();
                            ctx.translate(worm.nodes[m].x, worm.nodes[m].y);
                            ctx.rotate(-worm.nodes[m].r);
                            ctx.lineTo(0, -25);
                            ctx.restore();
                        }
                        ctx.closePath();
                        ctx.fillStyle = "#000000";
                        ctx.shadowBlur = 0;
                        ctx.fill();
                        ctx.lineWidth = 20;
                        ctx.strokeStyle = "#000000";
                        ctx.shadowBlur = 0;
                        ctx.stroke();
                        ctx.lineWidth = 3;
                        ctx.strokeStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.stroke();
                        var interpolation1 = interpolateQuadratic(12, 6, worm.happiness);
                        var interpolation2 = interpolateQuadratic(-11, -15, worm.happiness);
                        var interpolation3 = interpolateQuadratic(4, 19, worm.happiness);
                        ctx.save();
                        ctx.translate(worm.nodes[0].x, worm.nodes[0].y);
                        ctx.rotate(-worm.nodes[0].r);
                        ctx.beginPath();
                        ctx.moveTo(interpolation1, interpolation2);
                        ctx.bezierCurveTo(interpolation3, -7, interpolation3, 7, interpolation1, -interpolation2);
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.ellipse(0, -5, 2 * (1 - worm.blink), 2, 0, 0, 2 * Math.PI);
                        ctx.fillStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.fill();
                        ctx.beginPath();
                        ctx.ellipse(0, 5, 2 * (1 - worm.blink), 2, 0, 0, 2 * Math.PI);
                        ctx.fillStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.fill();
                        ctx.restore();
                        break;
                    // Render the mechanical worm.
                    case 2:
                        ctx.beginPath();
                        ctx.arc(worm.nodes[0].x, worm.nodes[0].y, 25, -(worm.nodes[0].r + Math.PI / 2), -(worm.nodes[0].r - Math.PI / 2));
                        for(var m = 1; m < worm.nodes.length - 1; m++)
                        {
                            ctx.save();
                            ctx.translate(worm.nodes[m].x, worm.nodes[m].y);
                            ctx.rotate(-worm.nodes[m].r);
                            
                            switch(true)
                            {
                                case (m - 1) % 4 === 0:
                                    ctx.lineTo(-3, 25);
                                    break;
                                case (m - 1) % 4 === 1 || (m - 1) % 4 === 2:
                                    ctx.lineTo(0, 25 - 5 * worm.nodes[m + 1].activeTime);
                                    break;
                                case (m - 1) % 4 === 3:
                                    ctx.lineTo(3, 25);
                                    break;
                            }
                            
                            ctx.restore();
                        }
                        ctx.arc(worm.nodes[worm.nodes.length - 1].x, worm.nodes[worm.nodes.length - 1].y, 25, -(worm.nodes[worm.nodes.length - 1].r - Math.PI / 2), -(worm.nodes[worm.nodes.length - 1].r + Math.PI / 2));
                        for(var m = worm.nodes.length - 2; m > 0; m--)
                        {
                            ctx.save();
                            ctx.translate(worm.nodes[m].x, worm.nodes[m].y);
                            ctx.rotate(-worm.nodes[m].r);
                            
                            switch(true)
                            {
                                case (m - 1) % 4 === 0:
                                    ctx.lineTo(-3, -25);
                                    break;
                                case ((m - 1) % 4 === 1 || (m - 1) % 4 === 2):
                                    ctx.lineTo(0, -25 + 5 * worm.nodes[m].activeTime);
                                    break;
                                case (m - 1) % 4 === 3:
                                    ctx.lineTo(3, -25);
                                    break;
                            }
                            
                            ctx.restore();
                        }
                        ctx.closePath();
                        ctx.fillStyle = "#000000";
                        ctx.shadowBlur = 0;
                        ctx.fill();
                        ctx.lineWidth = 20;
                        ctx.strokeStyle = "#000000";
                        ctx.shadowBlur = 0;
                        ctx.stroke();
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.stroke();
                        var interpolation1 = interpolateQuadratic(12, 6, worm.happiness);
                        var interpolation2 = interpolateQuadratic(-11, -15, worm.happiness);
                        var interpolation3 = interpolateQuadratic(4, 19, worm.happiness);
                        ctx.save();
                        ctx.translate(worm.nodes[0].x, worm.nodes[0].y);
                        ctx.rotate(-worm.nodes[0].r);
                        ctx.beginPath();
                        ctx.moveTo(interpolation1, interpolation2);
                        ctx.bezierCurveTo(interpolation3, -7, interpolation3, 7, interpolation1, -interpolation2);
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.ellipse(0, -5, 2 * (1 - worm.blink), 2, 0, 0, 2 * Math.PI);
                        ctx.fillStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.fill();
                        ctx.beginPath();
                        ctx.ellipse(0, 5, 2 * (1 - worm.blink), 2, 0, 0, 2 * Math.PI);
                        ctx.fillStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.fill();
                        ctx.restore();
                        break;
                    // Render the alien worm.
                    case 3:
                        ctx.beginPath();
                        ctx.arc(worm.nodes[0].x, worm.nodes[0].y, 25, -(worm.nodes[0].r + Math.PI / 2), -(worm.nodes[0].r - Math.PI / 2));
                        for(var m = 1; m < worm.nodes.length - 1; m++)
                        {
                            ctx.save();
                            ctx.translate(worm.nodes[m].x, worm.nodes[m].y);
                            ctx.rotate(-worm.nodes[m].r);
                            ctx.lineTo(0, 25);
                            ctx.restore();
                        }
                        ctx.arc(worm.nodes[worm.nodes.length - 1].x, worm.nodes[worm.nodes.length - 1].y, 25, -(worm.nodes[worm.nodes.length - 1].r - Math.PI / 2), -(worm.nodes[worm.nodes.length - 1].r + Math.PI / 2));
                        for(var m = worm.nodes.length - 2; m > 0; m--)
                        {
                            ctx.save();
                            ctx.translate(worm.nodes[m].x, worm.nodes[m].y);
                            ctx.rotate(-worm.nodes[m].r);
                            ctx.lineTo(0, -25);
                            ctx.restore();
                        }
                        ctx.closePath();
                        ctx.fillStyle = "#000000";
                        ctx.shadowBlur = 0;
                        ctx.fill();
                        ctx.lineWidth = 20;
                        ctx.strokeStyle = "#000000";
                        ctx.shadowBlur = 0;
                        ctx.stroke();
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.stroke();

                        var interpolation = interpolateQuadratic(Math.PI / 4, Math.PI / 6, worm.happiness);
                        ctx.save();
                        ctx.translate(worm.nodes[0].x, worm.nodes[0].y);
                        ctx.rotate(-worm.nodes[0].r);
                        ctx.beginPath();
                        ctx.moveTo(25 * Math.cos(-interpolation), 25 * Math.sin(-interpolation));
                        ctx.lineTo(50 * Math.cos(-interpolation), 50 * Math.sin(-interpolation));
                        ctx.lineWidth = 20;
                        ctx.strokeStyle = "#000000";
                        ctx.shadowBlur = 0;
                        ctx.stroke();
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(25 * Math.cos(interpolation), 25 * Math.sin(interpolation));
                        ctx.lineTo(50 * Math.cos(interpolation), 50 * Math.sin(interpolation));
                        ctx.lineWidth = 20;
                        ctx.strokeStyle = "#000000";
                        ctx.shadowBlur = 0;
                        ctx.stroke();
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(50 * Math.cos(-interpolation), 50 * Math.sin(-interpolation), 5, 0, 2 * Math.PI);
                        ctx.lineWidth = 20;
                        ctx.strokeStyle = "#000000";
                        ctx.shadowBlur = 0;
                        ctx.stroke();
                        ctx.fillStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(50 * Math.cos(interpolation), 50 * Math.sin(interpolation), 5, 0, 2 * Math.PI);
                        ctx.lineWidth = 20;
                        ctx.strokeStyle = "#000000";
                        ctx.shadowBlur = 0;
                        ctx.stroke();
                        ctx.fillStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.fill();
                        ctx.restore();
                        break;
                    // Render the flag worm.
                    case 4:
                        ctx.beginPath();
                        ctx.arc(worm.nodes[0].x, worm.nodes[0].y, 25, -(worm.nodes[0].r + Math.PI / 2), -(worm.nodes[0].r - Math.PI / 2));
                        for(var m = 1; m < worm.nodes.length - 1; m++)
                        {
                            ctx.save();
                            ctx.translate(worm.nodes[m].x, worm.nodes[m].y);
                            ctx.rotate(-worm.nodes[m].r);
                            
                            switch(true)
                            {
                                case (m - 1) % 20 < 19:
                                    ctx.lineTo(0, 25);
                                    break;
                                case (m - 1) % 20 === 19:
                                    ctx.lineTo(0, 25);
                                    ctx.lineTo(0, 25 + 40 * worm.nodes[m + 1].activeTime);
                                    ctx.lineTo(20 * worm.nodes[m + 1].activeTime, 25 + 30 * worm.nodes[m + 1].activeTime);
                                    ctx.lineTo(0, 25 + 20 * worm.nodes[m + 1].activeTime);
                                    ctx.lineTo(0, 25);
                                    break;
                            }
                            
                            ctx.restore();
                        }
                        ctx.arc(worm.nodes[worm.nodes.length - 1].x, worm.nodes[worm.nodes.length - 1].y, 25, -(worm.nodes[worm.nodes.length - 1].r - Math.PI / 2), -(worm.nodes[worm.nodes.length - 1].r + Math.PI / 2));
                        for(var m = worm.nodes.length - 2; m > 0; m--)
                        {
                            ctx.save();
                            ctx.translate(worm.nodes[m].x, worm.nodes[m].y);
                            ctx.rotate(-worm.nodes[m].r);
                            ctx.lineTo(0, -25);
                            ctx.restore();
                        }
                        ctx.closePath();
                        ctx.lineWidth = 20;
                        ctx.strokeStyle = "#000000";
                        ctx.shadowBlur = 0;
                        ctx.stroke();
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.stroke();
                        var interpolation1 = interpolateQuadratic(12, 6, worm.happiness);
                        var interpolation2 = interpolateQuadratic(-11, -15, worm.happiness);
                        var interpolation3 = interpolateQuadratic(4, 19, worm.happiness);
                        ctx.save();
                        ctx.translate(worm.nodes[0].x, worm.nodes[0].y);
                        ctx.rotate(-worm.nodes[0].r);
                        ctx.beginPath();
                        ctx.moveTo(interpolation1, interpolation2);
                        ctx.bezierCurveTo(interpolation3, -7, interpolation3, 7, interpolation1, -interpolation2);
                        ctx.lineWidth = 20;
                        ctx.strokeStyle = "#000000";
                        ctx.shadowBlur = 0;
                        ctx.stroke();
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = color;
                        ctx.shadowBlur = getShadows();
                        ctx.shadowColor = color;
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.ellipse(0, -5, 2 * (1 - worm.blink), 2, 0, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.ellipse(0, 5, 2 * (1 - worm.blink), 2, 0, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.restore();
                        break;
                }                        
            }
        }
    }
    
    //----- MINIMAP RENDERING ----
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.reset();
    ctx.save();

    // Draw the small minimap.
    if(!minimapExpanded)
    {
        var region = new Path2D();
        region.rect(gameWidth - minimapWidth - 10, gameHeight - minimapHeight - 10, minimapWidth, minimapHeight);
        ctx.clip(region, "nonzero");
        ctx.translate(gameWidth - minimapHalfWidth - 10, gameHeight - minimapHalfHeight - 10);
        ctx.fillStyle = "#000000";
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-minimapHalfWidth, -minimapHalfHeight, minimapWidth, minimapHeight);
    }
    // Draw the fullscreen minimap.
    else
    {
        ctx.translate(gameHalfWidth, gameHalfHeight);
        ctx.fillStyle = "#000000";
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-gameHalfWidth, -gameHalfHeight, gameWidth, gameHeight);
    }
    
    ctx.scale(camera.zoom * minimapZoom, camera.zoom * minimapZoom);
    ctx.translate(-camera.x, -camera.y);
    // MINIMAP SPACE
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 25;
    ctx.beginPath();
    ctx.arc(0, 0, WORLD_RADIUS, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.shadowBlur = getShadows(clampMin(20 * camera.zoom, 20));
    
    for(var n = 0; n < energies.length; n++)
    {
        const energy = energies[n];
        
        if(energy.inMinimap(camera, minimapExpanded))
        {
            ctx.globalAlpha = energy.opacity;
            
            switch(energy.type)
            {
                case 1:
                    ctx.fillStyle = "#ff0000";
                    ctx.shadowColor = "#ff0000";
                    break;
                case 2:
                    ctx.fillStyle = "#00e5ff";
                    ctx.shadowColor = "#00e5ff";
                    break;
                case 3:
                    ctx.fillStyle = "#ff9100";
                    ctx.shadowColor = "#ff9100";
                    break;
            }
            
            ctx.beginPath();
            ctx.arc(energy.x, energy.y, 25, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    
    ctx.lineWidth = 50;
    ctx.lineCap = "round";
    ctx.globalAlpha = 1;
    
    for(var n = 0; n < worms.length; n++)
    {
        const worm = worms[n];

        if(!worm.dead)
        {
            var color = hueString(worm.hue);
        
            if(worm.inMinimap(camera, minimapExpanded))
            {
                ctx.strokeStyle = color;
                ctx.shadowColor = color;
                ctx.beginPath();
                ctx.moveTo(worm.nodes[0].x, worm.nodes[0].y);
                
                for(var m = 1; m < worm.nodes.length; m++)
                {
                    ctx.lineTo(worm.nodes[m].x, worm.nodes[m].y);
                }
                
                ctx.stroke();
            }
        }
    }
    
    ctx.restore();

    if(!minimapExpanded)
    {
        ctx.lineWidth = 20;
        ctx.strokeStyle = "#000000";
        ctx.beginPath();
        ctx.roundRect(gameWidth - minimapWidth - 10, gameHeight - minimapHeight - 10, minimapWidth, minimapHeight, 20);
        ctx.stroke();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#222222";
        ctx.stroke();
        //ctx.strokeRect(gameWidth - minimapWidth - 10, gameHeight - minimapHeight - 10, minimapWidth, minimapHeight);
    }

    ctx.reset();
    ctx.globalAlpha = blackScreenOpacity;
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    request = requestAnimationFrame(render);
}

//----------------------------
//---------- MATHS -----------
//----------------------------

function distance(p1, p2 = point(0, 0))
{
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function distanceSquared(p1, p2 = point(0, 0))
{
    return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
}

// For quicker calculation of the distance.
function distanceManhattan(p1, p2 = point(0, 0))
{
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

// For fluid worm movement and camera animation.
function interpolateLinear(startingValue, endingValue, t)
{
    return (startingValue + (endingValue - startingValue) * t);
}

function interpolateQuadratic(startingValue, endingValue, t)
{
    return interpolateLinear(startingValue, endingValue, t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
}

function calculateAngleDifference(a1, a2)
{
    var difference = a2 - a1;
    while(difference < -Math.PI)
        difference += 2 * Math.PI;
    while(difference > Math.PI)
        difference -= 2 * Math.PI;
    return difference;
}

function pointInCircle(point, circle)
{
    if(distance(circle.center, point) <= circle.radius)
    {
        return true;
    }
    
    return false;
}

function pointInRectangle(point, rectangle, padding = 0)
{
    if(point.x >= rectangle.center.x - rectangle.width / 2 - padding && point.x <= rectangle.center.x + rectangle.width / 2 + padding && point.y >= rectangle.center.y - rectangle.height / 2 - padding && point.y <= rectangle.center.y + rectangle.height / 2 + padding)
    {
        return true;
    }
    
    return false;
}

function intersectCircleLineSegment(circle, line)
{
    var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
    v1 = {};
    v2 = {};
    v1.x = line.p2.x - line.p1.x;
    v1.y = line.p2.y - line.p1.y;
    v2.x = line.p1.x - circle.center.x;
    v2.y = line.p1.y - circle.center.y;
    b = (v1.x * v2.x + v1.y * v2.y);
    c = 2 * (v1.x * v1.x + v1.y * v1.y);
    b *= -2;
    d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
    if(isNaN(d))
    {
        return [];
    }
    u1 = (b - d) / c;
    u2 = (b + d) / c;    
    retP1 = {};
    retP2 = {}  
    ret = [];
    if(u1 <= 1 && u1 >= 0)
    {
        retP1.x = line.p1.x + v1.x * u1;
        retP1.y = line.p1.y + v1.y * u1;
        ret[0] = retP1;
    }
    if(u2 <= 1 && u2 >= 0)
    {
        retP2.x = line.p1.x + v1.x * u2;
        retP2.y = line.p1.y + v1.y * u2;
        ret[ret.length] = retP2;
    }       
    return ret;
}

function intersectCircleCircle(circle1, circle2)
{
    var a, dx, dy, d, h, rx, ry;
    var x0 = circle1.center.x, y0 = circle1.center.y, r0 = circle1.radius, x1 = circle2.center.x, y1 = circle2.center.y, r1 = circle2.radius, x2, y2;
    dx = x1 - x0;
    dy = y1 - y0;
    d = Math.sqrt((dy*dy) + (dx*dx));
    if (d > (r0 + r1)) {
        return false;
    }
    if (d < Math.abs(r0 - r1)) {
        return false;
    }
    a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;
    x2 = x0 + (dx * a/d);
    y2 = y0 + (dy * a/d);
    h = Math.sqrt((r0*r0) - (a*a));
    rx = -dy * (h/d);
    ry = dx * (h/d);
    var xi = x2 + rx;
    var xi_prime = x2 - rx;
    var yi = y2 + ry;
    var yi_prime = y2 - ry;
    return [point(xi, yi), point(xi_prime, yi_prime)];
}

function clampMin(num, min)
{
    return Math.max(num, min)
}

function clampMax(num, max)
{
    return Math.min(num, max);
}

function clamp(num, min, max)
{
    return Math.min(Math.max(num, min), max);
}
