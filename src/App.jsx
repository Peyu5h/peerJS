import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

const App = () => {
  const [myPeerId, setMyPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [call, setCall] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    const newPeer = new Peer(undefined, {
      host: "peer-js-pi.vercel.app",
      port: 3001,
      path: "/peerjs",
    });

    peerRef.current = newPeer;

    newPeer.on("open", (id) => {
      setMyPeerId(id);
    });

    newPeer.on("call", (call) => {
      setIncomingCall(call);
    });
    return () => {
      newPeer.destroy();
    };
  }, []);

  const callPeer = async (peerId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      localVideoRef.current.srcObject = stream;

      const call = peerRef.current.call(peerId, stream);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
      });
      setCall(call);
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
  };

  const handlePickUp = async () => {
    if (incomingCall) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        localVideoRef.current.srcObject = stream;

        incomingCall.answer(stream);
        incomingCall.on("stream", (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
        });
        setCall(incomingCall);
        setIncomingCall(null);
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    }
  };

  const handleDecline = () => {
    if (incomingCall) {
      incomingCall.close();
      setIncomingCall(null);
    }
  };

  const handleMuteMic = () => {
    if (localStream) {
      const enabled = localStream.getAudioTracks()[0].enabled;
      localStream.getAudioTracks()[0].enabled = !enabled;
      setMicMuted(!enabled);
    }
  };

  const handlePauseVideo = () => {
    if (localStream) {
      const enabled = localStream.getVideoTracks()[0].enabled;
      localStream.getVideoTracks()[0].enabled = !enabled;
      setVideoPaused(!enabled);
    }
  };

  const handleLeaveCall = () => {
    if (call) {
      call.close();
      setCall(null);
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
        localVideoRef.current.srcObject = null;
        remoteVideoRef.current.srcObject = null;
      }
    }
  };

  return (
    <div>
      <div>
        <h3>My Peer ID: {myPeerId}</h3>
        <input
          type="text"
          placeholder="Remote Peer ID"
          value={remotePeerId}
          onChange={(e) => setRemotePeerId(e.target.value)}
        />
        <button onClick={() => callPeer(remotePeerId)}>Call</button>
      </div>
      <div>
        <h3>Local Video</h3>
        <video ref={localVideoRef} autoPlay muted style={{ width: "300px" }} />
      </div>
      <div>
        <h3>Remote Video</h3>
        <video ref={remoteVideoRef} autoPlay style={{ width: "300px" }} />
      </div>

      <div className="controller">
        <button onClick={handleMuteMic}>{micMuted ? "Unmute" : "Mute"}</button>
        <button onClick={handlePauseVideo}>
          {videoPaused ? "Resume" : "Pause"}
        </button>
        <button onClick={handleLeaveCall}>Leave Call</button>
      </div>

      {incomingCall && (
        <div className="dialog">
          <h3>Incoming Call</h3>
          <button onClick={handlePickUp}>Pick Up</button>
          <button onClick={handleDecline}>Decline</button>
        </div>
      )}
    </div>
  );
};

export default App;
