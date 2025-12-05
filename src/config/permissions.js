module.exports = {
    // 👑 Propriétaire (Bypass total)
    OWNER_ID: process.env.OWNER_ID || '1431362559079874630',

    // 🛡️ Niveaux de permission (11 = Le plus bas, 1 = Le plus haut)
    // Les IDs sont ceux trouvés dans l'ancien perms.js
    LEVELS: {
        1: {
            name: 'Crown',
            level: 1,
            roles: ['1434622771299745914'],
            limits: { ban: Infinity, kick: Infinity, mute: Infinity } // Pas de limite
        },
        2: {
            name: 'Star',
            level: 2,
            roles: ['1434622766765707478'],
            limits: { ban: 20, kick: 20, mute: 50 } // Max 20 bans/heure
        },
        3: {
            name: 'Diamond',
            level: 3,
            roles: ['1434622759354368171', '1434622757953601556'],
            limits: { ban: 10, kick: 15, mute: 30 }
        },
        4: {
            name: 'Blue',
            level: 4,
            roles: ['1434622753054392430', '1434622752014340337'],
            limits: { ban: 5, kick: 10, mute: 20 }
        },
        5: {
            name: 'Orange',
            level: 5,
            roles: ['1434622747799191593', '1434622747006341362'],
            limits: { ban: 2, kick: 5, mute: 15 }
        },
        6: {
            name: 'Cyan',
            level: 6,
            roles: ['1434622723346272489', '1434622721148322084'],
            limits: { ban: 0, kick: 2, mute: 10 } // Pas de ban
        },
        7: {
            name: 'Yellow',
            level: 7,
            roles: ['1434622709513588826', '1434622705436459079', '1434622704413048852', '1434622698721509579', '1434622696716636184'],
            limits: { ban: 0, kick: 0, mute: 5 }
        },
        8: {
            name: 'OrangeDark',
            level: 8,
            roles: ['1434622693592010783', '1434622692429926560'],
            limits: { ban: 0, kick: 0, mute: 3 }
        },
        9: {
            name: 'Green',
            level: 9,
            roles: ['1434622681629851718', '1434622678983249950'],
            limits: { ban: 0, kick: 0, mute: 0 }
        },
        10: {
            name: 'Fleur',
            level: 10,
            roles: ['1434622699547656295', '1434622680455184395', '1434622675266830610'],
            limits: { ban: 0, kick: 0, mute: 0 }
        },
        11: {
            name: 'Medal',
            level: 11,
            roles: ['1434622674356670625', '1434622671454343188', '1434947767477866559'],
            limits: { ban: 0, kick: 0, mute: 0 }
        }
    }
};
