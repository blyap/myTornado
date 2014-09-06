require([
	'goo/entities/GooRunner',
  	'goo/entities/systems/PickingSystem',
	'goo/math/Ray',
	'goo/math/Vector2',
	'goo/math/Vector3',
  	'goo/picking/PrimitivePickLogic',
	'goo/renderer/Camera',
	'goo/renderer/Material',
	'goo/renderer/TextureCreator',
	'goo/renderer/light/PointLight',
	'goo/renderer/shaders/ShaderLib',
	'goo/scripts/FPCamControlScript',
	'goo/shapes/ShapeCreator'
], function (
	GooRunner,
  	PickingSystem,
	Ray,
	Vector2,
	Vector3,
  	PrimitivePickLogic,
	Camera,
	Material,
	TextureCreator,
	PointLight,
	ShaderLib,
	FPCamControlScript,
	ShapeCreator
) {
	"use strict";

	var goo = new GooRunner({logo : false, canvas: myCanvas});
  	var picked = null;
  	var widthD, heightD, respJ;

  	goo.renderer.setClearColor(0, 0, 0, 1);
	//goo.renderer.setSize(222, 222);
	//goo.renderer.domElement.id = 'gooCanvas';
	//document.body.appendChild(goo.renderer.domElement);
	//var www = parseInt(document.getElementById("gooCanvas").getAttribute("WIDTH"));

	function addCrosshair() {
		// the crosshair is just an an html element that sits on top of the webgl canvas containing a '+'11
		var div = document.createElement('div');
		div.id = 'crosshair';
		div.innerHTML = '&#183;'; // or &#8226;
		div.style.color = 'white';
		div.style.position = 'absolute';
		div.style.fontSize = 'x-large';
		div.style.zIndex = '2000';
		div.style.left = '49.6%';
		div.style.top = '48.5%';

		// a lot of code to make it unselectable
		div.style.webkitTouchCallout = 'none';
		div.style.webkitUserSelect = 'none';
		div.style.khtmlUserSelect = 'none';
		div.style.mozUserSelect = 'none';
		div.style.msUserSelect = 'none';
		div.style.userSelect = 'none';
		div.ondragstart = function () {
			return false;
		};

		// adding the element to the page
		document.body.appendChild(div);
	}

    var ws = new WebSocket('ws://localhost:8888/chatsocket');
    ws.onopen = function() {
        ws.send('Hello, world');
    };
    ws.onmessage = function (evt) {
        alert(evt.data);
    };

    var meshData = ShapeCreator.createSphere(24, 24, 1.0); // 3 - radius
    var material = Material.createMaterial(ShaderLib.simpleLit);
    var aim = new Array(5);
    var x = [0.0, 0.0, -20.0, 20.0, 0.0]; //var x = new Array(5);
    var y = [0.0, 0.0, 0.0, 0.0, 20.0]; //var y = new Array(5);
    var z = [-20.0, 20.0, 0.0, 0.0, 0.0]; //var z = new Array(5);
    for (var i = 0; i < aim.length; i++)  {
        aim[i] = goo.world.createEntity(meshData, material).addToWorld();
    }

  	function createTorus(y){
      	var meshData = ShapeCreator.createTorus(24, 24, 0.1, 10);
      	var material = Material.createMaterial(ShaderLib.simpleLit);
      	var tor = goo.world.createEntity(meshData, material).addToWorld();
      	tor.setRotation(Math.PI/2, 0, 0).setTranslation(0, y, 0);
      	tor.meshRendererComponent.materials[0].uniforms.materialAmbient = [1,1,0.5,1];
      	return 0;
    }

  	createTorus(10.0);
  	createTorus(-10.0);

	var camera = new Camera(90);
  	goo.world.createEntity( camera, new FPCamControlScript({
      domElement : goo.renderer.domElement,
      turnSpeedHorizontal : 0.01,
      turnSpeedVertical : 0.01
    }), [0.0, 0.0, 0.0]).addToWorld();


	// Add PickingSystem
	var picking = new PickingSystem({pickLogic: new PrimitivePickLogic()});
	goo.world.setSystem(picking);
	picking.onPick = function(pickedList) {
		if (pickedList && pickedList.length) {
          	// or (pickedList[0].entity == aim1) || (pickedList[0].entity == aim2) || (pickedList[0].entity == aim3) || (pickedList[0].entity == aim4) || (pickedList[0].entity == aim5)
          	if (pickedList[0].entity.meshRendererComponent.materials[0].uniforms.materialAmbient[2] == 0.6) {
				picked = pickedList[0].entity;
                //alert('seseeseses');
            }
            else {
            }
			// the world position of hit
			// do something with pickedList[0].intersection.points[0]
			// the distance from ray origin to hit position
			// do something with pickedList[0].intersection.distances[0]
		} else {
			picked = null;
		}
	};

	goo.callbacks.push(function(tpf) {
        widthD = goo.renderer.domElement.width;
        heightD = goo.renderer.domElement.height;
        for (var i = 0; i < aim.length; i++)  {
            aim[i].setTranslation(x[i], y[i], z[i]);
            aim[i].meshRendererComponent.materials[0].uniforms.materialAmbient = [1,1,0.6,1];
            aim[i].setScale(1000.0/heightD, 1000.0/heightD, 1000.0/heightD);
        }
		if (picked) {
			var val = Math.abs(Math.sin(goo.world.time)) + 0.5;
			picked.transformComponent.setScale(val, val, val);
		}
	});

	document.addEventListener('mousedown', function(event) {
		event.preventDefault();
		event.stopPropagation();

		var mouseDownX = event.pageX;
		var mouseDownY = event.pageY;
		console.log('mouse event coords: ' + mouseDownX + ',' + mouseDownY);

		var worldPos = new Vector3();
		var screenPos = new Vector2();

		camera.getWorldCoordinates(mouseDownX, mouseDownY, goo.renderer.viewportWidth, goo.renderer.viewportHeight, 0, worldPos);
		console.log('z=0, world coords: ' + worldPos.x + ',' + worldPos.y + ',' + worldPos.z);
		camera.getScreenCoordinates(worldPos, goo.renderer.viewportWidth, goo.renderer.viewportHeight, screenPos);
		if( mouseDownX !== screenPos.x || mouseDownY !== screenPos.y  )
			console.log('z=0, calculated screen coords: ' + screenPos.x + ',' + screenPos.y);

		camera.getWorldCoordinates(mouseDownX, mouseDownY, goo.renderer.viewportWidth, goo.renderer.viewportHeight, 1, worldPos);
		console.log('z=1, world coords: ' + worldPos.x + ',' + worldPos.y + ',' + worldPos.z);
		camera.getScreenCoordinates(worldPos, goo.renderer.viewportWidth, goo.renderer.viewportHeight, screenPos);
		if( mouseDownX !== screenPos.x || mouseDownY !== screenPos.y  )
			console.log('z=1, calculated screen coords: ' + screenPos.x + ',' + screenPos.y);

		var ray = new Ray();
		camera.getPickRay(goo.renderer.viewportWidth / 2, goo.renderer.viewportHeight / 2, goo.renderer.viewportWidth, goo.renderer.viewportHeight, ray);
		console.log('Ray: origin = ' + ray.origin.x + ',' + ray.origin.y + ',' + ray.origin.z + ' direction = ' + ray.direction.x + ','
			+ ray.direction.y + ',' + ray.direction.z);

		// Ask all appropriate world entities if they've been picked
		picking.pickRay = ray;
		picking._process();
	}, false);
	//alert(hhh);
	addCrosshair()
});