export function errorLogger(...errs: any[]) {
    const e = new Error();
    const regex = /\((.*):(\d+):(\d+)\)$/
    const match = regex.exec(e.stack!.split("\n")[2]!);

    console.error('\n[Error]:')
    if (match && match.length >= 3)
        console.log(`${match[1]}:${match[2]}:${match[3]}`)

    console.error(...errs)
    console.log()
}

export function errorAndExit(...errs: any[]) {
    const e = new Error();
    const regex = /\((.*):(\d+):(\d+)\)$/
    const match = regex.exec(e.stack!.split("\n")[2]!);

    console.error('\n[Error]:')
    if (match && match.length >= 3)
        console.log(`${match[1]}:${match[2]}:${match[3]}`)

    console.error(...errs)
    console.log()

    process.exit(1)
}