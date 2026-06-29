library(dplyr)
library(janitor)
library(lubridate)

workouts <- read.csv("user202919653_workout_history.csv") |>
  clean_names() |>
  select(workout_date, activity_type, distance_km)

workouts$workout_date <- mdy(workouts$workout_date)

saveRDS(workouts, "workout-history.rds")
