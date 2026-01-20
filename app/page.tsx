"use client"
import React, { useState } from 'react';
import { Video } from 'lucide-react';

export default function InterviewApp() {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const handleJoin = () => {
    if (roomName.trim() && userName.trim()) {
      setIsConnected(true);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video size={32} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Simulateur d'Entretien
            </h1>
            <p className="text-gray-600 mt-2">Étape 1 : Configuration de base</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la salle
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="ex: entretien-dev"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre nom
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="ex: Marie Dupont"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!roomName.trim() || !userName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
            >
              Rejoindre
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Étape 1/5 :</strong> Interface de base ✓
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Prochaine étape : Accès à la caméra et au micro
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Bienvenue {userName} !
          </h2>
          <p className="text-gray-600">
            Salle : <span className="font-mono text-blue-600">{roomName}</span>
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center">
          <p className="text-gray-400">Zone vidéo - à venir à l'étape 2</p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsConnected(false)}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Quitter
          </button>
        </div>
      </div>
    </div>
  );
}