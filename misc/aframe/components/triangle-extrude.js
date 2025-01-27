AFRAME.registerComponent("extrude", {
	schema: { type: 'number', default: 1},
	init() {
		let face_normal = new THREE.Vector3(...Array.from(this.el.components.geometry.geometry.attributes.normal.array.subarray(0,3)));
		face_normal.normalize();
		// rotate it around to face the direction we'll want to extrude
		face_normal.negate();
		// set to the depth of extrusion
		face_normal.multiplyScalar(this.data);

		let color = this.el.getAttribute('color')
		
		// is it safer to use
		// this.el.getAttribute('color') 
		// or
		// this.el.components.material.data.color
		// ?

		let top_tris = [
			new THREE.Vector3(...this.el.getAttribute('vertex-a').split(' ').map((a)=>a*1)),
			new THREE.Vector3(...this.el.getAttribute('vertex-b').split(' ').map((a)=>a*1)),
			new THREE.Vector3(...this.el.getAttribute('vertex-c').split(' ').map((a)=>a*1))
		]
		// apply the extrusion, then flip it around (leave b in place, swap a and c)
		let bottom_tris_reversed = top_tris.map(a=>a.clone().add(face_normal))
		let bottom_tris = bottom_tris_reversed.toReversed()
		
		let top_tris_reversed = top_tris.toReversed()

		let bottom_face = document.createElement('a-triangle')
		bottom_face.setAttribute('material', 'color', color)
		bottom_face.className = 'extrude-generated-tri'
		bottom_face.setAttribute('vertex-a', bottom_tris[0].toArray().join(' '))
		bottom_face.setAttribute('vertex-b', bottom_tris[1].toArray().join(' '))
		bottom_face.setAttribute('vertex-c', bottom_tris[2].toArray().join(' '))
		this.el.appendChild(bottom_face)

		console.log(top_tris)

		// add sides
		for (let i = 0; i < 3; i++) {
			let first_half = document.createElement('a-triangle')
			let second_half = document.createElement('a-triangle')

			first_half.setAttribute('material', 'color', color)
			second_half.setAttribute('material', 'color', color)
			first_half.className = 'extrude-generated-tri'
			second_half.className = 'extrude-generated-tri'

			first_half.setAttribute('vertex-a', top_tris[(i+1)%3].toArray().join(' '))
			first_half.setAttribute('vertex-b', top_tris[i].toArray().join(' '))
			first_half.setAttribute('vertex-c', bottom_tris_reversed[i].toArray().join(' '))

			second_half.setAttribute('vertex-a', bottom_tris[(i+1)%3].toArray().join(' '))
			second_half.setAttribute('vertex-b', bottom_tris[i].toArray().join(' '))
			second_half.setAttribute('vertex-c', top_tris_reversed[i].toArray().join(' '))

			this.el.appendChild(first_half)
			this.el.appendChild(second_half)
		}


	}
})
