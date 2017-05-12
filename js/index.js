$(document).ready(() => {
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / (window.innerHeight * 0.8), 0.1, 1000 );

  let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor( 0x000000, 1);
  document.getElementById('rendering').appendChild(renderer.domElement);
  
  var geometry = new THREE.BoxGeometry( 1, 1, 1 );
  var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  var cube = new THREE.Mesh( geometry, material );
  // scene.add( cube );

  camera.position.z = 0;
  
  var light = new THREE.AmbientLight( 0x909090 ); // soft white light
  scene.add( light );
  
  var dirLight = new THREE.PointLight(0xffffff, 1);
  dirLight.position.set(100, 50, -20);
  scene.add(dirLight);
  
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
          let group = new THREE.Group();
          meshes.forEach((mesh) => {
            group.add(mesh);
            
          })
          scene.add(group);
          
          group.position.y = 0;
          group.rotation.y = -Math.PI/2;
          group.position.z = -25;
          group.rotation.x = Math.PI * 0.1
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
    renderer.setSize( window.innerWidth, window.innerHeight * 0.8 );
  	renderer.render(scene, camera);
  }
  render();
});
