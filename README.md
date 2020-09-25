# RemixPlayer Documentation

**Description:**
RemixPlayer is a library that embeds audio in another webpage. RemixPlayer allows you to play a single full audio file, multiple full audio files, or multiple excerpts of audio files. Initially created for [podcast remixing](http://remixcast.com), RemixPlayer can be used to play podcasts, music, or any audio you please!

**Install:**
Install from npm:

    npm install RemixPlayer

OR install from yarn:

    yarn install RemixPlayer

And use in your code:

    import { RemixPlayer } from 'RemixPlayer'

**Use as a script tag:**

    <script src="https://cdn.jsdelivr.net/npm/remixplayer/index.js"></script>

**Use:**
To create an embed in your JavaScript project:

    //A remix containing three pieces of a TED Talk with start and end times

    const embed = new RemixPlayer([
    {title: "TED Talks Daily",
    episode: "How to build your confidence -- and spark it in others | Brittany Packnett",
    imagesrc: "https://pl.tedcdn.com/rss_feed_images/ted_talks_main_podcast/audio.png",
    src: "https://dts.podtrac.com/redirect.mp3/download.ted.com/talks/BrittanyPacknett_2019.mp3?apikey=172BB350-0207&prx_url=https://dovetail.prxu.org/70/fbc865d8-91e5-4ec2-bcd5-2805f84ec092/BrittanyPacknett_2019_VO_Intro.mp3",
    start: 104,
    end: 133},
    {title: "TED Talks Daily",
    episode: "How to build your confidence -- and spark it in others | Brittany Packnett",
    imagesrc: "https://pl.tedcdn.com/rss_feed_images/ted_talks_main_podcast/audio.png",
    src: "https://dts.podtrac.com/redirect.mp3/download.ted.com/talks/BrittanyPacknett_2019.mp3?apikey=172BB350-0207&prx_url=https://dovetail.prxu.org/70/fbc865d8-91e5-4ec2-bcd5-2805f84ec092/BrittanyPacknett_2019_VO_Intro.mp3",
    start: 236,
    end: 433},
    {title: "TED Talks Daily",
    episode: "How to build your confidence -- and spark it in others | Brittany Packnett",
    imagesrc: "https://pl.tedcdn.com/rss_feed_images/ted_talks_main_podcast/audio.png",
    src: "https://dts.podtrac.com/redirect.mp3/download.ted.com/talks/BrittanyPacknett_2019.mp3?apikey=172BB350-0207&prx_url=https://dovetail.prxu.org/70/fbc865d8-91e5-4ec2-bcd5-2805f84ec092/BrittanyPacknett_2019_VO_Intro.mp3",
    start: 498,
    end: 807}
    ]);

    embed.setup(div);

Where:

- title — title of the podcast/audio source (e.g. “This American Life”) _(required unless using song/artist pairing)_
- episode — episode name of the podcast/audio source (e.g. “Something Only I Can See”) _(required unless using song/artist pairing)_
- artist — artist who performs the song/audio source (e.g. Billie Eilish) _(required unless using title/episode pairing)_
- song — the title of the song/audio source (e.g. “Bad Guy”) _(required unless using title/episode pairing)_
- imagesrc — link to the image for the podcast/audio source (optional)
- src — link to the audio source _(required)_
- start — at what time the audio should start playing in seconds _(optional; default: beginning of audio source)_
- end — at what time the audio should stop playing in seconds _(optional; default: end of audio source)_

* div — HTML element that the embed should be placed in

**Examples**

    //An example of playing a single, full audio file
    //Plays one full TED Talk
    const embed = new RemixPlayer([
    {title: "TED Talks Daily",
    episode: "How to build your confidence -- and spark it in others | Brittany Packnett",
    imagesrc: "https://pl.tedcdn.com/rss_feed_images/ted_talks_main_podcast/audio.png",
    src: "https://dts.podtrac.com/redirect.mp3/download.ted.com/talks/BrittanyPacknett_2019.mp3?apikey=172BB350-0207&prx_url=https://dovetail.prxu.org/70/fbc865d8-91e5-4ec2-bcd5-2805f84ec092/BrittanyPacknett_2019_VO_Intro.mp3",
    }
    ]);

    embed.setup(div);


    //An example of playing multiple, full audio files
    //Plays two full TED Talks in a row
    const embed = new RemixPlayer([
    {title: "TED Talks Daily",
    episode: "How to build your confidence -- and spark it in others | Brittany Packnett",
    imagesrc: "https://pl.tedcdn.com/rss_feed_images/ted_talks_main_podcast/audio.png",
    src: "https://dts.podtrac.com/redirect.mp3/download.ted.com/talks/BrittanyPacknett_2019.mp3?apikey=172BB350-0207&prx_url=https://dovetail.prxu.org/70/fbc865d8-91e5-4ec2-bcd5-2805f84ec092/BrittanyPacknett_2019_VO_Intro.mp3",
    }
    {title: "TED Talks Daily",
    episode: "Do schools kill creativity? | Sir Ken Robinson",
    imagesrc: "https://pl.tedcdn.com/rss_feed_images/ted_talks_main_podcast/audio.png",
    src: "https://dts.podtrac.com/redirect.mp3/download.ted.com/talks/SirKenRobinson_2006.mp3?apikey=172BB350-0207&prx_url=https://dovetail.prxu.org/70/01928baa-ce0b-4664-a8a6-10ccfe65599f/SirKenRobinson_2006_VO_Intro.mp3",
    }
    ]);

    embed.setup(div);

**Styling:**

| Function Name       | Effect                                                            | Arguments                                                                                                                                |
| ------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| .buttons()          | Updates the styling of the buttons in the embed                   | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |
| .title()            | Updates the styling of the title in the embed (h3)                | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |
| .segment()          | Updates the styling of the segment numbers in the embed (h5)      | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |
| .excerpt()          | Updates the styling of “excerpted from” in the embed (h5)         | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |
| .image()            | Updates the styling of the images in the embed (img)              | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |
| .timestamp()        | Updates the styling of the timestamps in the embed (h6)           | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |
| .slider()           | Updates the styling of the audio slider in the embed (input)      | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |
| .dropDownTitle()    | Updates the styling of the title in the dropdown (h3)             | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |
| .dropDownSegment()  | Updates the styling of the segment numbers in the dropdown (h4)   | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |
| .dropDownImage()    | Updates the styling of the images in the dropdown (img)           | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |
| .containerDiv()     | Updates the styling of the div containing the embed (div)         | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |
| .dropDownListItem() | Updates the styling of each segment div within the dropdown (div) | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |
| .dropDown()         | Updates the styling of the div containing the dropdown (div)      | A dictionary of css style properties (camelCased) keys and the value to update them to (e.g. {backgroundColor: “#1271f5”, height: “3px”} |

**Licensing**
RemixPlayer is licensed under [the MIT License](https://opensource.org/licenses/MIT).
