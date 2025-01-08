AFRAME.registerComponent('simple-character-reference', {
	schema: {
		count: {default: 4},
		ring_width: {default: 0.02},
		//style: {default: 'circles'},
		head_height: {default: 0.2}
	},
	init: function() {
		for (let i = 0; i < this.data.count; i++) {
			let circle = document.createElement('a-ring')
			circle.setAttribute('radius-outer', this.data.head_height / 2)
			circle.setAttribute('radius-inner', this.data.head_height / 2 - this.data.ring_width)
			circle.setAttribute('color', 'lime')//this.el.components.material.data.color)
			circle.setAttribute('position', [0, this.data.head_height / 2 + this.data.head_height * i, 0].join(' '))
			this.el.appendChild(circle)
		}
		this.el.setAttribute('look-at-y', 'target: the_camera;')
	},
	update: function() {
		// delete anything that was previously initialized
		let old_boxes = Array.from(this.el.children).filter(ele=>{return ele.className == 'scharref-generated-box'})
		for (let i = 0; i < old_boxes.length; i++) {
			this.el.removeChild(old_boxes[i])
		}
		// then go again!
		this.init()
	}
})

// https://stackoverflow.com/questions/59954885/aframe-billboarding-only-y-axis
AFRAME.registerComponent('look-at-y', {
	schema: {
		target: {type: 'string', default: 'camera'}
	},
	init: function () { },
	update: function () { },
	tick: function () {
		const targetEl = document.getElementById(this.data.target).object3D;
		const el = this.el.object3D;
		const vec = new THREE.Vector3();
		targetEl.getWorldDirection(vec);
		vec.y = 0;
		vec.add(el.position)
		el.lookAt(vec);
	}
});
