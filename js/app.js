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
        score_board = document.getElementById('score-board'),
        score_board_players_score = document.getElementById('players-score'),
        score_board_rounds_played = document.getElementById('rounds-played'),
        plant_list_in_play = plant_list.slice(),
        rounds_played = 0,
        players_score = 0,
        rounds_correct_answers = [];

    blank_card.removeAttribute('id');
    sample_card.remove();


    // Start game

    playRound(plant_list_in_play, 1);

    /**
     * Displays a new card for a given round and set triggers for correct answer
     * @param plant_list_provided
     * @param round_number
     * @return {{botanical_name: string, common_name: string, pictures: string[]}|{botanical_name: string, common_name: string, pictures}|{botanical_name: string, common_name: string, pictures: string[]}|{botanical_name: string, common_name: string, pictures: string[]}}
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
            answer_buttons[index].dataset.index = index;
            if (answer.correct) {
                rounds_correct_answers[round_number] = index;
                answer_buttons[index].addEventListener('click', function() {
                    correctAnswer(this);
                });
            } else {
                answer_buttons[index].addEventListener('click', function() {
                    wrongAnswer(this);
                });
            }
        });

        // show
        deck.appendChild(new_card);
        new_card.classList.remove('hidden');

        return chosen_plant
    }

    /**
     * User guessed correctly
     * @param element
     */
    function correctAnswer(element) {
        element.classList.add('correct');
        updateScore(true);
    }

    /**
     * User guessed incorrectly
     * @param element
     */
    function wrongAnswer(element) {
        element.classList.add('incorrect');
        updateScore();
    }

    /**
     * Update the score and rounds played and score board
     * @param correct
     */
    function updateScore(correct = false) {
        rounds_played++;
        if (correct) {
            players_score++;
        }
        score_board_players_score.innerText = players_score;
        score_board_rounds_played.innerText = rounds_played;
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
            plant_list_clone = plant_list.slice();

        // Remove provided plant
        plant_list_clone = removePlantFromList(plant_list_clone, plant);

        while (output.length < 3) {
            let index = Math.floor(Math.random() * plant_list_clone.length),
                p = plant_list_clone[index];
            output.push(p.botanical_name);
            plant_list_clone.splice(index,1);
        }

        return output;
    }

    /**
     * Removes a given plant from a list
     * @param list
     * @param plant
     * @returns {object[]}
     */
    function removePlantFromList(list, plant) {
        list.splice(list.map(e => e.botanical_name).indexOf(plant.botanical_name), 1);
        return list;
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