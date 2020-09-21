/**
 * Generates an audio embed based off of a mix to play some audio.
 */
(() => {
  //export class RemixEmbed
  class RemixEmbed {
    constructor(mix) {
      this.mix = mix;

      // static variables
      this.isFirefox =
        navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
      this.isChrome = !!window.chrome;

      // Handles audio time slippage
      const dontSlip = () => {
        if (this.isChrome) {
          return 5;
        } else if (this.isFirefox) {
          return 50;
        } else {
          return 100;
        }
      };

      this.DONT_BOTHER_SLIP_MS = dontSlip();

      this.container = undefined; // Div which contains most of UI
      this.dropDownDiv; // Div which contains the drop down parts of the UI

      // mutable variables
      this.pleaseSeekTo = null;
      this.playButtonPaused = true;
      this.playing = false;
      this.updateLoopScheduled = false;
      this.currentSegment = 0;
      this.offsetList = [];
      this.dropDownOpen = false;
      this.length = 0;

      // Adding critical (non-mutable) prototypes to mix
      let position = 0;
      this.mix.forEach((x) => {
        if (x.title === undefined && x.artist === undefined) {
          throw "Embed segment must contain a title or artist";
        } else if (x.title !== undefined && x.artist !== undefined) {
          throw "Embed segment may contain either a title or artist, not both.";
        } else if (x.artist !== undefined) {
          x.title = x.artist;
        }
        if (x.episode === undefined && x.song === undefined) {
          throw "Embed segment must contain an episode or song";
        } else if (x.episode !== undefined && x.song !== undefined) {
          throw "Embed segment may contain either an episode or song, not both.";
        } else if (x.song !== undefined) {
          x.episode = x.song;
        }
        if (x.src === undefined) {
          throw "Embed segment must contain an audio source";
        }
        // Defaults to beginning of audio clip if no start time was given
        if (x.start === undefined) {
          x.start = 0;
        }
        // Defaults to end of audio clip if no end time was given
        if (x.end === undefined) {
          const audio = document.createElement("audio");
          audio.src = x.src;

          audio.addEventListener("loadedmetadata", () => {
            x.end = audio.duration;
            this.recalculate();
          });
        } else {
          // Updates length of scrubber and order of clips
          x.offset = this.length;
          this.offsetList.push(this.length);
          x.position = position;
          position += 1;
          x.duration = x.end - x.start;
          this.length += x.duration;
        }
      });
    }

    /**
     * Resets then recalculates length of scrubber and order of clips if the end of a clip defaults
     */
    recalculate = () => {
      let position = 0;
      this.offsetList = [];
      this.length = 0;
      this.mix.forEach((x) => {
        x.offset = this.length;
        this.offsetList.push(this.length);
        x.position = position;
        position += 1;
        x.duration = x.end - x.start;
        this.length += x.duration;
      });
    };

    /**
     * Contains the main functionality of the embed
     * e.g. updating information when the scrubber bar moves or buttons are pressed
     * and playing audio.
     */
    main = (dropdown) => {
      const scrubber = this.container.querySelector(".scrubber");
      const playButton = this.container.querySelector(".playButton > button");
      const back15 = this.container.querySelector(".back15");
      const forward15 = this.container.querySelector(".forward15");
      const back = this.container.querySelector(".back");
      const forward = this.container.querySelector(".forward");

      // scrubber.max = this.length;

      this.loadSources().then((audioElements) => {
        // Handles updating the visual cues regarding the scrubber and endtime
        // once all audio sources have actually loaded
        this.recalculate();
        scrubber.max = this.length;
        this.container.querySelector(".endtime").innerHTML = this.getTime(
          scrubber.max
        );

        scrubber.addEventListener("input", () => {
          this.pleaseSeekTo = scrubber.value;
          let curMix = this.getCurrentSegment(scrubber);
          this.container.querySelector(".curtime").innerHTML = this.getTime(
            scrubber.value
          );
          this.container.getElementsByTagName("H4")[0].innerHTML =
            "Segment " +
            parseInt(curMix.position + 1) +
            " / " +
            this.mix.length;
          this.container.getElementsByTagName("H3")[0].innerHTML =
            curMix.title + ": " + curMix.episode;
          if (this.container.getElementsByTagName("img").length > 0) {
            this.container.getElementsByTagName("img")[0].src = curMix.imagesrc;
            this.container.getElementsByTagName(
              "img"
            )[0].alt = `${curMix.title} logo`;
          }
        });

        playButton.addEventListener("click", () => {
          if (this.playButtonPaused) {
            this.playButtonPaused = false;
            playButton.classList.remove("play");
            playButton.classList.add("pause");
            this.pleaseSeekTo = scrubber.value;
            this.startUpdateLoopIfNotAlreadyScheduled(
              audioElements,
              0,
              scrubber
            );
          } else {
            this.playButtonPaused = true;
            playButton.classList.remove("pause");
            playButton.classList.add("play");
          }
        });

        back15.addEventListener("click", () => {
          scrubber.value = scrubber.value - 15;
          this.container.querySelector(".curtime").innerHTML = this.getTime(
            scrubber.value
          );
          if (!this.playButtonPaused) {
            this.pleaseSeekTo = parseInt(scrubber.value);
            this.startUpdateLoopIfNotAlreadyScheduled(
              audioElements,
              0,
              scrubber
            );
          }
        });

        forward15.addEventListener("click", () => {
          scrubber.value = parseInt(scrubber.value) + 15;
          this.container.querySelector(".curtime").innerHTML = this.getTime(
            scrubber.value
          );
          if (!this.playButtonPaused) {
            this.pleaseSeekTo = parseInt(scrubber.value);
            this.startUpdateLoopIfNotAlreadyScheduled(
              audioElements,
              0,
              scrubber
            );
          }
        });

        back.addEventListener("click", () => {
          let curMix = this.getCurrentSegment(scrubber);
          if (curMix.position == 0) {
            scrubber.value = parseInt(this.offsetList[0]);
          } else {
            this.currentSegment -= 1;
            scrubber.value = parseInt(this.offsetList[curMix.position - 1]);
          }
          let newCurMix = this.getCurrentSegment(scrubber);
          this.container.querySelector(".curtime").innerHTML = this.getTime(
            scrubber.value
          );
          this.container.getElementsByTagName("H4")[0].innerHTML =
            "Segment " +
            parseInt(newCurMix.position + 1) +
            " / " +
            this.mix.length;
          this.container.getElementsByTagName("H3")[0].innerHTML =
            newCurMix.title + ": " + newCurMix.episode;
          this.container.getElementsByTagName("img")[0].src =
            newCurMix.imagesrc;
          this.container.getElementsByTagName(
            "img"
          )[0].alt = `${curMix.title} logo`;

          if (!this.playButtonPaused) {
            this.pleaseSeekTo = parseInt(scrubber.value);
            this.startUpdateLoopIfNotAlreadyScheduled(
              audioElements,
              0,
              scrubber
            );
          }
        });

        forward.addEventListener("click", () => {
          let curMix = this.getCurrentSegment(scrubber);
          if (curMix.position == this.mix.length - 1) {
            scrubber.value = parseInt(scrubber.max);
          } else {
            this.currentSegment += 1;
            scrubber.value = parseInt(this.offsetList[curMix.position + 1]);
          }
          let newCurMix = this.getCurrentSegment(scrubber);
          this.container.querySelector(".curtime").innerHTML = this.getTime(
            scrubber.value
          );
          this.container.getElementsByTagName("H4")[0].innerHTML =
            "Segment " +
            parseInt(newCurMix.position + 1) +
            " / " +
            this.mix.length;
          this.container.getElementsByTagName("H3")[0].innerHTML =
            newCurMix.title + ": " + newCurMix.episode;
          this.container.getElementsByTagName("img")[0].src =
            newCurMix.imagesrc;
          this.container.getElementsByTagName(
            "img"
          )[0].alt = `${curMix.title} logo`;

          if (!this.playButtonPaused) {
            this.pleaseSeekTo = parseInt(scrubber.value);
            this.startUpdateLoopIfNotAlreadyScheduled(
              audioElements,
              0,
              scrubber
            );
          }
        });

        dropdown.addEventListener("click", () => {
          const dropDownDiv = this.dropDownDiv;
          if (this.dropDownOpen) {
            dropDownDiv.style.display = "none";
            this.dropDownOpen = false;
            dropdown.classList.remove("showless");
            dropdown.classList.add("showmore");
          } else {
            dropDownDiv.style.display = "block";
            this.dropDownOpen = true;
            dropdown.classList.remove("showmore");
            dropdown.classList.add("showless");
          }
        });

        this.startUpdateLoop(audioElements, 0, scrubber);
      });
    };

    /**
     * Calculates the current segment based off the current value of the scrubber
     * @param {input HTMLElement} scrubber
     */
    getCurrentSegment = (scrubber) => {
      let t = scrubber.value;
      for (const m of this.mix) {
        if ((t > m.offset) & (t < m.offset + m.duration) || t == m.offset) {
          this.currentSegment = m.position;
          return m;
        }
      }
      // This chatches when it's at the end of the input slider, but I'm not sure this is what it should be doing...
      return this.mix[this.mix.length - 1];
    };

    /**
     * Determines the current segment playing based on the current time
     * @param {number} t
     * @param {array of objects} segments
     */
    segmentByTime = (t, segments) => {
      let cumulative = 0;
      for (const seg of segments) {
        const seg_length = seg.end - seg.start;
        const upToCur = cumulative;
        cumulative += seg_length;
        if (t < cumulative) {
          const offset = seg.start + (t - upToCur);
          // Slightly hack-y; I'd love suggestions on how to make this cleaner
          this.container.getElementsByTagName("H4")[0].innerHTML =
            "Segment " + parseInt(seg.position + 1) + " / " + segments.length;
          // Updates source name (e.g. "from Kingdom of Loathing")
          this.container.getElementsByTagName("H3")[0].innerHTML =
            seg.title + ": " + seg.episode;
          // Updates image
          if (this.container.getElementsByTagName("img").length > 0) {
            this.container.getElementsByTagName("img")[0].src = seg.imagesrc;
            this.container.getElementsByTagName(
              "img"
            )[0].alt = `${seg.title} logo`;
          }

          return [seg.src, offset];
        }
      }
      return ["done", undefined, undefined];
    };

    /**
     * Plays the audio source aligned with 'source' and pauses all else
     * @param {string} source
     * @param {object} audioElements
     */
    playAndPauseAllOthers = (source, audioElements) => {
      for (const src of Object.keys(audioElements)) {
        if (src === source) {
          audioElements[src].play();
        } else {
          audioElements[src].pause();
        }
      }
    };

    /**
     * Pauses all audio sources
     * @param {object} audioElements
     */
    pauseAll = (audioElements) => {
      for (const src of Object.keys(audioElements)) {
        audioElements[src].pause();
      }
    };

    /**
     * Starts the update loop if it hasn't already been scheduled to start
     * @param {object} audioElements
     * @param {number} seek
     * @param {input HTMLElement} scrubber
     */
    startUpdateLoopIfNotAlreadyScheduled = (audioElements, seek, scrubber) => {
      if (!this.updateLoopScheduled) {
        return this.startUpdateLoop(audioElements, seek, scrubber);
      }
    };

    /**
     * Determines and formats the time that the scrubber bar is currently at
     * @param {number} total
     */
    getTime = (total) => {
      const time = [];
      time.push(Math.floor(total % 60).toString());
      time.push(Math.floor((total / 60) % 60).toString());
      time.push(Math.floor((total / (60 * 60)) % 24).toString());
      const formattedTime = [];
      for (const item of time) {
        if (item.length < 2) {
          formattedTime.push("0".concat(item));
        } else {
          formattedTime.push(item);
        }
      }
      return formattedTime[2] + ":" + formattedTime[1] + ":" + formattedTime[0];
    };

    /**
     * Handles playing audio, updating current time, and dealing with slippage
     * @param {object} audioElements
     * @param {number} seek
     * @param {input HTMLElement} scrubber
     */
    startUpdateLoop = (audioElements, seek, scrubber) => {
      // this function is synchronous, so ok to keep this at false
      // for the duration of the function, while no one else can check it.
      let length = 0;
      this.mix.forEach((x) => (length += x.end - x.start));
      let playStart = Date.now() - seek * 1000; // in ms
      let curSource = null;
      let t = (Date.now() - playStart) / 1000;
      console.log("seek of", seek, this.segmentByTime(t, this.mix));

      const ALLOWED_SLIP_SECONDS = 2; // if we're less this amount off then
      // correct our clock instead of the playback
      const update = () => {
        this.updateLoopScheduled = false;
        if (this.playButtonPaused) {
          this.pauseAll(audioElements);
          return;
        }
        if (this.pleaseSeekTo !== null) {
          const seek = this.pleaseSeekTo;
          this.pleaseSeekTo = null;
          this.startUpdateLoop(audioElements, seek, scrubber);
          return;
        }
        t = (Date.now() - playStart) / 1000;

        this.container.querySelector(".curtime").innerHTML = this.getTime(t);

        const [source, offset] = this.segmentByTime(t, this.mix);
        scrubber.value = t;

        if (curSource === null && source !== "done") {
          curSource = source;
          audioElements[curSource].currentTime = offset;
          this.playAndPauseAllOthers(curSource, audioElements);
        } else if (source === "done") {
          for (const src of Object.keys(audioElements)) {
            audioElements[src].pause();
          }
          return;
        } else if (source === curSource) {
          const slip = audioElements[curSource].currentTime - offset;
          if (Math.abs(slip) < this.DONT_BOTHER_SLIP_MS / 1000) {
            // don't both adjusting
          } else if (Math.abs(slip) < ALLOWED_SLIP_SECONDS) {
            const adjustedPlayStart =
              playStart +
              (offset - audioElements[curSource].currentTime) * 1000;
            playStart = adjustedPlayStart;
          } else {
            audioElements[curSource].currentTime = offset;
          }
        } else if (source === undefined) {
          throw "Source is undefined, cannot update";
        } else {
          curSource = source;
          this.playAndPauseAllOthers(curSource, audioElements);
          audioElements[curSource].currentTime = offset;
        }
        this.updateLoopScheduled = true;
        setTimeout(update, 200);
      };
      update();
    };

    /**
     * Creates the buffer bar, which is generally hidden when using the embed
     * @param {object} audioElement
     */
    bufferBar = (audioElement) => {
      const canvas = document.createElement("canvas");
      canvas.className = "audio-mix-embed-buffer";
      canvas.width = 800;
      canvas.height = 40;
      document.body.appendChild(canvas);
      document.body.appendChild(document.createElement("br"));

      const context = canvas.getContext("2d");

      context.fillStyle = "lightgray";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "red";
      context.strokeStyle = "white";

      const inc = canvas.width / audioElement.duration;

      // display TimeRanges
      window.setInterval(() => {
        for (let i = 0; i < audioElement.buffered.length; i++) {
          const startX = audioElement.buffered.start(i) * inc;
          const endX = audioElement.buffered.end(i) * inc;
          const width = endX - startX;

          context.fillRect(startX, 0, width, canvas.height);
          context.rect(startX, 0, width, canvas.height);
          context.stroke();
        }
      }, 1000);
    };

    /**
     * Loads sources and returns a promise with a map of src to audio element
     */
    loadSources = () => {
      const sources = {};
      for (const seg of this.mix) {
        sources[seg.src] = undefined;
      }
      const srcs = Object.keys(sources);
      const audioElements = {};

      const loaded = Promise.all(
        srcs.map((src) => {
          const audio = document.createElement("audio");
          audio.className = "audio-mix-embed-source";
          document.body.appendChild(audio);
          document.body.appendChild(document.createElement("br"));
          audio.src = src;
          audio.controls = true;
          audioElements[src] = audio;
          return new Promise((resolve) => {
            audio.addEventListener("loadedmetadata", (e) => {
              this.bufferBar(e.target);
            });
            audio.addEventListener("canplaythrough", () => {
              resolve("yay");
            });
          });
        })
      ).then(() => {
        const box = this.container.querySelector("div.box");
        const nameDiv = this.container.querySelector("div.nameDiv");
        const rightDiv = this.container.querySelector("div.rightDiv");
        box.style.visibility = "hidden";
        nameDiv.style.visibility = "visible";
        rightDiv.style.visibility = "visible";
        return audioElements;
      });
      return loaded;
    };

    /**
     * Creates the drop down menu
     * @param {HTMLElement} me
     * @param {HTMLElement} dropdown
     */
    createDropDown(me, dropdown) {
      const scrubber = this.container.querySelector(".scrubber");

      const dropDownDiv = this.dropDownDiv;

      for (const m of this.mix) {
        const segmentDiv = document.createElement("div");
        segmentDiv.className = me.className;
        segmentDiv.classList.add("segmentDiv", "audio", "embed");

        const imgDiv = document.createElement("div");
        imgDiv.className = me.className;
        imgDiv.classList.add("imgDiv", "audio", "embed");

        if (m.imagesrc.length > 0) {
          imgDiv.innerHTML = `
        <img class="dropdown embed" src=${m.imagesrc} alt='${m.title} logo'>
      `;
          segmentDiv.appendChild(imgDiv);
        }

        const textDiv = document.createElement("div");
        textDiv.className = me.className;
        textDiv.classList.add("textDiv", "audio", "embed");

        textDiv.innerHTML = `
        <h3 class="dropdown embed">${m.title} : ${m.episode} </h3>
        <h4 class="dropdown embed"> Segment ${parseInt(m.position + 1)} / ${
          this.mix.length
        } </h4>
      `;

        segmentDiv.appendChild(textDiv);

        dropDownDiv.appendChild(segmentDiv);

        dropDownDiv.appendChild(document.createElement("br"));

        segmentDiv.addEventListener("click", () => {
          scrubber.value = m.offset;
          this.container.querySelector(".curtime").innerHTML = this.getTime(
            scrubber.value
          );
          this.pleaseSeekTo = parseInt(scrubber.value);

          const newCurMix = this.getCurrentSegment(scrubber);
          this.container.querySelector(".curtime").innerHTML = this.getTime(
            scrubber.value
          );
          this.container.getElementsByTagName("H4")[0].innerHTML =
            "Segment " +
            parseInt(newCurMix.position + 1) +
            " / " +
            this.mix.length;
          this.container.getElementsByTagName("H3")[0].innerHTML =
            newCurMix.title + ": " + newCurMix.episode;
          if (newCurMix.imagesrc.length > 0) {
            this.container.getElementsByTagName("img")[0].src =
              newCurMix.imagesrc;
            this.container.getElementsByTagName(
              "img"
            )[0].alt = `${newCurMix.title} logo`;
          }

          dropDownDiv.style.display = "none";
          this.dropDownOpen = false;
          dropdown.classList.remove("showless");
          dropdown.classList.add("showmore");
        });
      }
    }

    /**
     * Handles styling of general elements
     * @param {string} style
     * @param {string} elementName
     */
    styling = (style, elementName) => {
      // Add error catching

      let allElements = document.getElementsByTagName(elementName);
      for (let i = 0; i < allElements.length; i++) {
        if (allElements[i].classList.value.includes("audio embed")) {
          for (let key of Object.keys(style)) {
            allElements[i].style[key] = style[key];
          }
        }
      }
    };

    /**
     * Handles styling of buttons
     * @param {string} style
     */
    buttons = (style) => {
      this.styling(style, "button");
    };

    /**
     * Handles styling of h3
     * @param {string} style
     */
    title = (style) => {
      this.styling(style, "h3");
    };

    /**
     * Handles styling of h4
     * @param {string} style
     */
    segment = (style) => {
      this.styling(style, "h4");
    };

    /**
     * Handles styling of h5
     * @param {string} style
     */
    excerpt = (style) => {
      this.styling(style, "h5");
    };

    /**
     * Handles styling of images
     * @param {string} style
     */
    image = (style) => {
      this.styling(style, "img");
    };

    /**
     * Handles styling of h6
     * @param {string} style
     */
    timestamp = (style) => {
      this.styling(style, "h6");
    };

    /**
     * Handles styling of input slider
     * @param {string} style
     */
    slider = (style) => {
      this.styling(style, "input");
    };

    /**
     * Handles styling of objects in drop down
     * @param {string} style
     * @param {string} elementName
     */
    dropDownStyling = (style, elementName) => {
      // Add error catching
      let allElements = document.getElementsByTagName(elementName);
      for (let i = 0; i < allElements.length; i++) {
        if (allElements[i].classList.value.includes("dropdown embed")) {
          for (let key of Object.keys(style)) {
            allElements[i].style[key] = style[key];
          }
        }
      }
    };

    /**
     * Handles styling of drop down h3
     * @param {string} style
     */
    dropDownTitle = (style) => {
      this.dropDownStyling(style, "h3");
    };

    /**
     * Handles styling of drop down h4
     * @param {string} style
     */
    dropDownSegment = (style) => {
      this.dropDownStyling(style, "h4");
    };

    /**
     * Handles styling of drop down images
     * @param {string} style
     */
    dropDownImage = (style) => {
      this.dropDownStyling(style, "img");
    };

    /**
     * Handles styling of objects by class name
     * @param {string} style
     * @param {string} elementName
     */
    classNameStyling = (style, elementName) => {
      let allElements = document.getElementsByClassName(elementName);
      for (let i = 0; i < allElements.length; i++) {
        for (let key of Object.keys(style)) {
          allElements[i].style[key] = style[key];
        }
      }
    };

    /**
     * Handles styling of audio-mix-embed class
     * @param {string} style
     */
    containerDiv = (style) => {
      this.classNameStyling(style, "audio-mix-embed");
    };

    /**
     * Handles styling of segmentDiv class
     * @param {string} style
     */
    dropDownListItem = (style) => {
      this.classNameStyling(style, "segmentDiv");
    };

    /**
     * Handles styling of dropdowndiv class
     * @param {string} style
     */
    dropDown = (style) => {
      this.classNameStyling(style, "dropdowndiv");
    };

    /**
     *  Creates a div for playing an excerpt of a audio file.
     *  The div will have the class 'audio-mix-embed' as well as
     *  whatever classes are on the script tag that spawned it.
     *  @param {HTMLElement} me
     */
    setup = (me) => {
      // Checking to see if we have images
      let containsImages = false;
      for (let m of mix) {
        if (m.imagesrc.length > 0) {
          containsImages = true;
        }
      }
      const containerDiv = (this.container = document.createElement("div"));
      containerDiv.className = me.className;
      containerDiv.classList.add("audio-mix-embed-container");
      me.parentNode.appendChild(containerDiv);

      const container = (this.container = document.createElement("div"));
      container.className = me.className;
      container.classList.add("audio-mix-embed");
      containerDiv.appendChild(container);

      // Loading screen box
      const box = document.createElement("div");
      box.className = me.className;
      box.classList.add("box", "audio", "embed");
      containerDiv.appendChild(box);

      box.innerHTML = `
        <div class="b b1 audio embed"></div>
        <div class="b b2 audio embed"></div>
        <div class="b b3 audio embed"></div>
        <div class="b b4 audio embed"></div>
      `;

      container.appendChild(box);

      const nameDiv = document.createElement("div");
      nameDiv.className = me.className;
      nameDiv.classList.add("nameDiv", "audio", "embed");
      if (containsImages) {
        nameDiv.innerHTML = `
        <img class="audio embed" src=''>
      `;
      }

      container.appendChild(nameDiv);

      const rightDiv = document.createElement("div");
      rightDiv.className = me.className;
      rightDiv.classList.add("rightDiv", "audio", "embed");

      const numSources = this.mix.length;

      rightDiv.innerHTML = `
        <h5 class="audio embed"> Excerpted from: </h5>
        <h3 class="audio embed"> ${this.mix[0].title}: ${this.mix[0].episode}</h3>
        <h4 class="audio embed"> Segment 1 / ${numSources} </h4>
        <div class="inputDiv audio embed"> 
            <h6 class="curtime audio embed"> 00:00:00 </h6>
            <input class="scrubber audio embed" type="range" value="0">
            <h6 class="endtime audio embed"> 00:00:00 </h6>
        </div>
      `;

      const buttonDiv = document.createElement("div");
      buttonDiv.className = me.className;
      buttonDiv.classList.add("buttonDiv", "audio", "embed");
      containerDiv.appendChild(buttonDiv);

      buttonDiv.innerHTML = `
        <button class="back audio embed"></button>
        <button class="back15 audio embed"></button>
        <span class="playButton audio embed">
          <button class="play audio embed"></button>
        </span>
        <button class="forward15 audio embed"></button>
        <button class="forward audio embed"></button>
      `;

      rightDiv.appendChild(buttonDiv);

      const dropdown = document.createElement("button");
      dropdown.classList.add("dropdown", "audio", "embed");
      container.appendChild(dropdown);
      rightDiv.appendChild(dropdown);

      container.appendChild(rightDiv);

      const dropDownDiv = (this.dropDownDiv = document.createElement("div"));
      dropDownDiv.className = me.className;
      dropDownDiv.classList.add("dropDownDiv", "audio", "embed");
      containerDiv.appendChild(dropDownDiv);

      this.createDropDown(me, dropdown);

      this.main(dropdown, me);

      const endtime = this.container.querySelector(".endtime");
      const scrubber = this.container.querySelector(".scrubber");

      endtime.innerHTML = this.getTime(scrubber.max);
    };
  }

  const becomingWise =
    "http://dts.podtrac.com/redirect.mp3/feeds.soundcloud.com/stream/608364675-the-everyday-gift-of-writing-naomi-shihab-nye.mp3";
  const poetryUnbound =
    "https://cdn.simplecast.com/audio/49fe14/49fe14cf-8aef-4a4f-83ca-a3ac86a522d8/bcb9c322-285f-45c8-a711-13e031e11340/a-poem-for-letting-yourself-be_tc.mp3?aid=rss_feed";
  const defaultMix = [
    {
      start: 74,
      end: 290,
      src: becomingWise,
      title: "Becoming Wise",
      episode: "The Everyday Gift of Writing",
      imagesrc:
        "https://onbeing.org/wp-content/uploads/2019/02/022219_Becoming_Wise_FinalArtwork_iTunes_1PM.jpg?resize=320,320",
    },
    {
      start: 29,
      end: 80,
      src: poetryUnbound,
      title: "Poetry Unbound",
      episode: "A Poem for Letting Yourself Be",
      imagesrc:
        "https://cdn.simplecast.com/images/8b774a2b-4c5b-4893-b25f-d045583d8230/053f0b36-2380-4f6b-b672-9abade809c59/3000x3000/3000x3000-poetryunbound-logo.jpg?aid=rss_feed",
    },
    {
      start: 119,
      end: 185,
      src: poetryUnbound,
      title: "Poetry Unbound",
      episode: "A Poem for Letting Yourself Be",
      imagesrc:
        "https://cdn.simplecast.com/images/8b774a2b-4c5b-4893-b25f-d045583d8230/053f0b36-2380-4f6b-b672-9abade809c59/3000x3000/3000x3000-poetryunbound-logo.jpg?aid=rss_feed",
    },
  ];

  let mix = defaultMix;

  if (document.currentScript.src.includes("?")) {
    const urlParams = new URLSearchParams(
      document.currentScript.src.slice(
        document.currentScript.src.indexOf("?") + 1
      )
    );
    if (urlParams.has("data")) {
      mix = JSON.parse(urlParams.get("data"));
    }
  }
  const remixembed = new RemixEmbed(mix);
  remixembed.setup(document.currentScript);
})();
