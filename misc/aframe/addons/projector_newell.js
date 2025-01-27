console.warn( "THREE.Projector: As part of the transition to ES6 Modules, the files in 'examples/js' were deprecated in May 2020 (r117). I manually updated them to r172." );
/**
 * @author mrdoob / http://mrdoob.com/
 * @author supereggbert / http://www.paulbrunt.co.uk/
 * @author julianwa / https://github.com/julianwa
 */

THREE.RenderableObject = function () {

	this.id = 0;

	this.object = null;
	this.z = 0;
	this.renderOrder = 0;

};

//

THREE.RenderableFace = function () {

	this.id = 0;

	this.v1 = new THREE.RenderableVertex();
	this.v2 = new THREE.RenderableVertex();
	this.v3 = new THREE.RenderableVertex();

	this.normalModel = new THREE.Vector3();

	this.vertexNormalsModel = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
	this.vertexNormalsLength = 0;

	this.color = new THREE.Color();
	this.material = null;
	this.uvs = [ new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2() ];

	this.z = 0;
	this.renderOrder = 0;

};

//

THREE.RenderableVertex = function () {

	this.position = new THREE.Vector3();
	this.positionWorld = new THREE.Vector3();
	this.positionScreen = new THREE.Vector4();

	this.visible = true;

};

THREE.RenderableVertex.prototype.copy = function ( vertex ) {

	this.positionWorld.copy( vertex.positionWorld );
	this.positionScreen.copy( vertex.positionScreen );

};

//

THREE.RenderableLine = function () {

	this.id = 0;

	this.v1 = new THREE.RenderableVertex();
	this.v2 = new THREE.RenderableVertex();

	this.vertexColors = [ new THREE.Color(), new THREE.Color() ];
	this.material = null;

	this.z = 0;
	this.renderOrder = 0;

};

//

THREE.RenderableSprite = function () {

	this.id = 0;

	this.object = null;

	this.x = 0;
	this.y = 0;
	this.z = 0;

	this.rotation = 0;
	this.scale = new THREE.Vector2();

	this.material = null;
	this.renderOrder = 0;

};

//

THREE.Projector = function () {

	var _object, _objectCount, _objectPoolLength = 0,
		_vertex, _vertexCount, _vertexPoolLength = 0,
		_face, _faceCount, _facePoolLength = 0,
		_line, _lineCount, _linePoolLength = 0,
		_sprite, _spriteCount, _spritePoolLength = 0,

		_renderData = { objects: [], lights: [], elements: [] },

		_vector3 = new THREE.Vector3(),
		_vector4 = new THREE.Vector4(),

		_clipBox = new THREE.Box3( new THREE.Vector3( - 1, - 1, - 1 ), new THREE.Vector3( 1, 1, 1 ) ),
		_boundingBox = new THREE.Box3(),
		_points3 = new Array( 3 ),

		_viewMatrix = new THREE.Matrix4(),
		_viewProjectionMatrix = new THREE.Matrix4(),

		_modelViewProjectionMatrix = new THREE.Matrix4(),

		_frustum = new THREE.Frustum(),

		_objectPool = [], _vertexPool = [], _facePool = [], _linePool = [], _spritePool = [];

	//

	var RenderList = function () {

		var normals = [];
		var colors = [];
		var uvs = [];

		var object = null;

		var normalMatrix = new THREE.Matrix3();

		function setObject( value ) {

			object = value;

			normalMatrix.getNormalMatrix( object.matrixWorld );

			normals.length = 0;
			colors.length = 0;
			uvs.length = 0;

		}

		function projectVertex( vertex ) {

			var position = vertex.position;
			var positionWorld = vertex.positionWorld;
			var positionScreen = vertex.positionScreen;

			positionWorld.copy( position ).applyMatrix4( _modelMatrix );
			positionScreen.copy( positionWorld ).applyMatrix4( _viewProjectionMatrix );

			var invW = 1 / positionScreen.w;

			positionScreen.x *= invW;
			positionScreen.y *= invW;
			positionScreen.z *= invW;

			vertex.visible = positionScreen.x >= - 1 && positionScreen.x <= 1 &&
					 positionScreen.y >= - 1 && positionScreen.y <= 1 &&
					 positionScreen.z >= - 1 && positionScreen.z <= 1;

		}

		function pushVertex( x, y, z ) {

			_vertex = getNextVertexInPool();
			_vertex.position.set( x, y, z );

			projectVertex( _vertex );

		}

		function pushNormal( x, y, z ) {

			normals.push( x, y, z );

		}

		function pushColor( r, g, b ) {

			colors.push( r, g, b );

		}

		function pushUv( x, y ) {

			uvs.push( x, y );

		}

		function checkTriangleVisibility( v1, v2, v3 ) {

			if ( v1.visible === true || v2.visible === true || v3.visible === true ) return true;

			_points3[ 0 ] = v1.positionScreen;
			_points3[ 1 ] = v2.positionScreen;
			_points3[ 2 ] = v3.positionScreen;

			return _clipBox.intersectsBox( _boundingBox.setFromPoints( _points3 ) );

		}

		function checkBackfaceCulling( v1, v2, v3 ) {

			return ( ( v3.positionScreen.x - v1.positionScreen.x ) *
				    ( v2.positionScreen.y - v1.positionScreen.y ) -
				    ( v3.positionScreen.y - v1.positionScreen.y ) *
				    ( v2.positionScreen.x - v1.positionScreen.x ) ) < 0;

		}

		function pushLine( a, b ) {

			var v1 = _vertexPool[ a ];
			var v2 = _vertexPool[ b ];

			// Clip

			v1.positionScreen.copy( v1.position ).applyMatrix4( _modelViewProjectionMatrix );
			v2.positionScreen.copy( v2.position ).applyMatrix4( _modelViewProjectionMatrix );

			if ( clipLine( v1.positionScreen, v2.positionScreen ) === true ) {

				// Perform the perspective divide
				v1.positionScreen.multiplyScalar( 1 / v1.positionScreen.w );
				v2.positionScreen.multiplyScalar( 1 / v2.positionScreen.w );

				_line = getNextLineInPool();
				_line.id = object.id;
				_line.v1.copy( v1 );
				_line.v2.copy( v2 );
				_line.z = Math.max( v1.positionScreen.z, v2.positionScreen.z );
				_line.renderOrder = object.renderOrder;

				_line.material = object.material;

				if ( object.material.vertexColors ) {

					_line.vertexColors[ 0 ].fromArray( colors, a * 3 );
					_line.vertexColors[ 1 ].fromArray( colors, b * 3 );

				}

				_renderData.elements.push( _line );

			}

		}

		function pushTriangle( a, b, c, material ) {

			var v1 = _vertexPool[ a ];
			var v2 = _vertexPool[ b ];
			var v3 = _vertexPool[ c ];

			if ( checkTriangleVisibility( v1, v2, v3 ) === false ) return;

			if ( material.side === THREE.DoubleSide || checkBackfaceCulling( v1, v2, v3 ) === true ) {

				_face = getNextFaceInPool();

				_face.id = object.id;
				_face.v1.copy( v1 );
				_face.v2.copy( v2 );
				_face.v3.copy( v3 );
				_face.z = ( v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z ) / 3;
				_face.renderOrder = object.renderOrder;

				// face normal
				_vector3.subVectors( v3.position, v2.position );
				_vector4.subVectors( v1.position, v2.position );
				_vector3.cross( _vector4 );
				_face.normalModel.copy( _vector3 );
				_face.normalModel.applyMatrix3( normalMatrix ).normalize();

				for ( var i = 0; i < 3; i ++ ) {

					var normal = _face.vertexNormalsModel[ i ];
					normal.fromArray( normals, arguments[ i ] * 3 );
					normal.applyMatrix3( normalMatrix ).normalize();

					var uv = _face.uvs[ i ];
					uv.fromArray( uvs, arguments[ i ] * 2 );

				}

				_face.vertexNormalsLength = 3;

				_face.material = material;

				if ( material.vertexColors ) {

					_face.color.fromArray( colors, a * 3 );

				}

				_renderData.elements.push( _face );

			}

		}

		return {
			setObject: setObject,
			projectVertex: projectVertex,
			checkTriangleVisibility: checkTriangleVisibility,
			checkBackfaceCulling: checkBackfaceCulling,
			pushVertex: pushVertex,
			pushNormal: pushNormal,
			pushColor: pushColor,
			pushUv: pushUv,
			pushLine: pushLine,
			pushTriangle: pushTriangle
		};

	};

	var renderList = new RenderList();

	function projectObject( object ) {

		if ( object.visible === false ) return;

		if ( object instanceof THREE.Light ) {

			_renderData.lights.push( object );

		} else if ( object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points ) {

			if ( object.material.visible === false ) return;
			if ( object.frustumCulled === true && _frustum.intersectsObject( object ) === false ) return;

			addObject( object );

		} else if ( object instanceof THREE.Sprite ) {

			if ( object.material.visible === false ) return;
			if ( object.frustumCulled === true && _frustum.intersectsSprite( object ) === false ) return;

			addObject( object );

		}

		var children = object.children;

		for ( var i = 0, l = children.length; i < l; i ++ ) {

			projectObject( children[ i ] );

		}

	}

	function addObject( object ) {

		_object = getNextObjectInPool();
		_object.id = object.id;
		_object.object = object;

		_vector3.setFromMatrixPosition( object.matrixWorld );
		_vector3.applyMatrix4( _viewProjectionMatrix );
		_object.z = _vector3.z;
		_object.renderOrder = object.renderOrder;

		_renderData.objects.push( _object );

	}

	this.projectScene = function ( scene, camera, sortObjects, sortElements ) {

		_faceCount = 0;
		_lineCount = 0;
		_spriteCount = 0;

		_renderData.elements.length = 0;

		if ( scene.matrixWorldAutoUpdate === true ) scene.updateMatrixWorld();
		if ( camera.parent === null && camera.matrixWorldAutoUpdate === true) camera.updateMatrixWorld();

		_viewMatrix.copy( camera.matrixWorldInverse );
		_viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, _viewMatrix );

		_frustum.setFromProjectionMatrix( _viewProjectionMatrix );

		//

		_objectCount = 0;

		_renderData.objects.length = 0;
		_renderData.lights.length = 0;

		projectObject( scene );

		if ( sortObjects === true ) {

			_renderData.objects.sort( painterSort );

		}

		//

		var objects = _renderData.objects;

		for ( var o = 0, ol = objects.length; o < ol; o ++ ) {

			var object = objects[ o ].object;
			var geometry = object.geometry;

			renderList.setObject( object );

			_modelMatrix = object.matrixWorld;

			_vertexCount = 0;

			if ( object instanceof THREE.Mesh ) {


					var material = object.material;

					var isMultiMaterial = Array.isArray( material );

					var attributes = geometry.attributes;
					var groups = geometry.groups;

					if ( attributes.position === undefined ) continue;

					var positions = attributes.position.array;

					for ( var i = 0, l = positions.length; i < l; i += 3 ) {

						var x = positions[ i ];
						var y = positions[ i + 1 ];
						var z = positions[ i + 2 ];

						var morphTargets = geometry.morphAttributes.position;

						if (morphTargets !== undefined) {
							var morphTargetsRelative = geometry.morphTargetsRelative;
							var morphInfluences = object.morphTargetInfluences;

							for ( var t = 0, tl = morphTargets.length; t < tl; t ++ ) {

								var influence = morphInfluences[ t ];

								if ( influence === 0 ) continue;

								var target = morphTargets[ t ];

								if ( morphTargetsRelative ) {

									x += target.getX( i / 3 ) * influence;
									y += target.getY( i / 3 ) * influence;
									z += target.getZ( i / 3 ) * influence;

								} else {

									x += ( target.getX( i / 3 ) - positions[ i ] ) * influence;
									y += ( target.getY( i / 3 ) - positions[ i + 1 ] ) * influence;
									z += ( target.getZ( i / 3 ) - positions[ i + 2 ] ) * influence;

								}

							}

						}

						renderList.pushVertex( x, y, z );

					}

					if ( attributes.normal !== undefined ) {

						var normals = attributes.normal.array;

						for ( var i = 0, l = normals.length; i < l; i += 3 ) {

							renderList.pushNormal( normals[ i ], normals[ i + 1 ], normals[ i + 2 ] );

						}

					}

					if ( attributes.color !== undefined ) {

						var colors = attributes.color.array;

						for ( var i = 0, l = colors.length; i < l; i += 3 ) {

							renderList.pushColor( colors[ i ], colors[ i + 1 ], colors[ i + 2 ] );

						}

					}

					if ( attributes.uv !== undefined ) {

						var uvs = attributes.uv.array;

						for ( var i = 0, l = uvs.length; i < l; i += 2 ) {

							renderList.pushUv( uvs[ i ], uvs[ i + 1 ] );

						}

					}

					if ( geometry.index !== null ) {

						var indices = geometry.index.array;

						if ( groups.length > 0 ) {

							for ( var g = 0; g < groups.length; g ++ ) {

								var group = groups[ g ];

								material = isMultiMaterial === true
									 ? object.material[ group.materialIndex ]
									 : object.material;

								if ( material === undefined ) continue;

								for ( var i = group.start, l = group.start + group.count; i < l; i += 3 ) {

									renderList.pushTriangle( indices[ i ], indices[ i + 1 ], indices[ i + 2 ], material );

								}

							}

						} else {

							for ( var i = 0, l = indices.length; i < l; i += 3 ) {

								renderList.pushTriangle( indices[ i ], indices[ i + 1 ], indices[ i + 2 ], material );

							}

						}

					} else {

						if ( groups.length > 0 ) {

							for ( var g = 0; g < groups.length; g ++ ) {

								var group = groups[ g ];

								material = isMultiMaterial === true
									 ? object.material[ group.materialIndex ]
									 : object.material;

								if ( material === undefined ) continue;

								for ( var i = group.start, l = group.start + group.count; i < l; i += 3 ) {

									renderList.pushTriangle( i, i + 1, i + 2, material );

								}

							}

						} else {

							for ( var i = 0, l = positions.length / 3; i < l; i += 3 ) {

								renderList.pushTriangle( i, i + 1, i + 2, material );

							}

						}

					}


			} else if ( object instanceof THREE.Line ) {

				_modelViewProjectionMatrix.multiplyMatrices( _viewProjectionMatrix, _modelMatrix );


					var attributes = geometry.attributes;

					if ( attributes.position !== undefined ) {

						var positions = attributes.position.array;

						for ( var i = 0, l = positions.length; i < l; i += 3 ) {

							renderList.pushVertex( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] );

						}

						if ( attributes.color !== undefined ) {

							var colors = attributes.color.array;

							for ( var i = 0, l = colors.length; i < l; i += 3 ) {

								renderList.pushColor( colors[ i ], colors[ i + 1 ], colors[ i + 2 ] );

							}

						}

						if ( geometry.index !== null ) {

							var indices = geometry.index.array;

							for ( var i = 0, l = indices.length; i < l; i += 2 ) {

								renderList.pushLine( indices[ i ], indices[ i + 1 ] );

							}

						} else {

							var step = object instanceof THREE.LineSegments ? 2 : 1;

							for ( var i = 0, l = ( positions.length / 3 ) - 1; i < l; i += step ) {

								renderList.pushLine( i, i + 1 );

							}

						}

					}


			} else if ( object instanceof THREE.Points ) {

				_modelViewProjectionMatrix.multiplyMatrices( _viewProjectionMatrix, _modelMatrix );


					var attributes = geometry.attributes;

					if ( attributes.position !== undefined ) {

						var positions = attributes.position.array;

						for ( var i = 0, l = positions.length; i < l; i += 3 ) {

							_vector4.set( positions[ i ], positions[ i + 1 ], positions[ i + 2 ], 1 );
							_vector4.applyMatrix4( _modelViewProjectionMatrix );

							pushPoint( _vector4, object, camera );

						}


				}

			} else if ( object instanceof THREE.Sprite ) {

				object.modelViewMatrix.multiplyMatrices( camera.matrixWorldInverse, object.matrixWorld );
				_vector4.set( _modelMatrix.elements[ 12 ], _modelMatrix.elements[ 13 ], _modelMatrix.elements[ 14 ], 1 );
				_vector4.applyMatrix4( _viewProjectionMatrix );

				pushPoint( _vector4, object, camera );

			}

		}

		if ( sortElements === true ) {

			_renderData.elements.sort( painterSort );
			_renderData.elements = newellSort(_renderData.elements)
			console.log(_renderData.elements.length)

		}

		return _renderData;

	};

	function pushPoint( _vector4, object, camera ) {

		var invW = 1 / _vector4.w;

		_vector4.z *= invW;

		if ( _vector4.z >= - 1 && _vector4.z <= 1 ) {

			_sprite = getNextSpriteInPool();
			_sprite.id = object.id;
			_sprite.x = _vector4.x * invW;
			_sprite.y = _vector4.y * invW;
			_sprite.z = _vector4.z;
			_sprite.renderOrder = object.renderOrder;
			_sprite.object = object;

			_sprite.rotation = object.rotation;

			_sprite.scale.x = object.scale.x * Math.abs( _sprite.x - ( _vector4.x + camera.projectionMatrix.elements[ 0 ] ) / ( _vector4.w + camera.projectionMatrix.elements[ 12 ] ) );
			_sprite.scale.y = object.scale.y * Math.abs( _sprite.y - ( _vector4.y + camera.projectionMatrix.elements[ 5 ] ) / ( _vector4.w + camera.projectionMatrix.elements[ 13 ] ) );

			_sprite.material = object.material;

			_renderData.elements.push( _sprite );

		}

	}

	// Pools

	function getNextObjectInPool() {

		if ( _objectCount === _objectPoolLength ) {

			var object = new THREE.RenderableObject();
			_objectPool.push( object );
			_objectPoolLength ++;
			_objectCount ++;
			return object;

		}

		return _objectPool[ _objectCount ++ ];

	}

	function getNextVertexInPool() {

		if ( _vertexCount === _vertexPoolLength ) {

			var vertex = new THREE.RenderableVertex();
			_vertexPool.push( vertex );
			_vertexPoolLength ++;
			_vertexCount ++;
			return vertex;

		}

		return _vertexPool[ _vertexCount ++ ];

	}

	function getNextFaceInPool() {

		if ( _faceCount === _facePoolLength ) {

			var face = new THREE.RenderableFace();
			_facePool.push( face );
			_facePoolLength ++;
			_faceCount ++;
			return face;

		}

		return _facePool[ _faceCount ++ ];


	}

	function getNextLineInPool() {

		if ( _lineCount === _linePoolLength ) {

			var line = new THREE.RenderableLine();
			_linePool.push( line );
			_linePoolLength ++;
			_lineCount ++;
			return line;

		}

		return _linePool[ _lineCount ++ ];

	}

	function getNextSpriteInPool() {

		if ( _spriteCount === _spritePoolLength ) {

			var sprite = new THREE.RenderableSprite();
			_spritePool.push( sprite );
			_spritePoolLength ++;
			_spriteCount ++;
			return sprite;

		}

		return _spritePool[ _spriteCount ++ ];

	}

	//

	function painterSort( a, b ) {

		if ( a.renderOrder !== b.renderOrder ) {

			return a.renderOrder - b.renderOrder;

		} else if ( a.z !== b.z ) {

			return b.z - a.z;

		} else if ( a.id !== b.id ) {

			return a.id - b.id;

		} else {

			return 0;

		}

	}

	function newellSort(listy) {
/* Other notes
For toon shading, /Countour Edges/ are those that form the outline of an object.
"Faces which are back faces are identified because their face normals point away from the observer," (Sutherland et al., p. 8)
"Back edges and contour edges are determined by noticing whether the faces that share the edge are back facing," (Sutherland et al., p. 8)
Is it possible, then, that vertex normals pointing planar to the camera viewport (neither towards nor away) are the contour edges?

does positionScreen z or w contain the "parallel projection" distance from the camera?
x and y checks use positionScreen, but our expected z distance would be positionWorld vs positionWorld of camera - unless z/w of positionScreen satisfies our requirements.

extract index 0: a.shift()
extract index length-1: a.pop()
add to end: a.push(x)
add to front: a.unshift(x)
*/
		var listy = listy // copy so that we can push/pop/slice
		var outlist = []

		// Preprocessing
		for (let i = 0; i < listy.length; i++) {
			var z_coords = [
				listy[i].v1.positionWorld.clone().sub(the_camera.object3D.position).length(),
				listy[i].v2.positionWorld.clone().sub(the_camera.object3D.position).length(),
				listy[i].v3.positionWorld.clone().sub(the_camera.object3D.position).length()
			]
			let newz_coords = [listy[i].v1.positionScreen.w, listy[i].v2.positionScreen.w, listy[i].v3.positionScreen.w]
			let x_coords = [listy[i].v1.positionScreen.x, listy[i].v2.positionScreen.x, listy[i].v3.positionScreen.x]
			let y_coords = [listy[i].v1.positionScreen.y, listy[i].v2.positionScreen.y, listy[i].v3.positionScreen.y]
			listy[i].ren = {
				z: {
					max: Math.max(...z_coords),
					min: Math.min(...z_coords),
					newmax: Math.max(...newz_coords),
					newmin: Math.min(...newz_coords)
				}, y: {
					max: Math.max(...y_coords),
					min: Math.min(...y_coords)
				}, x: {
					max: Math.max(...x_coords),
					min: Math.min(...x_coords)
				}
			}
		}

		loop_without_pushing:
		while (listy.length > 1) {
			var p = listy[0]
			for (var face_index = 1; face_index < listy.length; face_index++) {
				var q = listy[face_index]

				// 0. furthest point away from camera in p !> closest point to camera in q and not marked
				// I'm not sure if this approach is the best'
				//if(p.ren.z.max <= q.ren.z.min) {
				/*if (!(p.ren.z.max < q.ren.z.min)) {
					if (q.marked) continue
					else break
				}*/

				// 1. test if x not overlap
				if (!((p.ren.x.min <= q.ren.x.max) && (q.ren.x.min <= p.ren.x.max))) {
					continue
				}

				// 2. test if y not overlap
				if (!((p.ren.y.min <= q.ren.y.max) && (q.ren.y.min <= p.ren.y.max))) {
					continue
				}

				// BREAK/TODO: Only do x/y contains check
				listy.shift()
				continue loop_without_pushing

				// 3 & 4
				if (!checkForObscurance(p, q)) {
					continue
				}

				// 5. test if "Faces do not overlap on the screen"?

				if (q.marked) {
					// split p or q and insert new pcs
					// TODO!!! Will loop endlessly as is

					// for now, remove both offending faces
					listy.splice(face_index, 1)
					listy.shift()
					continue loop_without_pushing
				}

				// 3 & 4 inverse
				if (checkForObscurance(q, p)) {
					// split p or q and insert new pcs
					// TODO!!! Will loop endlessly as is
					//debugger
					//outlist.push(p)
					//outlist.push(q)
					//return outlist

					// for now, remove both offending faces
					listy.splice(face_index, 1)
					listy.shift()
					continue loop_without_pushing
				}

				// mark q, swap p and q, then run again
				q.marked = true
				listy.unshift(listy.splice(face_index, 1)[0])
				continue loop_without_pushing

			}
			// ran out of faces to check, so it's the most back
			outlist.push(listy.shift())
			console.log('Added new face to outlist', outlist.length, listy.length)
		}
		outlist.push(listy) // add that final, topmost face

		return outlist // .reverse() if needed
	}

	function checkForObscurance(p, q) {
		// --
		// 3. test if p is behind q in the world
		// --

		let q_d = -(q.normalModel.x * q.v1.positionWorld.x + q.normalModel.y * q.v1.positionWorld.y + q.normalModel.z * q.v1.positionWorld.z)
		let q_plane = function(x, y, z) { return q.normalModel.x * x + q.normalModel.y * y + q.normalModel.z * z + q_d }

		let positive = undefined
		let tdpoints = [p.v1.positionWorld, p.v2.positionWorld, p.v3.positionWorld]
		for (let i = 1; i < 3; i++) {
			if (positive != (q_plane(tdpoints[i].x, tdpoints[i].y, tdpoints[i].z) > 0)) {
				// check to make sure it's a full intersection, not a "against each other" situation.
				if (q_plane(tdpoints[i][0], tdpoints[i].y, tdpoints[i].z) == 0) {
					// special case where we ignore it
					// met the plane but did not exceed it
					continue
				} else if (positive == undefined) {
					// other special case where we haven't defined it yet
					positive = (q_plane(tdpoints[i].x, tdpoints[i].y, tdpoints[i].z) > 0)
					continue
				}
				positive = undefined
				break
			}
		}
		// check to make sure camera is on opposite side of plane
		if ((positive != (q_plane(the_camera.object3D.position.x, the_camera.object3D.position.y, the_camera.object3D.position.z) > 0)) && (positive != undefined)) {
			return false
		}

		// --
		// 4. test if q is in front of p in the world
		// --

		let p_d = -(p.normalModel.x * p.v2.positionWorld.x + p.normalModel.y * p.v2.positionWorld.y + p.normalModel.z * p.v2.positionWorld.z)
		let p_plane = function(x, y, z) { return p.normalModel.x * x + p.normalModel.y * y + p.normalModel.z * z + p_d }

		positive = undefined
		tdpoints = [q.v1.positionWorld, q.v2.positionWorld, q.v3.positionWorld]
		for (let i = 1; i < 3; i++) {
			if (positive != (p_plane(tdpoints[i].x, tdpoints[i].y, tdpoints[i].z) > 0)) {
				// check to make sure it's a full intersection, not a "against each other" situation.
				if (p_plane(tdpoints[i][0], tdpoints[i].y, tdpoints[i].z) == 0) {
					// special case where we ignore it
					// met the plane but did not exceed it
					continue
				} else if (positive == undefined) {
					// other special case where we haven't defined it yet
					positive = (p_plane(tdpoints[i].x, tdpoints[i].y, tdpoints[i].z) > 0)
					continue
				}
				positive = undefined
				break
			}
		}
		// check to make sure camera is on opposite side of plane
		if ((positive == (p_plane(the_camera.object3D.position.x, the_camera.object3D.position.y, the_camera.object3D.position.z) > 0)) && (positive != undefined)) {
			return false
		}

		return true
	}

	function clipLine( s1, s2 ) {

		var alpha1 = 0, alpha2 = 1,

			// Calculate the boundary coordinate of each vertex for the near and far clip planes,
			// Z = -1 and Z = +1, respectively.

			bc1near = s1.z + s1.w,
			bc2near = s2.z + s2.w,
			bc1far = - s1.z + s1.w,
			bc2far = - s2.z + s2.w;

		if ( bc1near >= 0 && bc2near >= 0 && bc1far >= 0 && bc2far >= 0 ) {

			// Both vertices lie entirely within all clip planes.
			return true;

		} else if ( ( bc1near < 0 && bc2near < 0 ) || ( bc1far < 0 && bc2far < 0 ) ) {

			// Both vertices lie entirely outside one of the clip planes.
			return false;

		} else {

			// The line segment spans at least one clip plane.

			if ( bc1near < 0 ) {

				// v1 lies outside the near plane, v2 inside
				alpha1 = Math.max( alpha1, bc1near / ( bc1near - bc2near ) );

			} else if ( bc2near < 0 ) {

				// v2 lies outside the near plane, v1 inside
				alpha2 = Math.min( alpha2, bc1near / ( bc1near - bc2near ) );

			}

			if ( bc1far < 0 ) {

				// v1 lies outside the far plane, v2 inside
				alpha1 = Math.max( alpha1, bc1far / ( bc1far - bc2far ) );

			} else if ( bc2far < 0 ) {

				// v2 lies outside the far plane, v2 inside
				alpha2 = Math.min( alpha2, bc1far / ( bc1far - bc2far ) );

			}

			if ( alpha2 < alpha1 ) {

				// The line segment spans two boundaries, but is outside both of them.
				// (This can't happen when we're only clipping against just near/far but good
				//  to leave the check here for future usage if other clip planes are added.)
				return false;

			} else {

				// Update the s1 and s2 vertices to match the clipped line segment.
				s1.lerp( s2, alpha1 );
				s2.lerp( s1, 1 - alpha2 );

				return true;

			}

		}

	}

};
