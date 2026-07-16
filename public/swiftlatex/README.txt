SwiftLaTeX engine files go here (in-browser WASM LaTeX compilation).

Download from https://github.com/SwiftLaTeX/SwiftLaTeX/releases and place:

  PdfTeXEngine.js
  swiftlatexpdftex.js
  swiftlatexpdftex.wasm

into this folder. The app loads /swiftlatex/PdfTeXEngine.js at runtime.
Until these files are present, resume compilation will show a friendly
"try again" toast and log details to the browser console.
