library(dplyr)
library(janitor)

workouts <- read.csv("user202919653_workout_history.csv") |>
  clean_names() |>
  select(workout_date, activity_type, distance_km)

workouts$workout_date <- as.Date(workouts$workout_date, format = "%B %d, %Y")

saveRDS(workouts, "workout-history.rds")
