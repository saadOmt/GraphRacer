const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// NOUVEAU : La mémoire du serveur. Il va lister tous les joueurs connectés.
let players = [];

io.on('connection', (socket) => {
    console.log('📱 Nouvelle connexion : ' + socket.id);

    // 1. Quand un joueur rejoint avec son pseudo et sa couleur
    socket.on('join_game', (data) => {
        const newPlayer = {
            id: socket.id, // L'ID unique généré par le réseau
            name: data.name,
            color: data.color
        };
        players.push(newPlayer);
        console.log(`👋 ${newPlayer.name} a rejoint la partie !`);
        
        // On envoie la liste des joueurs mise à jour à l'écran du PC
        io.emit('players_update', players);
    });

    // 2. Quand un téléphone envoie ses équations (le bouton GO)
    socket.on('submit_functions', (data) => {
        console.log(`🚀 Fonctions reçues d'un joueur`);
        // On transfère au PC en ajoutant l'ID du joueur pour qu'il le reconnaisse
        socket.broadcast.emit('receive_functions', {
            playerId: socket.id,
            segments: data.segments
        });
    });

    // 3. Le PC informe les téléphones du niveau choisi
    socket.on('host_update', (data) => {
        socket.broadcast.emit('host_update', data);
    });

    // 4. Quand un joueur quitte (ferme la page web sur son téléphone)
    socket.on('disconnect', () => {
        console.log('❌ Déconnexion : ' + socket.id);
        // On le retire de la liste
        players = players.filter(p => p.id !== socket.id);
        // On met à jour l'écran du PC pour qu'il disparaisse du lobby
        io.emit('players_update', players);
    });
});

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`✅ Serveur multijoueur (Party Game) prêt sur le port ${PORT}`);
});