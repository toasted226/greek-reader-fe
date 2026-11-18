# GreekReader

The Angular-powered frontend for [the Greek Reader API](https://github.com/toasted226/greek-reader-api). You can find find more information about how the Greek Reader project works there.

This site is live and hosted at https://greek-reader.modulrza.app, featuring morphological text-analysis, file uploads, dictionary searching, and user-saved lemmas. A react native app and a native [Iced](https://github.com/iced-rs/iced)-based Rust desktop client is in progress but not yet published.

## License

This project is licensed under the [MIT License](LICENSE).

Dictionary data is derived from [Wiktionary](https://en.wiktionary.org/) contributors' work, extracted by [Kaikki.org](https://kaikki.org/) using [wiktextract](https://github.com/tatuylonen/wiktextract). It is available under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/). The data has been modified for this project (filtered, normalised and restructured). The MIT licence in this repository covers the source code only, not the Wiktionary-derived data.

## Contributing

Issues and pull requests are welcome. There is no formal contribution guide or automated test suite yet, so please keep changes focused, describe the behaviour you changed, and include manual verification steps (the API, the F# engine, and the frontend are separate repositories, so note which ones a change touches).
