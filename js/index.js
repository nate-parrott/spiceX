$(document).ready(() => {
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / (window.innerHeight * 0.8), 0.1, 1000 );

  let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor( 0x000000, 0);
  // renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
  document.getElementById('rendering').appendChild(renderer.domElement);
  
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // renderer.shadowCameraNear = 3;
  // renderer.shadowCameraFar = camera.far;
  // renderer.shadowCameraFov = 50;
  // renderer.shadowMapBias = 0.0039;
  // renderer.shadowMapDarkness = 0.1;
  // renderer.shadowMapWidth = 1024;
  // renderer.shadowMapHeight = 1024;
  
  var geometry = new THREE.BoxGeometry( 10000, 10000, 0.0001 );
  var material = new THREE.MeshPhongMaterial({color: 0xffffff });
  // material.ambient.setHex(0x505050);
  var bg = new THREE.Mesh( geometry, material );
  scene.add( bg );
  bg.position.y = -13;
  bg.rotation.x = Math.PI * -0.4;
  bg.receiveShadow = true;

  camera.position.z = 0;
  
  var light = new THREE.AmbientLight( 0x404040 ); // soft white light
  scene.add( light );
  
  var dirLight = new THREE.PointLight(0xF71C86, 1);
  dirLight.position.set(10, 10, 0);
  scene.add(dirLight);
  dirLight.castShadow = true;
  
  dirLight = new THREE.PointLight(0xFBDA61, 1);
  dirLight.position.set(-10, 10, 0);
  scene.add(dirLight);
  dirLight.castShadow = true;
  
  let group = null;
  let updateRotation = (dx, dy) => {
    if (group) {
      group.position.y = 0;
      group.rotation.y = -Math.PI/2 + Math.PI * 0.1 * (dx-0.5);
      group.position.z = -25;
      group.rotation.x = Math.PI * 0.1 + Math.PI * 0.1 * (dy-0.5);
    }
  }
    
  let name = 'model13';
  JSM.ConvertURLListToJsonData(['3d/' + name + '.obj', '3d/' + name + '.mtl'], {
    onError: (e) => console.log(e),
    onReady: (fileNames, jsonData) => {
      console.log('got json data')
      let textureLoadedCallback = () => {};
      let asyncCallback = () => {};
      let meshes = JSM.ConvertJSONDataToThreeMeshes(jsonData, () => {}, {
        onStart: () => {},
        onProgress: () => {},
        onFinish: () => {
          group = new THREE.Group();
          meshes.forEach((mesh) => {
            group.add(mesh);
            mesh.castShadow = true;
          })
          scene.add(group);
          
          updateRotation(0.5, 0.5);
        }
      });
    }
  })
  
  // // load model:
  // var mtlLoader = new THREE.MTLLoader();
  // // mtlLoader.setBaseUrl( '3d/' );
  // mtlLoader.setPath( '3d/' );
  // var url = "model8.mtl";
  // mtlLoader.load( url, function( materials ) {
  //
  //     materials.preload();
  //
  //     var objLoader = new THREE.OBJLoader();
  //     objLoader.setMaterials( materials );
  //     objLoader.setPath( '3d/' );
  //     let onProgress = () => {};
  //     let onError = () => {};
  //     objLoader.load( 'model8.obj', function ( object ) {
  //       object.position.y = 0;
  //       object.rotation.y = -Math.PI/2;
  //       object.position.z = -25;
  //
  //       object.traverse( function( node ) {
  //           if ( node instanceof THREE.Mesh ) {
  //             // let geometry = new THREE.Geometry().fromBufferGeometry( node.geometry );
  //             // node.geometry = geometry;
  //             //   node.geometry.mergeVertices();
  //             //   node.geometry.computeVertexNormals(true);
  //           }
  //       });
  //
  //       scene.add( object );
  //
  //     }, onProgress, onError );
  //
  // });
  
  let render = () => {
  	requestAnimationFrame(render);
  	renderer.render(scene, camera);
  }
  render();
  
  $(document.body).mousemove((e) => {
    updateRotation(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
  });
  
  $(window).resize(() => {
    let width = window.innerWidth;
    let height = window.innerHeight * 0.8;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize( width, height );
  }).resize();
});
