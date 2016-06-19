(function () {
  'use strict'

  // shared variable

  var shakes = []

  // WebGL (three.js)

  var container
  var camera, scene, renderer
  var room
  var boxGeometry, sphereGeometry
  var image

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

    boxGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15)
    sphereGeometry = new THREE.SphereGeometry(0.15)


    var loader = new THREE.TextureLoader()
    loader.load(
	'images/logo.png',
	function ( texture ) {
            image = new THREE.MeshBasicMaterial({
		map: texture
            });
            image.map.needsUpdate = true
	}
    )

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
    if (shakes.length > 0) {
      var data = shakes.pop()
      var n = data.id - 1
      var h = 360 * data.id / 5

      var x = n <= 1 ? n : n - 2.5
      var y = n <= 1 ? 0.4 : -0.4
      var z = -(Math.random() + 0.5)

      var d = data.direction,
          type = data.type

      addCube(h, x, y, z, d, type)
    }

    var deads = []

    for (var i = 0; i < room.children.length; i++) {
      var cube = room.children[i]

      cube.userData.velocity.multiplyScalar(0.999)
      if (cube.userData.velocity.length() <= 0.001) {
        deads.push(cube)
        continue
      }

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

    for (var i = 0; i < deads.length; i++) {
      room.remove(deads[i])
    }

    renderer.render(scene, camera)
  }

  function addCube(h, x, y, z, direction, type) {
    if (room.children.length >= 200) {
      room.remove(room.children[0])
    }

    var cube
    if (type == 'halake') {
        cube = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), image);
      cube.overdraw = true;
    } else if (type == 'cube') {
      cube = new THREE.Mesh(sphereGeometry, new THREE.MeshLambertMaterial({
        color: hsv2rgb(h, 200 + Math.random() * 55, 200 + Math.random() * 55)}))
    } else {
      cube = new THREE.Mesh(boxGeometry, new THREE.MeshLambertMaterial({
        color: hsv2rgb(h, 200 + Math.random() * 55, 200 + Math.random() * 55)}))
    }

    cube.position.x = x
    cube.position.y = y
    cube.position.z = z

    cube.rotation.x = Math.random() * 2 * Math.PI
    cube.rotation.y = Math.random() * 2 * Math.PI
    cube.rotation.z = Math.random() * 2 * Math.PI

    cube.scale.x = Math.random() + 0.5
    cube.scale.y = Math.random() + 0.5
    cube.scale.z = Math.random() + 0.5

    cube.userData.velocity = new THREE.Vector3()

    direction = direction || {x: Math.random() * 0.02 - 0.01,
                              y: Math.random() * 0.02 - 0.01,
                              z: Math.random() * 0.02 - 0.01}

    cube.userData.velocity.x = direction.x
    cube.userData.velocity.y = direction.y
    cube.userData.velocity.z = direction.z

    room.add(cube)
  }

  function hsv2rgb(h, s, v) {
    var max = v
    var min = max - ((s / 255) * max)

    var r, g, b
    if (h < 60) {
      r = max
      g = (h / 60) * (max - min) + min
      b = min
    } else if (h < 120) {
      r = ((120 - h) / 60) * (max - min) + min
      g = max
      b = min
    } else if (h < 180) {
      r = min
      g = max
      b = ((h - 120) / 60) * (max - min) + min
    } else if (h < 240) {
      r = min
      g = ((240 - h) / 60) * (max - min) + min
      b = max
    } else if (h < 300) {
      r = ((h - 240) / 60) * (max - min) + min
      g = min
      b = max
    } else {
      r = max
      g = min
      b = ((360 - h) / 60) * (max - min) + min
    }

    return ~~r * 0x10000 + ~~g * 0x100 + ~~b
  }

  // WebSocket

  var ws = new WebSocket('ws://' + location.host + '/browser')

  ws.addEventListener('message', function (message) {
    var data = JSON.parse(message.data)

    switch (data.type) {
    case 'shake':
      var count = Math.random() * 5 + 3
      for (var i = 0; i < count; i++) {
        setTimeout(function () {
          shakes.push({
            id: data.payload.id,
            direction: data.payload.direction,
            type: data.payload.type
          })
        }, i * 100)
      }
      play(data.payload.soundUrl)
      break
    }
  })

  function play(url) {
    var audio = new Audio(url)
    audio.play()
  }
})()
