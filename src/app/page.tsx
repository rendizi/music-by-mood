'use client';

import axios from 'axios';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { FaGit, FaGithub, FaTelegramPlane } from 'react-icons/fa';

const Home = () => {
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [canRecordAgain, setCanRecordAgain] = useState(false);
  const [frameData, setFrameData] = useState<string | null>(null);
  const [backendResponse, setBackendResponse] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("")
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // Track the audio instance

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
      console.error('Error accessing camera: ', error);
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
    console.log('Started streaming frames');
    const frameInterval = 5;
    intervalRef.current = setInterval(() => {
      captureFrame();
    }, frameInterval * 1000);
  };

  const captureFrame = () => {
    console.log('Capturing frame');
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = canvas.toDataURL('image/jpeg');
        setFrameData(frameData);
        sendFrameToBackend(frameData);
      } else {
        console.log('No canvas context');
      }
    }
  };

  const sendFrameToBackend = async (frameData: string) => {
    try {
      console.log('Sending frame data to backend');
      const response = await axios.post('/api/process-frame', { frameData });
      console.log('Result from backend:', response.data);

      stopRecording();
      setCanRecordAgain(true);
      setBackendResponse(response.data.musicSuggestion);
      setIsDialogOpen(true);

      // Search Spotify and play the first track
      if (response.data.musicSuggestion) {
        await searchAndPlayMusicPreview(response.data.musicSuggestion);
      }
    } catch (error) {
      console.error('Error sending frame to backend: ', error);
    }
  };

  const searchAndPlayMusicPreview = async (query: string) => {
    try {
      const token = (session as any).accessToken; // Replace with your method to get the access token
      const response = await axios.get(`https://api.spotify.com/v1/search`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          q: query,
          type: 'track',
          limit: 1,
        },
      });

      const tracks = response.data.tracks.items;
      if (tracks.length > 0) {
        console.log(tracks[0])
        setName(tracks[0].name)
        const trackPreviewUrl = tracks[0].preview_url;

        if (trackPreviewUrl) {
          if (audioRef.current) {
            audioRef.current.pause(); // Stop any currently playing audio
          }
          audioRef.current = new Audio(trackPreviewUrl); // Create a new audio object
          audioRef.current.play(); // Play the preview
          console.log('Playing preview: ', trackPreviewUrl);
        } else {
          console.log('Preview not available for this track');
        }
      } else {
        console.log('No tracks found');
      }
    } catch (error) {
      console.error('Error searching for music on Spotify: ', error);
    }
  };

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause(); // Stop the audio
      audioRef.current.currentTime = 0; // Reset the audio to the beginning
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

  if (!session) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Login with Spotify</h1>
        <button
          onClick={() => signIn('spotify')}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
        >
          Login with Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-300 to-white text-gray-800 p-4 relative">
<div className="px-4">
<h1 className="text-6xl font-extrabold mb-4 text-center text-gray-900 drop-shadow-lg">
    Music of the Day 🎶
  </h1>
  <p className="text-lg italic text-center text-gray-700">
    Brought to you by the Gibrat Party 🐧
  </p>
</div>
  
      <div className="mb-8 mt-5">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="rounded-xl shadow-xl border-4 border-white w-full max-w-2xl h-auto transform hover:scale-105 transition duration-300"
        />
      </div>
  
      <button 
        onClick={handleRecord} 
        disabled={canRecordAgain && isRecording}
        className={`px-8 py-4 rounded-full text-white font-bold tracking-wide transition-transform duration-300 transform ${isRecording ? 'bg-red-500 hover:scale-105' : 'bg-blue-500 hover:bg-blue-600 hover:scale-110'} disabled:bg-gray-400 disabled:cursor-not-allowed`}>
        {isRecording ? "🛑 Stop Recording" : canRecordAgain ? "🔄 Record Again" : "🎤 Start Recording"}
      </button>
  
      {isDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-lg w-full max-h-full overflow-y-auto animate-fade-in">
            <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">Today's Music 🎶</h2>
            {frameData && (
              <img 
                src={frameData} 
                alt="Captured frame" 
                className="w-full h-auto mb-6 rounded-lg shadow-md transition-transform duration-200 hover:scale-105"
              />
            )}
            <h2 className="text-2xl font-semibold mb-4">Is...</h2>
            <pre className="bg-gray-100 p-4 rounded-lg mb-6 shadow-inner text-gray-700 text-lg">{name}</pre>
  
            <button
              onClick={() => {
                stopAllAudio();
                setIsDialogOpen(false);
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 font-semibold tracking-wide transition-transform duration-300 transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      )}

<footer className="bg-blue-200 text-gray-800 p-4 text-center shadow-md absolute bottom-0 w-full">
  <div className="flex justify-center space-x-8">
    <a
      href="https://github.com/rendizi/music-by-mood"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center hover:text-blue-600 transition duration-300"
    >
      <FaGithub className="mr-2 text-2xl" />
      <span className="text-lg font-bold">GitHub</span>
    </a>
    <a
      href="https://t.me/rendizi"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center hover:text-blue-600 transition duration-300"
    >
      <FaTelegramPlane className="mr-2 text-2xl" />
      <span className="text-lg font-bold">Telegram</span>
    </a>
    {/* Add more links as needed */}
  </div>
  <p className="mt-2 text-sm">Join the fun with our penguin party! 🐧</p>
</footer>


    </div>
  );
  
  
  
};

export default Home;
