$(document).ready(() => {
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / (window.innerHeight * 0.8), 0.1, 1000 );

  var renderer = new THREE.WebGLRenderer();
  document.getElementById('rendering').appendChild(renderer.domElement);
  
  var geometry = new THREE.BoxGeometry( 1, 1, 1 );
  var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  var cube = new THREE.Mesh( geometry, material );
  // scene.add( cube );

  camera.position.z = 0;
  
  var light = new THREE.AmbientLight( 0x404040 ); // soft white light
  scene.add( light );
  
  var dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(100, 100, 50);
  scene.add(dirLight);
  
  // load model:
  var mtlLoader = new THREE.MTLLoader();
  // mtlLoader.setBaseUrl( '3d/' );
  mtlLoader.setPath( '3d/' );
  var url = "model.mtl";
  mtlLoader.load( url, function( materials ) {

      materials.preload();

      var objLoader = new THREE.OBJLoader();
      objLoader.setMaterials( materials );
      objLoader.setPath( '3d/' );
      let onProgress = () => {};
      let onError = () => {};
      objLoader.load( 'model.obj', function ( object ) {
        object.position.y = 0;
          scene.add( object );
          object.rotation.y = -Math.PI/2;
          object.position.z = -25;
      }, onProgress, onError );

  });
  
  let render = () => {
  	requestAnimationFrame(render);
    renderer.setSize( window.innerWidth, window.innerHeight * 0.8 );
  	renderer.render(scene, camera);
  }
  render();
});
