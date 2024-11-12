AFRAME.registerComponent('cubeofcubes', {
	schema: {
		cubecount: {default: 9, min: 1}
	},
	update: function() {
		// delete anything that was previously initialized
		let old_boxes = Array.from(this.el.children).filter(ele=>{return ele.className == 'cubeofcubes-generated-box'})
		for (let i = 0; i < old_boxes.length; i++) {
			this.el.removeChild(old_boxes[i])
		}
		// then go again!
		this.init()
	},
	init: function() {
		for (let i = 0; i < this.data.cubecount; i++) {
			let box = document.createElement('a-box')
			box.className = 'cubeofcubes-generated-box'
			// TODO: Complete the creation of the cubes and placing them as children into this.el
		}
	}
})

AFRAME.registerPrimitive('a-cubeofcubes', {
	defaultComponents: { cubeofcubes: {} },
	mappings: {
		cubecount: 'cubeofcubes.cubecount'
	}
})
