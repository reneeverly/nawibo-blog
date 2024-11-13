// using object3D position was causing issues with my masonry component, so let's start over on position modifications.
// use INSTEAD of position
AFRAME.registerComponent('cad-position', {
	schema: {type: 'vec3', default: new THREE.Vector3(0, 0, 0)},
	init: function(){
		this.el.setAttribute('position', [
			this.data.x + this.el.components.geometry.data.width / 2,
			this.data.y + this.el.components.geometry.data.height / 2,
			this.data.z - this.el.components.geometry.data.depth / 2
		].join(' '))
	}
})

// https://stackoverflow.com/questions/38850411/how-to-create-a-wire-frame-3d-cube-in-a-frame
AFRAME.registerComponent("ngon-wireframe", {

    schema: {
        color: { type: 'color', default: 'black'}
    },

    init() {

        const baseGeometry = this.el.getObject3D('mesh').geometry
        if (!baseGeometry) {
            console.warn("ngon-wireframe: no base geometry found")
        };

        const edges = new THREE.EdgesGeometry( baseGeometry );
        const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: this.data.color } ) );
        this.el.object3D.add( line );

        this.el.getObject3D('mesh').visible = false;
    }
})
