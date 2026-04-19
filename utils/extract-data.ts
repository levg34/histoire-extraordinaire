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
 * Slice the story by chapters, interludes, epilogues and introduction.
 * The title of the chapter is extracted from the content, and the content of the slice is returned without the title.
 * The chapter number is also extracted if it exists.
 * The part of the story is also extracted if it exists (example: Arc 1, Arc 2, etc.). Anything before the first arc will be considered as part 1.
 * @param content
 * @returns default export of the file, the content of the story sliced by chapters, interludes, epilogues and introduction. Each slice has a type, a content, a title (if it exists), a chapter number (if it exists) and a story part.
 */
export function sliceStoryByChapters(content: string): {
    type: StorySliceType
    content: string /* the content of the slice, without the title */
    title?: string /* extract the chapter title, if any: example: Chapitre 1 : Titre du chapitre => Titre du chapitre, Introduction => undefined */
    nb?: number /* extract the chapter number, if any: example: Chapitre 1 => 1, Interlude => undefined */
    storyPart: {
        name?: string
        nb: number
    } /* extract the part of the story. Anything before ## Arc 2 will be {nb: 1}, no title */
}[] {
    const romanToNumber = (roman: string): number | undefined => {
        const romanMap: { [key: string]: number } = {
            I: 1,
            II: 2,
            III: 3,
            IV: 4,
            V: 5,
            VI: 6,
            VII: 7,
            VIII: 8,
            IX: 9,
            X: 10
        }
        return romanMap[roman.toUpperCase()]
    }

    const lines = content.split(/\r?\n/)
    const sections: {
        type: StorySliceType
        content: string
        title?: string
        nb?: number
        storyPart: {
            name?: string
            nb: number
        }
    }[] = []

    let currentStoryPart: { name?: string; nb: number } = { nb: 1 }

    let currentSection = {
        type: 'other' as StorySliceType,
        content: '',
        title: undefined as string | undefined,
        nb: undefined as number | undefined,
        storyPart: currentStoryPart
    }

    const pushCurrentSection = () => {
        if (currentSection.content !== '' || currentSection.title !== undefined || currentSection.type !== 'other') {
            sections.push(currentSection)
        }
        currentSection = {
            type: 'other',
            content: '',
            title: undefined,
            nb: undefined,
            storyPart: currentStoryPart
        }
    }

    const chapterRegex = /^### Chapitre (.+)$/
    const interludeRegex = /^### Interlude (.+)$/
    const epilogueRegex = /^### (E|É)pilogue(?: (.+))?$/
    const introRegex = /^### Introduction$/
    const storyPartRegex = /^## Partie (.+?)(?: : (.+))?$/

    for (const line of lines) {
        const arcMatch = storyPartRegex.exec(line)
        const chapterMatch = chapterRegex.exec(line)
        const interludeMatch = interludeRegex.exec(line)
        const epilogueMatch = epilogueRegex.exec(line)
        const introMatch = introRegex.exec(line)

        if (arcMatch) {
            const arcNumStr = arcMatch[1]?.trim()
            if (arcNumStr) {
                const nb = Number(arcNumStr) || romanToNumber(arcNumStr)
                const name = arcMatch[2]?.trim()
                if (nb) {
                    currentStoryPart = { nb, name }
                }
            }
        } else if (chapterMatch) {
            pushCurrentSection()
            const title = chapterMatch[1]?.trim()
            const nb = Number.isFinite(Number(title)) ? Number(title) : undefined
            currentSection = {
                type: 'chapter',
                content: `${line}\n`,
                title,
                nb,
                storyPart: currentStoryPart
            }
        } else if (interludeMatch) {
            pushCurrentSection()
            const title = interludeMatch[1]?.trim()
            const nb = Number.isFinite(Number(title)) ? Number(title) : undefined
            currentSection = {
                type: 'interlude',
                content: `${line}\n`,
                title,
                nb,
                storyPart: currentStoryPart
            }
        } else if (epilogueMatch) {
            pushCurrentSection()
            const title = (epilogueMatch[2] ?? '').trim() || 'Épilogue'
            currentSection = {
                type: 'epilogue',
                content: `${line}\n`,
                title,
                nb: undefined,
                storyPart: currentStoryPart
            }
        } else if (introMatch) {
            pushCurrentSection()
            currentSection = {
                type: 'intro',
                content: `${line}\n`,
                title: 'Introduction',
                nb: undefined,
                storyPart: currentStoryPart
            }
        } else {
            currentSection.content += `${line}\n`
        }
    }

    pushCurrentSection()
    return sections
}
