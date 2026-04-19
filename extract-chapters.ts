import histoire from "./histoire/Jusqu'à toucher l'écorce.md?raw"
import { extractChaptersTitle, getStorySliceWithContent, sliceStoryByChapters } from './utils/extract-data'

// const chapters = extractChaptersTitle(histoire)

// await Bun.write('output/chapters.md', chapters.join('\n'))

const slicedStory = sliceStoryByChapters(histoire)
console.log(slicedStory)
