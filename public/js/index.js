(function () {
  'use strict'

  // shared variable

  var shakeCount = 0

  // WebGL (three.js)

  var container
  var camera, scene, renderer
  var room

  init()
  animate()

  function init() {
    container = document.createElement('div')
    document.body.appendChild(container)

    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10)
    scene.add(camera)

    room = new THREE.Mesh(
      new THREE.BoxGeometry(6, 6, 6, 10, 10, 10),
      new THREE.MeshBasicMaterial({color: 0x202020, wireframe: true}))
    scene.add(room)

    scene.add(new THREE.HemisphereLight(0x404020, 0x202040, 0.5))
    
    var light = new THREE.DirectionalLight(0xffffff)
    light.position.set(1, 1, 1).normalize()
    scene.add(light)

    var geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15)

    for (var i = 0; i < 200; i++) {
      var cube = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: Math.random() * 0xffffff}))

      cube.position.x = Math.random() * 4 - 2
      cube.position.y = Math.random() * 4 - 2
      cube.position.z = Math.random() * 4 - 2

      cube.rotation.x = Math.random() * 2 * Math.PI
      cube.rotation.y = Math.random() * 2 * Math.PI
      cube.rotation.z = Math.random() * 2 * Math.PI

      cube.scale.x = Math.random() + 0.5
      cube.scale.y = Math.random() + 0.5
      cube.scale.z = Math.random() + 0.5

      cube.userData.velocity = new THREE.Vector3()
      cube.userData.velocity.x = Math.random() * 0.01 - 0.005
      cube.userData.velocity.y = Math.random() * 0.01 - 0.005
      cube.userData.velocity.z = Math.random() * 0.01 - 0.005

      room.add(cube)
    }

    renderer = new THREE.WebGLRenderer({antialias: true})
    renderer.setClearColor(0x101010)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.sortObjects = false

    container.appendChild(renderer.domElement)

    window.addEventListener('resize', onWindowResize, false)
  }

  function animate() {
    requestAnimationFrame(animate)
    render()
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }

  function render() {
    if (shakeCount > 0) {
      var x = Math.random() - 0.5
      var y = Math.random() - 0.5
      var z = -(Math.random() + 0.5)

      while (shakeCount > 0) {
        var cube = room.children[0]
        room.remove(cube)

        cube.position.x = x
        cube.position.y = y
        cube.position.z = z

        cube.rotation.x = Math.random() * 2 * Math.PI
        cube.rotation.y = Math.random() * 2 * Math.PI
        cube.rotation.z = Math.random() * 2 * Math.PI

        cube.scale.x = Math.random() + 0.5
        cube.scale.y = Math.random() + 0.5
        cube.scale.z = Math.random() + 0.5

        cube.userData.velocity.x = Math.random() * 0.02 - 0.01
        cube.userData.velocity.y = Math.random() * 0.02 - 0.01
        cube.userData.velocity.z = Math.random() * 0.02 - 0.01

        room.add(cube)

        shakeCount -= 1
      }
    }

    for (var i = 0; i < room.children.length; i++) {
      var cube = room.children[i]

      cube.userData.velocity.multiplyScalar(0.999)
      cube.position.add(cube.userData.velocity)

      if (cube.position.x < -3 || 3 < cube.position.x) {
        cube.position.x = THREE.Math.clamp(cube.position.x, -3, 3)
        cube.userData.velocity.x *= -1
      }

      if (cube.position.y < -3 || 3 < cube.position.y) {
        cube.position.y = THREE.Math.clamp(cube.position.y, -3, 3)
        cube.userData.velocity.y *= -1
      }

      if (cube.position.z < -3 || 3 < cube.position.z) {
        cube.position.z = THREE.Math.clamp(cube.position.z, -3, 3)
        cube.userData.velocity.z *= -1
      }

      cube.rotation.x += cube.userData.velocity.x * 2
      cube.rotation.y += cube.userData.velocity.y * 2
      cube.rotation.z += cube.userData.velocity.z * 2
    }

    renderer.render(scene, camera)
  }

  // WebSocket

  var ws = new WebSocket('ws://' + location.host + '/browser')

  ws.addEventListener('message', function (message) {
    var data = JSON.parse(message.data)

    switch (data.type) {
    case 'shake':
      shakeCount += Math.random() * 5 + 3
      break
    }
  })
})()
