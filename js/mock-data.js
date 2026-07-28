//mock-data.js

async function seedSixMonthsOfProgressData() {
    const exerciseId = "069d4556-9862-4927-89e8-b7c1a84dc024";
    const exerciseName = "Test Exercise";

    const numberOfWeeks = 26;
    const workoutsPerWeek = 2;

    let currentWeight = 40;
    let workoutNumber = 0;

    const mockWorkouts = [];

    const today = new Date();
    const startDate = new Date(today);

    startDate.setDate(startDate.getDate() - numberOfWeeks * 7);
    startDate.setHours(18, 0, 0, 0);

    for (let weekIndex = 0; weekIndex < numberOfWeeks; weekIndex++) {
        for (
            let weeklyWorkoutIndex = 0;
            weeklyWorkoutIndex < workoutsPerWeek;
            weeklyWorkoutIndex++
        ) {
            const workoutDate = new Date(startDate);

            workoutDate.setDate(
                startDate.getDate()
                + weekIndex * 7
                + weeklyWorkoutIndex * 3
            );

            const timeUnderLoad =
                Math.floor(Math.random() * 41) + 40;

            mockWorkouts.push({
                id: `mock-progress-${workoutNumber}`,
                startedAt: workoutDate.toISOString(),
                finishedAt: new Date(
                    workoutDate.getTime() + 45 * 60 * 1000
                ).toISOString(),

                exercises: [
                    {
                        id: crypto.randomUUID(),
                        exerciseId: exerciseId,
                        name: exerciseName,
                        settings: [],

                        sets: [
                            {
                                id: crypto.randomUUID(),
                                weight: currentWeight,
                                timeUnderLoad: timeUnderLoad
                            }
                        ]
                    }
                ]
            });

            if (timeUnderLoad > 70) {
                currentWeight += 2.5;
            }

            workoutNumber++;
        }
    }

    const existingWorkouts = loadWorkouts();

    const workoutsWithoutOldMockData =
        existingWorkouts.filter(function (workout) {
            return !workout.id.startsWith("mock-progress-");
        });

    await saveWorkouts([
        ...workoutsWithoutOldMockData,
        ...mockWorkouts
    ]);

    console.log(
        `${mockWorkouts.length} mock workouts added`
    );
}