class ARButton {

	static createButton( renderer, sessionInit = {} ) {

		const button = document.createElement( 'button' );

		function showStartAR( /*device*/ ) {

			if ( sessionInit.domOverlay === undefined ) {

				const overlay = document.createElement( 'div' );
				overlay.style.display = 'none';
				document.body.appendChild( overlay );

				const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
				svg.setAttribute( 'width', 38 );
				svg.setAttribute( 'height', 38 );
				svg.style.position = 'absolute';
				svg.style.right = '20px';
				svg.style.top = '20px';
				svg.addEventListener( 'click', function () {

					currentSession.end();

				} );
				overlay.appendChild( svg );

				const path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
				path.setAttribute( 'd', 'M 12,12 L 28,28 M 28,12 12,28' );
				path.setAttribute( 'stroke', '#fff' );
				path.setAttribute( 'stroke-width', 2 );
				svg.appendChild( path );

				if ( sessionInit.optionalFeatures === undefined ) {

					sessionInit.optionalFeatures = [];

				}

				sessionInit.optionalFeatures.push( 'dom-overlay' );
				sessionInit.domOverlay = { root: overlay };

			}

			//

			let currentSession = null;

			async function onSessionStarted( session ) {

				session.addEventListener( 'end', onSessionEnded );

				renderer.xr.setReferenceSpaceType( 'local' );

				await renderer.xr.setSession( session );

				button.textContent = 'STOP AR';
				sessionInit.domOverlay.root.style.display = '';

				currentSession = session;

			}

			function onSessionEnded( /*event*/ ) {

				currentSession.removeEventListener( 'end', onSessionEnded );

				stylizeElement( button );
				let debugInfo = !app.DEBUG ? `<br><br><br>
				<font style="font-size: 13px">
				Generated:<br/>
				Lights: ${app.planes}<br>
				Composition: ${app.composition}<br>
				Palette: ${app.paletteNum}<br>
				Noise: ${app.noise}<br>
				Surround: ${app.surround}<br>
				Glow: ${ app.glow ? 'high' : 'low'}
				</font>` : ``;

				button.innerHTML = '<b></b>' + instruction + debugInfo;
				sessionInit.domOverlay.root.style.display = 'none';

				currentSession = null;
			}

			//

			button.style.display = '';
			button.style.cursor = 'pointer';

			// button.textContent = 
			const instruction = 
				`<font style="font-size: 20px"><i>Totem</i></font>
				<font style="font-size: 13px"><br />augmented reality experience<br />
				by Paweł Dudko
				<br /><br /><br />
				Tap here
				</font>`;
			button.innerHTML = instruction;

			button.onmouseenter = function () {

				button.style.background = '#00000095';

			};

			button.onmouseleave = function () {

				button.style.background = '#00000075';
			};

			button.onclick = function () {

				if ( currentSession === null ) {

					navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );

				} else {

					currentSession.end();

				}

			};

		}

		function disableButton() {

			button.style.display = '';

			stylizeElement( button );

			button.onmouseenter = null;
			button.onmouseleave = null;

			button.onclick = null;

		}

		function showARNotSupported() {

			disableButton();
			
			let message = 'AR NOT SUPPORTED';
			if ( navigator.userAgent.toLowerCase().indexOf('chrome') > -1 ) {
				message += '<br /><br /><b>OPEN WEBSITE IN CHROME BROWSER</b>'
			}
			// button.textContent = message;
			button.innerHTML = message;
		

		}

		function showARNotAllowed( exception ) {

			disableButton();

			console.warn( 'Exception when trying to call xr.isSessionSupported', exception );

			button.textContent = 'AR NOT ALLOWED';

		}

		function stylizeElement( element ) {

			element.style.position = 'absolute';
			element.style.top = `${window.innerWidth * 0.07}px`;
			element.style.bottom = `${window.innerWidth * 0.07}px`;
			element.style.left = '7%';
			element.style.right = '7%';
			element.style.padding = '0 15%';
			element.style.border = 'none'; //'1px solid #2c3342';
			element.style.borderRadius = '5vw';
			element.style.background = '#00000075';
			element.style.color = '#fff';
			element.style.font = 'normal 16px sans-serif';
			element.style.lineHeight = 1.25;
			element.style.fontWeight = 'lighter';
			element.style.textAlign = 'center';
			element.style.opacity = '1.0';
			element.style.outline = 'none';
			// element.style.zIndex = '999';
		}

		if ( 'xr' in navigator ) {

			button.id = 'ARButton';
			button.style.display = 'none';

			stylizeElement( button );

			navigator.xr.isSessionSupported( 'immersive-ar' ).then( function ( supported ) {

				supported ? showStartAR() : showARNotSupported();

			} ).catch( showARNotAllowed );

			return button;

		} else {
			
			const message = document.createElement( 'a' );

			if ( window.isSecureContext === false ) {

				message.href = document.location.href.replace( /^http:/, 'https:' );
				message.innerHTML = "WebXR neeeds secure connection.<p><b> Tap to reload with secure connection.</b></p>"; // TODO Improve message

			} else {

				message.href = 'https://apps.apple.com/us/app/webxr-viewer/id1295998056';
				message.innerHTML = 'WebXR not available.';
				if (navigator.userAgent.indexOf("like Mac") != -1) 
					message.innerHTML += '<br /><br />Apple devices needs WebXR browser to experience Augmented Reality.<br /><br /><b>Click here to download WebXR viewer</b>';
				else if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1 )
					message.innerHTML += '<br /><br /><b>OPEN WEBSITE IN CHROME BROWSER</b>';

			}

			stylizeElement( message );
			message.style.paddingTop = '50%';
			message.style.font = 'normal 16px sans-serif';


			return message;

		}

	}

}

export { ARButton };
