AFRAME.registerComponent('window', {
	schema: {
		style: {default: 'scpld_single'},
		pane_color: {default: 'skyblue'},
		frame_width: { default: 0.05}
	},
	init() {
		let width = this.el.components.geometry.data.width
		let height = this.el.components.geometry.data.height
		let depth = this.el.components.geometry.data.depth
		let bottom = [-width / 2, -height / 2, depth / 2]

		let color = this.el.components.material.data.color

		function newBoxGivenParams(cad_position, width, depth, height) {
			let newbox = document.createElement('a-box')
			newbox.className = 'window-generated-box'
			newbox.setAttribute('cad-position', cad_position)
			newbox.setAttribute('width', width)
			newbox.setAttribute('depth', depth)
			newbox.setAttribute('height', height)
			newbox.setAttribute('color', color)
			return newbox
		}

		// top and bottom of frame
		this.el.appendChild(newBoxGivenParams(bottom.join(' '), width, depth, this.data.frame_width))
		this.el.appendChild(newBoxGivenParams([bottom[0], bottom[1] + height - this.data.frame_width, bottom[2]].join(' '), width, depth, this.data.frame_width))
		
		// left and right of frame
		this.el.appendChild(newBoxGivenParams(bottom.join(' '), this.data.frame_width, depth, height))
		this.el.appendChild(newBoxGivenParams([bottom[0] + width - this.data.frame_width, bottom[1], bottom[2]].join(' '), this.data.frame_width, depth, height))

		if (this.data.style == 'scpld_single') {
			// ┌─────┐
			// ├─┬─┬─┤
			// │ │ │ │
			// ├─┴─┴─┤
			// └─────┘
			
			// horizontal crosses
			// Bottom 2/9ths up
			this.el.appendChild(newBoxGivenParams('cad-position', [bottom[0], bottom[1] + height * 2/9 - this.data.frame_width / 2, bottom[2]].join(' '), width, depth, this.data.frame_width))
			// Top 7/9ths up
			this.el.appendChild(newBoxGivenParams('cad-position', [bottom[0], bottom[1] + height * 7/9 - this.data.frame_width / 2, bottom[2]].join(' '), width, depth, this.data.frame_width))

			// vertical crosses
			// one third across
			this.el.appendChild(newBoxGivenParams('cad-position', [bottom[0] + width / 3 - this.data.frame_width / 2, bottom[1] + height * 2/9, bottom[2]].join(' '), this.data.frame_width, depth, height * 5/9))
			// two thirds across
			this.el.appendChild(newBoxGivenParams('cad-position', [bottom[0] + width * 2 / 3 - this.data.frame_width / 2, bottom[1] + height * 2/9, bottom[2]].join(' '), this.data.frame_width, depth, height * 5/9))

		} else if (this.data.style == 'scpld_triple') {
			// ┌───┬───┬───┐
			// ├─┬─┼─┬─┼─┬─┤
			// │ │ │ │ │ │ │
			// ├─┴─┼─┴─┼─┴─┤
			// └───┴───┴───┘

			// horizontal crosses
			// Bottom 2/9ths up
			this.el.appendChild(newBoxGivenParams('cad-position', [bottom[0], bottom[1] + height * 2/9 - this.data.frame_width / 2, bottom[2]].join(' '), width, depth, this.data.frame_width))
			// Top 7/9ths up
			this.el.appendChild(newBoxGivenParams('cad-position', [bottom[0], bottom[1] + height * 7/9 - this.data.frame_width / 2, bottom[2]].join(' '), width, depth, this.data.frame_width))

			// main verticals
			// one third over
			this.el.appendChild(newBoxGivenParams('cad-position', [bottom[0] + width / 3 - this.data.frame_width / 2, bottom[1], bottom[2]].join(' '), this.data.frame_width, depth, height))
			// two thirds over
			this.el.appendChild(newBoxGivenParams('cad-position', [bottom[0] + width * 2 / 3 - this.data.frame_width / 2, bottom[1], bottom[2]].join(' '), this.data.frame_width, depth, height))

			// sub verticals
			// one sixth over (halfway through first third)
			this.el.appendChild(newBoxGivenParams('cad-position', [bottom[0] + width * 1 / 6 - this.data.frame_width / 2, bottom[1] + height * 2/9, bottom[2]].join(' '), this.data.frame_width, depth, height * 5/9))
			// three sixths over (halfway through middle third)
			this.el.appendChild(newBoxGivenParams('cad-position', [bottom[0] + width * 3 / 6 - this.data.frame_width / 2, bottom[1] + height * 2/9, bottom[2]].join(' '), this.data.frame_width, depth, height * 5/9))
			// five sixths over (halfway through last third
			this.el.appendChild(newBoxGivenParams('cad-position', [bottom[0] + width * 5 / 6 - this.data.frame_width / 2, bottom[1] + height * 2/9, bottom[2]].join(' '), this.data.frame_width, depth, height * 5/9))
		}

		// pane
		let pane = document.createElement('a-box')
		pane.className = 'window-generated-box'
		pane.setAttribute('position', [0, 0, 0].join(' ')) // Note: Not CAD Position, but center-based position.
		pane.setAttribute('width', width - this.data.frame_width)
		pane.setAttribute('depth', 0.02)
		pane.setAttribute('height', height - this.data.frame_width)
		pane.setAttribute('color', this.data.pane_color)
		pane.setAttribute('opacity', 0.4)
		this.el.appendChild(pane)

		this.el.getObject3D('mesh').visible = false
	},
	update() {
		// delete anything that was previously initialized
		let old_boxes = Array.from(this.el.children).filter(ele=>{return ele.className == 'window-generated-box'})
		for (let i = 0; i < old_boxes.length; i++) {
    			this.el.removeChild(old_boxes[i])
		}
		// then go again!
		this.init()
	}
})
