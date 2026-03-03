function getLocalISTTimestampDate(): Date {
    return new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
        })
    );
}

export const isGreaterThanMinutes = (
    dateTime: string,
    minutes: number
): boolean => {
    if (!dateTime) return false;

    // 🔥 Parse UTC ISO properly
    const givenUtcDate = new Date(dateTime);
    console.log('givenUtcDate', givenUtcDate)
    if (isNaN(givenUtcDate.getTime())) return false;

    // 🔥 Convert given UTC → IST
    const givenIST = new Date(
        givenUtcDate.toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
        })
    );

    // 🔥 Current IST
    const nowIST = getLocalISTTimestampDate();

    const diff = nowIST.getTime() - givenIST.getTime();

    if (diff < 0) return false;

    return diff >= minutes * 60 * 1000;
};