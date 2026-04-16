import histoire from "./histoire/Jusqu'à toucher l'écorce.md?raw"
import { extractChapters } from './utils/extract-data'

const chapters = extractChapters(histoire)

await Bun.write('output/chapters.md', chapters.join('\n'))
