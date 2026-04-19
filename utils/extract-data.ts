export function extractChaptersTitle(content: string) {
    const chapterRegex = /# (.+)/g
    const chapters: string[] = []
    let match: RegExpExecArray | null

    while ((match = chapterRegex.exec(content)) !== null) {
        chapters.push(match[1]!)
    }

    return chapters
}

/**
 *
 * @param content the whole story
 * @param sliceNb slice 0 = the beginning of the story (title included until $sliceSize chapters)
 * @param sliceSize the number of chapters for the slice
 * @returns the slice of the story, by chapters/interludes
 * example: getStorySliceWithContent(histoire, 1, 2) will return the content of the story from chapter 1 to chapter 3 (excluded)
 */
export function getStorySliceWithContent(content: string, sliceNb: number, sliceSize: number): string {
    throw new Error('Not implemented yet')
}

/**
 * 
 * @param content 
 * @returns 
 */
export function sliceStoryByChapters(
    content: string
): { type: 'chapter' | 'interlude' | 'epilogue' | 'intro' | 'other'; content: string; title?: string; nb?: number }[] {
    const chapterRegex = /^(#+) (.+)$/gm
    const slices: {
        type: 'chapter' | 'interlude' | 'epilogue' | 'intro' | 'other'
        content: string
        title?: string
        nb?: number
    }[] = []
    let match: RegExpExecArray | null
    let lastIndex = 0
    let currentSlice: {
        type: 'chapter' | 'interlude' | 'epilogue' | 'intro' | 'other'
        content: string
        title?: string
        nb?: number
    } | null = null

    while ((match = chapterRegex.exec(content)) !== null) {
        const [fullMatch, hashes, title] = match
        const index = match.index

        if (currentSlice) {
            currentSlice.content = content.slice(lastIndex, index).trim()
            slices.push(currentSlice)
        }

        const level = hashes?.length
        let type: 'chapter' | 'interlude' | 'epilogue' | 'intro' | 'other' = 'other'

        if (level === 1) {
            type = title?.toLowerCase().includes('interlude') ? 'interlude' : 'chapter'
        } else if (level === 2) {
            type = title?.toLowerCase().includes('epilogue') ? 'epilogue' : 'intro'
        }

        currentSlice = { type, content: '', title, nb: slices.filter((s) => s.type === type).length + 1 }
        lastIndex = index + fullMatch.length
    }

    if (currentSlice) {
        currentSlice.content = content.slice(lastIndex).trim()
        slices.push(currentSlice)
    }

    return slices
}
