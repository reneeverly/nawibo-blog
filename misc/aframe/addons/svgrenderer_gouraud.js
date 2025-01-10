console.warn( "THREE.SVGRenderer: As part of the transition to ES6 Modules, the files in 'examples/js' were deprecated in May 2020 (r117).  I manually updated them to r164." );
/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.SVGObject = function ( node ) {

	THREE.Object3D.call( this );

	this.isSVGObject = true;
	this.node = node;

};

THREE.SVGObject.prototype = Object.create( THREE.Object3D.prototype );
THREE.SVGObject.prototype.constructor = THREE.SVGObject;

THREE.SVGRenderer = function () {

	var _renderData, _elements, _lights,
		_svgWidth, _svgHeight, _svgWidthHalf, _svgHeightHalf,

		_v1, _v2, _v3,

		_svgNode,
		_pathCount = 0,

		_precision = null,
		_quality = 1,

		_currentPath, _currentStyle;

	var _this = this,
		_clipBox = new THREE.Box2(),
		_elemBox = new THREE.Box2(),

		_color = new THREE.Color(),
		_diffuseColor = new THREE.Color(),
		_ambientLight = new THREE.Color(),
		_directionalLights = new THREE.Color(),
		_pointLights = new THREE.Color(),
		_clearColor = new THREE.Color(),

		_vector3 = new THREE.Vector3(), // Needed for PointLight
		_centroid = new THREE.Vector3(),
		_normal = new THREE.Vector3(),
		_normalViewMatrix = new THREE.Matrix3(),

		_viewMatrix = new THREE.Matrix4(),
		_viewProjectionMatrix = new THREE.Matrix4(),

		_svgPathPool = [],

		_projector = new THREE.Projector(),
		_svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );


	this.domElement = _svg;

	this.autoClear = true;
	this.sortObjects = true;
	this.sortElements = true;

	this.overdraw = 0.5;

	this.outputColorSpace = THREE.SRGBColorSpace

	this.info = {

		render: {

			vertices: 0,
			faces: 0

		}

	};

	this.setQuality = function ( quality ) {

		switch ( quality ) {

			case "high": _quality = 1; break;
			case "low": _quality = 0; break;

		}

	};

	this.setClearColor = function ( color ) {

		_clearColor.set( color );

	};

	this.setPixelRatio = function () {};

	this.setSize = function ( width, height ) {

		_svgWidth = width; _svgHeight = height;
		_svgWidthHalf = _svgWidth / 2; _svgHeightHalf = _svgHeight / 2;

		_svg.setAttribute( 'viewBox', ( - _svgWidthHalf ) + ' ' + ( - _svgHeightHalf ) + ' ' + _svgWidth + ' ' + _svgHeight );
		_svg.setAttribute( 'width', _svgWidth );
		_svg.setAttribute( 'height', _svgHeight );

		_clipBox.min.set( - _svgWidthHalf, - _svgHeightHalf );
		_clipBox.max.set( _svgWidthHalf, _svgHeightHalf );

	};

	this.getSize = function () {

		return {
			width: _svgWidth,
			height: _svgHeight
		};

	}

	this.setPrecision = function ( precision ) {

		_precision = precision;

	};

	function removeChildNodes() {

		_pathCount = 0;

		while ( _svg.childNodes.length > 0 ) {

			_svg.removeChild( _svg.childNodes[ 0 ] );

		}

	}

	function convert( c ) {

		return _precision !== null ? c.toFixed( _precision ) : c;

	}

	this.clear = function () {

		removeChildNodes();
		_svg.style.backgroundColor = _clearColor.getStyle(_this.outputColorSpace);

	};

	this.render = function ( scene, camera ) {

		if ( camera instanceof THREE.Camera === false ) {

			console.error( 'THREE.SVGRenderer.render: camera is not an instance of THREE.Camera.' );
			return;

		}

		var background = scene.background;

		if ( background && background.isColor ) {

			removeChildNodes();
			_svg.style.backgroundColor = background.getStyle(_this.outputColorSpace);

		} else if ( this.autoClear === true ) {

			this.clear();

		}

		_this.info.render.vertices = 0;
		_this.info.render.faces = 0;

		_viewMatrix.copy( camera.matrixWorldInverse );
		_viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, _viewMatrix );

		_renderData = _projector.projectScene( scene, camera, this.sortObjects, this.sortElements );
		_elements = _renderData.elements;
		_lights = _renderData.lights;

		_normalViewMatrix.getNormalMatrix( camera.matrixWorldInverse );

		calculateLights( _lights );

		 // reset accumulated path

		_currentPath = '';
		_currentStyle = '';

		for ( var e = 0, el = _elements.length; e < el; e ++ ) {

			var element = _elements[ e ];
			var material = element.material;

			if ( material === undefined || material.opacity === 0 ) continue;

			_elemBox.makeEmpty();

			if ( element instanceof THREE.RenderableSprite ) {

				_v1 = element;
				_v1.x *= _svgWidthHalf; _v1.y *= - _svgHeightHalf;

				renderSprite( _v1, element, material );

			} else if ( element instanceof THREE.RenderableLine ) {

				_v1 = element.v1; _v2 = element.v2;

				_v1.positionScreen.x *= _svgWidthHalf; _v1.positionScreen.y *= - _svgHeightHalf;
				_v2.positionScreen.x *= _svgWidthHalf; _v2.positionScreen.y *= - _svgHeightHalf;

				_elemBox.setFromPoints( [ _v1.positionScreen, _v2.positionScreen ] );

				if ( _clipBox.intersectsBox( _elemBox ) === true ) {

					renderLine( _v1, _v2, material );

				}

			} else if ( element instanceof THREE.RenderableFace ) {

				_v1 = element.v1; _v2 = element.v2; _v3 = element.v3;

				if ( _v1.positionScreen.z < - 1 || _v1.positionScreen.z > 1 ) continue;
				if ( _v2.positionScreen.z < - 1 || _v2.positionScreen.z > 1 ) continue;
				if ( _v3.positionScreen.z < - 1 || _v3.positionScreen.z > 1 ) continue;

				_v1.positionScreen.x *= _svgWidthHalf; _v1.positionScreen.y *= - _svgHeightHalf;
				_v2.positionScreen.x *= _svgWidthHalf; _v2.positionScreen.y *= - _svgHeightHalf;
				_v3.positionScreen.x *= _svgWidthHalf; _v3.positionScreen.y *= - _svgHeightHalf;

				if ( this.overdraw > 0 ) {

					expand( _v1.positionScreen, _v2.positionScreen, this.overdraw );
					expand( _v2.positionScreen, _v3.positionScreen, this.overdraw );
					expand( _v3.positionScreen, _v1.positionScreen, this.overdraw );

				}

				_elemBox.setFromPoints( [
					_v1.positionScreen,
					_v2.positionScreen,
					_v3.positionScreen
				] );

				if ( _clipBox.intersectsBox( _elemBox ) === true ) {

					renderFace3( _v1, _v2, _v3, element, material );

				}

			}

		}

		flushPath(); // just to flush last svg:path

		scene.traverseVisible( function ( object ) {

			 if ( object instanceof THREE.SVGObject ) {

				_vector3.setFromMatrixPosition( object.matrixWorld );
				_vector3.applyMatrix4( _viewProjectionMatrix );

				if ( _vector3.z < - 1 || _vector3.z > 1 ) return;

				var x = _vector3.x * _svgWidthHalf;
				var y = - _vector3.y * _svgHeightHalf;

				var node = object.node;
				node.setAttribute( 'transform', 'translate(' + x + ',' + y + ')' );

				_svg.appendChild( node );

			}

		} );

	};

	function calculateLights( lights ) {

		_ambientLight.setRGB( 0, 0, 0 );
		_directionalLights.setRGB( 0, 0, 0 );
		_pointLights.setRGB( 0, 0, 0 );

		for ( var l = 0, ll = lights.length; l < ll; l ++ ) {

			var light = lights[ l ];
			var lightColor = light.color;

			if ( light.isAmbientLight ) {

				_ambientLight.r += lightColor.r;
				_ambientLight.g += lightColor.g;
				_ambientLight.b += lightColor.b;

			} else if ( light.isDirectionalLight ) {

				_directionalLights.r += lightColor.r;
				_directionalLights.g += lightColor.g;
				_directionalLights.b += lightColor.b;

			} else if ( light.isPointLight ) {

				_pointLights.r += lightColor.r;
				_pointLights.g += lightColor.g;
				_pointLights.b += lightColor.b;

			}

		}

	}

	function calculateLight( lights, position, normal, color ) {

		for ( var l = 0, ll = lights.length; l < ll; l ++ ) {

			var light = lights[ l ];
			var lightColor = light.color;

			if ( light.isDirectionalLight ) {

				var lightPosition = _vector3.setFromMatrixPosition( light.matrixWorld ).normalize();

				var amount = normal.dot( lightPosition );

				if ( amount <= 0 ) continue;

				amount *= light.intensity;

				color.r += lightColor.r * amount;
				color.g += lightColor.g * amount;
				color.b += lightColor.b * amount;

			} else if ( light.isPointLight ) {

				var lightPosition = _vector3.setFromMatrixPosition( light.matrixWorld );

				var amount = normal.dot( _vector3.subVectors( lightPosition, position ).normalize() );

				if ( amount <= 0 ) continue;

				amount *= light.distance == 0 ? 1 : 1 - Math.min( position.distanceTo( lightPosition ) / light.distance, 1 );

				if ( amount == 0 ) continue;

				amount *= light.intensity;

				color.r += lightColor.r * amount;
				color.g += lightColor.g * amount;
				color.b += lightColor.b * amount;

			}

		}

	}

	function renderSprite( v1, element, material ) {

		var scaleX = element.scale.x * _svgWidthHalf;
		var scaleY = element.scale.y * _svgHeightHalf;

		if ( material.isPointsMaterial ) {

			scaleX *= material.size;
			scaleY *= material.size;

		}

		var path = 'M' + convert( v1.x - scaleX * 0.5 ) + ',' + convert( v1.y - scaleY * 0.5 ) + 'h' + convert( scaleX ) + 'v' + convert( scaleY ) + 'h' + convert( - scaleX ) + 'z';
		var style = "";

		if ( material.isSpriteMaterial || material.isPointsMaterial ) {

			style = 'fill:' + material.color.getStyle(_this.outputColorSpace) + ';fill-opacity:' + material.opacity;

		}

		addPath( style, path );

	}

	function renderLine( v1, v2, material ) {

		var path = 'M' + convert( v1.positionScreen.x ) + ',' + convert( v1.positionScreen.y ) + 'L' + convert( v2.positionScreen.x ) + ',' + convert( v2.positionScreen.y );

		if ( material.isLineBasicMaterial ) {

			var style = 'fill:none;stroke:' + material.color.getStyle(_this.outputColorSpace) + ';stroke-opacity:' + material.opacity + ';stroke-width:' + material.linewidth + ';stroke-linecap:' + material.linecap;

			if ( material.isLineDashedMaterial ) {

				style = style + ';stroke-dasharray:' + material.dashSize + "," + material.gapSize;

			}

			addPath( style, path );

		}

	}

	function renderFace3( v1, v2, v3, element, material ) {

		var gouraud_override = false;
		var v1_color = new THREE.Color(),
		    v2_color = new THREE.Color(),
		    v3_color = new THREE.Color();

		_this.info.render.vertices += 3;
		_this.info.render.faces ++;

		var path = 'M' + convert( v1.positionScreen.x ) + ',' + convert( v1.positionScreen.y ) + 'L' + convert( v2.positionScreen.x ) + ',' + convert( v2.positionScreen.y ) + 'L' + convert( v3.positionScreen.x ) + ',' + convert( v3.positionScreen.y ) + 'z';
		var style = '';

		if ( material.isMeshBasicMaterial ) {

			_color.copy( material.color );

			if ( material.vertexColors ) {

				_color.multiply( element.color );

			}

		} else if ( material.isMeshLambertMaterial || material.isMeshPhongMaterial || material.isMeshStandardMaterial ) {
/*
Gouraud Approximation: Since we know that each face is "one color", we can map a monochrome gradient on top of it: https://stackoverflow.com/questions/3182516/coloring-a-triangle-naturally-using-svg-gradients
*/

			_diffuseColor.copy( material.color );

			if ( material.vertexColors ) {

				_diffuseColor.multiply( element.color );

			}

			_color.copy( _ambientLight );

			_centroid.copy( v1.positionWorld ).add( v2.positionWorld ).add( v3.positionWorld ).divideScalar( 3 );

			calculateLight( _lights, _centroid, element.normalModel, _color );


v1_color.copy(_ambientLight);
v2_color.copy(_ambientLight);
v3_color.copy(_ambientLight);
calculateLight( _lights, v1.positionWorld, element.vertexNormalsModel[0], v1_color );
calculateLight( _lights, v2.positionWorld, element.vertexNormalsModel[1], v2_color );
calculateLight( _lights, v3.positionWorld, element.vertexNormalsModel[2], v3_color );
v1_color.multiply( _diffuseColor ).add( material.emissive );
v2_color.multiply( _diffuseColor ).add( material.emissive );
v3_color.multiply( _diffuseColor ).add( material.emissive );

if (!(v1_color.equals(v2_color) && v2_color.equals(v3_color))) {
	gouraud_override = true;
}


			_color.multiply( _diffuseColor ).add( material.emissive );

		} else if ( material.isMeshNormalMaterial ) {

			_normal.copy( element.normalModel ).applyMatrix3( _normalViewMatrix ).normalize();

			_color.setRGB( _normal.x, _normal.y, _normal.z ).multiplyScalar( 0.5 ).addScalar( 0.5 );

		}

		if ( material.wireframe ) {

			style = 'fill:none;stroke:' + _color.getStyle(_this.outputColorSpace) + ';stroke-opacity:' + material.opacity + ';stroke-width:' + material.wireframeLinewidth + ';stroke-linecap:' + material.wireframeLinecap + ';stroke-linejoin:' + material.wireframeLinejoin;

		} else if (gouraud_override) {

			let color_1, color_2, midpoint = new THREE.Vector4(), maxpoint = new THREE.Vector4();

			/*if (v1_color.equals(v2_color)) {
				// v1,v2 -> v3
				color_1 = v1_color.getStyle(_this.outputColorSpace)
				color_2 = v3_color.getStyle(_this.outputColorSpace)
				midpoint.copy(v1.positionScreen).add(v2.positionScreen).divideScalar(2)
				let vector_mid_to_maxpoint = Vector4toVector2(v1.positionScreen.clone().sub(midpoint)).rotateAround(new THREE.Vector2(0, 0), Math.PI/2).add(Vector4toVector2(midpoint))
				let vector_three_to_maxpoint = midpoint.clone().sub(v1.positionScreen).add(v3.positionScreen)
				maxpoint = get_intersection(midpoint, vector_mid_to_maxpoint, v3.positionScreen, vector_three_to_maxpoint)
			} else if (v1_color.equals(v3_color)) {
				// v1,v3 -> v2
				color_1 = v1_color.getStyle(_this.outputColorSpace)
				color_2 = v2_color.getStyle(_this.outputColorSpace)
				midpoint.copy(v1.positionScreen).add(v3.positionScreen).divideScalar(2)
				let _b = v1.positionScreen.clone().sub(midpoint)
				let vector_mid_to_maxpoint = Vector4toVector2(_b).rotateAround(new THREE.Vector2(0, 0), Math.PI/2).add(Vector4toVector2(midpoint))
				let vector_two_to_maxpoint = midpoint.clone().sub(v1.positionScreen).add(v2.positionScreen)
				maxpoint = get_intersection(midpoint, vector_mid_to_maxpoint, v2.positionScreen, vector_two_to_maxpoint)
			} else if (v2_color.equals(v3_color)) {
				color_1 = v1_color.getStyle(_this.outputColorSpace)
				color_2 = v3_color.getStyle(_this.outputColorSpace)
				maxpoint.copy(v2.positionScreen).add(v3.positionScreen).divideScalar(2)
				let _b = v2.positionScreen.clone().sub(maxpoint)
				let vector_max_to_midpoint = Vector4toVector2(_b).rotateAround(new THREE.Vector2(0, 0), Math.PI/2).add(Vector4toVector2(maxpoint))
				let vector_one_to_midpoint = maxpoint.clone().sub(v2.positionScreen).add(v1.positionScreen)
				midpoint = get_intersection(maxpoint, vector_max_to_midpoint, v1.positionScreen, vector_one_to_midpoint)
			} else {*/
				// complex
				// https://stackoverflow.com/questions/3182516/coloring-a-triangle-naturally-using-svg-gradients
				// skew the gradient?  rotate gradient points around center of line between min and max luma, and stretch/shrink the line such that maxp and minp still have same color value.  I think this forms an ellipse of sorts?  If this were an equilateral triangle, then luma between min and max should be halfway linearly.  The max it should need to rotate/skew is to the third point (in either rotational direction)

				// let's get the lightnesses (ignore color-proper for now)
				let shades = [
					[v1, v1_color, v1_color.getHSL({h:0,s:0,l:0}).l],
					[v2, v2_color, v2_color.getHSL({h:0,s:0,l:0}).l],
					[v3, v3_color, v3_color.getHSL({h:0,s:0,l:0}).l]
				].sort(function (a, b) {
					if (a[2] < b[2]) {
						return 1
					} else if (a[2] > b[2]) {
						return -1
					} else {
						return 0
					}
				}) // [0] = lightest (maxp), [2] = darkest (minp)
				let expected_position_fraction = (shades[1][2]-shades[2][2])/(shades[0][2]-shades[2][2])

				// Current thoughts: draw a line from the expected position on the line between minp and maxp to the actual midp in space.  90deg from that line is the line the gradient sits on.

				let vec_minp_maxp = shades[0][0].positionScreen.clone().sub(shades[2][0].positionScreen)
				let expected_midp = shades[2][0].positionScreen.clone().add(vec_minp_maxp.clone().normalize().multiplyScalar(vec_minp_maxp.length() * expected_position_fraction))

				let  vec_mexp_midp = shades[1][0].positionScreen.clone().sub(expected_midp)

				let vec_midp_gradient = Vector4toVector2(vec_mexp_midp).rotateAround(new THREE.Vector2(), Math.PI/2)

				// Then, intersection (between maxp -> same vector from expected to midp) and gradient line for new max gradient position.

				// darkest color
				midpoint = get_intersection(shades[1][0].positionScreen, vec_midp_gradient.clone().add(shades[1][0].positionScreen), shades[2][0].positionScreen, vec_mexp_midp.clone().add(shades[2][0].positionScreen))

				// lightest color
				maxpoint = get_intersection(shades[1][0].positionScreen, vec_midp_gradient.clone().add(shades[1][0].positionScreen), shades[0][0].positionScreen, vec_mexp_midp.clone().add(shades[0][0].positionScreen))
				
				color_1 = shades[2][1].getStyle(_this.outputColorSpace) // darkest shade
				color_2 = shades[0][1].getStyle(_this.outputColorSpace) // lightest shade

				console.log('Given:', shades[0][0].positionScreen, shades[1][0].positionScreen, shades[2][0].positionScreen)
				console.log('Found:', maxpoint, midpoint)
				if (Number.isNaN(maxpoint.x)) debugger;

				// approximation, because we haven't done the complex triangle calc yet
				//midpoint = shades[2][0].positionScreen
				//maxpoint = shades[0][0].positionScreen
			/*}*/
			//console.log(midpoint, maxpoint)
			style = 'fill:url("data:image/svg+xml;base64,' + window.btoa('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><linearGradient id="thegrad" gradientUnits="userSpaceOnUse"  x1="' + midpoint.x + '" y1="' + midpoint.y + '" x2="' + maxpoint.x + '" y2="' + maxpoint.y + '"><stop offset="0%" stop-color="' + color_1 + '"></stop><stop offset="100%" stop-color="' + color_2 + '"></stop></linearGradient></defs></svg>') + '#thegrad");fill-opacity:' + material.opacity;

		} else {

			style = 'fill:' + _color.getStyle(_this.outputColorSpace) + ';fill-opacity:' + material.opacity;

		}

		addPath( style, path );

	}

	function get_intersection(a, b, c, d) {
		let maxpoint = new THREE.Vector2()
		//maxpoint.x = _3.x + ((_1.y - _2.y) * (_1.y * (_1.x - _2.x) + _3.x - _1.x) - _3.y * (_1.x - _2.x)) / ((_3.y - _4.y) - 1)
		//maxpoint.y = _3.y + (((_1.y - _2.y) * (_1.y * (_1.x - _2.x) + _3.x - _1.x) - _3.y * (_1.x - _2.x)) / ((_3.x - _4.x) * (_3.y - _4.y) - (_3.x - _4.x))) * (_3.y - _4.y)

		// Try 2:
		// https://math.stackexchange.com/questions/3176543/intersection-point-of-2-lines-defined-by-2-points-each

		let a1 = b.y - a.y
		let b1 = a.x - b.x
		let c1 = a1 * a.x + b1 * a.y

		let a2 = d.y - c.y
		let b2 = c.x - d.x
		let c2 = a2 * c.x + b2 * c.y

		let det = a1 * b2 - a2 * b1

		if (det == 0) {
			console.warn('Lines will never intersect.')
			maxpoint.x = 0
			maxpoint.y = 0
		} else {
			maxpoint.x = (b2*c1 - b1*c2)/det
			maxpoint.y = (a1*c2 - a2*c1)/det
		}

		maxpoint.re = 'hi'
		return maxpoint
	}

	function Vector4toVector2(v4) {
		let v2 = new THREE.Vector2(v4.x, v4.y)
		//console.log(v2, v4)
		return v2
	}

	// Hide anti-alias gaps

	function expand( v1, v2, pixels ) {

		var x = v2.x - v1.x, y = v2.y - v1.y,
			det = x * x + y * y, idet;

		if ( det === 0 ) return;

		idet = pixels / Math.sqrt( det );

		x *= idet; y *= idet;

		v2.x += x; v2.y += y;
		v1.x -= x; v1.y -= y;

	}

	function addPath( style, path ) {

		if ( _currentStyle === style ) {

			_currentPath += path;

		} else {

			flushPath();

			_currentStyle = style;
			_currentPath = path;

		}

	}

	function flushPath() {

		if ( _currentPath ) {

			_svgNode = getPathNode( _pathCount ++ );
			_svgNode.setAttribute( 'd', _currentPath );
			_svgNode.setAttribute( 'style', _currentStyle );
			_svg.appendChild( _svgNode );

		}

		_currentPath = '';
		_currentStyle = '';

	}

	function getPathNode( id ) {

		if ( _svgPathPool[ id ] == null ) {

			_svgPathPool[ id ] = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );

			if ( _quality == 0 ) {

				_svgPathPool[ id ].setAttribute( 'shape-rendering', 'crispEdges' ); //optimizeSpeed

			}

			return _svgPathPool[ id ];

		}

		return _svgPathPool[ id ];

	}

};
