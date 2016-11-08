export {Athletics};

let Athletics = {
    getSports: function () {
        return [
            {
                name: 'Sprint',
                id: 'sp_sprint',
                select_electronic: true,
                description: ''
            },
            {
                id: 'sp_long_jump',
                name: 'Weitsprung',
                select_electronic: false,
                description: 'Jede Teilnehmerin bzw. jeder Teilnehmer hat drei Versuche. Der Absprung von einer Absprungfläche ist zulässig. Diese erstreckt sich von den Kanten des Absprungbalkens 30 cm nach beiden Seiten, umfasst also insgesamt 80 cm. Die Sprungweite wird vom hintersten Eindruck des Niedersprungs bis zur Höhe des vordersten Eindrucks des Absprungs gemessen, wobei die Messung immer im rechten Winkel zum Balken vorgenommen wird. Gültigkeit der Sprünge siehe Zeichnung.'
            }
        ];
    },

    /// data is an array of objects with id (view getSports) and score
    // example: [{id: 'sp_sprint', score: 16}]
    validate: function (data) {
        var result = [];

        for (var sport in data) {
            if (sport.value > 0) {
                result.push(sport.id);
            }
        }


    },

    calculate: function (data) {

    },

    getInformation: function () {
        return {
            'Allgemein': '',
            'Bewertung': ''
        }
    },
};