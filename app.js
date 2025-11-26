import * as THREE from 'three';
import { ARButton } from './libs/ARButton.js';

// Global UUID variable
let uuid = null;

// PERLIN NOISE class
class Perlin {
    constructor() {
    this.R = new Random;
      this.grad3 =
        [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
         [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
         [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
      this.p = [];
      for (var i=0; i<256; i++) {
        this.p[i] = Math.floor(this.R.rDec()*256);
      }
  
      // To remove the need for index wrapping, double the permutation table length
      this.perm = [];
      for(i=0; i<512; i++) {
        this.perm[i]=this.p[i & 255];
      }
  
      // A lookup table to traverse the simplex around a given point in 4D.
      // Details can be found where this table is used, in the 4D noise method.
      this.simplex = [
        [0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],
        [0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],
        [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],
        [1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],
        [1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],
        [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],
        [2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],
        [2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]];
    }
  
    dot(g, x, y) {
      return g[0]*x + g[1]*y;
    }
  
    noise(xin, yin) {
      var n0, n1, n2; // Noise contributions from the three corners
      // Skew the input space to determine which simplex cell we're in
      var F2 = 0.5*(Math.sqrt(3.0)-1.0);
      var s = (xin+yin)*F2; // Hairy factor for 2D
      var i = Math.floor(xin+s);
      var j = Math.floor(yin+s);
      var G2 = (3.0-Math.sqrt(3.0))/6.0;
      var t = (i+j)*G2;
      var X0 = i-t; // Unskew the cell origin back to (x,y) space
      var Y0 = j-t;
      var x0 = xin-X0; // The x,y distances from the cell origin
      var y0 = yin-Y0;
      // For the 2D case, the simplex shape is an equilateral triangle.
      // Determine which simplex we are in.
      var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
      if(x0>y0) {i1=1; j1=0;} // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      else {i1=0; j1=1;}      // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
      // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
      // c = (3-sqrt(3))/6
      var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
      var y1 = y0 - j1 + G2;
      var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
      var y2 = y0 - 1.0 + 2.0 * G2;
      // Work out the hashed gradient indices of the three simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var gi0 = this.perm[ii+this.perm[jj]] % 12;
      var gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12;
      var gi2 = this.perm[ii+1+this.perm[jj+1]] % 12;
      // Calculate the contribution from the three corners
      var t0 = 0.5 - x0*x0-y0*y0;
      if(t0<0) n0 = 0.0;
      else {
        t0 *= t0;
        n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);  // (x,y) of grad3 used for 2D gradient
      }
      var t1 = 0.5 - x1*x1-y1*y1;
      if(t1<0) n1 = 0.0;
      else {
        t1 *= t1;
        n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
      }
      var t2 = 0.5 - x2*x2-y2*y2;
      if(t2<0) n2 = 0.0;
      else {
        t2 *= t2;
        n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 70.0 * (n0 + n1 + n2);
    }
  }

// pseudo-random class
class Random {
    constructor() {
    this.useA = false;
    let sfc32 = function (uint128Hex) {
        let a = parseInt(uint128Hex.substr(0, 8), 16);
        let b = parseInt(uint128Hex.substr(8, 8), 16);
        let c = parseInt(uint128Hex.substr(16, 8), 16);
        let d = parseInt(uint128Hex.substr(24, 8), 16);
        return function () {
        a |= 0; b |= 0; c |= 0; d |= 0;
        let t = (((a + b) | 0) + d) | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
        };
    };
    // seed prngA with first half of hash
    this.prngA = new sfc32(uuid.substr(0, 16));
    // seed prngB with second half of hash
    this.prngB = new sfc32(uuid.substr(16, 16));
    for (let i = 0; i < 1e6; i += 2) {
        this.prngA();
        this.prngB();
    }
    }
    // random number between 0 (inclusive) and 1 (exclusive)
    rDec() {
        this.useA = !this.useA;
        return this.useA ? this.prngA() : this.prngB();
    }
    // random number between a (inclusive) and b (exclusive)
    rNum(a, b) {
        return a + (b - a) * this.rDec();
    }
    // random integer between a (inclusive) and b (inclusive)
    // requires a < b for proper probability distribution
    rInt(a, b) {
        return Math.floor(this.rNum(a, b + 1));
    }
    // random boolean with p as percent liklihood of true
    rBool(p) {
        return this.rDec() < p;
    }
    rList(list) {
        return list[Math.floor(this.rNum(0, list.length * 0.99))];
    }
}

const dim = Math.min(window.innerHeight, window.innerWidth);


class App{
	constructor() {
        this.DEBUG = 0;

        // Generate a random UUID if not already defined
        if (!uuid) {
            uuid = this.generateUUID();
        }
        console.log('random UUID:', uuid);

        this.perlin = new Perlin();
    
        this.r = new Random;

		const container = document.createElement( 'div' );
        container.className = "fade-in-5";
        
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
      
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.0001, 100 );
        this.camera.position.z = 0;
		
		this.scene = new THREE.Scene();
        this.scene.background = this.DEBUG ? new THREE.Color( 0x222222 ) : null;

		this.scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );

        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1, 1 ).normalize();
		this.scene.add( light );
       
        // set temporary info button
        let butt = document.createElement( 'button' );
        butt.style.display = '';
        butt.style.position = 'absolute';
        butt.style.top = `${window.innerWidth * 0.07}px`;
        butt.style.bottom = `${window.innerWidth * 0.07}px`;
        butt.style.left = '7%';
        butt.style.right = '7%';
        butt.style.padding = '0 15%';
        butt.style.border = 'none';
        butt.style.background = '#000';
        butt.style.color = '#fff';
        butt.style.font = 'normal 13px sans-serif';
        butt.style.lineHeight = 1.75;
        butt.style.fontWeight = 'lighter';
        butt.style.textAlign = 'center';
        butt.style.opacity = '1.0';
        butt.style.outline = 'none';
        butt.style.zIndex = '999';
        butt.innerHTML = `<span class="loader"></span>
        <br /><br />Your personalized experience is being calculated.
        <br /><br />
        Available in Chrome browser on devices running Android 7 and later and in WebXR browser on iOS devices.`;
        document.body.appendChild( butt );

        // wait for the page to load
        window.addEventListener('load', () => {

            // calculate the textures and geometry
            this.initScene();
            
            // create Three JS renderer and add to container
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
            this.renderer.setPixelRatio( window.devicePixelRatio ); //1.0
            this.renderer.setSize( window.innerWidth, window.innerHeight );
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            container.appendChild( this.renderer.domElement );
            this.renderer.setAnimationLoop( this.render.bind(this) );
            
            // load WebXR button and set WebXR 
            this.setupXR();

            // remove loading button
            butt.remove();
            
        });

        
        
        window.addEventListener('resize', this.resize.bind(this) );
	};	

    // START OF LOCAL TESTING 
    random_uuid() {
        let x = "0123456789abcdef", hash = "";
        for (let i = 32; i > 0; --i) {
            hash += x[Math.floor(Math.random() * x.length)];
        }
        return hash;
    }   
    // END OF LOCAL TESTING
    
    
    initScene(){
        this.objects = [];
        this.posY = [];
        this.noiseOffset = [];
        this.textures = [];        

        let paletteNum = this.r.rInt(1, 14);
        this.paletteNum = paletteNum;
        let palette = 
              paletteNum == 1  ? [0xDAD2D8, 0x143642, 0x0F8B8D, 0xEC9A29, 0xA8201A]             
            : paletteNum == 2  ? [0xDAFFED, 0x3C6E71, 0x70AE6E, 0xF24333, 0xBEEE62]             
            : paletteNum == 3  ? [0xF2EFEA, 0xFC7753, 0x66D7D1, 0x403D58, 0xDBD56E]             
            : paletteNum == 4  ? [0x2D3047, 0x419D78, 0xE0A458, 0xE0A458, 0xC04ABC, 0xFFFAF0]   
            : paletteNum == 5  ? [0x29339B, 0x74A4BC, 0xB6D6CC, 0xF1FEC6, 0xFF3A20]             
            : paletteNum == 6  ? [0xF6BD60, 0xF7EDE2, 0xF5CAC3, 0x84A59D, 0xF28482]             
            : paletteNum == 7  ? [0xF2B9BB, 0xF1E1B8, 0xA3DDBD, 0xBCB0E7, 0xBCEAE9, 0xA3C1F3]   
            : paletteNum == 8  ? [0x80184F, 0xF65B1B, 0xFECB31, 0x19A080, 0xB8D20C, 0x617AC3]   
            : paletteNum == 9  ? [0x4E337B, 0x59BC8C, 0xA2D172, 0xF59B13, 0xE4684D]             
            : paletteNum == 10 ? [0xDAFFED, 0x9BF3F0, 0x473198, 0x4A0D67, 0xADFC92]             
            : paletteNum == 11 ? [0x1B264F, 0x274690, 0x576CA8, 0x302B27, 0xF5F3F5]             
            : paletteNum == 12 ? [0x6AAB80, 0x539988, 0x3C7F90, 0x5b82be, 0x424ea9, 0x7f77bb]   
            : paletteNum == 13 ? [0xEF946C, 0xC4A77D, 0x70877F, 0x454372, 0x2F2963]             
            : paletteNum == 14 ? [0xFFB86F, 0xE0CA3C, 0xBA5C12, 0x3E2F5B, 0x261132]

            : paletteNum == 99 ? [0x000000, 0x010101, 0x101010, 0x202020, 0x303030, 0x040404]      // potential for another project - MAGNIFICENT!!!
            : [0xFFFFFF];

        for (let i = 0; i < palette.length; i++) {
            palette[i] = new THREE.Color(palette[i]);
        }

        // RANDOMIZED VALUES
        this.planes = this.DEBUG ? 1 : this.r.rInt(25, 35);
        this.composition = this.DEBUG ? -1 : this.r.rInt(0, 8);                     // -1 - debugging composition compositiondebug
        this.surround = this.composition == 3 || this.composition == 4 || this.composition == 8 ? false : this.r.rBool(0.5);
        if (this.surround) this.planes *= 3;
        

        // VARIATIONS booleans
        this.noise = this.DEBUG ? 0 : this.r.rBool(0.1);                                // add floating "particles"
        this.canvasNum = this.DEBUG ? 1 : Math.min(10, this.planes);                    // number of canvases
        this.glow = this.r.rBool(0.35);
        
        
        console.log("Planes",this.planes);
        console.log('Kompozycja', this.composition);
        console.log('Paleta',paletteNum);
        console.log('Noise', this.noise);
        console.log('Surround', this.surround);
        console.log('Glow', this.glow);
        

        // CREATE TEXTURES - CANVASES
        for (let i = 0; i < this.canvasNum; i++) {
            // set spots number for every object/plane
            let spots = this.r.rInt(1,5);

            // CANVAS - draw circles
            this.textures[i] = document.createElement('canvas');
            this.textures[i].width = dim * window.devicePixelRatio;
            this.textures[i].height = dim * window.devicePixelRatio;
            let ctx = this.textures[i].getContext('2d');
            
            // set transparent context
            ctx.fillStyle = '#00000000';
            ctx.fillRect(0, 0, this.textures[i].width, this.textures[i].height);
            
            let polygon = [];
            // draw spots on canvas
            for (let j = 0; j < spots; j++) {
                // define spot variables
                let radiusX = this.textures[i].width/this.r.rNum(2,3);
                let radiusY = this.textures[i].height/4;
                let offX = this.textures[i].width/2;
                let offY = this.textures[i].height/2;
                let colNum = this.r.rInt(0, palette.length - 1);
                let col = new THREE.Color(palette[colNum]);
                
                let polyIter = 4;
                let polyNum = 10;

                ctx.beginPath();
                // iterate polygon
                for (let ii = 0; ii < polyIter; ii++) {
                    // make polygon
                    for (let jj = 0; jj < polyNum; jj++) {
                        polygon[ii * polyNum + jj] = new THREE.Vector2(
                            offX + Math.cos(Math.PI * 2 * jj / polyNum) * radiusX * this.r.rNum(-1, 1),
                            offY + Math.sin(Math.PI * 2 * jj / polyNum) * radiusY * this.r.rNum(-1, 1)
                        );
                    }
                    // draw polygon
                    for (let jj = 0; jj < polyNum; jj++) {
                        if (!jj)
                            ctx.moveTo(polygon[ii * polyNum + jj].x, polygon[ii * polyNum + jj].y);
                        else 
                            ctx.lineTo(polygon[ii * polyNum + jj].x, polygon[ii * polyNum + jj].y); 
                    }
                    ctx.closePath();
                    let alpha = Math.sin((j+0.5)/spots);
                    alpha = this.glow ? alpha * 33 | 0 : alpha * 75 | 0;
                    ctx.fillStyle = `#${ col.getHexString() }${ alpha }`;
                    ctx.fill();
                }
                
            }
            
            // CUSTOM CANVAS FILTERS:
            // src: https://github.com/zhengsk/ImageFilters.js#readme
            // create an ImageData for the area you want to apply the filter.
            
            let imageData = ctx.getImageData(0, 0, this.textures[i].width, this.textures[i].height);
            
            // pass it to a filter and get the modified copy
            let blurVal = this.r.rNum(this.textures[i].width/40, this.textures[i].width/20) | 0;
            let filtered = ImageFilters.BoxBlur(imageData, 2, blurVal, 10);
            
            // put it back into a context to view the results
            ctx.putImageData(filtered, 0, 0);
            

            // debugging stroke to show canvas boarders
            if (this.DEBUG) {
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 3;
                ctx.strokeRect(0, 0, this.textures[i].width, this.textures[i].height);
            }

        }

        // create +100% noisy textures
        if (this.noise) {
            // create textures - canvases
            for (let i = this.canvasNum; i < 2 * this.canvasNum; i++) {
                // set spots number for every object/plane
                let spots = this.r.rInt(5,15);

                // CANVAS - draw circles
                this.textures[i] = document.createElement('canvas');
                this.textures[i].width = dim * window.devicePixelRatio;
                this.textures[i].height = dim * window.devicePixelRatio;
                let ctx = this.textures[i].getContext('2d');
                
                // set transparent context
                ctx.fillStyle = '#00000000';
                ctx.fillRect(0, 0, this.textures[i].width, this.textures[i].height);
                ctx.filter = `blur( 1px )`;

                // draw spots on canvas
                for (let j = 0; j < spots*30; j++) {
                    // define spot variables
                    let radius = this.textures[i].width/500 * this.r.rDec() | 0;
                    let twoRadius = radius * 2;
                    let posX = (this.textures[i].width - 2*twoRadius) * this.r.rDec() + twoRadius;
                    let posY = (this.textures[i].width - 2*twoRadius) * this.r.rDec() + twoRadius;
                    let colNum = this.r.rInt(0, palette.length - 1);
                    let col = new THREE.Color(palette[colNum]);

                    // draw two spots
                    ctx.beginPath();
                    ctx.arc(posX, posY, radius, 0, 2 * Math.PI, false);
                    ctx.fillStyle = `#${ col.getHexString() }`;
                    ctx.fill();                    
                }
            }
        }

        // create geometry
        for (let i = 0; i < this.planes; i++) {
            // SET OBJECT VARIABLES
            this.posY[i] = this.r.rNum(-.5,.3);
            this.noiseOffset[i] = this.r.rNum(.05, .25);
            
            // GEOMETRY
            this.geometry = new THREE.PlaneGeometry( 1, 1.5, 10, 10 );    

            // MATERIAL
            let tempTextureNum = this.r.rInt(0, this.textures.length - 1);
            const material = new THREE.MeshBasicMaterial({
                map: new THREE.CanvasTexture(this.textures[tempTextureNum]),
                transparent: true,
                side: THREE.DoubleSide,
                depthTest: false,
            });
            // set material blending - some to additive, others to normal
            material.blending = this.glow ? THREE.AdditiveBlending                          // if GLOW - everything is additive
                : tempTextureNum > this.canvasNum ? THREE.AdditiveBlending                  // if not GLOW, NOISE are additive
                    : this.r.rBool(0.5) ? THREE.AdditiveBlending : THREE.NormalBlending;    // ca 50% will be additive, else will be normal

            // CUSTOM BLENDING
            // docs: https://threejs.org/docs/#api/en/constants/CustomBlendingEquations
            // example: https://threejs.org/examples/#webgl_materials_blending_custom
            // material.blending = THREE.CustomBlending;
            // material.blendEquation = THREE.AddEquation; //default
            // material.blendSrc = THREE.SrcAlphaFactor; //default
            // material.blendDst = THREE.OneMinusSrcAlphaFactor; //default
            
                        
            const object = new THREE.Mesh( this.geometry, material );
            object.position.x = this.r.rNum(-3,3) * .3;
            object.position.y = this.r.rNum(-0.5,1);
            object.position.z = this.r.rNum(-2,1) - 3; // should be ca. `-2` for AR
            if (this.surround) {
                object.position.x = i%4 == 0 ? this.r.rNum(-1.9, -0.5)
                    : i%4 == 1 ? this.r.rNum(0.5, 1.9) 
                    : i%4 == 2 ? this.r.rNum(0.5, 1.9) 
                    : this.r.rNum(-1.9, -0.5);
                object.position.z = i%4 == 0 ? this.r.rNum(0.5, 1.9) 
                    : i%4 == 1 ? this.r.rNum(0.5, 1.9) 
                    : i%4 == 2 ? this.r.rNum(-1.5, -0.9)
                    : this.r.rNum(-1.9, -0.5);
            }
            
            // // PLANE GEOMETRY - compositiondebug
                    // -1 - debugging composition
                    // 0 - vertical movement, vertical lights standard, first version
                    // 1 - vertical, wide, swirl
                    // 2 - wide, chmurki
                    // 3 - totem - vertical pillar, horizontal lights
                    // 4 - totem - vertical pillar, vertical ligths
                    // 5 - vertical light beams - tan function
                    // 6 - horizontal light beams, ortogonal - tan function
                    // 7 - horizontal light beams, grid - tan function
                    // 8 - planes in circle rotating in X axis - weird
            
            if (this.composition == -1) {
                object.position.set(0,0,-3);     
                object.scale.set(2,2,1);

            } else if (this.composition == 0) {
                object.rotation.y = 2 * Math.PI * this.r.rDec();
            
            } else if (this.composition == 1) {
                object.rotation.z = Math.PI/2;
                object.rotation.y = 2 * Math.PI * this.r.rDec();
            
            } else if (this.composition == 2) {
                object.scale.x = 2 + this.perlin.noise(this.r.rNum(0,999), this.r.rNum(0,999));
                object.rotation.y = Math.PI * this.r.rDec();
                object.position.y = 2 * this.r.rNum(-0.5,1);


            } else if (this.composition == 3) {
                object.scale.y *= 1.5;
                object.rotation.z = Math.PI/2;
                object.rotation.y = Math.PI * this.r.rDec();
                object.position.y = 2 * this.r.rNum(-0.5,1);


            } else if (this.composition == 4) {
                object.position.y = 2 * this.r.rNum(-0.4,1.5);
                object.rotation.y = Math.PI * this.r.rDec(); 

            
            } else if (this.composition == 5) {
                object.position.y = 3 * this.r.rNum(-0.4,1);
                object.rotation.y = Math.PI * this.r.rDec(); 
            
            
            } else if (this.composition == 6) {
                object.rotation.z = Math.PI/2;
                object.rotation.x = Math.PI * this.r.rDec();
            
            } else if (this.composition == 7) {
                object.rotation.z = Math.PI/2;
                object.position.x = i%4 == 0 ? this.r.rNum(-1.9, 0.75)
                    : i%4 == 1 ? this.r.rNum(0.75, 1.9) 
                    : i%4 == 2 ? this.r.rNum(0.75, 1.9) 
                    : this.r.rNum(-1.9, 0.75);
                object.position.z = i%4 == 0 ? this.r.rNum(0.75, 1.9) 
                    : i%4 == 1 ? this.r.rNum(0.75, 1.9) 
                    : i%4 == 2 ? this.r.rNum(-1.9, 0.75)
                    : this.r.rNum(-1.9, 0.75);
                object.rotation.y = 
                    (object.position.x < 0 && object.position.z < 0) || (object.position.x > 0 && object.position.z > 0) ? Math.PI/4 :
                    -Math.PI/4;


            } else if (this.composition == 8) {
                let r = 1;
                object.position.x = r * Math.sin(Math.PI * 2 * i / this.planes);
                object.position.z = r * Math.cos(Math.PI * 2 * i / this.planes) - 3;
                object.rotation.y = Math.PI * (i / this.planes);
                object.scale.set = (1,1,1);


            } else if (this.composition == 99) {                 
                object.rotation.z = Math.PI/2;
                object.rotation.x = 2 * Math.PI * this.r.rDec();
            }
                
            
            this.scene.add( object );
            this.objects.push( object );
        }
    }

    render() {   
        const delta = this.clock.getDelta();
        
        // Log XR status on first render
        if (!this.xrLogged) {
            console.log('XR Session active:', this.renderer.xr.isPresenting);
            console.log('Renderer size:', this.renderer.getSize(new THREE.Vector2()));
            console.log('Scene object count:', this.scene.children.length);
            console.log('Camera position:', this.camera.position);
            this.xrLogged = true;
        }
        
        // compositiondebug

        // movement based on perlin noise
        for (let i = 0; i < this.objects.length; i++) {
            if (this.composition == -1) {
        
            } else if (this.composition == 0) {
                this.objects[i].position.y = this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i], this.posY[i] << i) + this.posY[i];
                this.objects[i].scale.y = 2 + this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i], this.posY[i] * 2);
            
            } else if (this.composition == 1) {
                this.objects[i].scale.x = 2 + this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i], this.posY[i] * 2);
                this.objects[i].position.x = this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i] * 0.4, this.posY[i]) + this.posY[i];
            
            } else if (this.composition == 2) {
                this.objects[i].scale.y = 0.75 + Math.abs(this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i] + 100, this.posY[i] * 2 + 100));
                this.objects[i].position.x = this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i] * 0.35, this.posY[i] + 1);
            
            } else if (this.composition == 3) {

                this.objects[i].scale.x = 3 + this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i], this.posY[i] * 2);
                this.objects[i].position.x = Math.sin(this.clock.elapsedTime * 0.1) * this.perlin.noise(0.2 * this.clock.elapsedTime * this.noiseOffset[i] + i, this.posY[i] + i);
                this.objects[i].position.z = -3 + Math.cos(this.clock.elapsedTime * 0.1) * this.perlin.noise(0.2 * this.clock.elapsedTime * this.noiseOffset[i] + i, this.posY[i] + 981 + i);

            } else if (this.composition == 4) {
                this.objects[i].scale.y = 3 + this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i], this.posY[i] * 2);
                this.objects[i].position.x = 2 * Math.sin(this.clock.elapsedTime * 0.05) * this.perlin.noise(0.2 * this.clock.elapsedTime * this.noiseOffset[i] / 2, this.posY[i]);
                this.objects[i].position.z = -3 + 2 * Math.cos(this.clock.elapsedTime * 0.05) * this.perlin.noise(0.2 * this.clock.elapsedTime * this.noiseOffset[i] / 2, this.posY[i] + i);

            } else if (this.composition == 5) {
                this.objects[i].scale.y = 1 + Math.abs(Math.tan(this.clock.elapsedTime * 0.15 + i * 100));
                this.objects[i].position.y = this.posY[i] + this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i] * 0.2, this.posY[i]);
                
            } else if (this.composition == 6) {
                this.objects[i].scale.y = 1.0 + Math.abs(Math.tan(this.clock.elapsedTime * 0.1 + i * 100));
                this.objects[i].rotation.x += Math.sin(this.clock.elapsedTime * 0.01 + i * 500) * this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i] * 0.01, this.posY[i] + i) * 0.002;
                this.objects[i].position.x = this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i] * 0.2 + i*10, this.posY[i] + i) + this.posY[i];

            } else if (this.composition == 7) {
                this.objects[i].scale.y = 1.0 + Math.abs(Math.tan(this.clock.elapsedTime * 0.1 + i * 100));

            } else if (this.composition == 8) {
                this.objects[i].scale.y = 1.0 + Math.abs(Math.tan(this.clock.elapsedTime * 0.1 + i * 100))
                this.objects[i].rotation.x += Math.sin(this.clock.elapsedTime * 0.01 + i * 500) * this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i] * 0.01, this.posY[i] + i) * 0.002;
                

            } else if (this.composition == 99) {
                this.objects[i].position.x = this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i], this.posY[i]) + this.posY[i];
                this.objects[i].scale.x = 3 + this.perlin.noise(this.clock.elapsedTime * this.noiseOffset[i], this.posY[i] * 2);
            }
        } 
            
        // this.objects.forEach( (object) => { object.position.y += 0.001; });
        
        this.renderer.render( this.scene, this.camera );
    }    

    setupXR(){
        this.renderer.xr.enabled = true;
        this.renderer.xr.setFramebufferScaleFactor( 1.0 / window.devicePixelRatio );
        if (!this.DEBUG) {
            this.btn = ARButton.createButton( this.renderer );
            this.btn.className = "fade-in-5";
            this.btn.classList.add("blurred-background");
            document.body.appendChild( this.btn );
        }
    }
    
    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16 | 0;
            let v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }).replace(/-/g, '');
    }

    animate() {
        requestAnimationFrame( animate );
        render();
    }
}

export { App };