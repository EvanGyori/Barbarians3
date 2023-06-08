//Variables making canvas possible to edit
var cnv = document.getElementById('gameCanvas');
var ctx = cnv.getContext('2d');

//Constant variables
const ANIMAL_TILE_CHANCE = 0.02; // Chance that a tile will be a animal spawn point for each tile
const OBJ_TILE_CHANCE = 0.025; // Chance that a tile will be a object (tree or rock) for each tile
const TREE_CHANCE = 0.5; // Chance that a object will be a tree over a rock
const WORLD_SIZE = 200; // how many tiles are in the world 50 pixels per tiles
const WEAPONS = [
  {DMG: 5, COOLDOWN: 75, GATHERMULTI: 1, ATTACKRANGE: 5}, // 0 - Basic Sword
  {DMG: 10, COOLDOWN: 150, GATHERMULTI: 2, ATTACKRANGE: 5}, // 1 - Battleaxe
  {DMG: 5, COOLDOWN: 150, GATHERMULTI: 2, ATTACKRANGE: 10} // 2 - LongSword
];
const MOVES = [
  {NAME: "Dodge", COOLDOWN: 1000, DEFAULTCONTROLS: false, DURATION: 20}, // 0 - Dodge
  {NAME: "Spin Attack", COOLDOWN: 2000, DEFAULTCONTROLS: true, DURATION: 40}, // 1 - Spin Attack
  {NAME: "Slam Attack", COOLDOWN: 45, DEFAULTCONTROLS: true, DURATION: 70}, // 2 - Slam Attack
  {NAME: "Bow & Arrow", COOLDOWN: 1000, DEFAULTCONTROLS: true, DURATION: 100}, // 3 - Bow & Arrow
  {NAME: "Triplets", COOLDOWN: 2000, DEFAULTCONTROLS: true, DURATION: 150} // 4 - Triplets (shoots 3 arrows)
];
const MAGIC = [
  {NAME: "Fireball", COOLDOWN: 1500, DURATION: 150}, // 0 - Fireball
  {NAME: "Reflect", COOLDOWN: 6000, DURATION: 500}, // 1 - Reflect (Take 25% damage and reflect 75% onto attacker but cannot attack)
];
const NPCS = [
  {NAME: "Sheep", MAXHP: 18, WALKSPEED: 1, RUNSPEED: 1.3, SIZE: 35, XPREWARD: 10, FOODREWARD: 5, HOSTILE: false, SHOWHP: true},
  {NAME: "Brown Bear", MAXHP: 62, WALKSPEED: 0.9, RUNSPEED: 1.2, SIZE: 50, XPREWARD: 50, FOODREWARD: 50, HOSTILE: true, COOLDOWN: 100, DMG: 14, SHOWHP: true},
  {NAME: "Goblin", MAXHP: 5, WALKSPEED: 1, RUNSPEED: 1, SIZE: 20, XPREWARD: 1, GOLDREWARD: 1, HOSTILE: true, COOLDOWN: 75, DMG: 3, SHOWHP: false}
];

const UNLOCK_MOVE1 = 5;
const UNLOCK_MOVE2 = 10;
const UNLOCK_MAGIC1 = 15;
const UNLOCK_MAGIC2 = 25;

//Player
var playerCount = 0;
var players = {
  p1: {
    dead: true,
    x: Math.floor(Math.random()*WORLD_SIZE*50),
    y: Math.floor(Math.random()*WORLD_SIZE*50),
    x2: 0, //speed player is moving
    y2: 0,
    angle: 0,
    size: 25, //size in pixels
    speed: 1.5, //Pixels per 10 miliSec
    weapon: 1, //Sword id
    attackTime: 0, //Time till player can attack again
    supplies: {food: 0, wood: 0, stone: 0, gold: 0},
    hp: 20,
    hpMax: 20,
    xp: 0,
    lvl: 1,
    gather: 1,
    dmg: 1, // % of damage dealt by weapon
    points: 0,
    regen: 0.3, // % of health regen every 2 seconds if untouched for 6 seconds
    regenTime: 200, //10 Milisec
    move1: [0, 0, 0, 0, true], //Special move for the player [move, cooldown, duration, type, locked]
    move2: [1, 0, 0, 0, true],
    magic1: [0, 0, 0, 0, true], // Special magic [magic, cooldown, duration, type, locked]
    magic2: [1, 0, 0, 0, true],
    attackRestrict: false,
    moveRestrict: false, //Restricts player from attacking
    effects: [], //0 - Acid attack, 1 - acid infect
    world: 0,
    masterySkills: {unlocked: [], points: 0}
  }
}


var world = {
  x: 0,
  y: 0
}

var client = {
  key: {w: [false, 0], a: [false, 0], s: [false, 0], d: [false, 0]},
  mouse: {x: 0, y: 0, lmb: false, mmb: false, rmb: false}
};

var object = {};
var NPCSpawn = {}; // 0 - Sheep
var entities = [];
var items = [];
var magic = []; // 0 - fireball
var particles = [];

//Images
var player_img = new Image();
var tree_img = new Image();
var rock_img = new Image();
var sheep_img = new Image();
var move1_img = new Image();
var move2_img = new Image();
var locked_img = new Image();
var magic1_img = new Image();
var magic2_img = new Image();
var magicBall_img = new Image();
var reflect_img = new Image();
var gas_img = new Image();
var dust_img = new Image();
var sheep_img = new Image();
var brown_bear_img = new Image();
var goblin_img = new Image();
var meat_img = new Image();
var gold_img = new Image();
var effect_img = new Image();

player_img.src = 'player.svg';
tree_img.src = 'Tree.svg';
rock_img.src = 'Rock.svg';
sheep_img.src = 'Sheep.svg';
move1_img.src = 'Dodge-Move.svg';
move2_img.src = 'Dodge-Move.svg';
locked_img.src = 'Locked.svg';
magic1_img.src = 'Fireball-Magic.svg';
magic2_img.src = 'Fireball-Magic.svg';
magicBall_img.src = 'Fireball.svg';
reflect_img.src = 'Reflect.svg';
gas_img.src = 'Acid-Particle.svg';
dust_img.src = 'Dust-Particle.svg';
sheep_img.src = 'Sheep.svg';
brown_bear_img.src = 'Brown-Bear.svg';
goblin_img.src = 'Goblin.svg';
meat_img.src = 'Meat.svg';
gold_img.src = 'Gold.svg';
effect_img.src = 'Acid-Attack.svg';

generateMap(WORLD_SIZE, WORLD_SIZE);

setInterval(function() {
  moveParticles();
  playerMovement();
  playerRules();
  mouseDown();
  if (players.p1.dead === false) { playerMoves(); playerMagic(); }
  NPCAI();
  collision();
  drawCanvas();
}, 10);

setInterval(function() {
  createParticles();
}, 200);

setInterval(function() {
  if (client.key.w[1] > 0) {client.key.w[1] = 0;}
  if (client.key.s[1] > 0) {client.key.s[1] = 0;}
  if (client.key.a[1] > 0) {client.key.a[1] = 0;}
  if (client.key.d[1] > 0) {client.key.d[1] = 0;}
}, 500);

setInterval(function() {
  NPCSpawns();
}, 1000);

//jquery
//Sets variables based on mouse position
document.onmousemove = function(evt) {
  client.mouse.x = evt.pageX;
  client.mouse.y = evt.pageY;
}

$('body').mousedown(function(evt) {
  switch (evt.which) {
    case 1:
      client.mouse.lmb = true; //Left Mouse Button
      break;
    case 2:
      client.mouse.mmb = true; //Middle Mouse Button
      break;
    case 3:
      client.mouse.rmb = true; //Right Mouse Button
      break;
  }
}).mouseup(function(evt) {
  mouseUp();
  switch (evt.which) {
    case 1:
      client.mouse.lmb = false;
      break;
    case 2:
      client.mouse.mmb = false;
      break;
    case 3:
      client.mouse.rmb = false;
      break;
  }
});

//Sets variables to true of false whether the key is pressed
$(function() {
  $(document).keydown(function(evt) {
    switch(evt.keyCode) {
      case 87:
        client.key.w[0] = true;
        break;
      case 83:
        client.key.s[0] = true;
        break;
      case 68:
        client.key.d[0] = true;
        break;
      case 65:
        client.key.a[0] = true;
        break;
      case 81:
        client.key.q = true;
        break;
      case 69:
        client.key.e = true;
        break;
      case 49:
        client.key.one = true;
        break;
      case 50:
        client.key.two = true;
        break;
    }
  }).keyup(function(evt) {
    switch(evt.keyCode) {
      case 87:
        client.key.w[0] = false;
        client.key.w[1]++;
        break;
      case 83:
        client.key.s[0] = false;
        client.key.s[1]++;
        break;
      case 68:
        client.key.d[0] = false;
        client.key.d[1]++;
        break;
      case 65:
        client.key.a[0] = false;
        client.key.a[1]++;
        break;
      case 81:
        client.key.q = false;
        break;
      case 69:
        client.key.e = false;
        break;
      case 49:
        client.key.one = false;
        break;
      case 50:
        client.key.two = false;
        break;
      case 192: //Tilda ~
        if (players.p1.moveMode == 0) {players.p1.moveMode = 1;} else {players.p1.moveMode = 0;}
    }
  });
});

function moveParticles() {
  for (i=0; i<particles.length; i++) {
    if (particles[i] != undefined) {
      particles[i].lifetime--;
      var angle = Math.atan2(particles[i].x - particles[i].gotoX, -(particles[i].y - particles[i].gotoY)) - Math.PI/2;
      particles[i].x += particles[i].speed*Math.cos(angle);
      particles[i].y += particles[i].speed*Math.sin(angle);
      if (particles[i].lifetime <= 0) {particles[i] = undefined;}
    }
  }
}

function createParticles() {
  if (players.p1.dead === false) {
    for (i=0; i<players.p1.effects.length; i++) {
      if (players.p1.effects[i] != undefined) {
        players.p1.effects[i][1] -= 20;
        if (players.p1.effects[i] == 0) {
          particles[particles.length] = {x: players.p1.x+Math.random()*50-25, y: players.p1.y+Math.random()*50-25, gotoX: players.p1.x+Math.random()*50-25, gotoY: players.p1.y+Math.random()*50-25, type: 0, lifetime: 150, speed: 0.5};
        }
        if (players.p1.effects[i][1] <= 0) { players.p1.effects[i] = undefined; }
      }
    }
  }
}

function NPCSpawns() {
  for (x = Math.floor(players.p1.x/50)-15; x <= Math.floor(players.p1.x/50)+15; x++) {
    for (y = Math.floor(players.p1.y/50)-15; y <= Math.floor(players.p1.y/50)+15; y++) {
      if (NPCSpawn[x+"_"+y] != undefined) {
        if (NPCSpawn[x+"_"+y][1] === false) {
          if (NPCSpawn[x+"_"+y][2] > 0) {
            NPCSpawn[x+"_"+y][2]--;
          } else {
            NPCSpawn[x+"_"+y][1] = true;
            entities[entities.length] = {preset: NPCSpawn[x+"_"+y][0], spawn: x+"_"+y, x: x*50+50, y: y*50+50, gotoX: x*50+50, gotoY: y*50+50,
            hp: NPCS[NPCSpawn[x+"_"+y][0]].MAXHP, angle: Math.random()*10, move: 0, effects: [], cooldown: 0};
          }
        }
      }
    }
  }
}

function NPCAI() {
  for (i=0; i<entities.length; i++) {
    if (entities[i] != undefined) {
      var preset = entities[i].preset;
      if (players.p1.dead === false) {
        var distance = Math.dist(players.p1.x, players.p1.y, entities[i].x, entities[i].y);
        //Animal looks at player if not hostile
        if (distance <= 400 + players.p1.size/2 && NPCS[preset].HOSTILE === false) {
          var angle = Math.atan2(players.p1.x - entities[i].x, -(players.p1.y - entities[i].y)) - Math.PI/2;
          entities[i].angle = angle;
          //Run away if player is too close
          if (distance <= 5+players.p1.size/2+NPCS[preset].SIZE) {
            var angle = Math.atan2(players.p1.x - entities[i].x, -(players.p1.y - entities[i].y)) + Math.PI/2;
            entities[i].move = 2; // 0 - dont move, 1 - walk, 2 - run
            entities[i].gotoX = entities[i].x+2000*Math.cos(angle);
            entities[i].gotoY = entities[i].y+2000*Math.sin(angle);
          }
        }
      }
      //Hostile Animal
      if (NPCS[preset].HOSTILE === true) {
        //cooldown
        if (entities[i].cooldown > 0) { entities[i].cooldown--; }
        //Chase player if nearby
        if (distance <= 200+players.p1.size/2+NPCS[preset].SIZE) {
          var angle = Math.atan2(players.p1.x - entities[i].x, -(players.p1.y - entities[i].y)) - Math.PI/2;
          entities[i].move = 2;
          entities[i].gotoX = entities[i].x+1000*Math.cos(angle);
          entities[i].gotoY = entities[i].y+1000*Math.sin(angle);
          //Attack player
          if (distance <= 5+players.p1.size/2+NPCS[preset].SIZE && entities[i].cooldown <= 0) {
            entities[i].cooldown = NPCS[preset].COOLDOWN;
            if ( (players.p1.magic1[2] > 0 && players.p1.magic1[0] == 1) || (players.p1.magic2[2] > 0 && players.p1.magic2[0] == 1)) {
              players.p1.hp -= NPCS[preset].DMG/4;
              entities[i].hp -= NPCS[preset].DMG*0.75;
            } else {players.p1.hp -= NPCS[preset].DMG;}
            players.p1.regenTime = 600;
          }
        }
      }
      //Wander
      if (Math.random() >= 0.999 && entities[i].move == 0) {
        entities[i].move = 1;
        entities[i].gotoX = entities[i].x+Math.random()*1000-500;
        entities[i].gotoY = entities[i].y+Math.random()*1000-500;
      }
      //Move
      if (entities[i].move > 0 && entities[i].cooldown <= 0) {
        if (Math.dist(entities[i].x, entities[i].y, entities[i].gotoX, entities[i].gotoY) <= NPCS[preset].RUNSPEED) {
          entities[i].move = 0;
        } else {
          var angle = Math.atan2(entities[i].x - entities[i].gotoX, -(entities[i].y - entities[i].gotoY)) + Math.PI/2;
          if (entities[i].move == 1) {var speed = NPCS[preset].WALKSPEED;}
          else {var speed = NPCS[preset].RUNSPEED;}
          entities[i].angle = angle;
          entities[i].x += speed*Math.cos(angle);
          entities[i].y += speed*Math.sin(angle);
        }
      }
      //If animal is dead
      if (entities[i].hp <= 0) {
        if (NPCS[entities[i].preset].FOODREWARD != undefined) {items[items.length] = {id: 0, x: entities[i].x, y: entities[i].y, value: NPCS[entities[i].preset].FOODREWARD};}
        if (NPCS[entities[i].preset].GOLDREWARD != undefined) {items[items.length] = {id: 1, x: entities[i].x, y: entities[i].y, value: NPCS[entities[i].preset].GOLDREWARD};}
        entities[i] = undefined;
      }
    }
  }
}

function generateMap(X, Y) {
  world = {
    x: X*50,
    y: Y*50
  }

  for (x=0; x<X/2; x++) {
    for (y=0; y<Y/2; y++) {
      var random = Math.random();
      if (Math.random() <= OBJ_TILE_CHANCE) {
        if (random <= TREE_CHANCE) {var preset = 0; var size = 10;} else {var preset = 1; var size = 40;} //0 - tree, 1 - rock
        object[x*2+"_"+y*2] = [preset, 0, 2, 2, true, size]; //object, lift, size x, size y, circle?, collision radius
      } else if (Math.random() <= ANIMAL_TILE_CHANCE) {
        if (random <= 0.9) {var preset = 0;} else {var preset = 1;} //0 - sheep, 1 - Bear
        NPCSpawn[x*2+"_"+y*2] = [preset, false, Math.floor(Math.random()*10)];
      }
    }
  }
}

function playerRules() {
  //Leveling
  if (players.p1.xp >= players.p1.lvl*15+10) {
    players.p1.xp -= players.p1.lvl*15+10;
    players.p1.lvl++;
    players.p1.points++;
    players.p1.hpMax += 1.5;
    players.p1.size += 0.1;
    players.p1.dmg += 0.1;
    players.p1.gather += 0.25;
    players.p1.hp = players.p1.hpMax;
  }
  if (players.p1.lvl >= UNLOCK_MOVE1) { players.p1.move1[4] = false; }
  if (players.p1.lvl >= UNLOCK_MOVE2) { players.p1.move2[4] = false; }
  if (players.p1.lvl >= UNLOCK_MAGIC1) { players.p1.magic1[4] = false; }
  if (players.p1.lvl >= UNLOCK_MAGIC2) { players.p1.magic2[4] = false; }

  //Death
  if (players.p1.hp <= 0) { players.p1.dead = true; }

  //Regenerating
  if (players.p1.regenTime <= 0) {
    players.p1.regenTime = 200;
    players.p1.hp += players.p1.hpMax*players.p1.regen;
    if (players.p1.hp > players.p1.hpMax) { players.p1.hp = players.p1.hpMax; }
  } else {
    players.p1.regenTime--;
  }

  //Pickup Items
  for (i=0; i<items.length; i++) {
    if (items[i] != undefined) {
      if (Math.dist(players.p1.x, players.p1.y, items[i].x, items[i].y) <= players.p1.size/2) {
        if (items[i].id == 0) {players.p1.supplies.food += items[i].value;}
        else if (items[i].id == 1) {players.p1.supplies.gold += items[i].value;}
        items[i] = undefined;
      }
    }
  }
}

function mouseUp() {
  if (client.mouse.lmb === true) {
    if (players.p1.dead === true) {
      if (client.mouse.x >= cnv.width/2-75 && client.mouse.x <= cnv.width/2+75
      && client.mouse.y >= cnv.height/4 && client.mouse.y <= cnv.height/4+50) { //Play button
        players.p1 = {
          dead: false,
          x: Math.floor(Math.random()*WORLD_SIZE*50),
          y: Math.floor(Math.random()*WORLD_SIZE*50),
          x2: 0, //speed player is moving
          y2: 0,
          angle: 0,
          size: 25, //size in pixels
          speed: 1.5, //Pixels per 10 miliSec
          weapon: 0, //Sword id
          attackTime: 0, //Time till player can attack again
          supplies: {food: 0, wood: 0, stone: 0, gold: 0},
          hp: 20,
          hpMax: 20,
          xp: 0,
          lvl: 1,
          gather: 1,
          dmg: 1, // % of damage dealt by weapon
          points: 0,
          regen: 0.3, // % of health regen every 2 seconds if untouched for 6 seconds
          regenTime: 200, //10 Milisec
          move1: [3, 0, 0, 0, true], //Special move for the player [move, cooldown, duration, type, locked]
          move2: [4, 0, 0, 0, true],
          magic1: [0, 0, 0, 0, true], // Special magic [magic, cooldown, duration, type, locked]
          magic2: [1, 0, 0, 0, true],
          attackRestrict: false, //Restricts player from attacking
          moveRestrict: false,
          effects: [], //0 - Acid attack, 1 - acid infect
          world: 0
        }
      }
    } else if (client.mouse.x > 170 && client.mouse.x <= 300 && client.mouse.y >= 35 && client.mouse.y < 85 && players.p1.points > 0) {
      players.p1.points--;
      if (client.mouse.x > 170 && client.mouse.x <= 300 && client.mouse.y >= 35 && client.mouse.y < 50) {players.p1.hpMax += 0.75;}

      if (client.mouse.x > 170 && client.mouse.x <= 300 && client.mouse.y >= 50 && client.mouse.y < 65) {players.p1.dmg += 0.05;}

      if (client.mouse.x > 170 && client.mouse.x <= 300 && client.mouse.y >= 65 && client.mouse.y < 85) {players.p1.gather += 0.2;}
    }
  }
}

function mouseDown() {
  if (client.mouse.lmb === true) {
    if (players.p1.dead === false) {
      if ( !(client.mouse.x > 170 && client.mouse.x <= 300 && client.mouse.y >= 35 && client.mouse.y < 85) && players.p1.attackTime <= 0 && players.p1.attackRestrict === false) {
        players.p1.attackTime = WEAPONS[players.p1.weapon].COOLDOWN;
        for (i=0; i<entities.length; i++) {
          if (entities[i] != undefined) {
            if (Math.dist(players.p1.x+players.p1.size/2*Math.cos(players.p1.angle), players.p1.y+players.p1.size/2*Math.sin(players.p1.angle), entities[i].x, entities[i].y) <= WEAPONS[players.p1.weapon].ATTACKRANGE+players.p1.size/2+NPCS[entities[i].preset].SIZE) {
              entities[i].hp -= WEAPONS[players.p1.weapon].DMG*players.p1.dmg;
              /*for (i2=0; i2<players.p1.effects.length; i2++) {
                if (players.p1.effects[i2] != undefined) {
                  if (players.p1.effect[i2][0] == 0) {entities[i].effects[entities[i].effects.length] = [0, 1000];}
                }
              }*/
              var angle = Math.atan2(players.p1.x - entities[i].x, -(players.p1.y - entities[i].y)) + Math.PI/2;
              entities[i].move = 2;
              entities[i].gotoX = entities[i].x+2000*Math.cos(angle);
              entities[i].gotoY = entities[i].y+2000*Math.sin(angle);
              if (entities[i].hp <= 0) {
                players.p1.xp += NPCS[entities[i].preset].XPREWARD;
              }
            }
          }
        }
        for (x = Math.floor(players.p1.x/50-players.p1.size/2); x <= Math.floor(players.p1.x/50+players.p1.size); x++) {
          for (y = Math.floor(players.p1.y/50-players.p1.size/2); y <= Math.floor(players.p1.y/50+players.p1.size); y++) {
            if (object[x+"_"+y] != undefined) {
              if (Math.dist(players.p1.x+players.p1.size/2*Math.cos(players.p1.angle), players.p1.y+players.p1.size/2*Math.sin(players.p1.angle), x*50+50, y*50+50) <= 35+players.p1.size/2) {
                if (object[x+"_"+y][0] == 0) {
                  players.p1.xp += WEAPONS[players.p1.weapon].GATHERMULTI;
                  players.p1.supplies.wood += Math.floor(players.p1.gather*WEAPONS[players.p1.weapon].GATHERMULTI);
                  object[x+"_"+y][1] = 5;
                } else if (object[x+"_"+y][0] == 1) {
                  players.p1.xp += WEAPONS[players.p1.weapon].GATHERMULTI;
                  players.p1.supplies.stone += Math.floor(players.p1.gather*WEAPONS[players.p1.weapon].GATHERMULTI);
                  object[x+"_"+y][1] = 5;
                }
              }
            }
          }
        }
      }
    }
  }
  if (players.p1.dead === false) {
    if (players.p1.attackTime > 0) {
      players.p1.attackTime--;
    }
    if (players.p1.weapon == 0) {
      if (players.p1.attackTime >= 30) {
        player_img.src = 'Player-Attack.svg';
      } else {
        player_img.src = 'Player.svg';
      }
    } else if (players.p1.weapon == 1) {
      if (players.p1.attackTime >= 50) {
        player_img.src = 'Player-Attack-1.svg';
      } else {
        player_img.src = 'Player-1.svg';
      }
    }
  }
}

function collision() {
  //Border
  if (players.p1.x < 0) {players.p1.x = 0;}
  if (players.p1.x > WORLD_SIZE*50) {players.p1.x = WORLD_SIZE*50;}
  if (players.p1.y < 0) {players.p1.y = 0;}
  if (players.p1.y > WORLD_SIZE*50) {players.p1.y = WORLD_SIZE*50;}

  //Objects
  for (x = Math.floor(players.p1.x/50-cnv.width/100-1); x < Math.floor(players.p1.x/50+cnv.width/100+1); x++) {
    for (y = Math.floor(players.p1.x/50-cnv.width/100-1); y < Math.floor(players.p1.x/50+cnv.width/100+1); y++) {
      if (object[x+"_"+y] != undefined) {
        //NPCS and Objects
        for (i=0; i<entities.length; i++) {
          if (entities[i] != undefined) {
            if (object[x+"_"+y][4] === true) {
              if (Math.dist(entities[i].x, entities[i].y, x*50+object[x+"_"+y][2]*25, y*50+object[x+"_"+y][3]*25) <= NPCS[entities[i].preset].SIZE+object[x+"_"+y][5]) {
                var angle = Math.atan2(entities[i].x - (x*50+object[x+"_"+y][2]*25), -(entities[i].y - (y*50+object[x+"_"+y][3]*25))) - Math.PI/2;
                if (entities[i].move == 1) {var pushSpeed = Math.abs(NPCS[entities[i].preset].WALKSPEED);}
                else if (entities[i].move == 2) {var pushSpeed = Math.abs(NPCS[entities[i].preset].RUNSPEED);}
                entities[i].x += pushSpeed*Math.cos(angle);
                entities[i].y += pushSpeed*Math.sin(angle);
              }
            }
          }
        }
      }
    }
  }

  //Objects and players
  for (x = Math.floor(players.p1.x/50 -players.p1.size/50 -3); x <= Math.floor(players.p1.x/50 +players.p1.size/50 +3); x++) {
    for (y = Math.floor(players.p1.y/50 -players.p1.size/50 -3); y <= Math.floor(players.p1.y/50 +players.p1.size/50 +3); y++) {
      if (object[x+"_"+y] != undefined) {
        if (object[x+"_"+y][4] === true) {
          if (Math.dist(players.p1.x, players.p1.y, x*50+object[x+"_"+y][2]*25, y*50+object[x+"_"+y][3]*25) <= players.p1.size/2+object[x+"_"+y][5]) {
            var angle = Math.atan2(players.p1.x - (x*50+object[x+"_"+y][2]*25), -(players.p1.y - (y*50+object[x+"_"+y][3]*25))) - Math.PI/2;
            var pushSpeed = Math.abs(players.p1.x2)+Math.abs(players.p1.y2);
            players.p1.x += pushSpeed*Math.cos(angle);
            players.p1.y += pushSpeed*Math.sin(angle);
          }
        }
      }
    }
  }

  //NPCS
  for (i=0; i<entities.length; i++) {
    if (entities[i] != undefined) {
      //Border
      if (entities[i].x < 0) {entities[i].x = 0;}
      if (entities[i].x > WORLD_SIZE*50) {entities[i].x = WORLD_SIZE*50;}
      if (entities[i].y < 0) {entities[i].y = 0;}
      if (entities[i].y > WORLD_SIZE*50) {entities[i].y = WORLD_SIZE*50;}
    }
  }
}

function playerMagic() {
  for (i=1; i<3; i++) {
    var Ma = "magic"+i;
    if (players.p1[Ma][1] <= 0 && players.p1[Ma][0] >= 0 && players.p1[Ma][4] === false) {
      if ( (i == 1 && client.key.one === true) || (i == 2 && client.key.two === true) ) {
        if (players.p1[Ma][0] == 0 && players.p1.attackRestrict === false) {
          players.p1[Ma][1] = MAGIC[0].COOLDOWN;
          var dirX = players.p1.x + players.p1.size/2*Math.cos(players.p1.angle);
          var dirY = players.p1.y + players.p1.size/2*Math.sin(players.p1.angle);
          magic[magic.length] = {x: dirX, y: dirY, moveAngle: players.p1.angle, size: 15, lifetime: MAGIC[0].DURATION, type: 0, dmg: 7*players.p1.dmg, speed: 3, img: 'Fireball.svg', faceAngle: players.p1.angle, animation: 0};
        } else if (players.p1[Ma][0] == 1) {
          players.p1[Ma][1] = MAGIC[1].COOLDOWN;
          players.p1[Ma][2] = MAGIC[1].DURATION;
          players.p1[Ma][3] = 0;
          players.p1.attackRestrict = true;
        }
      }
    } else if (players.p1[Ma][1] > 0) {
      players.p1[Ma][1]--;
    }

    if (players.p1[Ma][2] > 0) {
      if (players.p1[Ma][0] == 1) {
        if (players.p1[Ma][2] == 1) {
          players.p1.attackRestrict = false;
        } else {
          players.p1[Ma][3] += 0.05;
        }
      }
      players.p1[Ma][2]--;
    }

    if (i == 1) {
      switch(players.p1[Ma][0]) {
        case -1:
          magic1_img.src = 'No-Move.svg';
          break;
        case 0:
          magic1_img.src = 'Fireball-Magic.svg';
          break;
        case 1:
          magic1_img.src = "Reflect-Magic.svg";
          break;
      }
    } else {
      switch(players.p1[Ma][0]) {
        case -1:
          magic2_img.src = 'No-Move.svg';
          break;
        case 0:
          magic2_img.src = 'Fireball-Magic.svg';
          break;
        case 1:
          magic2_img.src = "Reflect-Magic.svg";
          break;
      }
    }
  }

  for (i=0; i<magic.length; i++) {
    if (magic[i] != undefined) {
      if (magic[i].type == 0) { magic[i].faceAngle += 0.06; }
      magic[i].x += magic[i].speed*Math.cos(magic[i].moveAngle);
      magic[i].y += magic[i].speed*Math.sin(magic[i].moveAngle);
      magic[i].lifetime--;
      if (magic[i].lifetime <= 0) { magic[i] = undefined; }
      for (i2=0; i2<entities.length; i2++) {
        if (entities[i2] != undefined && magic[i] != undefined) {
          if (Math.dist(magic[i].x, magic[i].y, entities[i2].x, entities[i2].y) <= 10+NPCS[entities[i2].preset].SIZE) {
            entities[i2].hp -= magic[i].dmg;
            magic[i] = undefined;
            entities[i2].move = 2;
            entities[i2].gotoX = entities[i2].x+Math.random()*4000-2000;
            entities[i2].gotoY = entities[i2].y+Math.random()*4000-2000;
          }
        }
      }
    }
  }
}

function playerMoves() {
  for (i=1; i<3; i++) {
      var Mo = "move"+i;
      if (players.p1[Mo][4] === false) {
      if (players.p1[Mo][1] <= 0 && players.p1[Mo][0] >= 0 && players.p1.dead === false) {
        if (MOVES[players.p1[Mo][0]].DEFAULTCONTROLS === true) {
          if ( (i == 1 && client.key.e === true) || (i == 2 && client.key.q === true) ) {
            if (players.p1[Mo][0] == 1 && players.p1.attackRestrict === false) { //Spin attack
              players.p1[Mo][1] = MOVES[1].COOLDOWN;
              players.p1[Mo][2] = MOVES[1].DURATION;
            } else if (players.p1[Mo][0] == 2 && players.p1.attackRestrict === false) { //Slam Attack
              players.p1[Mo][1] = MOVES[2].COOLDOWN*WEAPONS[players.p1.weapon].COOLDOWN;
              players.p1[Mo][2] = MOVES[2].DURATION;
            } else if (players.p1[Mo][0] == 3 && players.p1.attackRestrict === false) { //Bow & Arrow
              players.p1[Mo][1] = MOVES[3].COOLDOWN;
              players.p1[Mo][2] = MOVES[3].DURATION;
              players.p1.speed /= 2;
            } else if (players.p1[Mo][0] == 4 && players.p1.attackRestrict === false) { //Triplets
              players.p1[Mo][1] = MOVES[4].COOLDOWN;
              players.p1[Mo][2] = MOVES[4].DURATION;
              players.p1.speed /= 2;
            }
          }
        } else {
          if (players.p1[Mo][0] == 0 && players.p1.moveRestrict === false) { //Dodge
            if (client.key.w[1] >= 2) {
              players.p1[Mo][1] = MOVES[0].COOLDOWN;
              players.p1[Mo][2] = MOVES[0].DURATION;
              players.p1[Mo][3] = 0;
            } else if (client.key.s[1] >= 2) {
              players.p1[Mo][1] = MOVES[0].COOLDOWN;
              players.p1[Mo][2] = MOVES[0].DURATION;
              players.p1[Mo][3] = 1;
            } else if (client.key.a[1] >= 2) {
              players.p1[Mo][1] = MOVES[0].COOLDOWN;
              players.p1[Mo][2] = MOVES[0].DURATION;
              players.p1[Mo][3] = 2;
            } else if (client.key.d[1] >= 2) {
              players.p1[Mo][1] = MOVES[0].COOLDOWN;
              players.p1[Mo][2] = MOVES[0].DURATION;
              players.p1[Mo][3] = 3;
            }
          }
        }
      } else if (players.p1[Mo][1] >= 0) {
        players.p1[Mo][1]--;
      }

      //Move Rules
      if (players.p1[Mo][2] > 0) {
        if (players.p1[Mo][0] == 0) {
          if (players.p1[Mo][3] == 0) {
            players.p1.y2 = -10;
            players.p1.y -= 10;
          } else if (players.p1[Mo][3] == 1) {
            players.p1.y2 = 10;
            players.p1.y += 10;
          } else if (players.p1[Mo][3] == 2) {
            players.p1.x2 = -10;
            players.p1.x -= 10;
          } else if (players.p1[Mo][3] == 3) {
            players.p1.x2 = 10;
            players.p1.x += 10;
          }
        } else if (players.p1[Mo][0] == 1) {
          if (players.p1[Mo][2] == 1) {
            if (players.p1.weapon == 0) { player_img.src = 'Player.svg'; } else if (players.p1.weapon == 1) { player_img.src = 'Player-1.svg'; }
            players.p1.attackRestrict = false;
          } else {
            players.p1.angle -= 6/MOVES[1].DURATION;
            if (players.p1.weapon == 0) { player_img.src = 'Player-Spin.svg'; } else if (players.p1.weapon == 1) { player_img.src = 'Player-Spin-1.svg'; }
            players.p1.attackRestrict = true;
            for (i2=0; i2<entities.length; i2++) {
              if (entities[i2] != undefined) {
                if (Math.dist(entities[i2].x, entities[i2].y, players.p1.x, players.p1.y) <= players.p1.size*3) {
                  entities[i2].hp -= players.p1.dmg*1.25;
                  var angle = Math.atan2(players.p1.x - entities[i2].x, -(players.p1.y - entities[i2].y)) + Math.PI/2;
                  entities[i2].x += 10*Math.cos(angle);
                  entities[i2].y += 10*Math.sin(angle);
                  entities[i2].move = 2;
                  entities[i2].gotoX = entities[i2].x+2000*Math.cos(angle);
                  entities[i2].gotoY = entities[i2].y+2000*Math.sin(angle);
                  if (entities[i2].hp <= 0) {
                    players.p1.xp += NPCS[entities[i2].preset].XPREWARD;
                  }
                }
              }
            }
          }
        } else if (players.p1[Mo][0] == 2) {
          if (players.p1[Mo][2] == 1) {
            if (players.p1.weapon == 0) { player_img.src = 'Player.svg'; } else if (players.p1.weapon == 1) { player_img.src = 'Player-1.svg'; }
            players.p1.attackRestrict = false;
            players.p1.moveRestrict = false;
            for (a=0; a<15; a++) {
              particles[particles.length] = {x: players.p1.x-players.p1.size/2+Math.random()*50-25, y: players.p1.y-players.p1.size/2+Math.random()*50-25, gotoX: 0, gotoY: 0, type: 1, lifetime: Math.random()*1000, speed: Math.random()/30};
              var angle = Math.atan2(players.p1.x-players.p1.size/2 - particles[particles.length-1].x, -(players.p1.y-players.p1.size/2 - particles[particles.length-1].y)) - Math.PI/2;
              particles[particles.length-1].gotoX = particles[particles.length-1].x+1000*Math.cos(angle);
              particles[particles.length-1].gotoY = particles[particles.length-1].y+1000*Math.sin(angle);
            }
            for (i2=0; i2<entities.length; i2++) {
              if (entities[i2] != undefined) {
                if (Math.dist(entities[i2].x, entities[i2].y, players.p1.x, players.p1.y) <= players.p1.size*4) {
                  entities[i2].hp -= players.p1.dmg*WEAPONS[players.p1.weapon].DMG*2;
                  var angle = Math.atan2(players.p1.x - entities[i2].x, -(players.p1.y - entities[i2].y)) + Math.PI/2;
                  entities[i2].x += 50*Math.cos(angle);
                  entities[i2].y += 50*Math.sin(angle);
                  entities[i2].move = 2;
                  entities[i2].gotoX = entities[i2].x+2000*Math.cos(angle);
                  entities[i2].gotoY = entities[i2].y+2000*Math.sin(angle);
                  if (entities[i2].hp <= 0) {
                    players.p1.xp += NPCS[entities[i2].preset].XPREWARD;
                  }
                }
              }
            }
          } else {
            if (players.p1.weapon == 0) { player_img.src = 'Player-Slam.svg'; } else if (players.p1.weapon == 1) { player_img.src = 'Player-Slam-1.svg'; }
            players.p1.attackRestrict = true;
            players.p1.moveRestrict = true;
          }
        } else if (players.p1[Mo][0] == 3) {
          if (players.p1[Mo][2] == 1) {
            if (players.p1.weapon == 0) { player_img.src = 'Player.svg'; } else if (players.p1.weapon == 1) { player_img.src = 'Player-1.svg'; }
            players.p1.attackRestrict = false;
            players.p1.speed *= 2;
            var dirX = players.p1.x + players.p1.size/2*Math.cos(players.p1.angle);
            var dirY = players.p1.y + players.p1.size/2*Math.sin(players.p1.angle);
            magic[magic.length] = {x: dirX, y: dirY, moveAngle: players.p1.angle, size: 15, lifetime: 100, type: 1, dmg: 4*players.p1.dmg, speed: 6, img: 'Arrow.svg', faceAngle: players.p1.angle, animation: 0};
          } else {
            player_img.src = 'Player-Bow.svg';
            players.p1.attackRestrict = true;
          }
        } else if (players.p1[Mo][0] == 4) {
          if (players.p1[Mo][2] == 1) {
            if (players.p1.weapon == 0) { player_img.src = 'Player.svg'; } else if (players.p1.weapon == 1) { player_img.src = 'Player-1.svg'; }
            players.p1.attackRestrict = false;
            players.p1.speed *= 2;
            var dirX = players.p1.x + players.p1.size/2*Math.cos(players.p1.angle);
            var dirY = players.p1.y + players.p1.size/2*Math.sin(players.p1.angle);
            magic[magic.length] = {x: dirX, y: dirY, moveAngle: players.p1.angle, size: 15, lifetime: 100, type: 1, dmg: 3*players.p1.dmg, speed: 6, img: 'Arrow.svg', faceAngle: players.p1.angle, animation: 0};
            magic[magic.length] = {x: dirX, y: dirY, moveAngle: players.p1.angle+0.3, size: 15, lifetime: 100, type: 1, dmg: 3*players.p1.dmg, speed: 6, img: 'Arrow.svg', faceAngle: players.p1.angle+0.3, animation: 0};
            magic[magic.length] = {x: dirX, y: dirY, moveAngle: players.p1.angle-0.3, size: 15, lifetime: 100, type: 1, dmg: 3*players.p1.dmg, speed: 6, img: 'Arrow.svg', faceAngle: players.p1.angle-0.3, animation: 0};
          } else {
            player_img.src = 'Player-Bow1.svg';
            players.p1.attackRestrict = true;
          }
        }
        players.p1[Mo][2]--;
      }
    }
    if (i == 1) {
      switch(players.p1[Mo][0]) {
        case -1:
          move1_img.src = 'No-Move.svg';
          break;
        case 0:
          move1_img.src = 'Dodge-Move.svg';
          break;
        case 1:
          move1_img.src = 'Spin-Move.svg';
          break;
        case 2:
          move1_img.src = 'Slam-Move.svg';
          break;
        case 3:
          move1_img.src = 'Bow-Move.svg';
          break;
        case 4:
          move1_img.src = 'Triplets-Move.svg';
          break;
      }
    } else {
      switch(players.p1[Mo][0]) {
        case -1:
          move2_img.src = 'No-Move.svg';
          break;
        case 0:
          move2_img.src = 'Dodge-Move.svg';
          break;
        case 1:
          move2_img.src = 'Spin-Move.svg';
          break;
        case 2:
          move2_img.src = 'Slam-Move.svg';
          break;
        case 3:
          move2_img.src = 'Bow-Move.svg';
          break;
        case 4:
          move2_img.src = 'Triplets-Move.svg';
          break;
      }
    }
  }
}

function playerMovement() {
  if (players.p1.dead === false && players.p1.moveRestrict === false) {
    var dirX = players.p1.x;
    var dirY = players.p1.y;
    players.p1.x2 = 0;
    players.p1.y2 = 0;
    if (players.p1.attackTime <= WEAPONS[players.p1.weapon].COOLDOWN/2 && !((players.p1.move2 == 1 && players.p1.move2Duration > 0) || (players.p1.move1 == 1 && players.p1.move1Duration > 0))) {
      if (client.key.w[0] === true) {dirY -= players.p1.speed;}
      if (client.key.s[0] === true) {dirY += players.p1.speed;}
      if (client.key.a[0] === true) {dirX -= players.p1.speed;}
      if (client.key.d[0] === true) {dirX += players.p1.speed;}
    }

    var angle = Math.atan2(dirX - players.p1.x, -(dirY - players.p1.y)) - Math.PI/2;
    if (dirX != players.p1.x) {
      players.p1.x += players.p1.speed*Math.cos(angle);
      players.p1.x2 = players.p1.speed*Math.cos(angle);
    }
    if (dirY != players.p1.y) {
      players.p1.y += players.p1.speed*Math.sin(angle);
      players.p1.y2 = players.p1.speed*Math.sin(angle);
    }
  } else if (players.p1.dead === true) {
    players.p1.x++;
    if (players.p1.x >= WORLD_SIZE*50) {
      players.p1.x = WORLD_SIZE*5;
      players.p1.y = Math.floor(Math.random()*WORLD_SIZE*50);
    }
  }
}

function drawCanvas() { //DrawCanvas <--------------------------------------------------------
  cnv.width = window.innerWidth;
  cnv.height = window.innerHeight;
  ctx.clearRect(0, 0, cnv.width, cnv.height);

  //Grass Backdrop
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#51a359";
  ctx.fillRect(0, 0, cnv.width, cnv.height);

  //player
  if (players.p1.dead === false) {
    ctx.save();
    if ( !((players.p1.move2[0] == 1 && players.p1.move2[2] > 0) || (players.p1.move1[0] == 1 && players.p1.move1[2] > 0)) ) {
      players.p1.angle = Math.atan2(client.mouse.x - cnv.width/2, -(client.mouse.y - cnv.height/2)) - Math.PI/2;
    }
    ctx.setTransform(1, 0, 0, 1, cnv.width/2+players.p1.x2, cnv.height/2+players.p1.y2);
    ctx.rotate(players.p1.angle + Math.PI/2);
    ctx.drawImage(player_img, -players.p1.size, -players.p1.size, players.p1.size*2, players.p1.size*2);
    ctx.restore();
    for (i=1; i<3; i++) {
      if (players.p1["move"+i][0] == 0 && players.p1["move"+i][2] > 0) {
        var dir = players.p1["move"+i][3];
        ctx.globalAlpha = 0.5;
        ctx.save();
        if (dir == 0) {
          ctx.setTransform(1, 0, 0, 1, cnv.width/2+players.p1.x2, cnv.height/2+players.p1.y2+players.p1.size/8);
        } else if (dir == 1) {
          ctx.setTransform(1, 0, 0, 1, cnv.width/2+players.p1.x2, cnv.height/2+players.p1.y2-players.p1.size/8);
        } else if (dir == 2) {
          ctx.setTransform(1, 0, 0, 1, cnv.width/2+players.p1.x2+players.p1.size/8, cnv.height/2+players.p1.y2);
        } else if (dir == 3) {
          ctx.setTransform(1, 0, 0, 1, cnv.width/2+players.p1.x2-players.p1.size/8, cnv.height/2+players.p1.y2);
        }
        ctx.rotate(players.p1.angle + Math.PI/2);
        ctx.drawImage(player_img, -players.p1.size, -players.p1.size, players.p1.size*2, players.p1.size*2);
        ctx.restore();

        ctx.globalAlpha = 0.25;
        ctx.save();
        if (dir == 0) {
          ctx.setTransform(1, 0, 0, 1, cnv.width/2+players.p1.x2, cnv.height/2+players.p1.y2+players.p1.size/4);
        } else if (dir == 1) {
          ctx.setTransform(1, 0, 0, 1, cnv.width/2+players.p1.x2, cnv.height/2+players.p1.y2-players.p1.size/4);
        } else if (dir == 2) {
          ctx.setTransform(1, 0, 0, 1, cnv.width/2+players.p1.x2+players.p1.size/4, cnv.height/2+players.p1.y2);
        } else if (dir == 3) {
          ctx.setTransform(1, 0, 0, 1, cnv.width/2+players.p1.x2-players.p1.size/4, cnv.height/2+players.p1.y2);
        }
        ctx.rotate(players.p1.angle + Math.PI/2);
        ctx.drawImage(player_img, -players.p1.size, -players.p1.size, players.p1.size*2, players.p1.size*2);
        ctx.restore();
      }
    }

    //Reflect Magic
    ctx.globalAlpha = 1;
    for (i = 1; i<3; i++) {
      if (players.p1["magic"+i][0] == 1 && players.p1["magic"+i][2] > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, cnv.width/2+players.p1.x2, cnv.height/2+players.p1.y2);
        ctx.rotate(players.p1["magic"+i][3] + Math.PI/2);
        ctx.drawImage(reflect_img, -players.p1.size, -players.p1.size, players.p1.size*2, players.p1.size*2);
        ctx.restore();
      }
    }

    //Player's Health Bar
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#000000";
    ctx.roundRect(cnv.width/2-players.p1.size, cnv.height/2+players.p1.size, players.p1.size*2, 10, 3);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ce3e39";
    ctx.roundRect(cnv.width/2-players.p1.size, cnv.height/2+players.p1.size, players.p1.hp/players.p1.hpMax*players.p1.size*2, 10, 3);

    //Move cooldown next to healthbar
    ctx.fillStyle = "#474747";
    ctx.globalAlpha = 0.75;
    if (players.p1.move1[0] != -1) {
      ctx.beginPath();
      if (players.p1.move1[0] == 2) {ctx.arc(cnv.width/2-players.p1.size-5, cnv.height/2+players.p1.size+5, 5, 0, Math.PI*2*players.p1.move1[1]/(MOVES[players.p1.move1[0]].COOLDOWN*WEAPONS[players.p1.weapon].COOLDOWN));}
      else {ctx.arc(cnv.width/2-players.p1.size-5, cnv.height/2+players.p1.size+5, 5, 0, Math.PI*2*players.p1.move1[1]/MOVES[players.p1.move1[0]].COOLDOWN);}
      ctx.fill();
    }
    //Magic cooldown next to healthbar
    if (players.p1.magic1[0] != -1) {
      ctx.beginPath();
      ctx.arc(cnv.width/2+players.p1.size+5, cnv.height/2+players.p1.size+5, 5, 0, Math.PI*2*players.p1.magic1[1]/MAGIC[players.p1.magic1[0]].COOLDOWN);
      ctx.fill();
    }
  }

  //NPCS
  ctx.globalAlpha = 1;
  for (i=0; i<entities.length; i++) {
    if (entities[i] != undefined) {
      if (entities[i].x-players.p1.x >= -cnv.width/2-NPCS[entities[i].preset].SIZE && entities[i].x-players.p1.x <= cnv.width/2+NPCS[entities[i].preset].SIZE
      && entities[i].y-players.p1.y >= -cnv.height/2-NPCS[entities[i].preset].SIZE && entities[i].y-players.p1.y <= cnv.height/2+NPCS[entities[i].preset].SIZE) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, entities[i].x-players.p1.x+cnv.width/2, entities[i].y-players.p1.y+cnv.height/2);
        ctx.rotate(entities[i].angle + Math.PI/2);
        if (entities[i].preset == 0) {
          ctx.drawImage(sheep_img, -NPCS[entities[i].preset].SIZE, -NPCS[entities[i].preset].SIZE, NPCS[entities[i].preset].SIZE*2, NPCS[entities[i].preset].SIZE*2);
        } else if (entities[i].preset == 1) {
          ctx.drawImage(brown_bear_img, -NPCS[entities[i].preset].SIZE, -NPCS[entities[i].preset].SIZE, NPCS[entities[i].preset].SIZE*2, NPCS[entities[i].preset].SIZE*2);
        } else if (entities[i].preset == 2) {

        }
        ctx.restore();

        if (NPCS[entities[i].preset].SHOWHP === true) {
          //Health Bar
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = "#000000";
          ctx.roundRect(entities[i].x - players.p1.x + cnv.width/2 -25, entities[i].y - players.p1.y + cnv.height/2 +25, 50, 6, 3);
          ctx.fillStyle = "#ce3e39";
          ctx.roundRect(entities[i].x - players.p1.x + cnv.width/2 -25, entities[i].y - players.p1.y + cnv.height/2 +25, entities[i].hp/NPCS[entities[i].preset].MAXHP*50, 6, 3);
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  //Items
  for (i=0; i<items.length; i++) {
    if (items[i] != undefined) {
      if (items[i].x-players.p1.x >= -cnv.width/2-20 && items[i].x-players.p1.x <= cnv.width/2+20 && items[i].y-players.p1.y >= -cnv.height/2-20 && items[i].y-players.p1.y <= cnv.height/2+20) {
        if (items[i].id == 0) {
          ctx.drawImage(meat_img, items[i].x-players.p1.x-20+cnv.width/2, items[i].y-players.p1.y-20+cnv.height/2, 40, 40);
        } else if (items[i].id == 1) {
          ctx.drawImage(gold_img, items[i].x-players.p1.x-20+cnv.width/2, items[i].y-players.p1.y-20+cnv.height/2, 40, 40);
        }
      }
    }
  }

  //Objects
  for (x = Math.floor(players.p1.x/50 - cnv.width/50 +1); x <= Math.floor(players.p1.x/50 + cnv.width/50 +1); x++) {
    for (y = Math.floor(players.p1.y/50 - cnv.height/50 +1); y <= Math.floor(players.p1.y/50 + cnv.height/50 +1); y++) {
      if (object[x+"_"+y] != undefined) {
        if (object[x+"_"+y][0] == 0) {
          ctx.drawImage(tree_img, x*50 - players.p1.x + cnv.width/2, y*50 - players.p1.y + cnv.height/2 - object[x+"_"+y][1], 100, 100);
        } else if (object[x+"_"+y][0] == 1) {
          ctx.drawImage(rock_img, x*50 - players.p1.x + cnv.width/2, y*50 - players.p1.y + cnv.height/2 - object[x+"_"+y][1], 100, 100);
        }
        if (object[x+"_"+y][1] > 0) {
          object[x+"_"+y][1]--;
        }
      }
    }
  }

  //effects
  for (i=0; i<players.p1.effects.length; i++) {
    if (players.p1.effects[i] != undefined) {
      var preset = players.p1.effects[i];
      if (preset == 0) {effect_img.src = 'Acid-Attack.svg';} else if (preset == 1) {effect_img.src = 'Acid-Effect.svg';}
      ctx.drawImage(effect_img, cnv.width-40, 10+40*i, 30, 30);
    }
  }

  //particles
  for (i=0; i<particles.length; i++) {
    if (particles[i] != undefined) {
      if (particles[i].type == 0) {
        ctx.drawImage(gas_img, particles[i].x-players.p1.x+cnv.width/2, particles[i].y-players.p1.y+cnv.height/2, 10, 10);
      } else if (particles[i].type == 1) {
        ctx.drawImage(dust_img, particles[i].x-players.p1.x+cnv.width/2, particles[i].y-players.p1.y+cnv.height/2, 40, 40);
      }
    }
  }

  //magic
  for (i=0; i<magic.length; i++) {
    if (magic[i] != undefined) {
      magicBall_img.src = magic[i].img;
      var x = magic[i].x-players.p1.x+cnv.width/2;
      var y = magic[i].y-players.p1.y+cnv.height/2;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, x, y);
      ctx.rotate(magic[i].faceAngle + Math.PI/2);
      ctx.drawImage(magicBall_img, -magic[i].size, -magic[i].size, magic[i].size*2, magic[i].size*2);
      ctx.restore();
    }
  }

  if (players.p1.dead === false) {
    //Level Bar
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#000000"; // xp/xpneed*length
    ctx.roundRect(cnv.width/2-127, cnv.height-32, 254, 29, 5);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#2f6fd6";
    if (players.p1.xp > 0) {
      ctx.roundRect(cnv.width/2-125, cnv.height-30, players.p1.xp/(players.p1.lvl*15+10)*250, 25, 5);
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillText(Math.floor(players.p1.xp/(players.p1.lvl*15+10)*100) + "%", cnv.width/2-7, cnv.height-12);
    ctx.font = "15px Arial";
    ctx.fillText("lvl " + players.p1.lvl, cnv.width/2-10, cnv.height-40);

    //Special Moves
    ctx.drawImage(move1_img, cnv.width/2-167, cnv.height-32, 30, 30);//Move 1
    ctx.drawImage(move2_img, cnv.width/2-207, cnv.height-32, 30, 30);//Move 2
    //Cooldowns
    ctx.fillStyle = "#474747";
    ctx.globalAlpha = 0.75;
    //Move1
    if (players.p1.move1[0] != -1) {
      ctx.beginPath();
      if (players.p1.move1[0] == 2) {ctx.arc(cnv.width/2-152, cnv.height-17, 10, 0, Math.PI*2*players.p1.move1[1]/(MOVES[players.p1.move1[0]].COOLDOWN*WEAPONS[players.p1.weapon].COOLDOWN));}
      else {ctx.arc(cnv.width/2-152, cnv.height-17, 10, 0, Math.PI*2*players.p1.move1[1]/MOVES[players.p1.move1[0]].COOLDOWN);}
      ctx.fill();
    }
    //Move2
    if (players.p1.move2[0] != -1) {
      ctx.beginPath();
      if (players.p1.move2[0] == 2) {ctx.arc(cnv.width/2-192, cnv.height-17, 10, 0, Math.PI*2*players.p1.move2[1]/(MOVES[players.p1.move2[0]].COOLDOWN*WEAPONS[players.p1.weapon].COOLDOWN));}
      else {ctx.arc(cnv.width/2-192, cnv.height-17, 10, 0, Math.PI*2*players.p1.move2[1]/MOVES[players.p1.move2[0]].COOLDOWN);}
      ctx.fill();
    }
    //Locked
    if (players.p1.move1[4] === true) {
      ctx.drawImage(locked_img, cnv.width/2-167, cnv.height-32, 30, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "8px Arial";
      ctx.fillText(UNLOCK_MOVE1, cnv.width/2-165, cnv.height-24);
    }
    if (players.p1.move2[4] === true) {
      ctx.drawImage(locked_img, cnv.width/2-207, cnv.height-32, 30, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px Arial";
      ctx.fillText(UNLOCK_MOVE2, cnv.width/2-205, cnv.height-24);
    }

    //Move1 hover
    /*ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#000000";
    if (client.mouse.x >= cnv.width/2-167 && client.mouse.x <= cnv.width/2-137 && client.mouse.y >= cnv.height-32 && client.mouse.y <= cnv.height-2) {
      if (players.p1.move1 == 0) {
        ctx.roundRect(cnv.width/2-257, cnv.height-107, 120, 70, 10);
        ctx.globalAlpha = 1;
        ctx.font = "15px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Dodge", cnv.width/2-252, cnv.height-92);
      }
    }*/

    //Special Abilities
    ctx.globalAlpha = 1;
    ctx.drawImage(magic1_img, cnv.width/2+137, cnv.height-32, 30, 30);//magic 1
    ctx.drawImage(magic2_img, cnv.width/2+177, cnv.height-32, 30, 30);//magic 2
    //Cooldowns
    ctx.fillStyle = "#474747";
    ctx.globalAlpha = 0.75;
    //magic 1
    if (players.p1.magic1[0] != -1) {
      ctx.beginPath();
      ctx.arc(cnv.width/2+152, cnv.height-17, 10, 0, Math.PI*2*players.p1.magic1[1]/MAGIC[players.p1.magic1[0]].COOLDOWN);
      ctx.fill();
    }
    //magic 2
    if (players.p1.magic2[0] != -1) {
      ctx.beginPath();
      ctx.arc(cnv.width/2+192, cnv.height-17, 10, 0, Math.PI*2*players.p1.magic2[1]/MAGIC[players.p1.magic2[0]].COOLDOWN);
      ctx.fill();
    }
    //Locked
    if (players.p1.magic1[4] === true) {
      ctx.drawImage(locked_img, cnv.width/2+137, cnv.height-32, 30, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "8px Arial";
      ctx.fillText(UNLOCK_MAGIC1, cnv.width/2+139, cnv.height-24);
    }
    if (players.p1.magic2[4] === true) {
      ctx.drawImage(locked_img, cnv.width/2+177, cnv.height-32, 30, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px Arial";
      ctx.fillText(UNLOCK_MAGIC2, cnv.width/2+179, cnv.height-24);
    }

    //Resources
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#000000";
    ctx.roundRect(10, 10, 150, 85, 5);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#2eff00";
    ctx.font = "12px Arial";
    ctx.fillText("+" + Math.floor(players.p1.gather*WEAPONS[players.p1.weapon].GATHERMULTI), 15, 25)
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Wood    " + players.p1.supplies.wood, 15, 40);
    ctx.fillText("Stone    " + players.p1.supplies.stone, 15, 55);
    ctx.fillText("Food     " + players.p1.supplies.food, 15, 70);
    ctx.fillText("Gold      " + players.p1.supplies.gold, 15, 85);

    //Player Points Usage
    if (players.p1.points > 0) {
      ctx.fillStyle = "#000000";
      ctx.globalAlpha = 0.5;
      ctx.roundRect(170, 10, 150, 85, 5);
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 1;
      ctx.fillText("Points "+players.p1.points, 175, 25);

      if (client.mouse.x > 170 && client.mouse.x <= 300 && client.mouse.y >= 35 && client.mouse.y < 50) {ctx.fillStyle="#2deaff";}
      ctx.fillText("Increase Hp         +", 175, 40);
      ctx.fillStyle = "#ffffff";
      if (client.mouse.x > 170 && client.mouse.x <= 300 && client.mouse.y >= 50 && client.mouse.y < 65) {ctx.fillStyle="#2deaff";}
      ctx.fillText("Increase Dmg      +", 175, 55);
      ctx.fillStyle = "#ffffff";
      if (client.mouse.x > 170 && client.mouse.x <= 300 && client.mouse.y >= 65 && client.mouse.y < 85) {ctx.fillStyle="#2deaff";}
      ctx.fillText("Increase Gather   +", 175, 70);
    }
  }

  //Dead menu
  if (players.p1.dead === true) {
    //Transparent Death Backdrop
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, cnv.width, cnv.height);

    //Play button
    ctx.globalAlpha = 0.75;
    ctx.font = "30px Arial";
    if (client.mouse.x >= cnv.width/2-75 && client.mouse.x <= cnv.width/2+75
    && client.mouse.y >= cnv.height/4 && client.mouse.y <= cnv.height/4+50) {
      ctx.roundRect(cnv.width/2-75, cnv.height/4-5, 150, 50, 10);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Play", cnv.width/2-30, cnv.height/4+30);
    } else {
      ctx.roundRect(cnv.width/2-75, cnv.height/4, 150, 50, 10);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Play", cnv.width/2-30, cnv.height/4+35);
    }
  }
}

//Calculates the distance between two points
Math.dist=function(x1, y1, x2, y2) {
  return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

ctx.roundRect=function(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}
