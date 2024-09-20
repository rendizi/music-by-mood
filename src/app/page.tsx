'use client'

import axios from "axios";
import { useState, useRef, useEffect } from "react";

const Home = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [canRecordAgain, setCanRecordAgain] = useState(false); 
  const [frameData, setFrameData] = useState<string | null>(null); 
  const [backendResponse, setBackendResponse] = useState<string | null>(null); 
  const [isDialogOpen, setIsDialogOpen] = useState(false); 
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera: ", error);
    }
  };

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startCamera();
      startRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setCanRecordAgain(false); 
    startStreamingFrames();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startStreamingFrames = () => {
    console.log("Started streaming frames");
    const frameInterval = 3; 
    intervalRef.current = setInterval(() => {
      captureFrame();
    }, frameInterval * 1000);
  };

  const captureFrame = () => {
    console.log("Capturing frame");
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = canvas.toDataURL("image/jpeg");
        setFrameData(frameData);
        sendFrameToBackend(frameData);
      } else {
        console.log("No canvas context");
      }
    }
  };

  const sendFrameToBackend = async (frameData: string) => {
    try {
      console.log("Sending frame data to backend");
      const response = await axios.post("/api/process-frame", { frameData });
      console.log("Result from backend:", response.data);

      stopRecording();
      setCanRecordAgain(true); 

      setBackendResponse(response.data.musicSuggestion);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error sending frame to backend: ", error);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
      <h1 className="text-3xl font-bold mb-6">Record Video and Suggest Music</h1>
      <div className="mb-6">
        <video ref={videoRef} autoPlay playsInline className="h-auto rounded-lg shadow-lg" />
      </div>
      <button 
        onClick={handleRecord} 
        disabled={canRecordAgain && isRecording}
        className={`px-4 py-2 rounded-lg text-white font-semibold ${isRecording ? 'bg-red-500' : 'bg-blue-500 hover:bg-blue-600'} disabled:bg-gray-400 disabled:cursor-not-allowed`}>
        {isRecording ? "Stop Recording" : canRecordAgain ? "Again" : "Start Recording & Stream Frames"}
      </button>
  
      {isDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-full overflow-y-auto animate-zoom-in">
            <h2 className="text-2xl font-semibold mb-4">Frame Sent to Backend</h2>
            {frameData && <img src={frameData} alt="Captured frame" className="w-full h-auto mb-4 rounded-lg" />}
            <h2 className="text-xl font-semibold mb-2">Backend Response</h2>
            <pre className="bg-gray-100 p-4 rounded-lg mb-4">{backendResponse}</pre>
            <button 
              onClick={() => setIsDialogOpen(false)} 
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
  
  
};

export default Home;
