import { onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { ZegoSuperBoardManager } from "zego-superboard-web";
import { auth } from "./firebase-config";
import Login from "./login";
import logo from "./logo.png";
import "./App.css";

function randomID(len: number) {
  let result = "";
  const chars = "12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP";
  const maxPos = chars.length;

  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

function getUrlParams(url = window.location.href) {
  const urlStr = url.split("?")[1];
  return new URLSearchParams(urlStr);
}

function App() {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const inactivityTimeout = 15 * 60 * 1000; // 15 minutos de inactividad

  const myMeeting = async (element: HTMLElement) => {
    const roomID = getUrlParams().get("roomID") || randomID(5);

    // Generate Kit Token
    const appID = Number(import.meta.env.VITE_appID);
    const serverSecret = String(import.meta.env.VITE_serverSecret);
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      randomID(5),
      randomID(5)
    );

    // Create instance object from Kit Token.
    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zp.addPlugins({ ZegoSuperBoardManager });

    // Start the call
    zp.joinRoom({
      container: element,
      sharedLinks: [
        {
          name: "Link de la sesión HealthyMind",
          url:
            window.location.protocol +
            "//" +
            window.location.host +
            window.location.pathname +
            "?roomID=" +
            roomID,
        },
      ],
      scenario: {
        mode: ZegoUIKitPrebuilt.GroupCall,
      },
      videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_720P,
    });

    // Agregar logo a la sala de espera
    const addLogoToWaitingRoom = () => {
      const waitingRoom = document.querySelector(".pOvRwHj19chJGkgemUH3");
      if (waitingRoom) {
        const logoContainer = document.createElement("div");
        logoContainer.className = "logo-container";
        const logoElement = document.createElement("img");
        logoElement.src = logo;
        logoElement.alt = "Logo HealthyMind";
        logoContainer.appendChild(logoElement);
        waitingRoom.appendChild(logoContainer);

        const handleResize = () => {
          const width = window.innerWidth;
          const height = window.innerHeight;
          if (width <= 958 || height <= 528) {
            logoContainer.classList.add("logo-hidden");
          } else {
            logoContainer.classList.remove("logo-hidden");
          }
        };

        window.addEventListener("resize", handleResize);
        handleResize();
        return () => {
          window.removeEventListener("resize", handleResize);
        };
      }
    };

    setTimeout(addLogoToWaitingRoom, 500);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Cierre de sesión por inactividad.");
        auth.signOut();
      }, inactivityTimeout);
      setTimeoutId(timeoutId);
    };

    const activityEvents = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Evento para detectar si el usuario sale de la ventana o pestaña
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (auth.currentUser) {
        console.log("Cierre de sesión al salir de la ventana.");
        auth.signOut();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      className="myCallContainer"
      ref={(el) => {
        if (el) myMeeting(el);
      }}
      style={{ width: "100vw", height: "100vh" }}
    ></div>
  );
}

export default function AppWrapper() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        console.log("Sesión iniciada. Usuario:", currentUser);
      } else {
        console.log("No hay sesión iniciada.");
      }
    });
    return unsubscribe;
  }, []);

  if (loading) return <p>Cargando...</p>;
  if (!user) return <Login onLogin={() => setUser(auth.currentUser)} />;

  return <App />;
}