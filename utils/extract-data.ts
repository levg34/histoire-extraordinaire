export function extractChapters(content: string) {
    const chapterRegex = /# (.+)/g
    const chapters: string[] = []
    let match: RegExpExecArray | null

    while ((match = chapterRegex.exec(content)) !== null) {
        chapters.push(match[1]!)
    }

    return chapters
}
