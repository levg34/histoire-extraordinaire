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
    const sections = sliceStoryByChapters(content)
    const chapterSectionIndices = sections
        .map((section, index) => (section.type === 'chapter' ? index : -1))
        .filter((index) => index >= 0)

    const startChapterIndex = sliceNb * sliceSize
    if (startChapterIndex >= chapterSectionIndices.length) {
        return ''
    }

    const endChapterIndex = startChapterIndex + sliceSize
    const startSectionIndex = sliceNb === 0 ? 0 : chapterSectionIndices[startChapterIndex]
    const endSectionIndex = chapterSectionIndices[endChapterIndex] ?? sections.length

    return sections
        .slice(startSectionIndex, endSectionIndex)
        .map((section) => section.content)
        .join('')
}

type StorySliceType = 'chapter' | 'interlude' | 'epilogue' | 'intro' | 'other'

/**
 *
 * @param content
 * @returns
 */
export function sliceStoryByChapters(content: string): {
    type: StorySliceType
    content: string
    title?: string
    nb?: number /* extract the chapter number, if any */
}[] {
    const lines = content.split(/\r?\n/)
    const sections: {
        type: StorySliceType
        content: string
        title?: string
        nb?: number
    }[] = []

    let currentSection = {
        type: 'other' as StorySliceType,
        content: '',
        title: undefined as string | undefined,
        nb: undefined as number | undefined
    }

    const pushCurrentSection = () => {
        if (currentSection.content !== '' || currentSection.title !== undefined || currentSection.type !== 'other') {
            sections.push(currentSection)
        }
        currentSection = {
            type: 'other',
            content: '',
            title: undefined,
            nb: undefined
        }
    }

    const chapterRegex = /^### Chapitre (.+)$/
    const interludeRegex = /^### Interlude (.+)$/
    const epilogueRegex = /^### (E|É)pilogue(?: (.+))?$/
    const introRegex = /^### Introduction$/

    for (const line of lines) {
        const chapterMatch = chapterRegex.exec(line)
        const interludeMatch = interludeRegex.exec(line)
        const epilogueMatch = epilogueRegex.exec(line)
        const introMatch = introRegex.exec(line)

        if (chapterMatch) {
            pushCurrentSection()
            const title = chapterMatch[1]?.trim()
            const nb = Number.isFinite(Number(title)) ? Number(title) : undefined
            currentSection = {
                type: 'chapter',
                content: `${line}\n`,
                title,
                nb
            }
        } else if (interludeMatch) {
            pushCurrentSection()
            const title = interludeMatch[1]?.trim()
            const nb = Number.isFinite(Number(title)) ? Number(title) : undefined
            currentSection = {
                type: 'interlude',
                content: `${line}\n`,
                title,
                nb
            }
        } else if (epilogueMatch) {
            pushCurrentSection()
            const title = (epilogueMatch[2] ?? '').trim() || 'Épilogue'
            currentSection = {
                type: 'epilogue',
                content: `${line}\n`,
                title,
                nb: undefined
            }
        } else if (introMatch) {
            pushCurrentSection()
            currentSection = {
                type: 'intro',
                content: `${line}\n`,
                title: 'Introduction',
                nb: undefined
            }
        } else {
            currentSection.content += `${line}\n`
        }
    }

    pushCurrentSection()
    return sections
}
