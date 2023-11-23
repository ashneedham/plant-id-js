/**
 * Plant-ID-o-matic v1.0
 * =====================
 *
 */

const ROUND_LENGTH = 10;
const DIFFICULTY_EASY = 'easy';
const DIFFICULTY_HARD = 'hard';
document.addEventListener("DOMContentLoaded", function() {
    let sample_card = document.getElementById('sample-card'),
        game_difficulty_box = document.getElementById('game-difficulty'),
        game_difficulty = null;
        data_list = document.getElementById('full-plant-list'),
        plant_list_modal = document.getElementById('plant-list'),
        start_button = document.getElementById('start'),
        play_again_button = document.getElementById('play-again'),
        blank_card = sample_card.cloneNode(true),
        deck = document.getElementById('deck'),
        score_board = document.getElementById('score-board'),
        score = document.getElementById('score'),
        score_board_players_score = document.getElementById('players-score'),
        score_board_rounds_played = document.getElementById('rounds-played'),
        final_score_modal = document.getElementById('final-score'),
        final_score_inner = final_score_modal.getElementsByClassName('inner')[0],
        copy_info_modal = document.getElementById('copy-info'),
        copy_info_inner = copy_info_modal.getElementsByClassName('inner')[0],
        modal_close_buttons = document.getElementsByClassName('modal-close'),
        rounds_played = 0,
        players_score = 0,
        current_round = 0,
        rounds_correct_answers = [],
        selected_answer = null,
        check_answer_callback = null,
        plant_list = null,
        plant_list_in_play = null;

    blank_card.removeAttribute('id');
    sample_card.remove();

    // Get list
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            plant_list = JSON.parse(this.responseText);
            plant_list_in_play = plant_list.slice()

            plant_list.forEach(function(p) {
                let o = document.createElement('div');
                o.classList.add('item');
                o.innerText = p.botanical_name;
                o.setAttribute('data-botanical', p.botanical_name);
                data_list.appendChild(o);
            });
        }
    };
    xmlhttp.open("GET", "https://www.plantle.app/plant-list.json", true);
    xmlhttp.send();

    // Start game
    start_button.addEventListener('click', function() {
        game_difficulty = document.querySelector('input[name=difficulty]:checked').value;
        game_difficulty_box.style.display = 'none';

        // Set the sample card based on the difficulty level
        if (game_difficulty === DIFFICULTY_HARD) {
            blank_card.querySelector('.answers.easy').style.display = 'none';

            // Setup the data list events
            data_list.querySelectorAll('.item').forEach(function(item) {
                item.addEventListener('click', function() {
                    selected_answer = this.getAttribute('data-botanical');
                    plant_list_modal.close();
                    check_answer_callback(selected_answer);
                });
            });

        } else {
            blank_card.querySelector('.answers.hard').style.display = 'none';
        }

        playRound(plant_list_in_play, 1);
    });

    // Play again
    play_again_button.addEventListener('click', function() {
        let cards = deck.getElementsByClassName('card');
        Array.from(cards).forEach(function (element) {
            element.remove();
        });
        rounds_played = 0;
        players_score = 0;
        current_round = 0;
        rounds_correct_answers = [];
        plant_list_in_play = plant_list.slice();
        final_score_modal.close();
        document.body.classList.remove('unlocked');
        deck.classList.remove('spread');
        resetScore();
        playRound(plant_list_in_play, 1);
    });

    // Modal close buttons
    for (let btn of modal_close_buttons) {
        btn.addEventListener('click', function () {
            this.parentNode.close();
        });
    }


    /**
     * Displays a new card for a given round and set triggers for correct answer
     * @param plant_list_provided
     * @param round_number
     * @return {{botanical_name: string, common_name: string, pictures: string[]}|{botanical_name: string, common_name: string, pictures}|{botanical_name: string, common_name: string, pictures: string[]}|{botanical_name: string, common_name: string, pictures: string[]}}
     */
    function playRound(plant_list_provided, round_number) {
        let new_card = blank_card.cloneNode(true)
            new_card.style.zIndex = 100+round_number,
            chosen_plant = getRandomPlant(plant_list_provided),
            picture = new_card.getElementsByClassName('picture')[0],
            copyright_block = new_card.getElementsByClassName('copyright')[0],
            copyright_icon = copyright_block.getElementsByClassName('icon')[0],
            copyright_text = copyright_block.getElementsByClassName('text')[0],
            photo = getRandomPicture(chosen_plant);

        // Remove chosen plant from list to prevent playing it more than once
        plant_list_provided = removePlantFromList(plant_list_provided, chosen_plant);
        current_round = round_number;
        new_card.setAttribute('id', 'card_'+round_number);
        new_card.setAttribute('data-botanical', chosen_plant.botanical_name);
        picture.style.backgroundImage = 'url("img/photos/'+photo.filename+'")';
        copyright_text.innerHTML = '<a href="' + photo.credit_url + '" target="_blank">' + photo.credit_owner + '</a> <br> ' + photo.credit_date + ' <br> <a href="' + photo.licence_url + '" target="_blank">Licence</a>';

        copyright_icon.addEventListener('click', function() {
            copy_info_inner.innerHTML = this.nextElementSibling.innerHTML;
            copy_info_modal.showModal();
        });

        if (game_difficulty === DIFFICULTY_HARD) {
            /**
             * HARD MODE
             */
            let botanical_name = new_card.querySelector('.botanical-name');
            botanical_name.addEventListener('click', function() {
                check_answer_callback = function(answer) {
                    botanical_name.innerText = new_card.getAttribute('data-botanical');
                    botanical_name.classList.add('selected');
                    new_card.querySelector('.answer').innerText = answer;
                    new_card.querySelector('.common-name').classList.remove('blurred');

                    if (new_card.getAttribute('data-botanical') === answer) {
                        correctAnswer(new_card, round_number, 1);
                    } else {
                        new_card.classList.add('wrong');
                        wrongAnswer(new_card);
                    }
                    playNextRoundOrShowFinalScore(plant_list_provided, 5000);
                };
                plant_list_modal.showModal();
            });
        } else {
            /**
             * EASY MODE
             */
            let answer_buttons = new_card.getElementsByTagName('button'),
                answers = generateAnswerList(chosen_plant);
            answers.forEach(function(answer, index) {
                answer_buttons[index].innerText = answer.name;
                answer_buttons[index].dataset.index = index;
                if (answer.correct) {
                    answer_buttons[index].addEventListener('click', function() {
                        if (!isCardLocked(new_card)){
                            lockCard(new_card);
                            correctAnswer(this, round_number, index);
                            playNextRoundOrShowFinalScore(plant_list_provided);
                        }
                    });
                } else {
                    answer_buttons[index].addEventListener('click', function() {
                        if (!isCardLocked(new_card)) {
                            lockCard(new_card);
                            wrongAnswer(this);
                            playNextRoundOrShowFinalScore(plant_list_provided);
                        }
                    });
                }
            });
        }

        // Show
        deck.appendChild(new_card);
        new_card.classList.remove('hidden');

        // Set autcomplete list and focus on text field when playing hard
        if (game_difficulty === DIFFICULTY_HARD) {
            // new_card.querySelector('input[name=answer]').focus();
        }

        return chosen_plant
    }

    /**
     * Check rounds left to play and trigger if so
     * @param updated_plant_list
     */
    function playNextRoundOrShowFinalScore(updated_plant_list, timeout = 1000) {
        if (rounds_played < ROUND_LENGTH) {
            setTimeout(function() {
                playRound(updated_plant_list, rounds_played+1);
            }, timeout);
        } else {
            setTimeout(function() {
                document.body.classList.add('unlocked');
                deck.classList.add('spread');
            }, timeout);
            setTimeout(function() {
                final_score_inner.innerHTML = score.innerHTML;
                final_score_modal.showModal();
            }, 1500);
        }
    }

    /**
     * User guessed correctly
     * @param element
     * @param round_number
     * @param correct_index
     */
    function correctAnswer(element, round_number, correct_index) {
        rounds_correct_answers[round_number] = correct_index;
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
     * Mark a card as answered
     * @param element
     */
    function lockCard(element) {
        element.classList.add('answered');
    }

    /**
     * Check to see if a card has been answered
     * @param element
     * @returns {boolean}
     */
    function isCardLocked(element) {
        return element.classList.contains('answered');
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
     * Reset the score
     */
    function resetScore() {
        score_board_players_score.innerText = '-';
        score_board_rounds_played.innerText = '-';
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