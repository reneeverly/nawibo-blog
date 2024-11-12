/* 0.5 means center/middle */
/* 0 means bottom for y, left for x, ? for z */
AFRAME.registerComponent('position-origin', {
  dependencies: ['position'],

  schema: {type: 'vec3', default: new THREE.Vector3(0.5, 0.5, 0.5)},

  init: function(){
    var oldPosition = new THREE.Vector3()
    oldPosition.copy(this.el.object3D.position);
    let offset = [
      this.el.getAttribute('width') * (this.data.x - 0.5),
      this.el.getAttribute('height') * (this.data.y - 0.5),
      this.el.getAttribute('depth') * (this.data.z - 0.5)
    ]
    this.el.object3D.position.x = oldPosition.x - offset[0]
    this.el.object3D.position.y = oldPosition.y - offset[1]
    this.el.object3D.position.z = oldPosition.z - offset[2]

    // experimental pivot
    this.el.setAttribute('pivot', offset.join(' '))
  }
})
