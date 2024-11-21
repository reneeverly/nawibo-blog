AFRAME.registerComponent("masonry", {
	dependencies: ['position'],
	schema: {
		type: {default: 'brick'},
		width: {default: 0.193675},
		height: {default: 0.05715},
		depth: {default: 0.092075},
		mortar: {default: 0.009525},
		mortar_color: {default: '#ececec'},
		tile_fraction_left: {default: 1}, // percentage of a brick and mortar
		tile_fraction_bottom: {default: 1}, // percentage of a brick and mortar
		extra_mortar: {default: [0, 0, 0, 0]} // mortar distance units; left, right, back, front
	},
	init() {
		// Set regional brick dimensions
		if (this.data.type == 'brick_in') {
			this.data.width = 0.19
			this.data.height = 0.053
			this.data.depth = 0.115
			this.data.mortar = 0.01
		} else if (this.data.type == 'brick_cn') {
			this.data.width = 0.24
			this.data.height = 0.053
			this.data.depth = 0.115
			this.data.mortar = 0.01
		} else if (this.data.type == 'brick_au') {
			this.data.width = 0.23
			this.data.height = 0.076
			this.data.depth = 0.11
			this.data.mortar = 0.01
		} else if (this.data.type == 'brick_metric_5') {
			this.data.width = 0.19
			this.data.height = 0.04
			this.data.depth = 0.115
			this.data.mortar = 0.01
		} else if (this.data.type == 'brick_metric_4') {
			this.data.width = 0.24
			this.data.height = 0.09
			this.data.depth = 0.115
			this.data.mortar = 0.01
		}

		let width = this.el.components.geometry.data.width //this.el.getAttribute('width')
		let height = this.el.components.geometry.data.height //.getAttribute('height')
		let depth = this.el.components.geometry.data.depth //getAttribute('depth')
		let bottom = [-width / 2, -height / 2, 0]
		//if (typeof this.el.components['position-origin'] == 'undefined') { bottom = [-width / 2, -height / 2, 0] } else { bottom = [-width/2 - width * (this.el.components['position-origin'].data.x), -height * this.el.components['position-origin'].data.y, -depth * (this.el.components['position-origin'].data.z - 0.5)] }
		console.log(this.el.components)
		let offset = 0
		for (let j = 0; j < height; j += this.data.height + this.data.mortar) {
  			let precalc_height = this.data.height
			let j_adjustment = 0
  			if ((j + precalc_height) > height) { precalc_height = height - j }

			// handle tile_fraction_bottom.
			if (j == 0) {
				precalc_height -= ((1-this.data.tile_fraction_bottom) * (this.data.height + this.data.mortar))
				j_adjustment -= (this.data.height + this.data.mortar) - this.data.tile_fraction_bottom * (this.data.height + this.data.mortar) // when tile_fraction_bottom = 1, should zero out so no i adjustment.
				if (precalc_height <= 0) {j += j_adjustment; continue} // avoid issues where backwards bricks are drawn.
			}

			// width walls
			for (let k = -depth / 2; k < depth / 2; k += depth - this.data.mortar) {
				for (let i = 0; i < width; i += this.data.width + this.data.mortar) {
  					let precalc_width = this.data.width
					let i_adjustment = 0
  					if (i == 0 && offset != 0) {
    						precalc_width = offset
						i_adjustment -= offset
  					}
  					if ((i + precalc_width) > width) { precalc_width = width - i }
					
					// handle tile_fraction_left.
					if (i == 0) {
						precalc_width -= ((1-this.data.tile_fraction_left) * (this.data.width + this.data.mortar))
						i_adjustment -= (this.data.width + this.data.mortar) - this.data.tile_fraction_left * (this.data.width + this.data.mortar) // when tile_fraction_left = 1, should zero out so no i adjustment.
						if (precalc_width <= 0) {i += i_adjustment; continue} // avoid issues where backwards bricks are drawn.
					}
					
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
					i += i_adjustment
				}
			}
			
			// depth walls
			for (let k = 0; k < width; k += width - this.data.mortar) {
				// if using extra_mortar, skip this step
				if (k == 0 && this.data.extra_mortar[0] >= 1) { continue }
				else if (k != 0 && this.data.extra_mortar[1] >= 1) { continue }
				
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

			j += j_adjustment

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

