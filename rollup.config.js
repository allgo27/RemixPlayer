import postcss from "rollup-plugin-postcss";
import multi from "@rollup/plugin-multi-entry";
import url from "postcss-url";
import babel from "rollup-plugin-babel";

const options = {
  url: "inline",
};

export default {
  input: ["script.js", "static/embed.css"],
  output: {
    file: "index.js",
    format: "umd",
    name: "RemixPlayer",
  },
  plugins: [
    postcss({
      plugins: [url(options)],
    }),
    babel(),
    multi(),
  ],
};
