module.exports = {
    aliases: 'copypaste',
    category: 'Juegos/Películas',
    description: 'Responde con el copypaste para reportar jugadores en Valorant.',

    maxArgs: 0,
    slash: 'both',

    callback: () => {
        return {
            content: 'Incitación al odio, racismo, xenofobia, amenazas de suicidio, amenazas de muerte, amenazas de bombas, terrorismo, cyberbullying, bullying, daño psicológico, doxing, acoso sexual, verbal, físico y agravado',
            custom: true,
            ephemeral: true
        };
    }
}