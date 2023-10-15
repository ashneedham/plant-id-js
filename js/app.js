/**
 * Plant-ID-o-matic v1.0
 * =====================
 *
 */

const round_length = 10;
document.addEventListener("DOMContentLoaded", function() {
    let sample_card = document.getElementById('sample-card'),
        blank_card = sample_card.cloneNode(true),
        deck = document.getElementById('deck'),
        plant_list_in_play = plant_list.slice(),
        players_score = 0;

    blank_card.removeAttribute('id');
    sample_card.remove();

    playRound(plant_list_in_play, 1);

    /**
     * Displays a new card for a given round and set triggers for correct answer
     * @param plant_list_provided
     * @param round_number
     */
    function playRound(plant_list_provided, round_number) {
        let new_card = blank_card.cloneNode(true)
            chosen_plant = getRandomPlant(plant_list_provided),
            picture = new_card.getElementsByClassName('picture')[0],
            answer_buttons = new_card.getElementsByTagName('button'),
            answers = generateAnswerList(chosen_plant);

        new_card.setAttribute('id', 'card_'+round_number);
        picture.style.backgroundImage = 'url("img/'+getRandomPicture(chosen_plant)+'")';

        answers.forEach(function(answer, index) {
            answer_buttons[index].innerText = answer.name;
        });

        // show
        deck.appendChild(new_card);
        new_card.classList.remove('hidden');
    }

    /**
     * Get a random plant from the provided plant list
     * @param {object[]} plant_list A list of plants to process
     * @returns {{botanical_name: string, common_name: string, pictures: string[]}|{botanical_name: string, common_name: string, pictures}|{botanical_name: string, common_name: string, pictures: string[]}|{botanical_name: string, common_name: string, pictures: string[]}}
     */
    function getRandomPlant(plant_list) {
        let random_number = Math.floor(Math.random() * plant_list.length);
        return plant_list[random_number];
    }

    /**
     * Get a random picture from the given plant
     * @param {object} plant A plant object
     * @returns {string} Filename of a random image
     */
    function getRandomPicture(plant) {
        let random_number = Math.floor(Math.random() * plant.pictures.length);
        return plant.pictures[random_number];
    }

    /**
     * Get a list of 3 incorrect names
     * @param {object} plant A single plant object
     * @param {object[]} plant_list A list of plant objects
     * @returns {string[]} List of 3 names excluding the provided plant name
     */
    function getThreeIncorrectNames(plant, plant_list) {
        let output = [],
            plant_index = plant_list.map(e => e.name).indexOf(plant.botanical_name),
            plant_list_clone = plant_list.slice();

        // Remove provided plant
        plant_list_clone.splice(plant_index, 1);

        while (output.length < 3) {
            let index = Math.floor(Math.random() * plant_list_clone.length),
                p = plant_list_clone[index];
            output.push(p.botanical_name);
            plant_list_clone.splice(index,1);
        }

        return output;
    }

    /**
     * Generate a list of answers
     * @param correct_plant
     * @returns {{name: string, correct: boolean}[]}
     */
    function generateAnswerList(correct_plant) {
        let alternative_answers = getThreeIncorrectNames(correct_plant, plant_list),
            output = [];

        alternative_answers.forEach(function(item) {
           output.push({'name': item, 'correct': false});
        });
        output.push({'name': correct_plant.botanical_name, 'correct': true});
        return shuffle(output);
    }

    /**
     * Shuffle an array
     * @param a
     * @returns {*}
     */
    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

});