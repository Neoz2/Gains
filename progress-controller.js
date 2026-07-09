// progress-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

(async function() {
    const workouts = loadWorkouts();

    const firstExercise = loadExercises()[0];
    console.log(firstExercise.name);

    const points = [];

    for (let workoutIndex = 0; workoutIndex < workouts.length; workoutIndex++) {
        for (let exerciseIndex = 0; exerciseIndex < workouts[workoutIndex].exercises.length; exerciseIndex++){
            const exercise = workouts[workoutIndex].exercises.find(function (exercise) {
                const set = exercise.sets[0];

                console.log(exercise.name);

                points.push({
                    workoutNumber: workoutIndex + 1,
                    weight: set.weight,
                    timeUnderLoad: set.timeUnderLoad
                });

                return exercise.name === firstExercise.name;
            });
        }
    }


    const weightCanvas = document.getElementById("weight-graph");
    const weightGradient = createChartFillGradient(weightCanvas);

    new Chart(weightCanvas, {
        type: "line",
        data: {
            labels: points.map(point => point.workoutNumber),
            datasets: [
                {
                    data: points.map(point => point.weight),
                    borderColor: "#EA2266",
                    backgroundColor: weightGradient,
                    fill: true
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    const tulCanvas = document.getElementById("tul-graph");
    const tulGradient = createChartFillGradient(tulCanvas);

    new Chart(tulCanvas, {
        type: "line",
        data: {
            labels: points.map(point => point.workoutNumber),
            datasets: [
                {
                    data: points.map(point => point.timeUnderLoad),
                    borderColor: "#EA2266",
                    backgroundColor: tulGradient,
                    fill: true
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                annotation: {
                    annotations: {
                        minTargetLine: {
                            type: "line",
                            yMin: 50,
                            yMax: 50,
                            borderColor: "rgba(255, 157, 46, 0.8)",
                            borderWidth: 2,
                            borderDash: [6, 6]
                        },
                        maxTargetLine: {
                            type: "line",
                            yMin: 80,
                            yMax: 80,
                            borderColor: "rgba(93, 227, 109, 0.8)",
                            borderWidth: 2,
                            borderDash: [6, 6]
                        }
                    }
                }
            }
        }
    });

})();

function createChartFillGradient(canvas) {
    const context = canvas.getContext("2d");

    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);

    gradient.addColorStop(0, "rgba(234, 34, 102, 0.3)");
    gradient.addColorStop(0.25, "rgba(234, 34, 102, 0.1)");
    gradient.addColorStop(0.5, "rgba(234, 34, 102, 0.02)");
    gradient.addColorStop(1, "rgba(234, 34, 102, 0)");

    return gradient;
}