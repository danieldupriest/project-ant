const config = {
  randomDir: .1,
  maxVelocity: 1,
  width: 512,
  height: 512,
  bodyLength: 5,
  hungerLimit: .3,
  pheromoneZeroCutoff: .01,
  pheromoneDissipationRate: .99,
};

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(x, y) {
    this.x += x;
    this.y += y;
  }

  unit() {
    const mag = Math.abs(this.x * this.x + this.y * this.y);
    return new Point(this.x / mag, this.y / mag);
  }
}

class Cell {
  constructor(point, color) {
    this.backgroundDrawn = false;
    this.point = point;
    this.color = color;
    this.pathPheromone = 0.0;
    this.foodPheromone = 0.0;
  }

  getPheromones() {
    return { path: this.pathPheromone, food: this.foodPheromone };
  }

  update() {
    this.pathPheromone *= config.pheromoneDissipationRate;
    if (this.pathPheromone < config.pheromoneZeroCutoff) this.pathPheromone = 0;
    this.foodPheromone *= config.pheromoneDissipationRate;
    if (this.foodPheromone < config.pheromoneZeroCutoff) this.foodPheromone = 0;
  }

  renderGround(context) {
    const x = this.point.x;
    const y = this.point.y;
    context.fillStyle = this.color;
    context.fillRect(x, y, 1, 1);
  }

  renderPheromones(context) {
    const x = this.point.x;
    const y = this.point.y;

    if (this.foodPheromone > config.pheromoneZeroCutoff) {
      const foodAlpha = Math.min(1, this.foodPheromone);
      context.fillStyle = `rgba(255, 0, 0, ${foodAlpha})`;
      context.fillRect(x, y, 1, 1);
    }

    if (this.pathPheromone > config.pheromoneZeroCutoff) {
      const pathAlpha = Math.min(1, this.pathPheromone);
      console.log(pathAlpha);
      context.fillStyle = `rgba(0, 0, 255, ${pathAlpha})`;
      context.fillRect(x, y, 1, 1);
    }
  }
}

class Map {
  constructor() {
    this.data = [];
    this.init();
    this.genGround();
  }

  init() {
    for (let x = 0; x < config.width; x++) {
      const newRow = new Array(config.height);
      this.data.push(newRow);
    }
  }

  addPheromone(position, pheromoneType) {
    const x = Math.floor(position.x);
    const y = Math.floor(position.y);
    if (x < 0 || x >= config.width || y < 0 || y >= config.height) return;
    if (pheromoneType === 'food')
      this.data[x][y].foodPheromone = 1.0;
    else if (pheromoneType === 'path')
      this.data[x][y].pathPheromone = 1.0;  
  }

  genGround() {
    for (let x = 0; x < config.width; x++) {
      for (let y = 0; y < config.height; y++) {
        const point = new Point(x, y);
        const randR = Math.floor(Math.random() * 50);
        const randG = Math.floor(200 + Math.random() * 56);
        const randB = Math.floor(Math.random() * 50);
        const color = `rgb(${randR}, ${randG}, ${randB})`;
        this.data[x][y] = new Cell(point, color)
      }
    }
  }

  render(context) {
    console.log(context);
    context.fillStyle = 'rgb(50, 200, 50)';
    context.fillRect(0, 0, config.width, config.height);

    for (const i of this.data) {
      for (const j of i) {
        if (j) j.renderPheromones(context);
      }
    }
  }

  update() {
    for (const i of this.data) {
      for (const j of i) {
        if (j) j.update();
      }
    }
  }
}

class Ant {
  constructor(point) {
    this.position = new Point(point.x, point.y);
    this.velocity = new Point(0, 0);
    this.foodCarried = 0.0;
    this.energy = 1.0;
  }

  chooseDirection() {
    const diff = config.randomDir;
    const randX = Math.random() * diff - .5 * diff;
    const randY = Math.random() * diff - .5 * diff;
    this.velocity.add(randX, randY);
    
    if (this.velocity.x > config.maxVelocity)
      this.velocity.x = config.maxVelocity;
    if (this.velocity.x < -config.maxVelocity)
      this.velocity.x = -config.maxVelocity;
    if (this.velocity.y > config.maxVelocity)
      this.velocity.y = config.maxVelocity;
    if (this.velocity.y < -config.maxVelocity)
      this.velocity.y = -config.maxVelocity;
  }

  handleBorders() {
    if (this.position.x > config.width) {
      this.position.x = config.width;
      this.velocity.x = 0;
    }

    if (this.position.x < 0) {
      this.position.x = 0;
      this.velocity.x = 0;
    }

    if (this.position.y > config.height) {
      this.position.y = config.height;
      this.velocity.y = 0;
    }

    if (this.position.y < 0) {
      this.position.y = 0;
      this.velocity.y = 0;
    }
  }

  move() {
    this.position.add(this.velocity.x, this.velocity.y);
  }

  leavePheromone(map) {
    let pheromoneType;
    if (this.foodCarried > 0) pheromoneType = 'food';
    else pheromoneType = 'path';
    map.addPheromone(this.position, pheromoneType, 1.0)
  }

  update(map) {
    this.chooseDirection();  
    this.leavePheromone(map);
    this.move();
    this.handleBorders();
  }

  render(context) {
    const startX = this.position.x;
    const startY = this.position.y;
    var radians = Math.atan2(this.velocity.x, this.velocity.y);
    const endX = startX + config.bodyLength * Math.sin(radians);
    const endY = startY + config.bodyLength * Math.cos(radians);
    context.strokeStyle = 'rgb(20, 20, 20)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
  }
}

class AntSim {
  constructor(contextBack, contextFore) {
    this.window = window;
    this.contextBack = contextBack;
    this.contextFore = contextFore;
    this.map = new Map(config.width, config.height);
    this.ants = [];

    this.nestLocation = new Point(
      Math.floor(config.width / 2),
      Math.floor(config.height / 2)
    );
  }

  addAnts(num) {
    for (let i = 0; i < num; i++) {
      const ant = new Ant(this.nestLocation);
      this.ants.push(ant)
    }
  }

  render() {
    this.map.update();
    this.map.render(this.contextBack);
  
    for (const ant of this.ants) {
      ant.update(this.map);
    }

    this.contextFore.clearRect(0, 0, config.width, config.height);
    
    for (const ant of this.ants) {
      ant.render(this.contextFore);
    }

    this.window.requestAnimationFrame(
      function() { this.render() }.bind(this)
    );
  }
}
