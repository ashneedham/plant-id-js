<?php

$plants = json_decode(file_get_contents('plant-list.json'));
$name_of_plants = [];
foreach ($plants as $plant) {
    $name_of_plants[] = $plant->botanical_name;
}

$image_path = filter_input(INPUT_POST, 'image_path', FILTER_SANITIZE_SPECIAL_CHARS);
$selected_plant = filter_input(INPUT_POST, 'selected_plant', FILTER_SANITIZE_SPECIAL_CHARS);


if (!empty($image_path) && !empty($selected_plant)) {

    // Check the selected plant exists in list
    if (!in_array($selected_plant, $name_of_plants)) {
        echo 'Selected plant not found in list <br>';
        var_dump($selected_plant, $name_of_plants);
        exit;
    }

    $ch = curl_init('https://api.wikimedia.org/core/v1/commons/file/File:'.$image_path.'.jpg');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'plantle [downloads]');
    $download = json_decode(curl_exec($ch));
    curl_close($ch);


    $ch = curl_init('https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles=File%3a'.$image_path.'.jpg&format=json');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'plantle [downloads]');
    $meta = json_decode(curl_exec($ch));
    curl_close($ch);

    if (is_null($download)) {
        echo 'API call failed';
        exit;
    }

    foreach ($plants as $plant) {
        if ($plant->botanical_name === $selected_plant) {
            $existing_pics_total = count($plant->pictures);

            // Check we haven't already downloaded it
            foreach ($plant->pictures as $pic) {
                if ($pic->credit_url === $download->file_description_url) {
                    echo 'Picture already exists under '.$selected_plant;
                    exit;
                }
            }

            $filename = str_replace(' ', '_', $selected_plant).'_'.($existing_pics_total+1).'.jpg';

            $new_pic = new stdClass();
            $artist = $meta->query->pages->{-1}->imageinfo[0]->extmetadata->Artist->value;
            $new_pic->credit_owner = strip_tags($artist);
            $new_pic->credit_date = $meta->query->pages->{-1}->imageinfo[0]->extmetadata->DateTimeOriginal->value;
            $new_pic->credit_url = 'https:'.$download->file_description_url;
            $new_pic->licence_url = $meta->query->pages->{-1}->imageinfo[0]->extmetadata->LicenseUrl->value;
            $new_pic->filename = $filename;

            // Add info to json and download image
            $opts = [
                "http" => [
                    "method" => "GET",
                    "header" => "User-Agent: plantle [downloads]"
                ]
            ];
            $context = stream_context_create($opts);
            $pic_content = file_get_contents($download->preferred->url, false, $context);
            if (empty($pic_content)) {
                echo 'Could not download image';
                exit;
            }
            file_put_contents(dirname(__FILE__).'/img/photos/'.$filename, $pic_content);
            $plant->pictures[] = $new_pic;

            // $output json
            file_put_contents('plant-list.json', json_encode($plants, JSON_PRETTY_PRINT));

            echo $image_path.' added to '.$selected_plant;
        }
    }
}


?>
<html>
<head>
    <title>Download from Wikimedia</title>
    <style>
        #help-link {
            cursor: pointer;
            display: inline-block;
            margin: 0 5px;
        }
    </style>
</head>
<body>
    <form action="" method="post">
        <input type="text" name="image_path"> <span id="help-link">?</span>
        <select name="selected_plant">
            <?php
            foreach ($name_of_plants as $p) {
                ?><option value="<?php echo $p ?>"><?php echo $p ?></option><?php
            }
            ?>
        </select>
        <input type="submit" value="Download">
    </form>

    <dialog id="help">
        <h3>Help</h3>
        <p>Select the filename from the following location e.g. Aegopodium_podagraria_117864826</p>
        <img src="img/wikimedia_filename_example.png" alt="" style="width:800px;">
        <button id="help-close">Close</button>
    </dialog>
    <script>
        let help_modal = document.getElementById('help'),
            help_link = document.getElementById('help-link'),
            help_close = document.getElementById('help-close');

        help_link.addEventListener('click', function() {
           help_modal.showModal();
        });

        help_close.addEventListener('click', function() {
            help_modal.close();
        });
    </script>
</body>
</html>
