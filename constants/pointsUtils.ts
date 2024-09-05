import { ref, update, getDatabase } from 'firebase/database';

export const updatePointsAndLevel = async (userId: string, currentPoints: number, currentLevel: number) => {
    if (!userId) return;

    const db = getDatabase();
    let newPoints = currentPoints + 20;
    let newLevel = currentLevel;

    if (newPoints >= 100) {
        newPoints = 0;
        newLevel += 1;
    }

    // Update state values
    // Assuming you have a method to update the state in the component file
    // setPoints(newPoints);
    // setLevel(newLevel);

    // Update Firebase
    const progressRef = ref(db, `users/${userId}/progress`);
    await update(progressRef, {
        points: newPoints,
        level: newLevel,
    });
};
