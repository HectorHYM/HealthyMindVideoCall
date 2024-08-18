import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { ZegoSuperBoardManager } from "zego-superboard-web";
import { Element } from './types';
import './App.css';
import logo from './logo.png';

function randomID(len: number) {
  let result = '';
  if (result) return result;
  const chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP';
  const maxPos = chars.length;
  let i;

  len = len || 5;
  for (i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

export function getUrlParams(
  url = window.location.href
) {
  const urlStr = url.split('?')[1];
  return new URLSearchParams(urlStr);
}

export default function App() {
      const roomID = getUrlParams().get('roomID') || randomID(5);
      
      const myMeeting = async (element: Element) => {

        // Generate Kit Token
        const appID = 380999169;
        const serverSecret = "7957e27ced7566bc1ec719aebc08baf4";
        const kitToken =  ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, roomID,  randomID(5),  randomID(5));
        
        // Create instance object from Kit Token.
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zp.addPlugins({ZegoSuperBoardManager});


        // start the call
        zp.joinRoom({
          container: element,
          sharedLinks: [
            {
              name: 'Link de la sesión HealthyMind',
              url:
               window.location.protocol + '//' + 
               window.location.host + window.location.pathname +
                '?roomID=' +
                roomID,
            },
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall, // To implement 1-on-1 calls, modify the parameter here to [ZegoUIKitPrebuilt.OneONoneCall].
          },
          videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_720P,
        });

        //*Se inyecta el logo después de que la sala de espera se haya renderizado
        const addLogoToWaitingRoom = () => {
            const waitingRoom = document.querySelector('.pOvRwHj19chJGkgemUH3');
            if(waitingRoom){
              const logoContainer = document.createElement('div');
              logoContainer.className = 'logo-container';
              const logoElement = document.createElement('img');
              logoElement.src = logo;
              logoElement.alt = 'Logo HealthyMind';
              logoContainer.appendChild(logoElement)
              waitingRoom.appendChild(logoContainer);

              const handleResize = () => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                if(width <= 958 || height <= 528){
                  logoContainer.classList.add('logo-hidden');
                }else{
                  logoContainer.classList.remove('logo-hidden');
                }
              };

              window.addEventListener('resize', handleResize);
              handleResize()
              return () => {
                window.removeEventListener('resize', handleResize);
              };
            }
        };

        //* Se llama a la función despues de un breve retraso
        setTimeout(addLogoToWaitingRoom, 500);
    };

  return (
    <div
      className="myCallContainer"
      ref={myMeeting}
      style={{ width: '100vw', height: '100vh' }}
    ></div>
  );
}
