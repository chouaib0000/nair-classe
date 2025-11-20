import React, { useState, useRef } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

function VoiceRecorder({ onRecordingComplete, currentRecording }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(currentRecording || '');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          onRecordingComplete(reader.result);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      Swal.fire('Erreur', "Impossible d'accéder au microphone", 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    setAudioUrl('');
    setRecordingTime(0);
    onRecordingComplete('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-neutral-700 mb-2">
        Note Vocale
      </label>

      {!audioUrl && !isRecording && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full flex items-center justify-center space-x-3 p-6 border-2 border-dashed border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Mic className="h-6 w-6 text-primary-600" />
          </div>
          <span className="text-neutral-700 font-medium">Appuyer pour enregistrer</span>
        </button>
      )}

      {isRecording && (
        <div className="flex items-center justify-between p-6 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute h-12 w-12 rounded-full bg-red-500 animate-ping opacity-75"></div>
              <Mic className="relative h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-900">Enregistrement en cours...</p>
              <p className="text-xl font-bold text-red-600">{formatTime(recordingTime)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Arrêter</span>
          </button>
        </div>
      )}

      {audioUrl && !isRecording && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-green-900">Note vocale enregistrée</span>
            <button
              type="button"
              onClick={deleteRecording}
              className="text-red-600 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <audio controls className="w-full">
            <source src={audioUrl} type="audio/webm" />
          </audio>
        </div>
      )}
    </div>
  );
}

export default VoiceRecorder;
