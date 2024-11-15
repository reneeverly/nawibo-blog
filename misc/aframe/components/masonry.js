AFRAME.registerComponent("masonry", {
	dependencies: ['position'],
	schema: {
		type: {default: 'brick'},
		width: {default: 0.193675},
		height: {default: 0.05715},
		depth: {default: 0.092075},
		mortar: {default: 0.009525},
		mortar_color: {default: '#ececec'},
		initial_offset: {default: 0}, // TODO: initial offset skips a brick at the start?
		extra_mortar: {default: [0, 0, 0, 0]} // mortar distance units; left, right, back, front
	},
	init() {
		let width = this.el.components.geometry.data.width //this.el.getAttribute('width')
		let height = this.el.components.geometry.data.height //.getAttribute('height')
		let depth = this.el.components.geometry.data.depth //getAttribute('depth')
		let bottom = [-width / 2, -height / 2, 0]
		//if (typeof this.el.components['position-origin'] == 'undefined') { bottom = [-width / 2, -height / 2, 0] } else { bottom = [-width/2 - width * (this.el.components['position-origin'].data.x), -height * this.el.components['position-origin'].data.y, -depth * (this.el.components['position-origin'].data.z - 0.5)] }
		console.log(this.el.components)
		let offset = this.data.initial_offset
		for (let j = 0; j < height; j += this.data.height + this.data.mortar) {
  			let precalc_height = this.data.height
  			if ((j + precalc_height) > height) { precalc_height = height - j }

			// width walls
			for (let k = -depth / 2; k < depth / 2; k += depth - this.data.mortar) {
				for (let i = 0; i < width; i += this.data.width + this.data.mortar) {
  					let precalc_width = this.data.width
  					if (i == 0 && offset != 0) {
    					precalc_width = offset
  					}
  					if ((i + precalc_width) > width) { precalc_width = width - i }
  					let bricky = document.createElement('a-box')
  					bricky.className = 'masonry-generated-box'
  					bricky.setAttribute('width', precalc_width)
  					bricky.setAttribute('height', precalc_height)
  					bricky.setAttribute('depth', this.data.mortar)
  					// being devious and setting the depth to the mortar - so that fitting bricks on sides is easier!  Now it's just a brick facade of sorts.
  					bricky.setAttribute('position', [bottom[0] + i + precalc_width / 2, bottom[1] + j + precalc_height / 2, bottom[2] + k + this.data.mortar / 2].join(' '))

  					// color the bricks, but not the mortar
  					bricky.setAttribute('color', this.el.getAttribute('color'))
  					this.el.appendChild(bricky)
  					//console.log(bricky)
  					if (precalc_width == offset) { i -= offset }
				}
			}
			
			// depth walls
			for (let k = 0; k < width; k += width - this.data.mortar) {
				for (let i = 0; i < depth; i += this.data.width + this.data.mortar) {
  					let precalc_width = this.data.width
  					if (i == 0 && offset != 0) {
    					precalc_width = offset
  					}
  					if ((i + precalc_width) > depth) { precalc_width = depth - i }
  					let bricky = document.createElement('a-box')
  					bricky.className = 'masonry-generated-box'
  					bricky.setAttribute('width', this.data.mortar)
  					bricky.setAttribute('height', precalc_height)
  					bricky.setAttribute('depth', precalc_width)
  					// being devious and setting the depth to the mortar - so that fitting bricks on sides is easier!  Now it's just a brick facade of sorts.
  					bricky.setAttribute('position', [bottom[0] + k + this.data.mortar / 2, bottom[1] + j + precalc_height / 2, -depth/2 + i + precalc_width / 2].join(' '))

  					// color the bricks, but not the mortar
  					bricky.setAttribute('color', this.el.getAttribute('color'))
  					this.el.appendChild(bricky)
  					//console.log(bricky)
  					if (precalc_width == offset) { i -= offset }
				}
			}

			if (offset == 0) { offset = this.data.width / 2 } else { offset = 0 }
		}

		// mortar
		let mortarbox = document.createElement('a-box')
		mortarbox.className = 'masonry-generated-box'
		mortarbox.setAttribute('color', this.data.mortar_color)
		mortarbox.setAttribute('width', width - 2 * this.data.mortar + this.data.extra_mortar[0] * this.data.mortar + this.data.extra_mortar[1] * this.data.mortar)
		mortarbox.setAttribute('height', height - 2 * this.data.mortar)
		mortarbox.setAttribute('depth', depth - 2 * this.data.mortar + this.data.extra_mortar[2] * this.data.mortar + this.data.extra_mortar[3] * this.data.mortar)
		mortarbox.setAttribute('position', [bottom[0] + this.data.mortar + mortarbox.getAttribute('width') / 2 - this.data.extra_mortar[0] * this.data.mortar, bottom[1] + this.data.mortar + mortarbox.getAttribute('height') / 2, bottom[2] - this.data.extra_mortar[3] * this.data.mortar / 2 + this.data.extra_mortar[2] * this.data.mortar / 2].join(' '))
		this.el.appendChild(mortarbox)
		this.el.getObject3D('mesh').visible = false
	},
	update() {
		// delete anything that was previously initialized
		let old_boxes = Array.from(this.el.children).filter(ele=>{return ele.className == 'masonry-generated-box'})
		for (let i = 0; i < old_boxes.length; i++) {
			this.el.removeChild(old_boxes[i])
		}
		// then go again!
		this.init()
	}
})

